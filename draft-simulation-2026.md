# 2026 Draft Simulation — Evan (slot 2)

What you'd likely end up with if you draft off the **BDGE PPR board** while the other 9 managers draft the way they actually draft. 300 simulated snake drafts.

> Current run uses the **updated BDGE board (Sep 3)** and **opponent models fitted to this league's 2022–25 drafts**. Both changed since the previous version — see the two sections at the bottom.

## Setup the sim used
- **Your slot:** 2 (snake) — order is locked: Chan, **You**, Ikaika, Justin Ho, Chase M., Pascual, Prashanth, Rollin, Harvey, Darwin.
- **League:** 10-team, **2-QB** start (2QB/2RB/2WR/1TE/1FLEX/1K/1D-ST + 6 bench, 16 rounds).
- **You:** best available on your BDGE board, roster-aware.
- **Opponents:** ESPN ADP, adjusted by a model fitted per manager — each one's real habitual round for their 1st and 2nd QB, plus their real early-round positional lean. K/D-ST stay in the last two rounds, as your league always does.
- **Seeded RNG**, so board and model changes are compared on identical draft noise.

### How well the opponent model matches reality
Validated on held-out seeds against the actual 2022–25 drafts:

| Check | Error |
|---|---|
| Mean round of each manager's first QB | **0.29 rounds** |
| Early-round positional share | **0.015** |
| Aggregate QB flow through pick 100 | 0.77 QBs |

Every manager is within one round of their real QB timing. This matters most for **Jeffrey Chan**, who picks at slot 1 — immediately ahead of you every round, and twice in a row at picks 20–21 between your Round 2 and Round 3 selections.

## Your board still loves QBs the market doesn't

| QB | BDGE | ESPN ADP | Gap |
|---|---:|---:|---:|
| Josh Allen | 3 | 21 | −18 |
| Lamar Jackson | 9 | 38 | −29 |
| Joe Burrow | 16 | 57 | −41 |
| Jayden Daniels | 17 | 52 | −35 |
| Jalen Hurts | 29 | 52 | −23 |
| Trevor Lawrence | 30 | 94 | −64 |
| Justin Herbert | 37 | 101 | −64 |

ADP is ESPN's public **1-QB** ADP — there is no 2-QB feed — which is *why* your QBs look like they fall. The sim corrects for that by anchoring QB demand to your league's own history rather than to that ADP.

---

## Scenario A — Follow the board literally ("QB-forward")

| Rd (ovr) | Pos | Player | BDGE / ADP |
|---|---|---|---|
| R1 (2) | RB | Jahmyr Gibbs | 1 / 1 |
| R2 (19) | **QB** | **Lamar Jackson** | 9 / 38 |
| R3 (22) | RB | Kenneth Walker III | 13 / 23 |
| R4 (39) | **QB** | **Joe Burrow** | 16 / 57 |
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
| R15–16 | K / D/ST | Mevis, Browns | – |

**Composition:** 3.0 QB / 3.9 RB / 6.1 WR / 1 TE
**2nd QB:** R3 6% · **R4 94%**

**Read:** An elite QB tandem locked by Round 4 and a strong RB1, but your WR1 is Tee Higgins in Round 5 and the receiving room is depth from there.

---

## Scenario B — Board + ADP discipline ("wait on QB, recommended")

| Rd (ovr) | Pos | Player | BDGE / ADP |
|---|---|---|---|
| R1 (2) | RB | Jahmyr Gibbs | 1 / 1 |
| R2 (19) | RB | Kenneth Walker III | 13 / 23 |
| R3 (22) | RB | Omarion Hampton | 20 / 23 |
| R4 (39) | WR | Tee Higgins / DeVonta Smith | 43 / 54 |
| R5 (42) | **QB** | **Trevor Lawrence** | 30 / 94 |
| R6 (59) | **QB** | **Justin Herbert** | 37 / 101 |
| R7 (62) | WR | Luther Burden III | 61 / 76 |
| R8 (79) | WR | Parker Washington | 67 / 92 |
| R9 (82) | WR | Christian Watson | 68 / 93 |
| R10 (99) | RB | MarShawn Lloyd | 75 / 167 |
| R11 (102) | QB | Malik Willis | 78 / 167 |
| R12 (119) | WR | Josh Downs | 96 / 136 |
| R13 (122) | WR | De'Zhaun Stribling | 105 / 147 |
| R14 (139) | TE | Juwan Johnson | 138 / 162 |
| R15–16 | K / D/ST | — | – |

**Composition:** 3.0 QB / 4.2 RB / 5.8 WR / 1 TE
**2nd QB:** R5 13% · **R6 87%**

**Read:** You get a comparable QB tandem two rounds later and bank three quality RBs plus a WR1 first. The balance now lands at **4.2 RB / 5.8 WR** — close to your natural WR lean, rather than the RB-heavy build the previous (mis-specified) opponent model predicted.

---

## What to expect regardless of approach

- **Round 1: Gibbs ~88%, Bijan ~12%.** Chan at slot 1 is a career WR-first drafter and usually opens with a receiver.
- **Round 2 (#19): Kenneth Walker III ~80–85%** — but **Lamar Jackson slips to you 13–18% of the time**. If he's there, that's the single biggest decision of your draft.
- **Round 3 (#22):** the board splits — Omarion Hampton 48% / Chase Brown 36% in Scenario B.
- **MarShawn Lloyd in Round 10, 100% of drafts.** His board jump from #131 to #75 against a 167 ADP is the biggest structural edge available to you.
- **Late QB3** (Malik Willis, R11) as insurance, standard in a 2-QB league.

## Recommendation for your slot

**Wait on QB — but take Lamar at 19 if he falls.**

The two scenarios end with comparable quarterbacks. What differs is what you own beside them, and waiting buys Hampton or Chase Brown plus a real WR1 at close to market price instead of a Round 3–4 reach.

The exception is genuine. Lamar Jackson at BDGE 9 with a 38 ADP is a different class of value from Burrow or Lawrence, and he reaches your Round 2 pick in roughly one draft in six. That is a value gap worth breaking discipline for; Burrow at pick 22 is not.

**The RB-heavy warning from the previous version no longer applies.** That was largely an artifact of under-modeled opponents. With Chan and the rest drafting the way they actually do, you land at 4.2 RB / 5.8 WR without steering.

---

## What changed: opponent models

Previously the sim used hand-tuned constants covering 4 of 10 managers for QB timing and 7 of 10 for positional lean. Checking simulated output against real drafts showed large errors — **Jeffrey Chan's first QB came at R8.68 in the sim against R4.25 in reality**, and Justin Ho R9.22 against R5.75. Chan picks directly ahead of you, so that error mattered.

The cause was structural. QB value was `min(adp, scarcity)`, and the scarcity term already makes elite QBs look like top-5 picks to everyone — a per-manager multiplier could not express "waits until Round 6." Each manager's habitual QB rounds are now read directly from draft history, with a fitted penalty for going earlier than habit.

| | Before | After |
|---|---:|---:|
| First-QB round error | 1.83 rounds | **0.29** |
| Positional share error | ~0.10 | **0.015** |

**Effect on you:** Scenario B moved from 5.0 RB / 5.0 WR to 4.2 RB / 5.8 WR, and Lamar Jackson began reaching pick 19 in a meaningful share of drafts.

## What changed: the board

Same format, **208 → 205 players**; three drops, all outside the top 170. Top 50 personnel unchanged.

| Player | Old | New | Move |
|---|---:|---:|---|
| Josh Jacobs (RB) | 65 | 120 | **−55** |
| MarShawn Lloyd (RB) | 131 | 75 | **+56** |
| Javonte Williams (RB) | 45 | 27 | +18 |
| Jeremiyah Love (RB) | 50 | 33 | +17 |
| Jalen Hurts (QB) | 24 | 29 | −5 |
| Trevor Lawrence (QB) | 25 | 30 | −5 |

The second QB tier slid ~5 spots while several RBs rose, so a QB is no longer automatically your best available.

### Caveats
- **The sim takes ~1 fewer QB than reality through the first 40 picks.** Real early-round QB scarcity is slightly higher than modeled, so treat the case for waiting as strong rather than airtight — and treat Lamar reaching pick 19 as an optimistic estimate.
- ADP is ESPN's public 1-QB ADP. QB timing is corrected; **non-QB ADP is not**, so it runs ~5–10 picks optimistic early. That also biases mildly against taking QBs early.
- The board carries no projections. This simulates *where players go*, not how many points they score.
- Opponent models capture QB timing and early positional lean. They do not model reaching for a specific player, positional runs, or reactions to what others just did.
- 300 drafts on a fixed seed; percentages are stable to a point or two, not exact.

Generated by `.espn-automation/draft_sim.js` with models from `fit_manager_models.js`. `BOARD=` swaps boards, `MODE=strict|waitQB`, `SEED=` changes noise, `NO_MODELS=1` reverts to the old hand-tuned opponents.
