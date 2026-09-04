# Fantasy Football League Analysis

Draft history, weekly league history, and a 2026 draft simulator for ESPN fantasy league **275797** (10-team, 2-QB, snake). Data pulled from ESPN's fantasy API for the seasons the league has existed (2018–2025).


## League history data (2022–2025) — `data/`
Every week of the last four seasons: rosters with per-player actual **and** projected points, matchup results, and the full transaction/trade ledger.

| File | Rows | What it is |
|---|---|---|
| `weekly-rosters-2022-2025.csv` | 12,160 | Every player on every roster, every week. Actual + projected points, lineup slot, starter flag, injury status |
| `weekly-matchups-2022-2025.csv` | 336 | Every head-to-head: both teams' actual and projected totals, winner, margin, playoff tier |
| `trades-consolidated-2022-2025.csv` | 254 | **Best-effort complete trade ledger** — 77 trades merged from ESPN's log and the roster snapshots |
| `trades-2022-2025.csv` | 84 | Only the 25 trades ESPN's transaction log stores items for, each row flagged against the roster snapshots |
| `player-movements-2022-2025.csv` | 364 | Every week-over-week ownership change, classified (trade / waiver-FA pickup / unlogged) |
| `transactions-2022-2025.csv` | 6,466 | Full raw transaction log: drafts, waivers, free agents, lineup moves, trade proposals/vetoes |
| `team-managers-2022-2025.csv` | 40 | Team-name → manager mapping per year |
| `trade-points-detail.csv` | 254 | Per-player trade returns: weeks held on the new roster and points produced |
| `manager-player-attachment.csv` | 1,597 | Every manager–player pair: weeks, seasons, stints, ownership share, times drafted |
| `bench-points-by-week.csv` | 680 | Per team-week: actual vs. optimal lineup points, points left on bench, whether it cost the game |
| `luck-adjusted-standings.csv` | 40 | Per manager-season: record, all-play, expected wins, luck, actual vs. deserved seed |
| `rivalry-head-to-head.csv` | 45 | Every manager pair: meetings, record, points, average margin |

Weeks are ESPN `scoringPeriodId` (1–17). `Started=1` means the player was in the scoring lineup (bench/IR excluded).

### A caveat on trade data
ESPN's transaction API stores complete item lists for only **25 of the 77** trades these four seasons. For the rest it kept the `TRADE_ACCEPT` record but dropped the players involved, so those trades are invisible in the transaction log.

The weekly roster snapshots are reliable — starter points reconcile to the reported team score on **all 672 matchup sides, exactly** — so the missing trades were recovered from them: a week-over-week ownership change with no waiver/free-agent add behind it, where two teams both gave and received a player. Only 8 of 180 such moves had any add record.

`trades-consolidated-2022-2025.csv` merges both sources and marks each row:
- `ESPN transaction log` + `CONFIRMED` (67 moves) — logged, and the player is on the receiving roster the next week
- `ESPN transaction log` + `CONFLICT` (12) / `DROPPED_AFTER` (5) — logged, but the snapshots disagree or the player was dropped before the next snapshot
- `Roster snapshots (missing from ESPN log)` (170) — recovered; the date is a week range, not a timestamp

Trades are heaviest in 2022 (23) and 2024 (24). Chase Mizoguchi is the most active trader (27 trades, 84 players moved).

## Analysis (`analysis/`)
Everything that looks at what already happened.

| File | What it is |
|---|---|
| `analysis/draft-analysis-all-years.md` | Position-by-round trends (2018–2025) + how each manager drafts and when they changed strategy |
| `analysis/draft-analysis.md` | Earlier 4-year (2022–2025) version of the above |
| `analysis/draft-pick-performance.md` | Where Evan leaks draft value (points scored vs. draft cost), 2022–2025 |
| `analysis/draft-value-all-managers.md` | League-wide draft-value leaderboard |
| `analysis/draft-value-deep-dive.md` | Full per-manager value breakdown (all 10 managers) |
| `analysis/trades-by-owner.md` | All 77 trades, 2022–2025, grouped by owner |
| `analysis/trade-points-analysis.md` | Who gained points by trading — net starter points per manager, per year and overall |
| `analysis/player-attachment-analysis.md` | Which managers keep coming back to the same players — weeks held, ownership share, repeat drafts |
| `analysis/bench-points-analysis.md` | Points left on the bench — optimal vs. actual lineups, overall, per season, and biggest single weeks |
| `analysis/luck-adjusted-standings.md` | All-play records and expected wins — who the schedule helped and who it robbed |
| `analysis/rivalry-matrix.md` | All-time head-to-head between every pair of managers, blowouts, and playoff meetings |

## 2026 draft prep (repo root)
Forward-looking, kept out of `analysis/` because it is a projection rather than a record.

| File | What it is |
|---|---|
| `draft-simulation-2026.md` | Simulated 2026 draft outcomes from slot 2 using the BDGE board vs. ESPN ADP (full) |
| `draft-simulation-summary.md` | Condensed version of the 2026 simulation |
| `bdge-draft-rankings-ppr-2026.csv` | Current BDGE PPR draft board (Sep 3) used as the internal strategy in the sim |
| `bdge-draft-rankings-ppr-2026-v1.csv` | Previous board (Aug 29), kept so sim runs stay comparable |

## Draft data
| File | What it is |
|---|---|
| `draft-history-combined.csv` | Every pick, all seasons (Year, Round, Overall, Player, NFL Team, Position, Manager, Team Name) |
| `draft-history-2022..2025.csv` | Per-year draft recaps |
| `draft-history-team-managers.csv` | Team-name → manager mapping per year (managers rename teams annually) |

## `.espn-automation/` (scripts)
Node scripts (Playwright over CDP) that pull the data from ESPN's API and build the analyses. Notable entry points:
- `launch.js` — opens a persistent Chrome and logs into ESPN (one-time, interactive)
- `generate_draft_history.js` — builds the per-year draft CSVs
- `compute_stats.js` — builds `draft-history-combined.csv` + position-by-round stats
- `fetch_points.js` / `analyze_picks.js` / `analyze_all.js` / `analyze_extended.js` — actual-points value analysis
- `fetch_sim_inputs.js` / `draft_sim.js` — 2026 draft simulation. `draft_sim.js` takes `BOARD=<csv>`, `MODE=strict|waitQB`, `SEED=<n>`
- `fetch_league_history.js` — pulls weekly rosters, matchups and transactions for 2022–2025 into `data/`
- `build_movements.js` — resolves player names, verifies trades against roster snapshots, derives the movement log
- `build_trade_ledger.js` — merges logged + roster-derived trades into the consolidated ledger
- `build_trade_report.js` — renders `analysis/trades-by-owner.md`
- `analyze_trade_points.js` — renders `analysis/trade-points-analysis.md` + `data/trade-points-detail.csv`
- `analyze_attachment.js` — renders `analysis/player-attachment-analysis.md` + `data/manager-player-attachment.csv`
- `analyze_bench.js` — solves optimal lineups; renders `analysis/bench-points-analysis.md` + `data/bench-points-by-week.csv`

Run them in that order; each is idempotent and rewrites its own outputs:
```bash
node .espn-automation/fetch_league_history.js   # ~3 min, ~90 API calls
node .espn-automation/build_movements.js
node .espn-automation/build_trade_ledger.js
node .espn-automation/build_trade_report.js
node .espn-automation/analyze_trade_points.js
node .espn-automation/analyze_attachment.js
node .espn-automation/analyze_bench.js
node .espn-automation/analyze_luck.js
node .espn-automation/analyze_rivalry.js
```

### Running the scripts
They talk to a Chrome instance over CDP (port 9222) so they reuse your ESPN login:
```bash
# Playwright is resolved from the npx cache; adjust NODE_PATH if needed
export NODE_PATH="$(dirname "$(find ~/.npm/_npx -name playwright -type d | head -1)")"
node .espn-automation/launch.js          # opens Chrome, log into ESPN once
node .espn-automation/compute_stats.js   # then run any analysis script
```

> **Note:** `.espn-automation/profile/` holds a live ESPN/MyDisney login session and is **gitignored** — it is never committed. Anyone cloning this repo logs in themselves via `launch.js`.
