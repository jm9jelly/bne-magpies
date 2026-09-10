import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const args = process.argv.slice(2)
const validateExisting = args.includes('--validate-existing')
const inputDir = path.resolve(rootDir, getArg('--input', 'data-import/raw'))
const outputDir = path.resolve(rootDir, getArg('--output', getArg('--out', 'src/data')))

const files = {
  club: 'Club.csv',
  teams: 'Teams.csv',
  members: 'Members.csv',
  rankings: 'Rankings.csv',
  bracket: 'Bracket.csv',
}

if (validateExisting) {
  const current = {
    club: readJson(path.join(outputDir, 'club.json')),
    teams: readJson(path.join(outputDir, 'teams.json')),
    rankings: readJson(path.join(outputDir, 'rankings.json')),
    bracket: readJson(path.join(outputDir, 'bracket.json')),
  }
  validateAll(current)
  console.log(`Data validation passed for ${path.relative(rootDir, outputDir)}`)
  process.exit(0)
}

const imported = importFromCsv(inputDir)
validateAll(imported)
fs.mkdirSync(outputDir, { recursive: true })
writeJson(path.join(outputDir, 'club.json'), imported.club)
writeJson(path.join(outputDir, 'teams.json'), imported.teams)
writeJson(path.join(outputDir, 'rankings.json'), imported.rankings)
writeJson(path.join(outputDir, 'bracket.json'), imported.bracket)
console.log(`Imported data from ${path.relative(rootDir, inputDir)} to ${path.relative(rootDir, outputDir)}`)

function getArg(name, fallback) {
  const index = args.indexOf(name)
  return index >= 0 && args[index + 1] ? args[index + 1] : fallback
}

function importFromCsv(dir) {
  for (const file of Object.values(files)) {
    const fullPath = path.join(dir, file)
    if (!fs.existsSync(fullPath)) {
      throw new Error(`Missing ${path.relative(rootDir, fullPath)}. Export the Google Sheets tab as this CSV first.`)
    }
  }

  return {
    club: buildClub(readCsv(path.join(dir, files.club))),
    teams: buildTeams(readCsv(path.join(dir, files.teams)), readCsv(path.join(dir, files.members))),
    rankings: buildRankings(readCsv(path.join(dir, files.rankings))),
    bracket: buildBracket(readCsv(path.join(dir, files.bracket))),
  }
}

function buildClub(rows) {
  const row = rows[0] ?? {}
  return {
    name: value(row.name, 'Magpies'),
    shortName: value(row.shortName, value(row.name, 'Magpies')),
    location: value(row.location, 'Brisbane, Australia'),
    tagline: value(row.tagline, ''),
    taglineZh: value(row.taglineZh, ''),
    overview: splitLines(row.overview),
    overviewZh: splitLines(row.overviewZh),
    instagramProfile: {
      username: value(row.instagramUsername, value(row.contactInstagramHandle, '@brisbane_magpies_volleyball')).replace(/^@/, ''),
      displayName: value(row.instagramDisplayName, 'Brisbane Magpies Volleyball Club'),
      stats: splitStats(row.instagramStats),
      category: value(row.instagramCategory, 'Community'),
      locations: splitLines(row.instagramLocations),
      contact: value(row.instagramProfileContact, ''),
    },
    details: splitDetails(row.details),
    skillLevels: splitSkillLevels(row.skillLevels),
    rules: splitRules(row.rules),
    contact: {
      name: value(row.contactName, 'Club coordinator'),
      email: value(row.contactEmail, ''),
      instagram: value(row.contactInstagram, ''),
      instagramHandle: value(row.contactInstagramHandle, ''),
      note: value(row.contactNote, ''),
    },
  }
}

function buildTeams(teamRows, memberRows) {
  return teamRows.map((team) => {
    const teamName = required(team.name, 'Teams.csv name')
    const members = memberRows
      .filter((member) => member.team === teamName)
      .sort((a, b) => toNumber(a.order, 999) - toNumber(b.order, 999))
      .map((member) => {
        const importedMember = {
          name: required(member.name, `Members.csv name for ${teamName}`),
        }
        const role = value(member.role, '')
        if (role) importedMember.role = role
        return importedMember
      })

    return {
      name: teamName,
      captain: value(team.captain, ''),
      members,
      notes: value(team.notes, ''),
    }
  })
}

function buildRankings(rows) {
  return rows.map((row) => ({
    position: toNumber(required(row.position, 'Rankings.csv position')),
    team: required(row.team, 'Rankings.csv team'),
    played: toNumber(value(row.played, 0)),
    wins: toNumber(value(row.wins, 0)),
    losses: toNumber(value(row.losses, 0)),
    points: toNumber(value(row.points, 0)),
    setDiff: value(row.setDiff, '0'),
    remarks: value(row.remarks, ''),
  }))
}

function buildBracket(rows) {
  const title = value(rows[0]?.title, 'Magpies Social League Finals')
  const titleZh = value(rows[0]?.titleZh, 'Magpies Social League 對戰晉級')
  const updated = value(rows[0]?.updated, new Date().toISOString().slice(0, 10))
  const rounds = []

  for (const row of rows) {
    const roundId = required(row.roundId, 'Bracket.csv roundId')
    let round = rounds.find((item) => item.id === roundId)
    if (!round) {
      round = {
        id: roundId,
        title: required(row.roundTitle, `Bracket.csv roundTitle for ${roundId}`),
        titleZh: value(row.roundTitleZh, ''),
        matches: [],
      }
      rounds.push(round)
    }

    round.matches.push({
      slot: required(row.slot, `Bracket.csv slot for ${roundId}`),
      date: required(row.date, `Bracket.csv date for ${roundId}`),
      time: value(row.time, ''),
      court: value(row.court, ''),
      teamA: required(row.teamA, `Bracket.csv teamA for ${roundId}`),
      teamB: required(row.teamB, `Bracket.csv teamB for ${roundId}`),
      scoreA: nullableNumber(row.scoreA),
      scoreB: nullableNumber(row.scoreB),
      winner: value(row.winner, 'TBC'),
      status: value(row.status, 'Pending'),
      advancesTo: value(row.advancesTo, ''),
    })
  }

  return { title, titleZh, updated, rounds }
}

function validateAll({ club, teams, rankings, bracket }) {
  const errors = []
  const teamNames = new Set()

  if (!club?.name) errors.push('club.name is required')
  if (!Array.isArray(teams)) errors.push('teams must be an array')
  if (!Array.isArray(rankings)) errors.push('rankings must be an array')
  if (!Array.isArray(bracket?.rounds)) errors.push('bracket.rounds must be an array')

  for (const team of teams ?? []) {
    if (!team.name) errors.push('Every team needs a name')
    if (teamNames.has(team.name)) errors.push(`Duplicate team name: ${team.name}`)
    teamNames.add(team.name)
    if (!Array.isArray(team.members) || team.members.length === 0) {
      errors.push(`${team.name} needs at least one member`)
    }
  }

  for (const row of rankings ?? []) {
    if (!Number.isInteger(row.position)) errors.push(`Ranking position must be an integer for ${row.team}`)
    if (!teamNames.has(row.team)) errors.push(`Ranking team not found in Teams.csv: ${row.team}`)
  }

  for (const round of bracket?.rounds ?? []) {
    for (const match of round.matches ?? []) {
      if (!isIsoDate(match.date)) errors.push(`Invalid match date for ${match.slot}: ${match.date}`)
      for (const field of ['teamA', 'teamB']) {
        const name = match[field]
        if (!teamNames.has(name) && !/^Winner\b|^Loser\b|^TBC$|^\d+(st|nd|rd|th) Ranking Team$/i.test(name)) {
          errors.push(`Bracket ${field} is not a known team or placeholder for ${match.slot}: ${name}`)
        }
      }
    }
  }

  if (errors.length > 0) {
    throw new Error(`Data validation failed:\n- ${errors.join('\n- ')}`)
  }
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'))
}

function writeJson(filePath, data) {
  fs.writeFileSync(filePath, `${JSON.stringify(data, null, 2)}\n`)
}

function readCsv(filePath) {
  const content = fs.readFileSync(filePath, 'utf8').replace(/^\uFEFF/, '')
  const rows = parseCsv(content)
  const headers = rows.shift()?.map((header) => header.trim()) ?? []
  return rows
    .filter((row) => row.some((cell) => cell.trim() !== ''))
    .map((row) => Object.fromEntries(headers.map((header, index) => [header, row[index]?.trim() ?? ''])))
}

function parseCsv(content) {
  const rows = []
  let row = []
  let field = ''
  let quoted = false

  for (let index = 0; index < content.length; index += 1) {
    const char = content[index]
    const next = content[index + 1]

    if (char === '"' && quoted && next === '"') {
      field += '"'
      index += 1
    } else if (char === '"') {
      quoted = !quoted
    } else if (char === ',' && !quoted) {
      row.push(field)
      field = ''
    } else if ((char === '\n' || char === '\r') && !quoted) {
      if (char === '\r' && next === '\n') index += 1
      row.push(field)
      rows.push(row)
      row = []
      field = ''
    } else {
      field += char
    }
  }

  if (field || row.length > 0) {
    row.push(field)
    rows.push(row)
  }

  return rows
}

function required(valueToCheck, label) {
  const normalised = value(valueToCheck, '')
  if (!normalised) throw new Error(`${label} is required`)
  return normalised
}

function value(valueToCheck, fallback) {
  return valueToCheck === undefined || valueToCheck === null || valueToCheck === '' ? fallback : String(valueToCheck).trim()
}

function toNumber(valueToCheck, fallback = 0) {
  const number = Number(valueToCheck)
  if (!Number.isFinite(number)) return fallback
  return number
}

function nullableNumber(valueToCheck) {
  if (valueToCheck === undefined || valueToCheck === null || valueToCheck === '') return null
  const number = Number(valueToCheck)
  if (!Number.isFinite(number)) return null
  return number
}

function splitLines(valueToSplit) {
  return value(valueToSplit, '')
    .split('|')
    .map((item) => item.trim())
    .filter(Boolean)
}

function splitStats(valueToSplit) {
  return splitLines(valueToSplit).map((entry) => {
    const [count, ...labelParts] = entry.trim().split(/\s+/)
    return {
      value: count,
      label: labelParts.join(' '),
    }
  })
}

function splitPairs(valueToSplit, keyName, valueName) {
  return splitLines(valueToSplit).map((item) => {
    const [key, ...rest] = item.split(':')
    return {
      [keyName]: key.trim(),
      [valueName]: rest.join(':').trim(),
    }
  })
}

function splitRules(valueToSplit) {
  return splitLines(valueToSplit).map((item) => {
    const [title, body = ''] = item.split('::')
    const paragraphs = body
      .split(';')
      .map((paragraph) => paragraph.trim())
      .filter(Boolean)

    return {
      title: title.trim(),
      paragraphs,
    }
  })
}

function splitDetails(valueToSplit) {
  return splitLines(valueToSplit).map((item) => {
    const [label, detailValue, meta, href, page] = item.split('::').map((part) => part.trim())
    return Object.fromEntries(
      [
        ['label', label],
        ['value', detailValue],
        ['meta', meta],
        ['href', href],
        ['page', page],
      ].filter(([, itemValue]) => itemValue),
    )
  })
}

function splitSkillLevels(valueToSplit) {
  return splitLines(valueToSplit).map((item) => {
    const [name, ...rest] = item.split(':')
    return {
      name: name.trim(),
      points: rest.join(':').split(';').map((point) => point.trim()).filter(Boolean),
    }
  })
}

function isIsoDate(date) {
  return /^\d{4}-\d{2}-\d{2}$/.test(date) && !Number.isNaN(new Date(`${date}T00:00:00`).getTime())
}
