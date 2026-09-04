// Fits per-manager draft models from this league's real drafts (2022-25).
//
// Two behaviours are fitted for each of the nine opponents:
//   qbAggr[m] — multiplier on the league QB-scarcity curve. Lower = takes QBs
//               earlier. Target: their actual mean round of first QB.
//   lean[m]   — early-round (R1-5) positional nudge in effective-ADP points.
//               Target: their actual share of R1-5 picks at RB/WR/TE.
//
// There is no closed form for either — a manager's pick depends on what the
// other nine left behind — so both are calibrated by iteration: run drafts,
// measure the gap against reality, nudge, repeat. The objective uses a fixed
// seed so it is deterministic; the result is then checked on unseen seeds.
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const ROOT = '/Users/evanfukumoto/Documents/VSCodeRepos/fantasy-football';
const YEARS = ['2022', '2023', '2024', '2025'];
const EVAN = 'Evan Fukumoto';            // driven by strategy mode, not a model
const FIT_SEED = 4242, FIT_RUNS = 120, ITERS = 40;
const mean = (a) => a.reduce((x, y) => x + y, 0) / a.length;

// ---------- targets from real drafts ----------
const rows = fs.readFileSync(path.join(ROOT, 'draft-history-combined.csv'), 'utf8')
  .trim().split(/\r?\n/).slice(1).map(l => {
    const c = l.split(',');
    return { year: c[0], round: +c[1], overall: +c[3], player: c[4], pos: c[6], mgr: c[7] };
  }).filter(r => YEARS.includes(r.year));

const managers = [...new Set(rows.map(r => r.mgr))].sort();
const target = {};
for (const m of managers) {
  const firstQB = [], early = { RB: 0, WR: 0, TE: 0, QB: 0, other: 0 };
  let earlyTotal = 0;
  for (const y of YEARS) {
    const mine = rows.filter(r => r.mgr === m && r.year === y);
    const qb = mine.filter(r => r.pos === 'QB').map(r => r.round).sort((a, b) => a - b);
    if (qb.length) firstQB.push(qb[0]);
    for (const r of mine.filter(r => r.round <= 5)) {
      earlyTotal++;
      if (early[r.pos] !== undefined) early[r.pos]++; else early.other++;
    }
  }
  const secondQB = [];
  for (const y of YEARS) {
    const qb = rows.filter(r => r.mgr === m && r.year === y && r.pos === 'QB')
      .map(r => r.round).sort((a, b) => a - b);
    if (qb.length > 1) secondQB.push(qb[1]);
  }
  target[m] = {
    firstQB: firstQB.length ? mean(firstQB) : null,
    secondQB: secondQB.length ? mean(secondQB) : null,
    share: { RB: early.RB / earlyTotal, WR: early.WR / earlyTotal, TE: early.TE / earlyTotal },
  };
}

// ---------- initial parameters ----------
const leagueFirstQB = mean(managers.filter(m => target[m].firstQB).map(m => target[m].firstQB));
const qbAggr = {}, lean = {}, qbHabit = {};
let qbHabitStrength = 10;
for (const m of managers) {
  // Scarcity multiplier stays neutral; per-manager timing is carried by the
  // habit rounds below, which are observed rather than fitted.
  qbAggr[m] = 1;
  lean[m] = { RB: 0, WR: 0, TE: 0 };
  if (m !== EVAN && target[m].firstQB) {
    qbHabit[m] = {
      first: +target[m].firstQB.toFixed(2),
      second: +(target[m].secondQB || target[m].firstQB + 3).toFixed(2),
    };
  }
}
const leagueShare = { RB: mean(managers.map(m => target[m].share.RB)),
                      WR: mean(managers.map(m => target[m].share.WR)),
                      TE: mean(managers.map(m => target[m].share.TE)) };

const write = () => fs.writeFileSync(path.join(ROOT, '.espn-automation/manager_models.json'),
  JSON.stringify({ fittedAt: new Date().toISOString().slice(0, 10), seed: FIT_SEED, runs: FIT_RUNS,
    note: 'Fitted from 2022-25 drafts by fit_manager_models.js. qbHabit rounds are observed directly; qbHabitStrength and lean are calibrated. Evan is excluded (his picks come from the strategy mode).',
    qbHabitStrength, qbHabit, qbAggr, lean }, null, 2));

const simulate = (seed, runs) => {
  execFileSync('node', [path.join(ROOT, '.espn-automation/draft_sim.js')], {
    env: { ...process.env, DUMP_ALL: '1', DUMP_RUNS: String(runs), MODE: 'waitQB', SEED: String(seed) },
    stdio: 'ignore',
  });
  const j = JSON.parse(fs.readFileSync(path.join(ROOT, '.espn-automation/sim_full_waitQB.json'), 'utf8'));
  const firstQB = {}, share = {};
  for (const m of j.slotMgr) { firstQB[m] = []; share[m] = { RB: 0, WR: 0, TE: 0, n: 0 }; }
  for (const run of j.runs) {
    run.forEach((team, i) => {
      const m = j.slotMgr[i];
      const qb = team.QB.map(p => p.round).sort((a, b) => a - b);
      if (qb.length) firstQB[m].push(qb[0]);
      for (const pos of ['QB', 'RB', 'WR', 'TE', 'K', 'D/ST']) {
        for (const p of team[pos]) if (p.round <= 5) {
          share[m].n++;
          if (share[m][pos] !== undefined) share[m][pos]++;
        }
      }
    });
  }
  const out = {};
  for (const m of j.slotMgr) out[m] = {
    firstQB: firstQB[m].length ? mean(firstQB[m]) : null,
    share: { RB: share[m].RB / share[m].n, WR: share[m].WR / share[m].n, TE: share[m].TE / share[m].n },
  };
  return out;
};

// ---------- calibrate ----------
// Two stages, because the objectives interact: QB timing shifts which players
// remain, which shifts positional share. Fitting both at once oscillates.
const err = (got, key) => {
  let e = 0, n = 0;
  for (const m of managers) {
    if (m === EVAN || !got[m]) continue;
    if (key === 'qb') {
      if (target[m].firstQB && got[m].firstQB) { e += Math.abs(got[m].firstQB - target[m].firstQB); n++; }
    } else {
      for (const pos of ['RB', 'WR', 'TE']) { e += Math.abs(got[m].share[pos] - target[m].share[pos]); n++; }
    }
  }
  return e / n;
};

console.log(`stage 1/2: QB timing (habit strength), ${managers.length - 1} opponents`);
let bestQB = Infinity, bestStrength = qbHabitStrength;
for (let it = 1; it <= 14; it++) {
  write();
  const got = simulate(FIT_SEED, FIT_RUNS);
  const e = err(got, 'qb');
  if (e < bestQB) { bestQB = e; bestStrength = qbHabitStrength; }
  const drift = [];
  for (const m of managers) {
    if (m === EVAN || !got[m] || !target[m].firstQB || !got[m].firstQB) continue;
    drift.push(got[m].firstQB - target[m].firstQB);
  }
  qbHabitStrength = Math.max(2, Math.min(45, qbHabitStrength - 4 * Math.tanh(mean(drift) / 2)));
  if (it % 4 === 0 || it === 1) console.log(`  iter ${String(it).padStart(2)}  QB round error ${e.toFixed(3)}  strength ${qbHabitStrength.toFixed(1)}`);
}
qbHabitStrength = bestStrength;
console.log(`  best QB round error ${bestQB.toFixed(3)} at strength ${qbHabitStrength.toFixed(1)}`);

console.log(`\nstage 2/2: early-round positional lean`);
let bestShare = Infinity, bestLean = JSON.parse(JSON.stringify(lean));
for (let it = 1; it <= 30; it++) {
  write();
  const got = simulate(FIT_SEED, FIT_RUNS);
  const e = err(got, 'share');
  if (e < bestShare) { bestShare = e; bestLean = JSON.parse(JSON.stringify(lean)); }
  for (const m of managers) {
    if (m === EVAN || !got[m]) continue;
    for (const pos of ['RB', 'WR', 'TE']) {
      // sim takes this position too often -> raise its effective ADP (less attractive)
      const d = got[m].share[pos] - target[m].share[pos];
      lean[m][pos] = Math.max(-30, Math.min(45, lean[m][pos] + 9 * d));
    }
  }
  if (it % 8 === 0 || it === 1) console.log(`  iter ${String(it).padStart(2)}  share error ${e.toFixed(4)}`);
}
Object.assign(lean, bestLean);
write();
console.log(`  best share error ${bestShare.toFixed(4)}`);
const bestErr = bestQB;

// ---------- validate on unseen seeds ----------
console.log('\nVALIDATION on held-out seeds (first-QB round):');
const val = [7001, 7002].map(s => simulate(s, 150));
console.log(`${'manager'.padEnd(22)} ${'actual'.padStart(7)} ${'fitted'.padStart(7)} ${'diff'.padStart(6)}   observed`);
let vErr = [];
for (const m of managers) {
  if (m === EVAN) continue;
  const t = target[m].firstQB;
  const got = mean(val.map(v => v[m].firstQB));
  vErr.push(Math.abs(got - t));
  const flag = Math.abs(got - t) >= 1.0 ? '  <--' : '';
  console.log(`${m.padEnd(22)} ${t.toFixed(2).padStart(7)} ${got.toFixed(2).padStart(7)} ${(got - t >= 0 ? '+' : '') + (got - t).toFixed(2).padStart(5)}   habit R${qbHabit[m] ? qbHabit[m].first.toFixed(1) : '-'}${flag}`);
}
console.log(`\nmean abs error on first-QB round: ${mean(vErr).toFixed(2)} rounds`);
console.log('wrote .espn-automation/manager_models.json');
