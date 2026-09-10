# Magpies Data Import

Use Google Sheets as the working data file, then export each tab as CSV into `data-import/raw/`.

Required CSV filenames:

- `Club.csv`
- `Teams.csv`
- `Members.csv`
- `Rankings.csv`
- `Bracket.csv`

`Members.csv` only needs `team`, `order`, and `name`. Do not include gender. A `role` column is optional for private admin notes, but the public site does not show playing positions.

In `Club.csv`, detail cards use `label::value::meta::href::page`. Leave unused fields blank. Use `href` for external links such as Google Maps, and `page` for internal navigation such as `bracket`. The `rules` column uses `Title::paragraph one;paragraph two|Next title::paragraph`.

Run:

```bash
npm run import:data
npm run validate:data
npm run build
```

The import writes the public website data files in `src/data/`. Push the commit after checking the site; Netlify will rebuild from Git.

Chinese note: Google Sheets 係資料管理介面，網站仍然係 static。每次更新資料都要匯出 CSV、run import、build、commit、push，Netlify 先會重新 publish。
