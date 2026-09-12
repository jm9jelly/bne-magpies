import { useEffect, useMemo, useState } from 'react'
import {
  Instagram,
  MapPin,
  CalendarDays,
  ShieldCheck,
  Trophy,
  UsersRound,
} from 'lucide-react'
import bracket from './data/bracket.json'
import club from './data/club.json'
import rankings from './data/rankings.json'
import teams from './data/teams.json'
import magpiesFlightCream from './assets/magpies-flight-cream-gold.png'
import magpiesLogoCream from './assets/magpies-mark-cream-gold.png'

const navItems = [
  { id: 'overview', label: 'Club', icon: ShieldCheck },
  { id: 'rankings', label: 'Ranking', icon: Trophy },
  { id: 'bracket', label: 'Schedule', icon: CalendarDays },
  { id: 'teams', label: 'Teams', icon: UsersRound },
]

const clubDetails = Array.isArray(club.details) ? club.details : []
const skillLevels = Array.isArray(club.skillLevels) ? club.skillLevels : []
const instagramProfile = club.instagramProfile ?? {}
const instagramStats = Array.isArray(instagramProfile.stats) ? instagramProfile.stats : []
const instagramLocations = Array.isArray(instagramProfile.locations) ? instagramProfile.locations : []
const bracketRounds = Array.isArray(bracket.rounds) ? bracket.rounds : []
const rankingList = Array.isArray(rankings) ? rankings : []
const teamList = Array.isArray(teams) ? teams : []
const rankingHasResults = rankingList.some((team) => team.points > 0 || team.wins > 0 || team.played > 0)
const allBracketMatches = bracketRounds.flatMap((round) =>
  (round.matches ?? []).map((match) => ({ ...match, roundTitle: round.title })),
)

function pageFromHash() {
  const hash = window.location.hash.replace('#', '')
  return navItems.some((item) => item.id === hash) ? hash : 'overview'
}

function App() {
  const [selectedTeamName, setSelectedTeamName] = useState(teamList[0]?.name ?? '')
  const [activePage, setActivePage] = useState(pageFromHash)

  useEffect(() => {
    const nextHash = `#${activePage}`
    if (window.location.hash !== nextHash) {
      window.history.replaceState(null, '', nextHash)
    }
  }, [activePage])

  useEffect(() => {
    const handleHashChange = () => {
      const nextPage = pageFromHash()
      setActivePage(nextPage)
      const nextHash = `#${nextPage}`
      if (window.location.hash !== nextHash) {
        window.history.replaceState(null, '', nextHash)
      }
    }
    window.addEventListener('hashchange', handleHashChange)
    return () => window.removeEventListener('hashchange', handleHashChange)
  }, [])

  const nextMatch = useMemo(() => allBracketMatches.find((match) => match.status === 'Upcoming'), [])
  const leader = rankingHasResults ? rankingList[0] : null

  function scrollToCurrentContent() {
    window.setTimeout(() => {
      const currentContent = document.querySelector('.content-section')
      currentContent?.scrollIntoView({
        behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
        block: 'start',
      })
    }, 0)
  }

  function navigateToPage(pageId) {
    setActivePage(pageId)
    scrollToCurrentContent()
  }

  function openTeam(teamName) {
    setSelectedTeamName(teamName)
    navigateToPage('teams')
  }

  return (
    <div className="app-shell">
      <header className="club-hero">
        <img className="hero-logo-watermark" src={magpiesFlightCream} alt="" aria-hidden="true" />

        <div className="topbar">
          <button type="button" className="brand-lockup" onClick={() => navigateToPage('overview')}>
            <span className="brand-mark" aria-hidden="true">
              <img src={magpiesLogoCream} alt="" />
            </span>
            <span>
              <strong>{club.name}</strong>
              <small>{club.heroSubtitle ?? 'Social League'}</small>
            </span>
          </button>

          <nav className="page-nav" aria-label="Primary navigation">
            {navItems.map((item) => {
              const Icon = item.icon
              const isActive = activePage === item.id
              return (
                <button
                  key={item.id}
                  type="button"
                  className={isActive ? 'nav-button active' : 'nav-button'}
                  aria-current={isActive ? 'page' : undefined}
                  onClick={() => navigateToPage(item.id)}
                >
                  <Icon aria-hidden="true" size={17} />
                  <span>{item.label}</span>
                </button>
              )
            })}
          </nav>
        </div>

        <div className="hero-grid">
          <section className="hero-copy">
            <p className="eyebrow">Brisbane Social Volleyball</p>
            <h1>{club.name}</h1>
            <p className="hero-subtitle">{club.heroSubtitle ?? 'Social League'}</p>
            <div className="hero-actions">
              <button type="button" className="primary-action" onClick={() => navigateToPage('bracket')}>
                <CalendarDays aria-hidden="true" size={18} />
                <span>View Schedule</span>
              </button>
              <button type="button" className="secondary-action" onClick={() => navigateToPage('teams')}>
                <UsersRound aria-hidden="true" size={18} />
                <span>Teams</span>
              </button>
            </div>
          </section>

          <NextMatchCard match={nextMatch} />
        </div>
      </header>

      <main>
        <section className="insight-strip" aria-label="Club snapshot">
          <InsightCard
            label={leader ? 'Top seed' : 'Ranking'}
            value={leader?.team ?? 'TBC'}
            meta={leader ? `${leader.points} competition pts` : 'ranking starts after first round'}
          />
          <InsightCard
            label="Teams"
            value={teamList.length}
            meta={`${teamList.reduce((total, team) => total + (team.members?.length ?? 0), 0)} listed players`}
          />
          <InsightCard
            label="Next battle"
            value={nextMatch ? nextMatch.court : 'TBC'}
            meta={nextMatch ? `${formatDate(nextMatch.date)} · ${nextMatch.time} · Brisbane time` : 'schedule pending'}
          />
        </section>

        {activePage === 'overview' && <OverviewPage onNavigate={navigateToPage} />}
        {activePage === 'rankings' && <RankingsPage onTeamSelect={openTeam} />}
        {activePage === 'bracket' && <BracketPage onTeamSelect={openTeam} />}
        {activePage === 'teams' && (
          <TeamsPage selectedTeamName={selectedTeamName} onSelectTeam={setSelectedTeamName} />
        )}
      </main>
    </div>
  )
}

function NextMatchCard({ match }) {
  return (
    <aside className="scoreboard-card" aria-label="Next scheduled match">
      <div className="scoreboard-topline">
        <span>Next Up</span>
        <strong>{match ? match.court : 'TBC'}</strong>
      </div>

      <div className="scoreboard-match">
        <div>
          <small>Team A</small>
          <strong>{match ? match.teamA : 'To be confirmed'}</strong>
        </div>
        <span className="versus">VS</span>
        <div>
          <small>Team B</small>
          <strong>{match ? match.teamB : 'To be confirmed'}</strong>
        </div>
      </div>

      <div className="court-lines" aria-hidden="true">
        <span />
        <span />
        <span />
      </div>

      <div className="scoreboard-footer">
        <span>{match ? formatDate(match.date) : 'Date TBC'}</span>
        <span>{match ? match.time : 'Time TBC'}</span>
        <span>{match ? match.status : 'Pending'}</span>
      </div>
    </aside>
  )
}

function InsightCard({ label, value, meta, tone = 'default' }) {
  return (
    <article className={`insight-card ${tone}`}>
      <p>{label}</p>
      <strong>{value}</strong>
      <span>{meta}</span>
    </article>
  )
}

function OverviewPage({ onNavigate }) {
  const hasRules = Array.isArray(club.rules) && club.rules.length > 0

  return (
    <section className="content-section">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Club Room</p>
          <h2>Magpies Introduction</h2>
        </div>
        <span className="status-pill">Brisbane · Social League</span>
      </div>

      <div className="club-layout">
        <article className="club-story">
          <a
            className="club-monogram"
            href={club.contact.instagram}
            target="_blank"
            rel="noreferrer"
            aria-label="Open Brisbane Magpies Volleyball on Instagram"
          >
            <img src={magpiesLogoCream} alt="" />
            <span className="instagram-profile-label">
              <Instagram size={16} aria-hidden="true" />
              {club.contact.instagramHandle}
            </span>
          </a>
          <div className="instagram-profile-card">
            <div className="instagram-profile-topline">
              <a href={club.contact.instagram} target="_blank" rel="noreferrer">
                {instagramProfile.username ?? 'brisbane_magpies_volleyball'}
              </a>
              <span aria-hidden="true">...</span>
            </div>
            <p className="instagram-display-name">
              {instagramProfile.displayName ?? 'Brisbane Magpies Volleyball Club'}
            </p>
            <div className="instagram-stats" aria-label="Instagram profile stats">
              {instagramStats.map((stat) => (
                <span key={stat.label}>
                  <strong>{stat.value}</strong> {stat.label}
                </span>
              ))}
            </div>
            <p className="instagram-category">{instagramProfile.category ?? 'Community'}</p>
            <ul className="instagram-locations">
              {instagramLocations.map((location) => (
                <li key={location}>
                  <MapPin size={16} aria-hidden="true" />
                  {location}
                </li>
              ))}
            </ul>
            <p className="instagram-contact">
              Contact:{' '}
              <a href={club.contact.instagram} target="_blank" rel="noreferrer">
                {instagramProfile.contact ?? club.contact.instagramHandle}
              </a>
            </p>
          </div>
        </article>

        <dl className="detail-grid">
          {clubDetails.map((item) => (
            <DetailCard item={item} key={item.label} onNavigate={onNavigate} />
          ))}
        </dl>
      </div>

      <section className="rules-section" aria-label="Club rules">
        <div className="section-heading compact-heading">
          <div>
            <p className="eyebrow">Social League</p>
            <h2>Rules for Social League</h2>
          </div>
        </div>
        {hasRules ? (
          <div className="rules-list">
            {club.rules.map((rule) => (
              <RuleBlock rule={rule} key={typeof rule === 'string' ? rule : rule.title} />
            ))}
          </div>
        ) : (
          <div className="rules-blank" aria-label="Rules content is blank for now" />
        )}
      </section>

      {skillLevels.length > 0 && (
        <section className="skill-section" aria-label="Skill levels">
          <div className="section-heading compact-heading">
            <div>
              <p className="eyebrow">Skill Level</p>
              <h2>Volleyball Skill Levels</h2>
            </div>
          </div>
          <div className="skill-level-grid">
            {skillLevels.map((level) => (
              <article className="skill-level-card" key={level.name}>
                <h3>{level.name}</h3>
                <ul>
                  {(level.points ?? []).map((point) => (
                    <li key={point}>{point}</li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        </section>
      )}

      <div className="contact-band">
        <div>
          <MapPin aria-hidden="true" size={21} />
          <span>{club.location}</span>
        </div>
        <div>
          <CalendarDays aria-hidden="true" size={21} />
          <span>Every Friday night</span>
        </div>
        <div>
          <Instagram aria-hidden="true" size={21} />
          <a href={club.contact.instagram} target="_blank" rel="noreferrer">
            {club.contact.instagramHandle}
          </a>
        </div>
      </div>
    </section>
  )
}

function DetailCard({ item, onNavigate }) {
  const value = (
    <>
      <span>{item.value}</span>
      {item.meta && <small>{item.meta}</small>}
    </>
  )

  return (
    <div className={item.page ? 'detail-card clickable' : 'detail-card'}>
      <dt>{item.label}</dt>
      <dd>
        {item.href ? (
          <a className="detail-link" href={item.href} target="_blank" rel="noreferrer">
            {value}
          </a>
        ) : item.page ? (
          <button type="button" className="detail-action" onClick={() => onNavigate(item.page)}>
            {value}
          </button>
        ) : (
          value
        )}
      </dd>
    </div>
  )
}

function RuleBlock({ rule }) {
  if (typeof rule === 'string') {
    return <p className="rule-text">{rule}</p>
  }

  return (
    <article className="rule-block">
      <h3>{rule.title}</h3>
      {(rule.paragraphs ?? []).map((paragraph) => (
        <p key={paragraph}>{paragraph}</p>
      ))}
      {Array.isArray(rule.items) && rule.items.length > 0 && (
        <ul>
          {rule.items.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      )}
    </article>
  )
}

function RankingsPage({ onTeamSelect }) {
  const podium = rankingList.slice(0, 3)

  return (
    <section className="content-section">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Social League Ranking</p>
          <h2>Current Ranking - 11/9/2026</h2>
        </div>
        <span className="status-pill">{rankingList.length} teams</span>
      </div>

      <div className="leaderboard-layout">
        <aside className="podium-panel">
          {podium.map((team) => (
            <button key={team.team} type="button" className="podium-row" onClick={() => onTeamSelect(team.team)}>
              <span>{team.position}</span>
              <strong>{team.team}</strong>
              <small>{team.points} competition pts · points ratio {team.pointsRatio ?? '-'}</small>
            </button>
          ))}
        </aside>

        <div className="table-wrap">
          <table className="responsive-table">
            <thead>
              <tr>
                <th>Ranking</th>
                <th>Team</th>
                <th>Total Competition Points</th>
                <th>Total Sets Ratio</th>
                <th>Total Points Ratio</th>
              </tr>
            </thead>
            <tbody>
              {rankingList.map((team) => (
                <tr key={team.team}>
                  <td data-label="Ranking">
                    <strong className="rank-number">{team.position}</strong>
                  </td>
                  <td data-label="Team">
                    <button type="button" className="team-link" onClick={() => onTeamSelect(team.team)}>
                      {team.team}
                    </button>
                  </td>
                  <td data-label="Competition Points">
                    <strong>{team.points}</strong>
                  </td>
                  <td data-label="Sets Ratio">{team.setsRatio ?? '-'}</td>
                  <td data-label="Points Ratio">{team.pointsRatio ?? '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <section className="ranking-rules-panel" aria-label="Ranking rules">
        <div>
          <h3>Ranking Rules</h3>
          <p>Each match is played as a best-of-three format.</p>
          <ul>
            <li>Set 1 is played to 25 points.</li>
            <li>Set 2 is played to 25 points.</li>
            <li>If the score is 1-1, Set 3 is played to 15 points.</li>
            <li>All sets use the rally point system.</li>
            <li>A team must win each set by a margin of 2 points.</li>
          </ul>
          <p>If a team wins 2-0, the official league match ends immediately.</p>
          <p>
            If there is remaining time in the allocated session, both teams may continue playing friendly sets until the
            end of the session. Friendly set results do not count towards league points, rankings, points ratio, or any
            official match records.
          </p>
        </div>
        <div>
          <h3>Ladder Ranking</h3>
          <p>The ladder is ranked in this order, from most significant to least significant:</p>
          <ol>
            <li>Competition Points</li>
            <li>Sets Ratio</li>
            <li>Points Ratio</li>
          </ol>
          <h3>Point System</h3>
          <ul>
            <li>2-0 Win: 3 points</li>
            <li>2-1 Win: 2 points</li>
            <li>2-1 Loss: 1 point</li>
            <li>2-0 Loss: 0 points</li>
            <li>Forfeit: 0 points</li>
          </ul>
        </div>
      </section>
    </section>
  )
}

function BracketPage({ onTeamSelect }) {
  const [selectedMatch, setSelectedMatch] = useState(null)

  function openMatch(match) {
    setSelectedMatch(match)
  }

  function handleMatchKeyDown(event, match) {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      openMatch(match)
    }
  }

  return (
    <section className="content-section">
      <div className="section-heading">
        <div>
          <p className="eyebrow">League Schedule</p>
          <h2>{bracket.title}</h2>
        </div>
        <span className="status-pill">{allBracketMatches.length} matches</span>
      </div>

      <div className="schedule-board" aria-label="League schedule">
        {bracketRounds.map((round, index) => (
          <section className="schedule-week" key={round.id}>
            <div className="schedule-week-heading">
              <div>
                <small>Week {index + 1}</small>
                <h3>{round.title}</h3>
              </div>
              <span>{formatRoundDate(round)}</span>
            </div>

            <div className="court-grid">
              {['Court 1', 'Court 2'].map((court) => (
                <section className="court-column" key={`${round.id}-${court}`}>
                  <div className={court === 'Court 1' ? 'court-title court-one' : 'court-title court-two'}>
                    {court}
                  </div>
                  <div className="schedule-match-stack">
                    {(round.matches ?? [])
                      .filter((match) => match.court === court)
                      .map((match) => (
                        <article
                          className="schedule-match-card"
                          key={match.slot}
                          role="button"
                          tabIndex={0}
                          aria-label={`View match details for ${match.teamA} versus ${match.teamB}`}
                          onClick={() => openMatch(match)}
                          onKeyDown={(event) => handleMatchKeyDown(event, match)}
                        >
                          <div className="time-pill">
                            <span>{match.time}</span>
                            <small>Brisbane time</small>
                          </div>
                          <div className="schedule-teams">
                            <ScheduleTeam name={match.teamA} onTeamSelect={onTeamSelect} />
                            <span className="schedule-vs">vs</span>
                            <ScheduleTeam name={match.teamB} onTeamSelect={onTeamSelect} />
                          </div>
                          <div className="schedule-note">
                            {matchHasResult(match) ? (
                              <>
                                <span className="match-result-pill">{formatMatchResult(match)}</span>
                                <span className="competition-points">
                                  Points {formatCompetitionPoints(match)}
                                </span>
                              </>
                            ) : (
                              <span className={`fixture-status ${match.status.toLowerCase().replace(/\s+/g, '-')}`}>
                                {match.status}
                              </span>
                            )}
                          </div>
                        </article>
                      ))}
                  </div>
                </section>
              ))}
            </div>
          </section>
        ))}
      </div>

      {selectedMatch && <MatchDetailModal match={selectedMatch} onClose={() => setSelectedMatch(null)} />}
    </section>
  )
}

function ScheduleTeam({ name, onTeamSelect }) {
  const knownTeam = teamList.some((team) => team.name === name)

  return knownTeam ? (
    <button
      type="button"
      className="schedule-team"
      onClick={(event) => {
        event.stopPropagation()
        onTeamSelect(name)
      }}
    >
      {name}
    </button>
  ) : (
    <span className="schedule-team placeholder">{name}</span>
  )
}

function MatchDetailModal({ match, onClose }) {
  return (
    <div className="match-detail-backdrop" role="presentation" onClick={onClose}>
      <article
        className="match-detail-card"
        role="dialog"
        aria-modal="true"
        aria-label={`${match.teamA} versus ${match.teamB} match details`}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="match-detail-heading">
          <div>
            <p className="eyebrow">{match.court}</p>
            <h3>
              {match.teamA} <span>vs</span> {match.teamB}
            </h3>
          </div>
          <button type="button" className="modal-close" onClick={onClose} aria-label="Close match details">
            Close
          </button>
        </div>

        <div className="detail-score-summary">
          <span>{formatDate(match.date)}</span>
          <span>{match.time}</span>
          <span>{match.timezone ?? 'Brisbane time'}</span>
          <strong>{match.status}</strong>
        </div>

        <div className="set-score-grid" aria-label="Set scores">
          <div className="set-score-row set-score-head">
            <span>Set</span>
            <span>{match.teamA}</span>
            <span>{match.teamB}</span>
          </div>
          {Array.isArray(match.sets) && match.sets.length > 0 ? (
            match.sets.map((set) => (
              <div className="set-score-row" key={`${match.slot}-set-${set.set}`}>
                <span>Set {set.set}</span>
                <strong>{set.teamA}</strong>
                <strong>{set.teamB}</strong>
              </div>
            ))
          ) : (
            <p className="scores-empty">Scores not entered yet.</p>
          )}
        </div>

        <div className="match-detail-actions">
          <div>
            <small>Match Score</small>
            <strong>{matchHasResult(match) ? formatMatchResult(match) : 'TBC'}</strong>
          </div>
          <div>
            <small>Competition Points</small>
            <strong>{matchHasCompetitionPoints(match) ? formatCompetitionPoints(match) : 'TBC'}</strong>
          </div>
          <div>
            <small>Winner</small>
            <strong>{match.winner ?? 'TBC'}</strong>
          </div>
        </div>
      </article>
    </div>
  )
}

function TeamsPage({ selectedTeamName, onSelectTeam }) {
  const selectedTeam = teamList.find((team) => team.name === selectedTeamName) ?? teamList[0]
  const record = selectedTeam ? rankingList.find((team) => team.team === selectedTeam.name) : null

  if (!selectedTeam) {
    return (
      <section className="content-section">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Teams</p>
            <h2>Team Members</h2>
          </div>
          <span className="status-pill">0 rosters</span>
        </div>
        <div className="empty-state">Team rosters are not imported yet.</div>
      </section>
    )
  }

  return (
    <section className="content-section">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Teams</p>
          <h2>Team Members</h2>
        </div>
        <span className="status-pill">{teamList.length} rosters</span>
      </div>

      <div className="teams-layout">
        <div className="team-selector" aria-label="Team selector">
          {teamList.map((team) => (
            <button
              key={team.name}
              type="button"
              className={team.name === selectedTeam.name ? 'team-select active' : 'team-select'}
              onClick={() => onSelectTeam(team.name)}
            >
              <span>{team.name}</span>
              <small>{team.members.length} players</small>
            </button>
          ))}
        </div>

        <article className="team-roster">
          <div className="team-roster-header">
            <div>
              <p className="eyebrow">Selected Team</p>
              <h3>{selectedTeam.name}</h3>
            </div>
            <div className="team-record">
              <span>{selectedTeam.captain}</span>
              {record && <strong>Seed {record.position} · {record.points} pts</strong>}
            </div>
          </div>

          <div className="lineup-board" aria-label="Lineup board">
            {selectedTeam.members.slice(0, 6).map((member, index) => (
              <div className={`lineup-dot position-${index + 1}`} key={`${selectedTeam.name}-court-${member.name}`}>
                <strong>{member.name}</strong>
              </div>
            ))}
          </div>

          <div className="member-grid">
            {selectedTeam.members.map((member) => (
              <div className="member-card" key={`${selectedTeam.name}-${member.name}`}>
                <strong>{member.name}</strong>
              </div>
            ))}
          </div>

          <p className="team-note">{selectedTeam.notes}</p>
        </article>
      </div>
    </section>
  )
}

function formatDate(value) {
  return new Intl.DateTimeFormat('en-AU', {
    weekday: 'short',
    day: '2-digit',
    month: 'short',
  }).format(new Date(`${value}T00:00:00`))
}

function formatRoundDate(round) {
  const firstMatch = round.matches?.[0]
  if (!firstMatch?.date) return ''

  return new Intl.DateTimeFormat('en-AU', {
    day: 'numeric',
    month: 'numeric',
    year: 'numeric',
  }).format(new Date(`${firstMatch.date}T00:00:00`))
}

function matchHasResult(match) {
  return match.matchScoreA !== null && match.matchScoreA !== undefined && match.matchScoreB !== null && match.matchScoreB !== undefined
}

function matchHasCompetitionPoints(match) {
  return (
    match.competitionPointsA !== null &&
    match.competitionPointsA !== undefined &&
    match.competitionPointsB !== null &&
    match.competitionPointsB !== undefined
  )
}

function formatMatchResult(match) {
  return `${match.matchScoreA ?? match.scoreA ?? '-'}:${match.matchScoreB ?? match.scoreB ?? '-'}`
}

function formatCompetitionPoints(match) {
  return `${match.competitionPointsA ?? '-'}:${match.competitionPointsB ?? '-'}`
}

export default App
