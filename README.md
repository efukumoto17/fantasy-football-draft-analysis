# Fantasy Football Draft Analysis

Draft history, analysis, and a 2026 draft simulator for ESPN fantasy league **275797** (10-team, 2-QB, snake). Data pulled from ESPN's fantasy API for the seasons the league has existed (2018–2025).

## Reports
| File | What it is |
|---|---|
| `draft-analysis-all-years.md` | Position-by-round trends (2018–2025) + how each manager drafts and when they changed strategy |
| `draft-analysis.md` | Earlier 4-year (2022–2025) version of the above |
| `draft-simulation-2026.md` | Simulated 2026 draft outcomes from slot 2 using the BDGE board vs. ESPN ADP (full) |
| `draft-simulation-summary.md` | Condensed version of the 2026 simulation |
| `draft-pick-performance.md` | Where Evan leaks draft value (points scored vs. draft cost), 2022–2025 |
| `draft-value-all-managers.md` | League-wide draft-value leaderboard |
| `draft-value-deep-dive.md` | Full per-manager value breakdown (all 10 managers) |

## Data
| File | What it is |
|---|---|
| `bdge-draft-rankings-ppr-2026.csv` | BDGE PPR draft board used as the internal strategy in the sim |
| `draft-history-combined.csv` | Every pick, all seasons (Year, Round, Overall, Player, NFL Team, Position, Manager, Team Name) |
| `draft-history-2022..2025.csv` | Per-year draft recaps |
| `draft-history-team-managers.csv` | Team-name → manager mapping per year (managers rename teams annually) |

## `.espn-automation/` (scripts)
Node scripts (Playwright over CDP) that pull the data from ESPN's API and build the analyses. Notable entry points:
- `launch.js` — opens a persistent Chrome and logs into ESPN (one-time, interactive)
- `generate_draft_history.js` — builds the per-year draft CSVs
- `compute_stats.js` — builds `draft-history-combined.csv` + position-by-round stats
- `fetch_points.js` / `analyze_picks.js` / `analyze_all.js` / `analyze_extended.js` — actual-points value analysis
- `fetch_sim_inputs.js` / `draft_sim.js` — 2026 draft simulation

### Running the scripts
They talk to a Chrome instance over CDP (port 9222) so they reuse your ESPN login:
```bash
# Playwright is resolved from the npx cache; adjust NODE_PATH if needed
export NODE_PATH="$(dirname "$(find ~/.npm/_npx -name playwright -type d | head -1)")"
node .espn-automation/launch.js          # opens Chrome, log into ESPN once
node .espn-automation/compute_stats.js   # then run any analysis script
```

> **Note:** `.espn-automation/profile/` holds a live ESPN/MyDisney login session and is **gitignored** — it is never committed. Anyone cloning this repo logs in themselves via `launch.js`.
