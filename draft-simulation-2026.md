# 2026 Draft Simulation — Evan (slot 2)

What you'd likely end up with if you draft off the **BDGE PPR board** while the other 9 managers draft to **current ESPN ADP** (adjusted for this league's real behavior). 300 simulated snake drafts.

> Re-run on the **updated BDGE board (Sep 3)**. The previous board is archived as `bdge-draft-rankings-ppr-2026-v1.csv`; what changed is summarized at the bottom.

## Setup the sim used
- **Your slot:** 2 (snake) — order is already set: Chan, **You**, Ikaika, Justin Ho, Chase M., Pascual, Prashanth, Rollin, Harvey, Darwin.
- **League:** 10-team, **2-QB** start (2QB/2RB/2WR/1TE/1FLEX/1K/1D-ST + 6 bench, 16 rounds).
- **You:** pick the best available player on your BDGE board (roster-aware — don't hoard a position past need).
- **Opponents:** draft to ESPN ADP, **but** QB demand is anchored to your league's actual history (2 QBs go in Round 1, a QB run in Rounds 6–7), and everyone leaves K/D-ST for the last two rounds — exactly as your league has always done.
- **Seeded RNG**, so the two boards were compared on identical draft noise rather than on luck.

## Your board still loves QBs the market doesn't — but less than it did

| QB | BDGE (old) | BDGE (new) | ESPN ADP | Gap |
|---|---:|---:|---:|---:|
| Josh Allen | 3 | 3 | 21 | −18 |
| Lamar Jackson | 9 | 9 | 38 | −29 |
| Joe Burrow | 16 | 16 | 57 | −41 |
| Jayden Daniels | 17 | 17 | 52 | −35 |
| Jalen Hurts | 24 | **29** | 52 | −23 |
| Trevor Lawrence | 25 | **30** | 94 | −64 |
| Drake Maye | 26 | **31** | 47 | −16 |
| Justin Herbert | 35 | **37** | 101 | −64 |

The elite four are unmoved. The **second QB tier slid ~5 spots** (Hurts, Lawrence, Maye), and four RB/WR names moved ahead of them. That single change is what makes this re-run differ from the last one.

ADP here is ESPN's public **1-QB** ADP — there is no 2-QB feed — which is *why* your QBs appear to "fall." The sim corrects for it by anchoring QB demand to your league's own draft history rather than to that ADP.

---

## Scenario A — Follow the board literally ("QB-forward")

You take the top name on your board every pick. Elite RB1, then both QBs early.

**Representative team:**

| Rd (ovr) | Pos | Player | BDGE / ADP |
|---|---|---|---|
| R1 (2) | RB | Jahmyr Gibbs | 1 / 1 |
| R2 (19) | RB | Kenneth Walker III | 13 / 23 |
| R3 (22) | **QB** | **Joe Burrow** | 16 / 57 |
| R4 (39) | **QB** | **Trevor Lawrence** | 30 / 94 |
| R5 (42) | WR | Tee Higgins | 43 / 54 |
| R6 (59) | RB | D'Andre Swift | 59 / 61 |
| R7 (62) | WR | Luther Burden III | 61 / 76 |
| R8 (79) | WR | Parker Washington | 67 / 92 |
| R9 (82) | WR | Christian Watson | 68 / 93 |
| R10 (99) | RB | MarShawn Lloyd | 75 / 167 |
| R11 (102) | QB | Malik Willis | 78 / 167 |
| R12 (119) | WR | Josh Downs | 96 / 136 |
| R13 (122) | WR | De'Zhaun Stribling | 105 / 147 |
| R14 (139) | TE | Juwan Johnson | 138 / 162 |
| R15 (142) | K | Harrison Mevis | – / 135 |
| R16 (159) | D/ST | Browns D/ST | – / 156 |

**Composition:** 3.0 QB / 4.2 RB / 5.8 WR / 1 TE

**Read:** A top-tier QB tandem (Burrow + Lawrence) that is a real edge in a 2-QB format, and a strong RB1. You still reach — Burrow at pick 22 against a 57 ADP — and your WR1 is Tee Higgins in Round 5.

**What changed:** this scenario is meaningfully less rigid than on the old board. Your 2nd QB used to land in Round 4 in **99%** of drafts; it is now **R4 79% / R5 21%**, and Round 4 itself is no longer automatic (QB 79%, RB 19%). The RB risers now compete with the QB tier instead of losing to it outright.

---

## Scenario B — Board + ADP discipline ("wait on QB, recommended")

Same board, but you don't reach for a QB while startable RB/WR are on the table.

| Rd (ovr) | Pos | Player | BDGE / ADP |
|---|---|---|---|
| R1 (2) | RB | Jahmyr Gibbs | 1 / 1 |
| R2 (19) | RB | Kenneth Walker III | 13 / 23 |
| R3 (22) | RB | Omarion Hampton | 20 / 23 |
| R4 (39) | WR | DeVonta Smith | 34 / 39 |
| R5 (42) | **QB** | **Trevor Lawrence** | 30 / 94 |
| R6 (59) | **QB** | **Justin Herbert** | 37 / 101 |
| R7 (62) | RB | D'Andre Swift | 59 / 61 |
| R8 (79) | WR | Parker Washington | 67 / 92 |
| R9 (82) | WR | Christian Watson | 68 / 93 |
| R10 (99) | RB | MarShawn Lloyd | 75 / 167 |
| R11 (102) | QB | Malik Willis | 78 / 167 |
| R12 (119) | WR | Josh Downs | 96 / 136 |
| R13 (122) | WR | De'Zhaun Stribling | 105 / 147 |
| R14 (139) | TE | Dalton Kincaid | 114 / 131 |
| R15 (142) | K | Harrison Mevis | – / 135 |
| R16 (159) | D/ST | Lions D/ST | – / 154 |

**Composition:** 3.0 QB / 5.0 RB / 5.0 WR / 1 TE

**Read:** You get **the same calibre of QB tandem two rounds later** (Lawrence R5, Herbert R6) and bank three quality RBs plus DeVonta Smith first. The 2nd QB lands in Round 6 in **100%** of drafts.

**The trade-off is now sharper.** On the old board this path produced 4.4 RB / 5.6 WR. It now produces **5.0 RB / 5.0 WR** — you come out genuinely RB-heavy, which runs against your historical WR lean. Your board's top WRs (Puka, Chase, Nabers, Collins) all carry top-25 ADP and are gone before your Round 2–3 picks.

---

## What to expect regardless of approach

- **Round 1: Gibbs 90%, Bijan 10%.** Chan at slot 1 is a career WR-first drafter and usually opens with a receiver, letting one of them fall.
- **Round 2: Kenneth Walker III, ~100%.** He is the board's clear value at pick 19 in both scenarios.
- **MarShawn Lloyd in Round 10, 100% of drafts.** His jump from #131 to #75 on the new board puts him squarely in your range at a 167 ADP — the single biggest new opportunity the updated board creates.
- **Late QB3 (Malik Willis, R11)** as insurance, standard in a 2-QB league.
- **K and D/ST in the last two rounds**, matching league custom.

## Recommendation for your slot

**Scenario B still wins, and the new board makes it easier to reach.**

You end up with comparable quarterbacks either way — the difference is what you own alongside them. Waiting converts a Round 3–4 QB reach into Omarion Hampton and DeVonta Smith at close to market price.

The reasoning has actually shifted since the last run. Previously this was advice to *fight* your board, which kept surfacing a QB as best-available. Now the board has largely closed that gap on its own: the second QB tier fell behind the RB/WR names you'd want anyway, so discipline and best-available point the same direction more often.

**The thing to watch is the opposite risk.** Following this path lands you at 5.0 RB / 5.0 WR. If you want to stay closer to your usual WR-heavy build, Round 7 is the lever — it comes up RB 76% / WR 24%, and taking the receiver there is the cheapest way to rebalance without touching the QB plan.

---

## What changed from the previous board

Same format, **208 → 205 players**. No additions; three drops (J.J. McCarthy, Jaydon Blue, Isiah Pacheco — all #174+). 126 players changed rank, but 107 of those moved 1–3 spots, and the **top 50 is the same personnel**.

| Player | Old | New | Move |
|---|---:|---:|---|
| Josh Jacobs (RB) | 65 | 120 | **−55**, Tier 9 → 14 |
| MarShawn Lloyd (RB) | 131 | 75 | **+56**, Tier 14 → 9 |
| Javonte Williams (RB) | 45 | 27 | +18 |
| Jeremiyah Love (RB) | 50 | 33 | +17 |
| Ashton Jeanty (RB) | 28 | 21 | +7 |
| Jalen Hurts (QB) | 24 | 29 | −5 |
| Trevor Lawrence (QB) | 25 | 30 | −5 |
| Drake Maye (QB) | 26 | 31 | −5 |

Net effect on the sim: **RBs up, QBs down.** Top-42 composition moved from 12 RB / 16 WR to 14 RB / 14 WR, and roster composition shifted ~0.6 players from WR to RB in both scenarios.

### Caveats
- Opponent behavior is modeled (ESPN ADP + your league's historical QB timing and K/D-ST discipline), not a prediction of specific rival picks. QB scarcity is calibrated to your 2022–25 drafts and matches them closely.
- ADP is ESPN's public **1-QB** ADP; there is no 2-QB feed. The sim corrects QB timing but **not** non-QB ADP, which is therefore ~5–10 picks optimistic in the early rounds. That bias runs slightly *against* taking QBs early, so treat the case for waiting as strong rather than airtight.
- The board carries no projections, so this simulates *where players go*, not how many points they score. It cannot tell you a pick was good, only that it was available.
- 300 drafts on a fixed seed. Percentages are stable to a point or two, not exact.

Generated by `.espn-automation/draft_sim.js` (`BOARD=` to swap boards, `MODE=strict|waitQB`, `SEED=` for noise).
