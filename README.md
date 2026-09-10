# Volleyball Club Website Prototype

Static Vite + React prototype for the Magpies volleyball club website. It is designed for Netlify Free hosting with no backend and no paid server.

## What Is Included

- Club overview / 球會簡介
- Social league ranking / social league 排名
- Weekly league schedule / 每週聯賽行程
- Team roster view / 隊員名單
- Rules for Social League / social league 規則
- Recoloured Magpies logo assets / 已配合網站色調嘅 Magpies logo

## Content Updates

Edit these JSON files:

- `src/data/club.json`
- `src/data/rankings.json`
- `src/data/bracket.json`
- `src/data/teams.json`

The ranking table follows the stored JSON order. If the order should change, update the `position` values and reorder the rows in `rankings.json`.

The schedule page follows the stored week, court, and match order in `bracket.json`; it is not auto-sorted. Team members are listed in `teams.json`.

Logo assets are stored in `src/assets/`. The site currently uses the cream/gold versions for the dark header and club panel.

## CSV Data Import

Use Google Sheets as the editing interface, then export each tab as CSV.

1. Create these tabs with the same column headers as the files in `data-import/sample/`:
   - `Club`
   - `Teams`
   - `Members`
   - `Rankings`
   - `Bracket`
   Members only need team, display order, and name. Gender and playing position are not shown on the public site.
   Club detail cards use `label::value::meta::href::page`; leave unused fields blank. Use `href` for external links and `page` for internal navigation such as `bracket`.
2. Export each tab as CSV into `data-import/raw/` using these exact filenames:
   - `Club.csv`
   - `Teams.csv`
   - `Members.csv`
   - `Rankings.csv`
   - `Bracket.csv`
3. Import, validate, and rebuild:

```bash
npm run import:data
npm run validate:data
npm run build
```

The importer overwrites `src/data/club.json`, `src/data/teams.json`, `src/data/rankings.json`, and `src/data/bracket.json`.

`data-import/raw/` is git-ignored so private working CSV files do not get published accidentally. Only the cleaned JSON used by the public site should be committed.

中文：之後你可以用 Google Sheet 管資料，export 做 CSV 放入 `data-import/raw/`，run import command，再 push 上 GitHub；Netlify 會自動重新 publish。

## Design References Reviewed

- Tournify tournament websites: responsive event hub, live schedules/standings, custom branding.
- Challonge tournament brackets: clear stage-based progression and winner advancement.
- PlayHQ sports management: competition, team, fixture, and participant-dashboard patterns.
- TeamSnap/Waresport club management pages: roster, scheduling, and operational dashboard ideas.
- Volleyball Queensland: real volleyball organisation structure with events, club discovery, membership, and news entry points.

## Local Commands

```bash
npm install
npm run dev
npm run build
npm run preview
```

## Netlify Free Deploy

The project includes `netlify.toml`:

```toml
[build]
  command = "npm run build"
  publish = "dist"
```

Recommended first deploy:

```bash
npx netlify status
npx netlify login
npx netlify deploy
```

For production after checking the preview:

```bash
npx netlify deploy --prod
```

Keep the free `*.netlify.app` URL for v1 to avoid domain cost. Do not enable paid add-ons or auto-recharge for this prototype.

Recommended public workflow:

1. Push this project to GitHub.
2. In Netlify, choose **Add new site from Git** and select the repository.
3. Confirm build command `npm run build` and publish directory `dist`.
4. Share the generated `*.netlify.app` URL.
5. For future updates, edit/import data, commit, and push. Netlify will rebuild automatically.

On this Mac Codex environment, the system Node is older than the current Netlify CLI requirement. Use the bundled Node path for Netlify CLI commands if npm shows engine warnings:

```bash
PATH="/Users/chingkiuwong/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin:$PATH" npx netlify status
PATH="/Users/chingkiuwong/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin:$PATH" npx netlify login
PATH="/Users/chingkiuwong/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin:$PATH" npx netlify deploy
```
