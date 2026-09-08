# 2026 Draft Analysis — League 275797 ("Will Chase ever win???")

Drafted 2026-09-07 · 10 teams · 16 rounds · snake · PPR
Starting lineup: **2 QB** / 2 RB / 2 WR / 1 TE / 1 FLEX / 1 K / 1 D/ST · 6 bench

Source data: `draft-board-2026.csv` (all 160 picks), `.espn-automation/draft2026_board.json` (settings, rosters, undrafted pool).
All point figures are ESPN's 2026 season projections (`proj26`). All value figures are `valSF = overall pick − ESPN superflex rank`; **positive = surplus, negative = reach**.

> **Read this first.** This is a **2-QB league**, not superflex. Twenty QB slots must be filled every single week out of ~32 startable NFL quarterbacks. That one fact drives almost everything below. It also means ESPN's public **ADP is useless here** — it comes from 1-QB leagues and systematically underprices QBs — so every value judgment on this page uses `rankSF`, not ADP.
>
> **One data caveat:** `valSF` is nonsense for kickers and defenses (ESPN buries them at superflex rank 230–510, so every K/DST looks like a −100 reach). All value/reach leaderboards here exclude K and D/ST. K/DST are still counted in lineup projections.

---

## 1. Power Ranking

### Method

Two steps, both fully mechanical:

1. **Optimal starting lineup projection.** For each roster, fill 2 QB / 2 RB / 2 WR / 1 TE / 1 FLEX / 1 K / 1 D/ST with the highest-`proj26` eligible players. This is the "everyone healthy, every week" ceiling.
2. **QB-availability adjustment.** Replace the naive "top two QBs" sum with the *expected* points actually delivered into the two mandatory QB slots across a 17-week season. Each QB is modeled as available in a given week with probability **p = 14/17 ≈ 0.824** (1 bye + ~2 games missed, the historical average for a starting NFL QB). Enumerate every availability state across a team's QBs; any unfilled QB slot is backfilled at **8.4 ppg** — 142.6 points over a season, the projection of the best *generic* free-agent QB (Shedeur Sanders) once Geno Smith is claimed.

Everything else (RB/WR/TE depth) is left unadjusted, because with only 1 FLEX and 6 bench spots, RB/WR depth is a marginal concern and QB depth is an existential one. Bench depth is reported separately as a tiebreaker.

**"QB pen"** below is the cost of that adjustment — it *is* the QB-fragility tax, measured in projected points.

| # | Manager | Slot | Raw lineup | QB (naive) | QB (adjusted) | **QB pen** | **ADJUSTED** | #QB | Bench depth (top-3 RB/WR/TE) |
|---:|---|---:|---:|---:|---:|---:|---:|---:|---:|
| 1 | **Chase Mizoguchi** | 5 | 2436.1 | 584.4 | 552.0 | −32.4 | **2403.7** | 3 | 526 |
| 2 | **Rollin Odama-Wong** | 8 | 2385.0 | 543.7 | 523.7 | −20.0 | **2365.0** | 3 | 465 |
| 3 | **Jeffrey Chan** | 1 | 2421.2 | 619.4 | 560.4 | **−59.0** | **2362.2** | **2** | 587 |
| 4 | **Prashanth Balaraman** | 7 | 2363.0 | 600.1 | 577.2 | −22.8 | **2340.2** | 3 | 529 |
| 5 | Evan Fukumoto | 2 | 2357.4 | 533.3 | 516.0 | −17.3 | **2340.1** | 3 | 542 |
| 6 | **Justin Ho** | 4 | 2388.7 | 584.0 | 531.3 | **−52.7** | **2335.9** | **2** | 603 |
| 7 | **Christopher Pascual** | 6 | 2348.1 | 603.1 | 561.8 | −41.3 | **2306.8** | 3 | 553 |
| 8 | **Ikaika Stone** | 3 | 2310.8 | 653.1 | 608.4 | −44.7 | **2266.1** | 3 | 542 |
| 9 | **Harvey Wang** | 9 | 2284.3 | 573.1 | 549.7 | −23.4 | **2260.9** | 3 | 563 |
| 10 | **Darwin Hu** | 10 | 2237.0 | 613.5 | 583.8 | −29.7 | **2207.3** | 4 | 545 |

**Spread from 1st to 10th: 196 points ≈ 11.5 points per week.** That is roughly one starting WR2. The league is tighter than the ordering suggests — places 3 through 7 are separated by 55 points total (3.2 ppg), which is inside the noise of a single projection system.

### Starting-lineup strength by slot

| Manager | QB×2 | RB×2 | WR×2 | TE | FLEX | K | D/ST |
|---|---:|---:|---:|---:|---:|---:|---:|
| Jeffrey Chan | **619** | **601** | 489 | 185 | **236** | 154 | 137 |
| Evan Fukumoto | 533 | **626** | 483 | 172 | **273** | 142 | 128 |
| Ikaika Stone | **653** | 533 | 489 | 210 | 194 | 158 | **73** |
| Justin Ho | 584 | 506 | **606** | 193 | 221 | 148 | 131 |
| Chase Mizoguchi | 584 | **616** | 513 | **242** | 194 | 158 | 130 |
| Christopher Pascual | 603 | **486** | 555 | 189 | 218 | **161** | 135 |
| Prashanth Balaraman | 600 | **474** | **613** | 189 | 206 | 157 | 125 |
| Rollin Odama-Wong | **544** | 537 | **618** | 207 | 210 | **171** | 100 |
| Harvey Wang | 573 | **609** | 482 | **155** | 208 | 144 | 113 |
| Darwin Hu | 613 | 487 | **461** | 241 | 207 | 146 | **82** |
| *League average* | *591* | *547* | *531* | *198* | *217* | *154* | *115* |

### Ranking commentary

**1. Chase Mizoguchi (2403.7).** Highest raw lineup *and* highest adjusted. He got there by paying nothing for QBs (picks 45 and 56) and spending everything else on ceiling. The one honest asterisk: **7 of his 16 picks carry an injury tag**, including McCaffrey, Breece Hall, Jonathon Brooks and Josh Jacobs. A risk-adjusted view slides him level with Rollin and Chan.

**2. Rollin Odama-Wong (2365.0).** The league's best WR pair and the *smallest* QB fragility tax (−20.0), because he actually rostered three usable QBs. He is here in spite of owning the league's worst QB output, not because of it.

**3. Jeffrey Chan (2362.2).** Second-best healthy lineup in the league. Also the single most fragile roster: two QBs, two kickers, no QB3. −59.0 is the largest tax in the draft and it is entirely self-inflicted.

**4. Prashanth Balaraman (2340.2).** The best-*constructed* roster in the league; the projections just don't love his running backs.

**5. Evan Fukumoto (2340.1).** Elite RB core (Bijan / Barkley / Walker, 626 + 273 FLEX, best in the league) undercut by the second-weakest QB duo (Goff + Shough, 533). Covered in detail elsewhere.

**6. Justin Ho (2335.9).** 4th-best healthy lineup, 6th after the QB tax. Same disease as Chan, slightly milder.

**7. Christopher Pascual (2306.8).** Third-best QB room, worst RB room.

**8. Ikaika Stone (2266.1).** Best QB slot in the league by 34 points and it isn't enough, because everything downstream of Josh Allen is below average.

**9. Harvey Wang (2260.9).** Great RBs, nothing else at or above league average.

**10. Darwin Hu (2207.3).** Last in raw projection *and* last after adjustment, while holding four quarterbacks.

---

## 2. Per-Manager Write-Ups

Autodraft note up front: **only 2 of 160 picks were autodrafted**, both by Harvey Wang at picks #149 (Eagles D/ST) and #152 (Jake Bates K). Combined damage vs. league-average K/DST: roughly **12 projected points**. No roster in this draft was meaningfully distorted by autodraft.

---

### Jeffrey Chan — Slot 1 · "Kick or die"

| | |
|---|---|
| Positional counts | **4 RB · 5 WR · 2 QB · 2 TE · 2 K · 1 D/ST** |
| Adjusted rank | 3rd (2362.2) — 2nd on raw lineup (2421.2) |
| Best value | **Jalen Hurts, #20** (rSF 15, **+5**) — 319.8 proj |
| Worst reach (skill) | Rachaad White, #141 (rSF 176, **−35**) |
| Verdict | **Elite lineup, negligent construction. Highest-variance team in the league.** |

Picks: Gibbs (1), Hurts (20), Dart (21), G.Wilson (40), Kyren (41), Flowers (60), T.McMillan (61), Sutton (80), Pitts (81), Pollard (100), Pittman (101), Broncos D/ST (120), Goedert (121), Pineiro (140), R.White (141), **Szmyt (160)**.

The 1.01 → Gibbs (369.1, highest-projected non-QB in the draft) plus the 2/3 turn on Hurts + Jaxson Dart is, at full strength, the second-best starting lineup in this league. He also has the league's best RB slot outside Evan (601) and deep, genuinely useful WR bench (Sutton 204, Pittman 197).

And then he threw a meaningful chunk of it away. **He drafted zero QB insurance and two kickers.** At pick **#160 — the final pick of the draft — Geno Smith (232.7 projected) was on the board, and Chan took Andre Szmyt (kicker, 120.8 projected).** He had already taken Eddy Pineiro at #140. The team name is "Kick or die," which is either self-aware or prophetic.

The math: his healthy QB slot is 619.4, second in the league. Run it through bye weeks and normal QB attrition and it delivers 560.4 — a **−59.0 point tax, the worst in the draft**, and 46 points worse than what Prashanth's structurally identical-quality QB room delivers. He also carries two TEs (Pitts + Goedert) while carrying zero backup QBs, which is the exact inversion of what a 2-QB / 1-TE league rewards.

He is ranked 3rd. He should have been ranked 1st. The gap is a second kicker.

---

### Ikaika Stone — Slot 3 · "Vietokwuegbunam Flashback"

| | |
|---|---|
| Positional counts | **6 RB · 4 WR · 3 QB · 1 TE · 1 K · 1 D/ST** |
| Adjusted rank | 8th (2266.1) |
| Best value | Josh Allen, #3 (rSF 1, **+2**) — 370.0 proj, highest in the draft |
| Worst reach | **Aaron Rodgers, #123 (rSF 228, −105)** — 2nd-worst reach of the draft |
| Verdict | **Best quarterback in the league, worst everything else.** |

Picks: **Josh Allen (3)**, C.Brown (18), Hampton (23), Olave (38), Pickens (43), T.Warren (58), Kyler (63), P.Washington (78), J.Warren (83), M.Evans (98), Dobbins (103), Charbonnet (118), Rodgers (123), Mevis (138), RJ Harvey (143), **Titans D/ST (158)**.

Taking Josh Allen at #3 in a 2-QB league is correct and he paired him with Kyler Murray (283.1) at #63 for a league-leading **653-point QB slot**. That is a 62-point edge over the league average at the position that matters most.

The problem is that he spent the rest of the draft losing that edge and more. His RB slot (533) and WR slot (489) are both below average, his D/ST is **Titans (72.9 projected — 42 points below the next-worst and 57 below league average, roughly −3.4 ppg all by itself)**, and his QB3 is Aaron Rodgers at 218.8, the steepest QB2→QB3 cliff among the three-QB teams (−64 points). That cliff is why he still eats a −44.7 tax despite carrying three arms.

Two picks that actively hurt: **Zach Charbonnet at #118 while listed OUT**, and Titans D/ST at #158 when the Browns (109.6), Lions (113.7), Patriots (106.1) and Chiefs (105.9) defenses all went undrafted. Second-worst value discipline in the draft (−443 cumulative valSF across skill picks).

Historically he flirted with early QB in 2023–24 and reverted in 2025; this year he went all the way back in, and it's the only part of his draft that worked.

---

### Justin Ho — Slot 4 · "The Big Beautiful Bill"

| | |
|---|---|
| Positional counts | **6 WR · 5 RB · 2 QB · 1 TE · 1 K · 1 D/ST** |
| Adjusted rank | 6th (2335.9) — **4th on raw lineup (2388.7)** |
| Best value | **DK Metcalf, #124** (rSF 109, **+15**) — best non-QB value of the draft |
| Worst reach | Jonah Coleman, #144 (rSF 221, **−77**); Jordan Mason, #117 (−60) |
| Verdict | **Best skill-position haul in the middle rounds; one QB injury from a lost season.** |

Picks: Chase (4), **Maye (17)**, Jeanty (24), London (37), McConkey (44), J.Price (57), Judkins (64), Odunze (77), **Mayfield (84)**, Golden (97), Kittle (104), Mason (117), **Metcalf (124)**, Steelers (137), J.Coleman (144), Butker (157).

He drafted the best wide receiver room in the league on a per-pick basis — Chase (336.9) and London (269.5) start, with McConkey (221.0) at FLEX and **Odunze (213.2), Metcalf (195.8) and Jadarian Price (194.1) on the bench**. That's 603 points of bench skill depth, the most in the draft. Drake London at #37 (+10) and Metcalf at #124 (+15) were two of the six best value picks of the whole draft.

Then the same failure as Chan: **two quarterbacks.** Drake Maye (319.8) and Baker Mayfield (264.3) is a fine starting pair — 584, right at league median — but there is nothing behind it, and he had picks #144 and #157 to fix it. He used them on Jonah Coleman (RB, 74.4 projected) and Harrison Butker. **Geno Smith, at 232.7 projected, was available for both.** Tax: **−52.7**, second-worst in the league, and it is the entire reason he finishes 6th instead of 4th.

Second flag: **5 of his picks carry a QUESTIONABLE tag**, including his first two (Chase, Jeanty). He is the most talent-rich and most brittle roster in the league simultaneously.

---

### Chase Mizoguchi — Slot 5 · "They Hit the Second Bower"

| | |
|---|---|
| Positional counts | **5 RB · 5 WR · 3 QB · 1 TE · 1 K · 1 D/ST** |
| Adjusted rank | **1st (2403.7)** — also 1st on raw lineup (2436.1) |
| Best value | **Jakobi Meyers, #145** (rSF 127, **+18**) — largest positive valSF in the draft |
| Worst reach | **Jordyn Tyson, #125** (rSF 213, **−88**) — and he's on **INJURY RESERVE** |
| Verdict | **Won the draft. Also drafted the widest injury tail in the draft.** |

Picks: CMC (5), Jefferson (16), **McBride (25)**, B.Hall (36), **Purdy (45)**, **Stafford (56)**, T.Higgins (65), Brooks (76), MHJ (85), Jacobs (96), C.Ward (105), Rams (116), Tyson (125), Myers (136), **Meyers (145)**, M.Washington (156).

This is the sharpest structural draft in the league. While six teams burned a round-1-or-2 pick on a quarterback, Chase took McCaffrey (341.5), Justin Jefferson (293.9) and Trey McBride (241.6 — best TE start in the league) with his first three picks, then bought a **league-median QB duo at picks 45 and 56**: Brock Purdy (291.6, +2) and Matthew Stafford (292.8, **+11**). He paid 101 total draft capital for 584 QB points; Harvey Wang paid 81 for 573. Chase got the same output while also owning a top-2 RB slot and the best TE.

Cam Ward (219.6) at #105 is a weak QB3 and costs him a −32.4 tax, but three arms is three arms.

**The honest caveat:** McCaffrey, Breece Hall, Tee Higgins, Jonathon Brooks and Jakobi Meyers are all QUESTIONABLE, Josh Jacobs is day-to-day, and **Jordyn Tyson at #125 is on IR** — a bench spot spent on a player who cannot play, in a league with only six bench spots. Seven of sixteen picks are dinged. If his projection holds he is the best team in the league; if two of CMC/Hall/Brooks miss time his RB room evaporates fast, because his RB4 is Josh Jacobs at 164.0.

---

### Christopher Pascual — Slot 6 · "Brown Ladd Squad"

| | |
|---|---|
| Positional counts | **5 WR · 4 RB · 3 QB · 2 TE · 1 K · 1 D/ST** |
| Adjusted rank | 7th (2306.8) |
| Best value | **Jayden Daniels, #15** (rSF 3, **+12**) — biggest value inside the top 50 picks |
| Worst reach | Jacoby Brissett, #115 (rSF 159, **−44**) |
| Verdict | **Third-best QB room in the league, dead-last RB room. Best draft-value discipline of the nine.** |

Picks: JSN (6), **Daniels (15)**, J.Love (26), **Dak (35)**, Egbuka (46), McLaurin (55), Swift (66), Fannin (75), Dowdle (86), Henderson (95), Addison (106), Brissett (115), Texans (126), Dicker (135), **Kelce (146)**, Worthy (155).

Getting **Jayden Daniels (rSF 3, 317.0 proj) at pick #15** was the best single piece of business in the first five rounds — the third-ranked superflex asset in the sport fell twelve slots past his rank because this league drafted RBs 1, 2 and 5. He followed it with Dak Prescott (286.1) at #35 for a **603-point QB slot at a total cost of picks 15 + 35**. That's the second-most efficient QB build after Chase's.

He then failed to build a running back room. **RB slot: 486, worst in the league**, 61 points below average. Jeremiyah Love (276.5) is fine; after that it's D'Andre Swift (209.9), Rico Dowdle (188.5) and TreVeyon Henderson (187.7), three rotational backs with real committee risk (three of the four are QUESTIONABLE).

He also reopened the tight-end hoard he closed after 2023 — Harold Fannin (#75) *and* Travis Kelce (#146) — in a 1-TE league. Kelce at −3 valSF is defensible as a late flier; carrying two TEs plus a QB3 of Jacoby Brissett (198.5, the weakest QB3 among three-QB teams) is not. Still, cumulative valSF of −198 across skill picks is the second-best discipline in the league.

---

### Prashanth Balaraman — Slot 7 · "WYD, Step Burrow"

| | |
|---|---|
| Positional counts | **5 WR · 4 RB · 3 QB · 2 TE · 1 K · 1 D/ST** |
| Adjusted rank | 4th (2340.2) |
| Best value | **Bo Nix, #47** (rSF 36, **+11**) |
| Worst reach | Blake Corum, #107 (rSF 178, **−71**) |
| Verdict | **The best-built roster in the league. The projections just don't like his running backs.** |

Picks: Nacua (7), **Burrow (14)**, Rice (27), Etienne (34), **Nix (47)**, Tuten (54), Skattebo (67), LaPorta (74), Tate (87), **D.Jones (94)**, Corum (107), Stribling (114), Fairbairn (127), Ferguson (134), Ravens (147), Coker (154).

Nobody handled the 2-QB requirement better. Joe Burrow (304.3) at #14, Bo Nix (295.7, **+11**) at #47, **and Daniel Jones (266.1) at #94 as a QB3 that would start for four teams in this league.** His QB2→QB3 drop-off is only 30 points — the flattest in the draft — which is why he carries the **second-smallest fragility tax (−22.8)** despite a 600-point QB slot. If Burrow gets hurt in Week 4, Prashanth's lineup barely notices. If Chan's or Ho's does, their season is over.

He also owns the second-best WR slot (613: Nacua 353.6 + Rashee Rice 259.3) with Carnell Tate (202.2) behind them.

The weakness is real: **RB slot 474, second-worst in the league.** Travis Etienne (246.4) and Cam Skattebo (227.4) start, and Bhayshul Tuten (206.0) FLEXes. Blake Corum at #107 (−71) was a bad use of a pick when the RB room already needed help.

Note also a break from an eight-year pattern: he has taken a TE in rounds 3–6 in seven of eight prior drafts. This year LaPorta came at **#74 (round 8)**, his latest first-TE since 2022 — and it cost him nothing, because TE was the cheapest position on the board.

---

### Rollin Odama-Wong — Slot 8 · "Rollin"

| | |
|---|---|
| Positional counts | **5 WR · 5 RB · 3 QB · 1 TE · 1 K · 1 D/ST** |
| Adjusted rank | **2nd (2365.0)** |
| Best value | **none positive.** Best pick was Caleb Williams, #48 (rSF 50, **−2**) |
| Worst reach | **Kaelon Black, #153 (rSF 294, −141)** — worst skill reach of the entire draft |
| Verdict | **Best WR corps in the league; worst QB slot in a 2-QB league. He abandoned his own identity and it half-worked.** |

Picks: **ARSB (8)**, **Lamb (13)**, D.Henry (28), Javonte (33), Caleb (48), Loveland (53), DJ Moore (68), **J.Love (73)**, M.Willis (88), Lloyd (93), Godwin (108), **Aubrey (113)**, Diggs (128), W.Marks (133), Chargers (148), K.Black (153).

The Amon-Ra St. Brown (324.0) + CeeDee Lamb (293.6) turn at 8/13 is the **best WR pair in the league (618)**, and Derrick Henry + Javonte Williams gives him a respectable 537 at RB with real depth behind it.

But here is the thing worth calling out to his face: **Rollin took a quarterback in Round 1 in 2022, 2023 and 2024.** That was his identity. This year he waited until **pick #48** and the result is the **worst QB slot in the league (543.7 naive, 523.7 adjusted)** — Caleb Williams (281.0) and Jordan Love (262.6), 47 points below league average at the one position with two mandatory slots. He did at least do the responsible thing and take a third arm (Malik Willis, 239.3, at #88), which is why his tax is only −20.0 and why he still lands 2nd.

He also had the **worst raw value discipline in the draft: −595 cumulative valSF over 14 skill picks (−42.5 average), and not a single pick with positive valSF.** He took the earliest kicker in the draft (Brandon Aubrey, #113, round 12), reached −77 on Chris Godwin, −73 on MarShawn Lloyd, −63 on Woody Marks, and closed with **Kaelon Black at #153 — superflex rank 294, 60.3 projected points, the single worst reach relative to rank in the entire draft.** That last one is essentially a discarded roster spot.

Ranking 2nd while paying above rank on every pick is a reminder that ESPN's board is not gospel — but four of the reaches above are on his bench, and bench spots are the one resource this format makes expensive.

---

### Harvey Wang — Slot 9 · "Harvey"

| | |
|---|---|
| Positional counts | **5 RB · 5 WR · 3 QB · 1 TE · 1 K · 1 D/ST** |
| Adjusted rank | 9th (2260.9) |
| Best value | **none positive.** Best was Trevor Lawrence, #32 (rSF 32, **0.0**) |
| Worst reach | C.J. Stroud, #92 (rSF 138, **−46**) |
| Autodraft | 2 picks — #149 Eagles D/ST, #152 Jake Bates. Cost ≈ **12 points** vs. league-average K/DST. Immaterial. |
| Verdict | **Paid QB2 prices for QB7 output, punted TE for the ninth straight year, and had no pick that beat its rank.** |

Picks: **J.Taylor (9)**, **Achane (12)**, AJ Brown (29), **T.Lawrence (32)**, **Herbert (49)**, Adams (52), Montgomery (69), J.Williams (72), A.Pierce (89), **Stroud (92)**, Gainwell (109), **Likely (112)**, W.Robinson (129), Monangai (132), Eagles (149, auto), Bates (152, auto).

The 9/12 turn was excellent: Jonathan Taylor (315.9) and De'Von Achane (293.2) gives him the **second-best RB slot in the league (609)** with David Montgomery (200.4) as insurance.

Everything after that underperformed. He spent picks **#32 and #49 — two top-50 selections — on Trevor Lawrence (289.6) and Justin Herbert (283.6)**, and the result is a **573-point QB slot, 7th in the league and 18 below average.** Chase Mizoguchi got 584 out of picks #45 and #56. Christopher Pascual got 603 out of #15 and #35. Harvey paid a middle price for the worst outcome of any team that invested early at QB. He then added C.J. Stroud at #92 (−46) for a QB3.

**And he punted tight end again.** Isaiah Likely at #112 projects **155.1 — the worst starting TE in the league by 17 points and 43 below league average.** This is the ninth consecutive year he's taken his TE last or near-last. It was defensible when TE was scarce league-wide; it is not defensible when **Mark Andrews (169.1), T.J. Hockenson (158.4), Juwan Johnson (146.7) and Kenyon Sadiq (146.0) all went completely undrafted.** He didn't need to spend a pick to beat Likely; he needed to spend a *later* pick.

His WR slot (482, 9th) is the other hole: A.J. Brown (249.4) and Davante Adams (232.2) are both on the wrong side of the aging curve. **Zero picks with positive valSF** — he and Rollin are the only two.

---

### Darwin Hu — Slot 10 · "Darwin"

| | |
|---|---|
| Positional counts | **5 WR · 4 RB · 4 QB(!) · 1 TE · 1 K · 1 D/ST** |
| Adjusted rank | **10th (2207.3)** — also 10th on raw lineup (2237.0) |
| Best value | Lamar Jackson, #11 (rSF 5, **+6**) |
| Worst reach | **Fernando Mendoza, #131 (rSF 226, −95)** — 3rd-worst reach of the draft, and a **fourth** QB |
| Verdict | **Lost the draft. Hoarded a position he'd already solved while fielding the league's worst WR room.** |

Picks: Cook (10), **Lamar (11)**, N.Collins (30), **Bowers (31)**, Waddle (50), **Mahomes (51)**, B.Irving (70), Stevenson (71), BTJ (90), C.Watson (91), Hubbard (110), **B.Young (111)**, Q.Johnston (130), **Mendoza (131)**, Little (150), Jaguars (151).

The turn at 10/11 was the right idea — James Cook (280.0) plus Lamar Jackson (322.5, rSF 5, **+6**). Brock Bowers at #31 gives him a 240.9 TE, effectively tied for best in the league. Mahomes (291.0) at #51 gives him a 613-point QB slot, 3rd best.

Then he took **Bryce Young at #111 (rSF 155, −44)** and, twenty picks later, **Fernando Mendoza at #131 (rSF 226, −95, 187.5 projected)**. That is a **fourth quarterback**, occupying one of six bench spots, projecting below eleven wide receivers and tight ends that went undrafted. He was already the most QB-insured team in the league after Bryce Young; the Mendoza pick has literally zero lineup value and the only justification is hoarding for trade leverage in a league where every rival except two already has a QB3.

The cost shows up exactly where you'd expect: **WR slot 461, worst in the league** (Nico Collins 248.2 + Jaylen Waddle 213.0), 70 points below average, with Christian Watson (187.7) and Brian Thomas Jr. (176.7) as the depth. **RB slot 487, ninth.** And **Jaguars D/ST at 81.7, second-worst in the league.**

Four QBs, a worst-in-league WR corps, and a bottom-two defense. It adds up to last place on both the raw and the adjusted board.

---

## 3. League-Wide Observations

### 3.1 The QB run, in order

29 quarterbacks were drafted. Twenty must start every week.

| # | Pick | Rd | QB | rSF | valSF | Proj | Manager |
|--:|--:|--:|---|--:|--:|--:|---|
| 1 | **3** | 1.3 | Josh Allen | 1 | +2 | **370.0** | Ikaika Stone |
| 2 | **11** | 2.1 | Lamar Jackson | 5 | +6 | 322.5 | Darwin Hu |
| 3 | **14** | 2.4 | Joe Burrow | 21 | −7 | 304.3 | Prashanth Balaraman |
| 4 | **15** | 2.5 | Jayden Daniels | 3 | **+12** | 317.0 | Christopher Pascual |
| 5 | **17** | 2.7 | Drake Maye | 13 | +4 | 319.8 | Justin Ho |
| 6 | **20** | 2.10 | Jalen Hurts | 15 | +5 | 319.8 | Jeffrey Chan |
| 7 | **21** | 3.1 | Jaxson Dart | 23 | −2 | 299.5 | Jeffrey Chan |
| 8 | **32** | 4.2 | Trevor Lawrence | 32 | 0 | 289.6 | Harvey Wang |
| 9 | **35** | 4.5 | Dak Prescott | 34 | +1 | 286.1 | Christopher Pascual |
| 10 | **45** | 5.5 | Brock Purdy | 43 | +2 | 291.6 | Chase Mizoguchi |
| 11 | **47** | 5.7 | Bo Nix | 36 | **+11** | 295.7 | Prashanth Balaraman |
| 12 | **48** | 5.8 | Caleb Williams | 50 | −2 | 281.0 | Rollin Odama-Wong |
| 13 | **49** | 5.9 | Justin Herbert | 52 | −3 | 283.6 | Harvey Wang |
| 14 | **51** | 6.1 | Patrick Mahomes | 58 | −7 | 291.0 | Darwin Hu |
| 15 | **56** | 6.6 | Matthew Stafford | 45 | **+11** | 292.8 | Chase Mizoguchi |
| 16 | **59** | 6.9 | Jared Goff | 100 | −41 | 268.3 | Evan Fukumoto |
| 17 | **63** | 7.3 | Kyler Murray | 75 | −12 | 283.1 | Ikaika Stone |
| 18 | **73** | 8.3 | Jordan Love | 135 | −62 | 262.6 | Rollin Odama-Wong |
| 19 | **82** | 9.2 | Tyler Shough | 78 | +4 | 265.1 | Evan Fukumoto |
| 20 | **84** | 9.4 | Baker Mayfield | 104 | −20 | 264.3 | Justin Ho |
| 21 | **88** | 9.8 | Malik Willis | 132 | −44 | 239.3 | Rollin Odama-Wong |
| 22 | **92** | 10.2 | C.J. Stroud | 138 | −46 | 246.1 | Harvey Wang |
| 23 | **94** | 10.4 | Daniel Jones | 102 | −8 | 266.1 | Prashanth Balaraman |
| 24 | **99** | 10.9 | Sam Darnold | 140 | −41 | 242.5 | Evan Fukumoto |
| 25 | **105** | 11.5 | Cam Ward | 157 | −52 | 219.6 | Chase Mizoguchi |
| 26 | **111** | 12.1 | Bryce Young | 155 | −44 | 237.7 | Darwin Hu |
| 27 | **115** | 12.5 | Jacoby Brissett | 159 | −44 | 198.5 | Christopher Pascual |
| 28 | **123** | 13.3 | Aaron Rodgers | 228 | **−105** | 218.8 | Ikaika Stone |
| 29 | **131** | 14.1 | Fernando Mendoza | 226 | **−95** | 187.5 | Darwin Hu |

**How it actually unfolded:**

- **Only one QB in round 1.** Ikaika took Allen at #3; the next eight picks were five RBs and three WRs. Nine of the top ten picks were skill players in a league where twenty QBs start.
- **Then the dam broke.** Five QBs went in round 2 (#11, #14, #15, #17, #20) and a sixth at #21. **Six of eleven picks from #11 to #21 were quarterbacks.**
- **Ten QBs gone by pick #51** — the first pick of round 6. **Half the mandatory QB slots were filled in five rounds.**
- **All 20 starter slots were filled by pick #99** (Sam Darnold, round 10.9). Everything after that is backup shopping.
- Nine backups were taken across rounds 9–14, and the last four (Ward, Young, Brissett, Mendoza) all reached 44+ slots past rank — which is simply what the QB market looks like when demand is 20 and quality supply is ~26.
- **QBs as a group were the *least* reached-for position in the draft** by valSF: average −19.9, median **−7**, versus RB −30.9, TE −22.4, WR −19.2. That's the market working: the QBs went roughly where the superflex board said they should, and the RBs went far too early.

**Who solved it and who didn't:** eight teams left with three or more QBs. **Jeffrey Chan and Justin Ho left with two.** Between them they used picks #140, #144, #157 and #160 on a second kicker, a 74-point RB, and two kickers — with **Geno Smith (232.7 projected) sitting undrafted the entire time.**

### 3.2 Which positions went early vs. rank

| Pos | Drafted | Avg valSF | Median valSF | Read |
|---|--:|--:|--:|---|
| **RB** | 46 | **−30.9** | −22 | **Most over-drafted position.** 5 of the first 10 picks. |
| TE | 14 | −22.4 | −23 | Over-drafted in the middle, then free late. Only 14 taken for 10 slots. |
| **QB** | 29 | **−19.9** | **−7** | **Priced most efficiently.** Correct, given the format. |
| WR | 50 | −19.2 | −18 | Priced roughly with RB, but far deeper. |
| K | 11 | (n/a) | — | First kicker #113 (Aubrey). Eleven taken for ten slots — Chan took two. |
| D/ST | 10 | (n/a) | — | First D/ST #116 (Rams). Exactly ten taken. |

Two structural notes:
- **RB was the only position the league genuinely overpaid for.** Five running backs went in round 1 and eight in the first fifteen picks, in a format with two RB slots and one FLEX. The teams that skipped that stampede (Pascual, Prashanth, Rollin, Justin Ho) got the elite WRs and QBs for free.
- **TE was nearly free.** Only 14 TEs were drafted; the 10th-best starting TE in the league projects 155.1, and **Mark Andrews (169.1) and T.J. Hockenson (158.4) went undrafted.** Anyone who spent a top-60 pick on a TE other than McBride or Bowers overpaid.

### 3.3 Biggest values of the draft (skill positions only)

| valSF | Pick | Player | Pos | rSF | Proj | Manager |
|--:|--:|---|---|--:|--:|---|
| **+18** | #145 | Jakobi Meyers | WR | 127 | 181.9 | Chase Mizoguchi |
| **+15** | #124 | DK Metcalf | WR | 109 | 195.8 | Justin Ho |
| **+12** | #15 | **Jayden Daniels** | QB | 3 | **317.0** | Christopher Pascual |
| +11 | #47 | Bo Nix | QB | 36 | 295.7 | Prashanth Balaraman |
| +11 | #56 | Matthew Stafford | QB | 45 | 292.8 | Chase Mizoguchi |
| +10 | #37 | Drake London | WR | 27 | 269.5 | Justin Ho |
| +6 | #11 | Lamar Jackson | QB | 5 | 322.5 | Darwin Hu |
| +5 | #20 | Jalen Hurts | QB | 15 | 319.8 | Jeffrey Chan |

**By actual points gained, Jayden Daniels at #15 is the value of the draft, not Meyers at #145.** A +18 on a 182-point WR who won't start is worth a fraction of a +12 on the third-ranked superflex asset in football. Christopher Pascual got a 317-point quarterback at the cost of a mid-round-2 pick because this league spent its first six selections on running backs and receivers.

### 3.4 Biggest reaches of the draft (skill positions only)

| valSF | Pick | Player | Pos | rSF | Proj | Manager |
|--:|--:|---|---|--:|--:|---|
| **−141** | #153 | Kaelon Black | RB | 294 | **60.3** | Rollin Odama-Wong |
| **−105** | #123 | Aaron Rodgers | QB | 228 | 218.8 | Ikaika Stone |
| **−95** | #131 | Fernando Mendoza | QB | 226 | 187.5 | Darwin Hu |
| −88 | #125 | Jordyn Tyson | WR | 213 | 99.8 (**IR**) | Chase Mizoguchi |
| −79 | #118 | Zach Charbonnet | RB | 197 | 134.0 (**OUT**) | Ikaika Stone |
| −77 | #108 | Chris Godwin Jr. | WR | 185 | 157.2 | Rollin Odama-Wong |
| −77 | #144 | Jonah Coleman | RB | 221 | 74.4 | Justin Ho |
| −73 | #93 | MarShawn Lloyd | RB | 166 | 134.4 | Rollin Odama-Wong |
| −71 | #107 | Blake Corum | RB | 178 | 159.3 | Prashanth Balaraman |
| −69 | #96 | Josh Jacobs | RB | 165 | 164.0 | Chase Mizoguchi |

Excluding those, the **worst reach that actually cost a starting slot** is Jared Goff at #59 (−41) and Jordan Love at #73 (−62) — both QB2s who now anchor the two weakest QB slots in the league.

Separately, and not on this table because valSF can't measure it: **Andre Szmyt, K, #160 (120.8 proj) by Jeffrey Chan, as a second kicker, over Geno Smith (232.7).** In pure lineup terms that is the worst pick of the draft, because Szmyt's marginal value to Chan's roster is literally zero.

### 3.5 Notable players left undrafted

| Player | Pos | rSF | Proj | Public ADP | Why it matters |
|---|---|--:|--:|--:|---|
| **Geno Smith** | QB | 200 | **232.7** | 170.0 | **Outprojects four drafted QBs** (Ward 219.6, Rodgers 218.8, Brissett 198.5, Mendoza 187.5). Free QB3 insurance nobody took — including the two teams with only two QBs. |
| Aaron Jones Sr. | RB | 170 | 178.2 | **117.1** | Fell ~35 picks past his public ADP. Would be the RB3 on six rosters. |
| Jayden Reed | WR | 147 | 173.4 | 139.8 | Outprojects 9 of the 50 drafted WRs. |
| Khalil Shakir | WR | 144 | 171.2 | 138.4 | Outprojects 7 of the 50 drafted WRs. |
| **Mark Andrews** | TE | 152 | **169.1** | 126.5 | Beats Harvey Wang's starting TE (Isaiah Likely, 155.1) by 14 points — free, 40 picks later. |
| T.J. Hockenson | TE | 172 | 158.4 | 154.3 | Also better than Likely. |
| Josh Downs | WR | 182 | 157.5 | 137.9 | — |
| Travis Hunter | WR | 115 | 137.6 | 118.8 | **Highest-ranked undrafted player in the league** and nobody wanted him. |
| Shedeur Sanders | QB | 304 | 142.6 | 169.9 | The realistic emergency-QB floor once Geno is claimed. |

Also undrafted: Lions (113.7), Browns (109.6), Patriots (106.1) and Chiefs (105.9) D/ST — **all four project better than the Jaguars (81.7, Darwin) and Titans (72.9, Ikaika) defenses that were actually drafted.**

---

## 4. Who Won the Draft, and Who Lost It

### Won: Chase Mizoguchi

**2436.1 raw / 2403.7 adjusted — first on both.** He won by refusing to participate in the round-2 QB run.

While six teams spent a pick in the top 21 on a quarterback, Chase used his first three picks on McCaffrey (341.5), Justin Jefferson (293.9) and Trey McBride (241.6). He then bought a **league-median QB slot (584) with picks #45 and #56** — Purdy at +2 and Stafford at +11 — which is a lower total cost than any team in the league except Christopher Pascual, who got more. He topped it off with Cam Ward as a third arm and the biggest single value of the draft in Jakobi Meyers (+18).

The result is a team that is top-2 at RB, top-4 at WR, best at TE, and average at QB, with three quarterbacks. Nobody else is above average at three positions.

**The one thing that could break it:** he drafted the most injured roster in the league — seven of sixteen picks are QUESTIONABLE, day-to-day or on IR, including McCaffrey, Breece Hall, Jonathon Brooks and Josh Jacobs. His RB4 is Josh Jacobs at 164.0. If two of the top three miss meaningful time, this ranking flips.

**Honorable mention — best *process*: Prashanth Balaraman.** Burrow at #14, Nix at #47 (+11), **Daniel Jones at #94 as a QB3 that would start for four teams**, and the second-best WR pair in the league. He has the smallest QB fragility tax of any high-investment QB team and the flattest QB2→QB3 cliff in the draft. He's 4th only because ESPN hates his running backs.

### Lost: Darwin Hu

**2237.0 raw / 2207.3 adjusted — last on both.** He drafted **four quarterbacks** in a league that starts two, and finished with the **worst WR room in the league (461, −70 vs. average)** and the second-worst D/ST (81.7).

The 10/11 turn (Cook + Lamar) and Bowers at #31 were fine. Everything after was a slow leak: Waddle over better WRs at #50, Bryce Young as a *third* QB at #111 (−44), and then **Fernando Mendoza at #131 (−95, 187.5 proj) as a fourth QB** — a bench spot spent on a player who cannot enter his lineup under any circumstance, while Jayden Reed (173.4), Khalil Shakir (171.2) and Mark Andrews (169.1) went undrafted. He converted his best asset (positional flexibility from the turn) into the one commodity he already had a surplus of.

### Also lost, differently: Jeffrey Chan and Justin Ho

Neither of them lost on talent — Chan has the **second-best healthy lineup in the league** and Ho has the **fourth-best plus the deepest bench (603)**. They both lost on the one rule this format enforces: **you need three quarterbacks.**

- Chan's QB tax is **−59.0**, Ho's is **−52.7**. Combined, that is 112 projected points evaporated for free.
- Chan spent picks #140 **and** #160 on kickers. Ho spent #144 on a 74-point running back and #157 on a kicker.
- **Geno Smith (232.7) was available at every one of those picks.** One waiver claim on Tuesday morning fixes exactly one of them.

They are the two highest-variance teams in the league: title contenders if their starters stay healthy, unrecoverable if a starting QB goes down in October.

### Also lost: Harvey Wang

Ninth on the adjusted board, **zero picks with positive valSF**, punted TE for the ninth straight year into a starting TE (Isaiah Likely, 155.1) that is **43 points below league average and worse than two undrafted tight ends**, and paid two top-50 picks for the seventh-best QB slot in the league. Jonathan Taylor and Achane are excellent and they are carrying a roster with no other above-average part.

### And a note on Rollin Odama-Wong

He finishes **2nd**, which the value numbers say should be impossible — he had the **worst draft-value discipline in the league (−595 cumulative valSF, no positive pick, the −141 Kaelon Black reach)**. He gets there on the strength of two picks: Amon-Ra St. Brown and CeeDee Lamb. But he also owns the **league's worst QB slot** after three straight years of taking a QB in round 1. If Caleb Williams and Jordan Love underperform their projections even modestly, that 2nd-place ranking is the first one to fall.

---

*Method note: all projections are ESPN's `proj26`, which is a single-source projection and should be treated as an ordering device, not truth. The QB-availability model assumes independence between quarterbacks and a uniform 14/17 availability rate; it does not model bye-week collisions specifically, which would slightly increase the penalty for two-QB teams whose starters share a bye.*
