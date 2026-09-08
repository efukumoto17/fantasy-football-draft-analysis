# 2026 Draft — How Every Manager Changed

League 275797 · 10 teams · snake · PPR · **2-QB** (two mandatory QB starters) · 16 rounds · drafted 2026-09-07.

This is a **behavioural / longitudinal** analysis: what each manager did *differently* in 2026 versus how they have drafted since 2018. It is deliberately not a "who won the draft" writeup — roster quality and power rankings are covered elsewhere. Everything here is about **change over time**.

Built on `../draft-board-2026.csv` (160 picks) and `../draft-history-combined.csv` (1,400 picks, 2018–2025). It extends `draft-analysis-all-years.md`, and every place 2026 continues or breaks a trend that file identified is flagged explicitly.

---

## 0. Data verification and caveats

**The league has been 2-QB for all nine drafts — verified, not assumed.** QBs drafted per year:

| Year | 2018 | 2019 | 2020 | 2021 | 2022 | 2023 | 2024 | 2025 | **2026** |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| QBs drafted | 27 | 28 | 32 | 34 | 28 | 28 | 29 | 29 | **29** |

A 10-team 1-QB league drafts ~15–18 QBs. 27–34 every single year, with no discontinuity, confirms two mandatory QB slots throughout. **No format change on QB — every shift below is behavioural, not rules-driven.**

Other caveats, stated up front:

- **Round-count break.** 2018–2023 were **18-round IDP** drafts; 2024–2026 are **16-round standard**. Raw round numbers for K/D-ST and late picks are not directly comparable across that break, so K/D-ST timing is also shown normalized (`round ÷ total rounds`). **Overall pick number is comparable across all nine years** (10 teams every year), so slot-controlled QB timing uses overall pick.
- **No historical value/ADP column exists.** `draft-history-combined.csv` carries only Year/Round/Overall/Player/Team/Position/Manager/Team Name. There is **no pre-2026 ADP or expert-rank field anywhere in the repo**, so a true reach/value delta cannot be computed for 2018–2025. Two substitutes are used and labelled as such:
  1. **Relative Aggression Index (RAI)** — process-based, computable for all nine years. For each pick, compare the normalized slot at which the *n*-th player at that position came off the board to the 2018–2025 league norm for that same positional tier, then de-mean within each year. **Positive = that manager consistently took positional tiers earlier than his peers did that same year.**
  2. **2026 only:** `valSF` from the draft board (`overall − rankSF`). Note `valSF` is *systematically negative* — the ESPN superflex rank pool is far larger than 160 picks, so the 2026 league mean is **−23.5**. All 2026 value figures below are therefore **centered on that league mean**; only the relative number is meaningful.
  3. For 2022–2025 outcome-based value, see the existing `draft-value-all-managers.md` (points-realized, not process) — referenced but not recomputed here.
- **Manager identity.** Jeff Chan (2018 only) and Jeffrey Chan (2021–2026) are separate ESPN accounts and are kept distinct. **Jeffrey Chan's baseline is 2021–2025 (5 drafts), not 8.** Daniel Ota (2019–2020) is out of scope. The other nine managers have all nine drafts.
- **Noise flags.** 2026 contained only **two autodraft picks in the entire draft** — Harvey Wang's last two (Eagles D/ST R15, Jake Bates R16). There were **no keepers**. Two 2026 picks were drafted already injured: Chase Mizoguchi's Jordyn Tyson (R13, INJURY_RESERVE) and Ikaika Stone's Zach Charbonnet (R12, OUT). Everything else is a deliberate human pick — this draft is unusually clean to read behaviourally.

---

## 1. Summary table

Baselines are the **2022–2025 mean** (the current competitive era; the 8-year mean is quoted in the per-manager sections where it differs materially). "Pivot" is a z-weighted composite of change in first-QB round, first-RB/WR/TE round, and QB/RB/WR/TE counts, each normalized by that manager's own 2022–25 variance — so it measures *deviation from his own habits*, not distance from the league.

| Manager | 2026 slot | First QB rd: 22–25 avg → 2026 | QB1 overall pick: 22–25 avg → 2026 | Pos counts QB/RB/WR/TE: 22–25 avg → 2026 | Archetype: then → now | Pivot |
|---|---:|---|---|---|---|---:|
| **Justin Ho** | 4 | 5.75 → **2** (−3.75) | 51.8 → **17** (−34.8) | 2.8/4.5/4.5/1.5 → 2/5/6/1 | RB-lean + premium TE, late QB → **WR-first, early QB, hard TE punt** | **17.1** |
| **Rollin Odama-Wong** | 8 | 1.00 → **5** (+4.00) | 6.2 → **48** (+41.8) | 3.0/4.8/4.5/1.2 → 3/5/5/1 | QB-in-Round-1 anchor (4 straight yrs) → **WR-WR-RB-RB, QB deferred to R5** | **13.4** |
| **Prashanth Balaraman** | 7 | 5.00 → **2** (−3.00) | 42.5 → **14** (−28.5) | 3.0/4.8/4.2/1.8 → 3/4/5/2 | Elite-WR + early TE + mid QB (8 yrs unchanged) → **elite WR + QB double-tap R2/R5, RB to R4, TE to R8** | **10.7** |
| Christopher Pascual | 6 | 3.50 → **2** (−1.50) | 29.2 → **15** (−14.2) | 3.0/4.5/4.8/1.5 → 3/4/5/2 | Hero-RB anchor + early QB → **WR-first, QB double-tap R2/R4, first RB not until R3** | 8.9 |
| Darwin Hu | 10 | 1.50 → **2** (+0.50) | 9.8 → **11** (+1.2) | 2.8/4.0/5.2/1.8 → **4**/4/5/1 | QB-R1 + WR volume, TE R7–10 → **QB R2 + earliest TE ever (R4) + 4 QBs (most in league)** | 8.7 |
| Ikaika Stone | 3 | 3.00 → **1** (−2.00) | 25.0 → **3** (−22.0) | 2.8/4.5/5.0/1.0 → 3/**6**/4/1 | WR-lean, reverted to late QB in 2025 → **elite-QB anchor + RB-heaviest team in league** | 8.1 |
| Jeffrey Chan | 1 | 4.25 → **2** (−2.25) | 38.2 → **20** (−18.2) | 2.5/3.8/5.0/1.8 → 2/4/5/2 | WR-first, QB timing bounces → **RB1 at 1.01 then back-to-back QBs R2–R3** | 7.8 |
| Evan Fukumoto | 2 | 3.25 → **6** (+2.75) | 29.5 → **59** (+29.5) | 3.0/3.8/5.5/1.2 → 3/4/5/2 | RB core with QB creeping up to R2–R3 → **RB-RB-RB opener, zero QB before R6** | 6.2 |
| Chase Mizoguchi | 5 | 6.25 → **5** (−1.25) | 59.0 → **45** (−14.0) | 2.8/4.5/4.8/1.8 → 3/5/5/1 | Hero-RB/WR-first + early TE, latest QB in league → **essentially unchanged; QB double-tap R5–R6** | 5.6 |
| Harvey Wang | 9 | 4.50 → **4** (−0.50) | 40.8 → **32** (−8.8) | 3.0/4.2/5.0/1.0 → 3/5/5/1 | RB/WR balance, mid QB, extreme TE punt → **identical, but tightest QB double-tap of his career (R4–R5)** | 3.3 |

**Read of the table:** eight of ten managers took their QB1 *earlier* in slot-controlled terms than their 2022–25 average. The two who went later — Evan Fukumoto and Rollin Odama-Wong — went *dramatically* later, and Rollin's is the single largest year-over-year behavioural swing in the dataset.

---

## 2. League-wide: the QB market broke open

The prior writeup called QB timing "the defining strategic decision" and noted the QB run had crept to Rounds 6–7 with 2 QBs typically going in Round 1. **2026 blew that up — but not in Round 1.** The league moved its QB mass into **Rounds 2–3** instead.

| Year | Rds | QBs drafted | Mean 1st-QB rd | **Median 1st-QB rd** | Mean QB1 overall | **Median QB1 overall** | QBs in top 30 | QBs in top 50 | Mgrs w/ QB by R2 | Mgrs w/ both QBs by R6 | Mgrs waiting past R5 |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| 2018 | 18 | 27 | 4.70 | 5.0 | 43.2 | 42.5 | 0 | 10 | 0 | 4 | 1 |
| 2019 | 18 | 28 | 4.50 | 4.5 | 42.2 | 42.5 | 2 | 9 | 1 | 5 | 3 |
| 2020 | 18 | 32 | 4.30 | 4.0 | 39.2 | 39.5 | 2 | 9 | 1 | 4 | 2 |
| 2021 | 18 | 34 | 3.60 | 4.0 | 31.7 | 33.5 | 5 | 12 | 1 | 4 | 1 |
| 2022 | 18 | 28 | 4.90 | 5.5 | 44.0 | 49.0 | 2 | 7 | 1 | 3 | 5 |
| 2023 | 18 | 28 | 3.10 | 3.0 | 27.2 | 25.5 | 6 | 9 | 4 | 4 | 2 |
| 2024 | 16 | 29 | 3.70 | 3.5 | 31.6 | 32.0 | 6 | 9 | 4 | 2 | 3 |
| 2025 | 16 | 29 | 3.50 | 3.5 | 30.0 | 29.0 | 5 | 8 | 3 | 3 | 2 |
| **2026** | **16** | **29** | **3.10** | **2.0** | **26.4** | **18.5** | **7** | **13** | **6** | **6** | **1** |

Every QB-adoption measure is at or above its all-time high in 2026:

- **Median first-QB round fell to 2.0** — the previous record low was 3.0 (2023). Half the league had a starting QB inside 20 picks.
- **Median QB1 overall pick = 18.5**, versus a previous best of 25.5 (2023) and a 2018–2020 norm around 40. **The typical manager's QB1 came off the board 11 picks earlier than in any prior draft.**
- **6 of 10 managers took a QB by Round 2** — previous high was 4 (2023, 2024).
- **6 of 10 had *both* QBs rostered by Round 6**, and **4 had both by Round 5** — both all-time highs (previous 5 and 3).
- **13 QBs went in the top 50 picks** — an all-time high, beating 2021's 12 and nearly double 2022's 7.
- **Only 1 manager waited past Round 5** for his QB1 (Evan Fukumoto, R6) — tied for the fewest ever.

Crucially, this is **not** a Round-1 phenomenon: only **1 QB went in Round 1** in 2026 (Josh Allen, 1.03), down from 2–3 in 2023–2025. The league collectively learned to **let Round 1 be a skill-position round and then take QBs at the 2/3 turn**. Six QBs came off the board between picks 11 and 21.

### Other league-wide meta shifts

**Round 1 composition — the WR-first wave stalled.**

| Year | 2018 | 2019 | 2020 | 2021 | 2022 | 2023 | 2024 | 2025 | **2026** |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| RB | 6 | 7 | 8 | 7 | 6 | 2 | 3 | 4 | **5** |
| WR | 4 | 3 | 1 | 1 | 3 | 4 | 5 | 4 | **4** |
| QB | 0 | 0 | 1 | 1 | 1 | 3 | 2 | 2 | **1** |
| TE | 0 | 0 | 0 | 1 | 0 | 1 | 0 | 0 | **0** |

The prior analysis flagged 2024–2025 as WR overtaking RB in Round 1 (4.5 WR vs 3.5 RB). **2026 partially reverses that: RB is back on top 5–4.** With QB pushed to Round 2, Round 1 reverted to a pure RB/WR round, and RB won it.

**First-five-rounds allocation (50 picks):**

| Year | QB | RB | WR | TE |
|---|---:|---:|---:|---:|
| 2022 | 7 | 19 | 19 | 5 |
| 2023 | 9 | 16 | 22 | 3 |
| 2024 | 9 | 18 | 21 | 2 |
| 2025 | 8 | 20 | 19 | 3 |
| **2026** | **13** | **17** | **18** | **2** |

QB's share of the first five rounds jumped from ~8–9 picks to **13** — a **+50% increase**, taken almost entirely out of WR (−1 to −4) and TE.

**TE premium: dead, and staying dead.** Only **2 TEs went in the first five rounds** in 2026, tying 2024 for the fewest in nine years (2022 peak: 5). Mean first-TE round is 7.50, in line with the 7.2–8.1 range of the last three years and well off the 6.0–6.6 Kelce-era numbers. First TE off the board was Trey McBride at pick 25 — later than 2021 (6), 2023 (5), 2025 (20). **The prior analysis's "early-TE spiked and faded" call holds; 2026 confirms it rather than reversing it.** The exception is Darwin Hu, below.

**K and D/ST: no meta shift at all.** Normalized timing (round ÷ total rounds) is flat:

| Year | K mean rd | K normalized | D/ST mean rd | D/ST normalized |
|---|---:|---:|---:|---:|
| 2023 | 16.30 | 0.91 | 13.80 | 0.77 |
| 2024 | 14.90 | 0.93 | 14.40 | 0.90 |
| 2025 | 14.64 | 0.91 | 14.70 | 0.92 |
| **2026** | **14.55** | **0.91** | **14.20** | **0.89** |

Identical to 2024–2025. **No kicker or defense creep — the league's late-round discipline is the most stable thing in it.** Individual movement (Rollin, Chan) is covered per manager.

**Relative Aggression Index by manager and year** (de-meaned within each year; **positive = took positional tiers earlier than his peers that year**; units are picks on a 160-pick scale):

| Manager | 2018 | 2019 | 2020 | 2021 | 2022 | 2023 | 2024 | 2025 | **2026** | avg 18–25 | Δ2026 |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| Darwin Hu | +1.1 | −2.9 | +1.8 | +1.0 | +4.1 | +0.6 | +1.9 | +0.5 | **+3.0** | +1.0 | +2.0 |
| Jeffrey Chan | – | – | – | −0.4 | −1.0 | −2.3 | −0.2 | −2.0 | **+2.0** | −1.2 | **+3.2** |
| Ikaika Stone | +1.6 | +0.7 | +0.1 | +0.2 | +1.5 | +1.7 | +1.0 | −1.5 | **+1.2** | +0.7 | +0.5 |
| Christopher Pascual | −0.5 | +0.6 | +1.3 | +1.4 | −1.9 | −0.8 | −1.1 | −0.2 | **+0.5** | −0.1 | +0.6 |
| Chase Mizoguchi | +0.6 | −1.9 | +0.9 | −1.2 | +2.7 | +0.9 | −0.0 | +0.4 | **−0.1** | +0.3 | −0.4 |
| Harvey Wang | +1.4 | +2.0 | −0.3 | +1.7 | −0.1 | +0.1 | +0.1 | −2.0 | **−0.1** | +0.4 | −0.5 |
| Rollin Odama-Wong | −0.6 | +3.1 | 0.0 | −1.0 | −2.4 | +2.8 | −2.7 | +0.1 | **−1.0** | −0.1 | −0.9 |
| Evan Fukumoto | −2.8 | −0.1 | −0.4 | +2.0 | +0.3 | −0.5 | +2.9 | +4.3 | **−1.2** | +0.7 | **−1.9** |
| Prashanth Balaraman | +2.3 | −1.2 | −2.0 | −0.8 | −0.8 | +0.3 | −4.1 | −0.3 | **−2.0** | −0.8 | −1.1 |
| Justin Ho | −3.4 | −1.2 | −2.3 | −2.8 | −2.3 | −3.0 | +2.2 | +0.8 | **−2.3** | −1.5 | −0.9 |

**2026 valSF, centered on the league mean of −23.5** (positive = drafted closer to ESPN superflex rank than the field, i.e. fewer reaches):

| Manager | Mean valSF | Centered | R1–5 centered | R6–16 centered | Biggest reach | Biggest value |
|---|---:|---:|---:|---:|---|---|
| Jeffrey Chan | −13.9 | **+9.6** | +0.6 | **+14.4** | Rachaad White (−35) | Jalen Hurts (+5) |
| Christopher Pascual | −14.1 | **+9.4** | +6.4 | +11.2 | Jacoby Brissett (−44) | Jayden Daniels (+12) |
| Harvey Wang | −17.9 | +5.6 | +2.2 | +7.6 | C.J. Stroud (−46) | Trevor Lawrence (0) |
| Prashanth Balaraman | −18.8 | +4.7 | +4.0 | +5.3 | Blake Corum (−71) | Bo Nix (+11) |
| Justin Ho | −19.3 | +4.2 | +3.2 | +4.9 | Jonah Coleman (−77) | DK Metcalf (+15) |
| Darwin Hu | −23.4 | +0.1 | −1.4 | +1.0 | Fernando Mendoza (−95) | Lamar Jackson (+6) |
| Chase Mizoguchi | −24.6 | −1.0 | +2.0 | −2.6 | Jordyn Tyson (−88, IR) | Jakobi Meyers (+18) |
| Evan Fukumoto | −28.4 | −4.9 | −6.0 | −4.2 | Makai Lemon (−62) | Tyler Shough (+4) |
| Ikaika Stone | −31.6 | −8.1 | −9.6 | −7.2 | Aaron Rodgers (−105) | Josh Allen (+2) |
| Rollin Odama-Wong | −42.5 | **−19.0** | −1.0 | **−28.8** | Kaelon Black (−141) | Caleb Williams (−2) |

---

## 3. The three biggest pivots

### 1. Justin Ho — the largest single-manager change in the draft (pivot 17.1)

Nine years of a stable identity, discarded in one draft. Justin's first QB has come in **Rounds 4–6 in all eight prior drafts** (4, 5, 4, 4, 6, 6, 5, 6 — never earlier than 4). In 2026 he took **Drake Maye at 2.07, overall pick 17** — **34.8 picks earlier than his 2022–25 average**, the biggest QB1 move in the league. He also took only **2 QBs**, his fewest since 2022, meaning he spent an early pick on QB and then *stopped* rather than double-tapping.

Simultaneously he abandoned the other half of his identity. The prior analysis described him as "RB-leaning with a recurring taste for a premium TE" — Kelce R1 2021, Andrews R2 2022, first TE in Rounds 3–5 in five of eight years. **In 2026 his first TE was George Kittle in Round 11** — his latest TE since 2018, and a 5.9-round move off his career norm. He also flipped RB/WR: **1 RB and 3 WRs in his first five rounds** (his previous four drafts averaged 2.5 RB / 1.75 WR early), and finished 6 WR / 5 RB.

**Deliberate.** No autodraft picks, no injury-forced moves in the early rounds. Ja'Marr Chase → Drake Maye → Ashton Jeanty → Drake London → Ladd McConkey is a coherent WR-first-with-elite-QB plan, and his centered valSF (+4.2) is fifth-best in the league — he executed it without reaching. He remains the league's most position-tier-patient drafter (RAI −2.3).

### 2. Rollin Odama-Wong — the league's most defined identity, deleted (pivot 13.4)

The prior writeup's headline finding was that Rollin "has taken a QB in Round 1 every single year from 2022 on — the most defined identity in the league." His QB1 overall picks 2022–2025: **7, 9, 4, 5.**

**In 2026 he did not take a QB until Round 5, overall pick 48** — his **latest first QB in all nine drafts** (previous latest: Round 4, 2018). That is **+41.8 picks** off his four-year average, by far the largest swing in the dataset in either direction. He opened WR-WR-RB-RB (Amon-Ra St. Brown, CeeDee Lamb, Derrick Henry, Javonte Williams) — a straight skill-position build he has never run.

**Deliberate, and slot is not the explanation.** He drafted from slot 8 in 2026, but he took a QB at 1.01-equivalent from slot 9 in 2023 and slot 7 in 2022. Slot 8 has never stopped him before.

**But the execution collapsed.** Having passed on QB early, he then took **three QBs** anyway — Caleb Williams (R5), **Jordan Love (R8, valSF −62)** and **Malik Willis (R9, −44)** — paying a heavy premium for replacement-level arms after the run had gone. His centered valSF of **−19.0** is worst in the league by 11 points, and it is concentrated in the back half (**−28.8 in R6–16** versus −1.0 in R1–5). He also took **Kaelon Black at 16.03 (−141)**, the single biggest reach in the draft. He additionally pulled his **kicker up to Round 12** — his earliest ever (his prior nine-year range was 13–18) and the first K off the board in 2026. The pivot reads as an intentional plan up top followed by an unplanned scramble once the QB tier emptied.

### 3. Prashanth Balaraman — the "most consistent manager in the league" broke (pivot 10.7)

The prior analysis singled Prashanth out as *"the steadiest strategy in the league: elite-WR anchor, an early/mid TE, mid-round QB — barely changed in 8 years."* All three legs moved in 2026.

- **QB:** first QB in Rounds 4–6 in all eight prior drafts (5, 4, 4, 4, 6, 4, 6, 4). **2026: Joe Burrow at 2.04, overall 14** — earliest ever, **−28.5 picks** off his 2022–25 average — then Bo Nix at 5.07. Both QBs by Round 5 for the first time in his career.
- **TE:** first TE in Rounds 3–6 in six of eight prior years (2025: R3). **2026: Sam LaPorta in Round 8**, his second-latest ever.
- **RB:** first RB in **Round 4** (Travis Etienne), his latest first RB in nine drafts (prior latest: R3).

Only the elite-WR anchor survived — Puka Nacua at 1.07, then Rashee Rice R3. **Deliberate**, no autodraft or injury forcing. He stayed disciplined doing it: centered valSF +4.7 (4th) and RAI −2.0, still one of the two most patient tier-drafters in the league. This is the same "wait, then take value" instinct applied to a new positional order.

---

## 4. The three managers who barely changed

### Harvey Wang (pivot 3.3 — the most static manager in the league)

Every headline number is inside his own noise band. First QB **Round 4** (2022–25 avg 4.5, nine-year range 3–6). First RB Round 1, first WR Round 3 — his standard opener. Position counts 3 QB / 5 RB / 5 WR / 1 TE, essentially his four-year average. **First TE in Round 12**, continuing the most extreme TE punt in the league (12, 13, 12 in the last three years). K in Round 16 and D/ST in Round 15 — exactly where he always puts them (K in Rounds 16–18 in eight of nine years). RAI −0.1, dead neutral.

The **one** genuine change: he took **Trevor Lawrence (R4) and Justin Herbert (R5) back to back** — a one-round gap between his two QBs. His prior minimum gap was 2 rounds (2018), and it has usually been 3–4. He compressed his QB acquisition without moving its start point. His two autodraft picks (Eagles D/ST, Jake Bates) are both K/D-ST in the last two rounds and are noise, not signal. He also has the **lowest player continuity in the league — exactly 1 repeat pick** (De'Von Achane), letting go of Courtland Sutton (3x, → Jeffrey Chan R8), Terry McLaurin (→ Pascual R6) and Saquon Barkley (→ Evan R3).

### Chase Mizoguchi (pivot 5.6)

First QB Round 5 against a 2022–25 average of 6.25 and a nine-year range of 4–8 — inside normal variance, though it does continue his gradual drift away from being "the league's latest-QB drafter" (R7–R8 in 2022 and 2024). He then double-tapped with Stafford in R6, giving him both QBs by Round 6 for only the second time since 2021. Opened Christian McCaffrey at 1.05 — a return to hero-RB after two straight WR-first openers, but a shape he ran for years before that.

The most notable continuity is **early TE for a second straight year**: Trey McBride in Round 3, following Brock Bowers in Round 2 of 2025. The prior analysis flagged 2025's Bowers pick as "his most aggressive early-TE move yet" — **2026 confirms it was a new standing preference, not a one-off.** RAI −0.1, centered valSF −1.0: exactly average aggression, exactly average discipline. **Also the highest player continuity in the league at 6 repeat picks** — CMC (3rd time), Stafford (3rd), Josh Jacobs (3rd), Rams D/ST (3rd), Brock Purdy, Marvin Harrison Jr. His Isiah Pacheco (3x), Tyreek Hill (3x) and Nick Chubb (3x) attachments ended only because those players are gone from the league entirely.

### Evan Fukumoto (pivot 6.2 — statistically third-most static, but with one real reversal)

Composite-wise Evan sits near the bottom of the pivot table, but that understates a single meaningful change; see his section below.

---

## 5. Per-manager detail (all 10)

### Evan Fukumoto — reverted to his 2018/2022 self on QB

`2026 R1–8: RB-RB-RB-WR-WR-QB-WR-TE`

The prior analysis's finding about Evan was: *"you've moved QB up from Rounds 5–6 to Rounds 2–3 over the last three drafts."* **2026 reverses it completely.** His first QB was **Jared Goff at 6.09, overall 59** — versus overall picks of 30, 16 and 14 in 2023–2025. That is **+29.5 picks later** than his four-year average and ties 2022 as his latest first QB in nine drafts. It also made him **the only manager in the league to wait past Round 5** for a QB.

He paired it with his most RB-committed opener since 2018: **Bijan Robinson, Kenneth Walker III, Saquon Barkley in Rounds 1–3**, and 3 RB / 2 WR through five rounds (his 2023–25 early mix averaged 1.3 RB / 2.3 WR). He also took **zero QBs in the first five rounds** for the first time since 2022.

**Deliberate on structure, expensive on execution.** No autodraft, no injury-forced picks. But the QB delay cost him: Goff at −41, Sam Darnold at −41, and only Tyler Shough (+4) came in on rank. His centered valSF is **−4.9, eighth of ten**, and it is worse in the early rounds (**−6.0 in R1–5**) than late — DeVonta Smith (−27) and Kenneth Walker (−22) are the culprits. This is a fresh problem: his RAI flipped from **+2.9 / +4.3 in 2024–2025 (the two most aggressive years of his career)** to **−1.2 in 2026**, meaning he stopped chasing tiers early and instead took players well after their rank suggested — the opposite failure mode. Note that this early-round leakage contradicts the pattern in `draft-pick-performance.md`, where Evan's historical strength was Rounds 1–2 (+363) and his weakness was Rounds 4–9 (−787). **In 2026 the early rounds, not the middle, are where he gave value back.**

**Continuity:** 4 repeat picks — Saquon Barkley (2nd), DeVonta Smith (3rd), Sam Darnold (3rd), Dalton Kincaid (2nd). He let go of Michael Pittman Jr. (→ Jeffrey Chan R11) and Davante Adams (→ Harvey Wang R6). TE at R8 and R15, K at R16, D/ST at R14 — all exactly his career norms.

### Jeffrey Chan — first-ever early QB double-tap

`2026 R1–8: RB-QB-QB-WR-RB-WR-WR-WR`

From the 1.01 slot he took Jahmyr Gibbs, then **Jalen Hurts (2.10) and Jaxson Dart (3.01) back to back at the 2/3 turn**. His five prior drafts had first-QB rounds of 4, 6, 2, 6, 3, and his two QBs were never both inside the top 25 picks — 2022's 6/7 was the tightest pair, and that was 50+ picks deep. **Locking both QB slots by pick 21 is new.** He also opened RB for the first time since 2023, having been the league's most consistent WR-first drafter.

**Deliberate and well-executed.** He was the **best value drafter in the 2026 field (centered +9.6)**, essentially all of it in the back half (**+14.4 in R6–16**), which matches his profile in `draft-value-all-managers.md` as the league's best drafter (+1238) with strength in the middle and late. But his **RAI jumped from a five-year average of −1.2 to +2.0 — the largest aggression swing in the league (+3.2)**. Chan, previously the manager who "rarely reaches," was second-most-aggressive on positional tiers in 2026 while still landing value. That combination is deliberate tier-reading, not recklessness.

Two quirks continue: he took **two kickers again** (R14 Eddy Pineiro, R16 Andre Szmyt — same as 2025), the only manager who does this. But his **first kicker moved back to Round 14**, later than his career norm of R10–R13 — he is no longer the earliest kicker drafter in the league. **Continuity:** 4 repeats (Zay Flowers, Tony Pollard, Rachaad White, Andre Szmyt); he dropped Justin Jefferson (→ Chase R2) and Tee Higgins after re-drafting them for two straight years.

### Ikaika Stone — re-committed to early QB, and went RB-heavy

`2026 R1–8: QB-RB-RB-WR-WR-TE-QB-WR`

The prior analysis called Ikaika "the one manager who tried a shift and backed off it" — early QB in 2023 (Mahomes R1) and 2024 (Hurts R2), then reverting to QB@5 in 2025. **2026 re-commits, harder than before: Josh Allen at 1.03, overall pick 3** — his earliest QB1 in nine drafts by overall pick (2023's was pick 7), and −22 picks off his four-year average. So the "backed off" reading of 2025 now looks like a one-year detour, not a settled preference; his QB1 overall picks read 31, 7, 14, 48, **3**.

The larger structural change is at RB. He drafted **6 RBs**, the most in the league and tied for his career high, against a 2022–25 average of 4.5, and cut WRs to 4 (his fewest since 2022). Chase Brown (R2), Omarion Hampton (R3), Jaylen Warren, J.K. Dobbins, Zach Charbonnet, RJ Harvey — this is the deepest RB room anyone built.

**Deliberate but costly.** Zach Charbonnet was already OUT when drafted (R12) — flag that as injury noise. Everything else was a choice, and his **centered valSF of −8.1 is ninth of ten**, worse early (−9.6) than late. Chase Brown (−36) and Omarion Hampton (−32) at the 2/3 turn were substantial reaches, and **Aaron Rodgers at 13.03 (−105)** is the second-biggest reach in the draft. His RAI (+1.2) is consistent with his career (+0.7), so the reaching is in character; the volume of it is not.

**Continuity — a five-year streak ended.** Ikaika had drafted **Stefon Diggs five separate times (2019, 2020, 2022, 2023, 2025)**, the strongest player attachment in the entire league per `player-attachment-analysis.md`. In 2026 he did not take him; **Rollin Odama-Wong took Diggs in Round 13.** He also let go of Dak Prescott (3x, → Pascual R4) and Derrick Henry (→ Rollin R3). He did re-draft Kyler Murray, Mike Evans and Rodgers. His K moved up to R14 (from a 15–18 career range) and D/ST stayed at R16.

### Justin Ho — see §3.1 (biggest pivot in the league)

### Chase Mizoguchi — see §4 (most static, tier 2)

### Christopher Pascual — the hero-RB anchor finally let go of Round 1 RB

`2026 R1–8: WR-QB-RB-QB-WR-WR-RB-TE`

Pascual's defining habit across eight drafts was opening RB: **first RB in Round 1 in seven of eight years, Round 2 in the eighth.** In 2026 his **first RB came in Round 3** (Jeremiyah Love) — his latest ever, +1.9 rounds off his career norm — after opening **Jaxon Smith-Njigba (1.06)**. This is the first draft in which he did not have an RB inside his first two picks.

He replaced that pick with QB: **Jayden Daniels at 2.05 (overall 15), then Dak Prescott at 4.05** — QB1 at his earliest since 2019, −14.2 picks off his four-year average, and both QB slots filled by Round 4. Combined with the RB delay, his opening five is 1 RB / 2 WR / 2 QB where his 2022–25 early mix averaged 2 RB / 1.25 WR / 1.25 QB.

**Deliberate and very disciplined.** No autodraft, no injuries. **Centered valSF +9.4, second-best in the league**, and the **best early-round mark in the field (+6.4 in R1–5)** — he took Daniels at +12 and Dak at +1, i.e. he got both QBs at or ahead of rank while others reached. Given `draft-value-all-managers.md` shows his career weakness is the late rounds (−790 in R10+), his +11.2 late mark in 2026 is a notable departure too.

**Continuity is his strongest trait: 7 repeat picks**, most in the league — Jayden Daniels (2nd), Dak Prescott (2nd), Terry McLaurin (2nd), D'Andre Swift (2nd), TreVeyon Henderson (2nd), Jordan Addison (2nd), and **Travis Kelce for the third time (R15)**, a late-round nostalgia pick that closes the loop on the 2022–23 Kelce window the prior analysis identified. His first non-Kelce TE was Harold Fannin Jr. in Round 8, consistent with his post-Kelce Round 8–10 TE norm. K R14, D/ST R13 — unchanged.

### Prashanth Balaraman — see §3.3

### Rollin Odama-Wong — see §3.2

### Harvey Wang — see §4 (most static)

### Darwin Hu — quadrupled down on QB and took his earliest TE ever

`2026 R1–8: RB-QB-WR-TE-WR-QB-RB-RB`

Darwin's QB timing looks unchanged on the surface — Lamar Jackson at 2.01, overall pick 11, versus overall picks of 4, 4, 4 in 2023–2025. But he drafted from **slot 10**, so 2.01 is his first realistic QB window; his Round-1 pick (James Cook at 1.10) and Lamar at 2.01 are back-to-back picks. **Functionally he continued the QB-R1 identity the prior analysis credited him with — this is continuity, not a pivot.**

What *did* change:

1. **He drafted 4 QBs** — most in the league, and up from a 2022–25 average of 2.75. Lamar (R2), Mahomes (R6), Bryce Young (R12), **Fernando Mendoza (R14, valSF −95)**. That's a full QB-hoarding strategy in a 2-QB league, and it is new.
2. **Brock Bowers in Round 4 is his earliest TE in nine drafts** by four rounds (career range R5–R10, 2022–25 average R8.8). He was previously a late-TE drafter; he is now not.
3. He cut to **1 TE** and stayed at 5 WR / 4 RB.

**Deliberate.** No autodraft, no injury forcing. His **centered valSF is +0.1 — dead average**, but that masks the shape: he was the **second-most positionally aggressive manager in the league (RAI +3.0 vs a career +1.0)**, which is consistent with his profile as the middle-round king in `draft-value-all-managers.md` (+669 in R4–9). Mendoza (−95) and Bryce Young (−44) are the price of QB4.

**Continuity broke, mostly by slot.** He re-drafted only 3 players (Brock Bowers, Rhamondre Stevenson, Jaguars D/ST). His long-running holds all went elsewhere before pick 10: **Josh Allen (2x) → Ikaika at 1.03**, **Jaxon Smith-Njigba (2x) → Pascual at 1.06**, **Drake London (2x) → Justin Ho R4**, **DJ Moore (3x) → Rollin R7**. Picking last, he could not defend them — this is slot noise, not a change of heart.

---

## 6. Attachment continuity, league-wide

Repeat picks (manager drafted the same player in a prior year) in 2026:

| Manager | Repeats | Notable renewals | Notable breaks |
|---|---:|---|---|
| Justin Ho | **8** (most in league) | Ja'Marr Chase, Ashton Jeanty, Drake London, Ladd McConkey, George Kittle, DK Metcalf, Baker Mayfield, Steelers D/ST | **Kyle Pitts Sr. — held all 4 seasons 2022–25, → Jeffrey Chan R9** |
| Christopher Pascual | 7 | Travis Kelce (3rd), Dak Prescott, Jayden Daniels, D'Andre Swift, TreVeyon Henderson, Jordan Addison, Terry McLaurin | Bijan Robinson (→ Evan 1.02), Cooper Kupp |
| Chase Mizoguchi | 6 | CMC (3rd), Stafford (3rd), Josh Jacobs (3rd), Rams D/ST (3rd), Brock Purdy, Marvin Harrison Jr. | Pacheco/Hill/Chubb — all out of the league |
| Prashanth Balaraman | 5 | Joe Burrow (3rd), Bo Nix, Travis Etienne, Bhayshul Tuten, Cam Skattebo | Justin Herbert (→ Harvey R5), C.J. Stroud (→ Harvey R10), Breece Hall (→ Chase R4) |
| Rollin Odama-Wong | 5 | Brandon Aubrey (3rd), Javonte Williams (3rd), DJ Moore (3rd), CeeDee Lamb, Chargers D/ST | **Lamar Jackson (3x) → Darwin 2.01** |
| Evan Fukumoto | 4 | Saquon Barkley, DeVonta Smith (3rd), Sam Darnold (3rd), Dalton Kincaid | Michael Pittman Jr. (→ Chan R11), Davante Adams (→ Harvey R6) |
| Jeffrey Chan | 4 | Zay Flowers, Tony Pollard, Rachaad White, Andre Szmyt | Justin Jefferson (2x, → Chase R2), Tee Higgins (→ Chase R7) |
| Ikaika Stone | 4 | Kyler Murray, Mike Evans, Aaron Rodgers, Chase Brown | **Stefon Diggs — 5 drafts, the league's strongest attachment, → Rollin R13** |
| Darwin Hu | 3 | Brock Bowers, Rhamondre Stevenson, Jaguars D/ST | Josh Allen, JSN, Drake London, DJ Moore — all gone before his 1.10 slot |
| Harvey Wang | **1** | De'Von Achane | Courtland Sutton (3x, → Chan R8), Saquon Barkley, Terry McLaurin, Jaylen Warren |

**The two headline broken attachments are Ikaika Stone / Stefon Diggs (5 drafts, ended) and Justin Ho / Kyle Pitts (rostered all four tracked seasons, ended).** Both are consistent with those managers' larger 2026 pivots — Ikaika reallocating to RB depth, Justin abandoning premium TE. Harvey Wang's single repeat pick is the lowest continuity number in the league and is consistent with his profile: he is static in *strategy* and volatile in *personnel*.

---

## 7. Where 2026 continues vs. breaks the prior analysis

| Prior finding (`draft-analysis-all-years.md`) | 2026 verdict |
|---|---|
| "Round 1 flipped from RB-first to WR-first" | **Partially reversed** — RB 5, WR 4 in Round 1 |
| "QB run has crept slightly later, Rounds 6–7" | **Broken decisively** — median QB1 round 2.0, 13 QBs in the top 50 |
| "Typically 2 QBs go in Round 1 (Rollin + Darwin)" | **Broken** — 1 QB in Round 1, and it was neither of them (Ikaika/Josh Allen) |
| "Early TE spiked and faded" | **Confirmed** — 2 TEs in the first 5 rounds, tied lowest ever |
| "K and D/ST ruthlessly disciplined, last 2–3 rounds" | **Confirmed** — normalized timing identical to 2024–25 |
| Rollin = "QB in Round 1 every year, most defined identity" | **Broken** — QB1 at overall 48, his latest ever |
| Darwin = "latest QB → earliest QB, the sharpest pivot" | **Continued** — QB at his first available turn, plus 4 QBs total |
| Chase = "latest-QB drafter, moved to WR-first, Bowers R2 in 2025" | **Early-TE confirmed as a habit** (McBride R3); WR-first partly reverted (CMC 1.05) |
| Evan = "moved QB up from R5–6 to R2–3" | **Reversed** — back to Round 6 |
| Ikaika = "tried early QB 2023–24, reverted in 2025" | **Re-reversed** — Josh Allen at overall pick 3 |
| Prashanth = "steadiest strategy in the league, barely changed in 8 years" | **Broken on all three legs** (QB R2, TE R8, RB R4) |
| Pascual = "rock-steady RB-anchor, opens RB nearly every year" | **Broken** — first RB in Round 3, opened WR |
| Harvey = "RB/WR, mid QB, most extreme TE punt" | **Fully confirmed** — the league's most static manager |
| Justin Ho = "no dramatic pivot, toggles early TE vs punt TE" | **Broken hardest of anyone** — QB R2, TE R11, WR-first |

---

## 8. Bottom line

- **The league-wide story is QB timing.** Median first-QB round went 3.5 → **2.0**; median QB1 overall pick 29 → **18.5**; QBs in the top 50 picks 8 → **13**; managers with both QBs by Round 6 3 → **6**. Every one of those is an all-time high in nine drafts. Eight of ten managers took QB1 earlier than their own four-year average.
- **The mass moved to Rounds 2–3, not Round 1.** Only one QB went in Round 1 (fewest since 2022). The league now treats the 2/3 turn as the QB window.
- **Biggest pivots:** Justin Ho (QB R6→R2, TE R4→R11, RB-lean→WR-first), Rollin Odama-Wong (QB R1→R5, deleting the league's most defined identity), Prashanth Balaraman (the "never changes" manager changing QB, RB and TE timing simultaneously).
- **Most static:** Harvey Wang (pivot 3.3, every number inside his own noise), Chase Mizoguchi (5.6, and his 2025 early-TE move now looks permanent), Evan Fukumoto (6.2 by composite — but with one genuinely large single-axis reversal on QB).
- **Nothing changed at K/D-ST.** Individual moves only: Rollin pulled his kicker to Round 12 (earliest of his career, first K off the board), Jeffrey Chan pushed his back to Round 14 (latest of his career) while still taking two.
