// Points left on the bench. For each team-week, computes the best lineup that
// was actually available from that roster and compares it to the lineup started.
//
// Slot eligibility is derived from the data: every starting slot a player was
// ever observed in league-wide (which captures real multi-position eligibility)
// unioned with the defaults for their listed position. IR players are excluded —
// ESPN would not have let them be started.
const fs = require('fs');
const path = require('path');
const ROOT = '/Users/evanfukumoto/Documents/VSCodeRepos/fantasy-football';
const YEARS = ['2022', '2023', '2024', '2025'];

const parseCsv = (f) => {
  const txt = fs.readFileSync(f, 'utf8');
  const rows = []; let cur = [], field = '', q = false;
  for (let i = 0; i < txt.length; i++) {
    const c = txt[i];
    if (q) { if (c === '"') { if (txt[i+1] === '"') { field += '"'; i++; } else q = false; } else field += c; }
    else if (c === '"') q = true;
    else if (c === ',') { cur.push(field); field = ''; }
    else if (c === '\n') { cur.push(field); rows.push(cur); cur = []; field = ''; }
    else if (c !== '\r') field += c;
  }
  if (field || cur.length) { cur.push(field); rows.push(cur); }
  const head = rows.shift();
  return rows.filter(r => r.length === head.length).map(r => Object.fromEntries(head.map((h, i) => [h, r[i]])));
};
const csvEsc = (v) => { const s = v == null ? '' : String(v); return /[",\n]/.test(s) ? '"' + s.replace(/"/g,'""') + '"' : s; };

const rosters = parseCsv(path.join(ROOT, 'data/weekly-rosters-2022-2025.csv'));
const matchups = parseCsv(path.join(ROOT, 'data/weekly-matchups-2022-2025.csv'));

const START = new Set(['QB','RB','WR','TE','FLEX','K','D/ST','DP']);
const POS_SLOTS = {
  QB: ['QB'], RB: ['RB','FLEX'], WR: ['WR','FLEX'], TE: ['TE','FLEX'],
  K: ['K'], 'D/ST': ['D/ST'],
  LB: ['DP'], DE: ['DP'], DT: ['DP'], S: ['DP'], CB: ['DP'], DB: ['DP'], DL: ['DP'],
};
// observed eligibility: any starting slot a player actually occupied, league-wide
const observed = new Map();
for (const r of rosters) {
  if (!START.has(r.LineupSlot)) continue;
  if (!observed.has(r.PlayerId)) observed.set(r.PlayerId, new Set());
  observed.get(r.PlayerId).add(r.LineupSlot);
}
const eligOf = (pid, pos) => {
  const s = new Set(POS_SLOTS[pos] || []);
  for (const x of (observed.get(pid) || [])) s.add(x);
  return s;
};

// per-year starting slots
const slotsFor = (y) => (y === '2022' || y === '2023')
  ? ['QB','QB','RB','RB','WR','WR','TE','FLEX','K','D/ST','DP']
  : ['QB','QB','RB','RB','WR','WR','TE','FLEX','K','D/ST'];

// group roster rows by team-week
const tw = new Map();
for (const r of rosters) {
  const k = `${r.Year}|${r.Week}|${r.TeamId}`;
  if (!tw.has(k)) tw.set(k, []);
  tw.get(k).push(r);
}

// exact max-weight assignment of players to slots via bitmask DP
const bestLineup = (players, slots) => {
  const S = slots.length, N = 1 << S;
  const NEG = -1e9;
  let dp = new Float64Array(N).fill(NEG);
  let pick = new Array(N).fill(null);
  dp[0] = 0; pick[0] = [];
  for (const p of players) {
    const nd = Float64Array.from(dp);
    const np = pick.slice();
    for (let mask = 0; mask < N; mask++) {
      if (dp[mask] === NEG) continue;
      for (let s = 0; s < S; s++) {
        if (mask & (1 << s)) continue;
        if (!p.elig.has(slots[s])) continue;
        const m2 = mask | (1 << s);
        const v = dp[mask] + p.pts;
        if (v > nd[m2]) { nd[m2] = v; np[m2] = pick[mask].concat([[p, slots[s]]]); }
      }
    }
    dp = nd; pick = np;
  }
  let best = 0, bi = 0;
  for (let m = 0; m < N; m++) if (dp[m] > best) { best = dp[m]; bi = m; }
  return { total: best, lineup: pick[bi] || [] };
};

const r1 = (n) => Math.round(n * 100) / 100;
const results = [];
for (const [k, roster] of tw) {
  const [year, week, teamId] = k.split('|');
  const avail = roster.filter(r => r.LineupSlot !== 'IR').map(r => ({
    pid: r.PlayerId, name: r.Player, pos: r.Position, slot: r.LineupSlot,
    started: r.Started === '1', pts: r.ActualPoints === '' ? 0 : Number(r.ActualPoints),
    elig: eligOf(r.PlayerId, r.Position),
  }));
  const actual = avail.filter(p => p.started).reduce((a, p) => a + p.pts, 0);
  const { total: optimal, lineup } = bestLineup(avail, slotsFor(year));
  const startedIds = new Set(avail.filter(p => p.started).map(p => p.pid));
  const optIds = new Set(lineup.map(([p]) => p.pid));
  const missed = lineup.filter(([p]) => !startedIds.has(p.pid)).map(([p, s]) => ({ ...p, optSlot: s }));
  const benchedWrong = avail.filter(p => p.started && !optIds.has(p.pid));
  results.push({
    year, week: Number(week), teamId,
    manager: roster[0].Manager, team: roster[0].TeamName,
    actual: r1(actual), optimal: r1(optimal), left: r1(optimal - actual),
    missed, benchedWrong,
  });
}
results.sort((a, b) => b.left - a.left);
console.log(`team-weeks analysed: ${results.length}`);
console.log(`mean points left on bench: ${r1(results.reduce((a, r) => a + r.left, 0) / results.length)}`);
console.log(`perfect lineups (left 0): ${results.filter(r => r.left === 0).length}`);

// did it cost the game?
const key = (y, w, t) => `${y}|${w}|${t}`;
const byTW = new Map(results.map(r => [key(r.year, r.week, r.teamId), r]));
let flips = 0;
const flipList = [];
for (const m of matchups) {
  for (const [meId, oppId] of [[m.HomeTeamId, m.AwayTeamId], [m.AwayTeamId, m.HomeTeamId]]) {
    const me = byTW.get(key(m.Year, Number(m.Week), meId));
    const opp = byTW.get(key(m.Year, Number(m.Week), oppId));
    if (!me || !opp) continue;
    if (me.actual < opp.actual && me.optimal > opp.actual) {
      flips++; me.costGame = true;
      flipList.push({ ...me, oppManager: opp.manager, oppActual: opp.actual, deficit: r1(opp.actual - me.actual) });
    }
  }
}
console.log(`losses that an optimal lineup would have flipped: ${flips}`);

fs.writeFileSync(path.join(ROOT, 'data/bench-points-by-week.csv'),
  ['Year,Week,TeamId,Manager,TeamName,ActualPoints,OptimalPoints,PointsLeftOnBench,CostTheGame,BiggestMiss,BiggestMissPoints']
    .concat(results.slice().sort((a, b) => a.year.localeCompare(b.year) || a.week - b.week || a.manager.localeCompare(b.manager))
      .map(r => {
        const bm = r.missed.slice().sort((x, y) => y.pts - x.pts)[0];
        return [r.year, r.week, r.teamId, r.manager, r.team, r.actual, r.optimal, r.left,
          r.costGame ? 'YES' : '', bm ? bm.name : '', bm ? r1(bm.pts) : ''].map(csvEsc).join(',');
      })).join('\n') + '\n');
console.log(`wrote data/bench-points-by-week.csv (${results.length} rows)`);

fs.writeFileSync(path.join(ROOT, '.espn-automation/bench.json'), JSON.stringify({
  results: results.map(r => ({ ...r, missed: r.missed.map(m => ({ name: m.name, pos: m.pos, pts: r1(m.pts), optSlot: m.optSlot })),
    benchedWrong: r.benchedWrong.map(m => ({ name: m.name, pos: m.pos, pts: r1(m.pts), slot: m.slot })) })),
  flipList: flipList.map(f => ({ year: f.year, week: f.week, manager: f.manager, actual: f.actual, optimal: f.optimal,
    left: f.left, oppManager: f.oppManager, oppActual: f.oppActual, deficit: f.deficit })),
}, null, 2));

// ---------------- markdown report ----------------
const managers = [...new Set(results.map(r => r.manager))].sort();
const agg = (rows) => {
  const m = new Map();
  for (const r of rows) {
    if (!m.has(r.manager)) m.set(r.manager, { weeks: 0, left: 0, actual: 0, optimal: 0, perfect: 0, cost: 0, worst: null });
    const a = m.get(r.manager);
    a.weeks++; a.left += r.left; a.actual += r.actual; a.optimal += r.optimal;
    if (r.left === 0) a.perfect++;
    if (r.costGame) a.cost++;
    if (!a.worst || r.left > a.worst.left) a.worst = r;
  }
  return m;
};
const fmt = (n) => r1(n).toFixed(1);
const eff = (a) => ((a.actual / a.optimal) * 100).toFixed(1) + '%';

const rankTable = (rows, showCost = true) => {
  const m = agg(rows);
  const rk = [...m.entries()].sort((a, b) => a[1].left - b[1].left);
  const out = [];
  out.push('| # | Manager | Points left | Per week | Efficiency | Perfect weeks |' + (showCost ? ' Losses it cost |' : ''));
  out.push('|---:|---|---:|---:|---:|---:|' + (showCost ? '---:|' : ''));
  rk.forEach(([name, a], i) => {
    out.push(`| ${i + 1} | ${name} | ${fmt(a.left)} | ${fmt(a.left / a.weeks)} | ${eff(a)} | ${a.perfect} |`
      + (showCost ? ` ${a.cost} |` : ''));
  });
  return { lines: out, rank: rk };
};

const M = [];
M.push('# Points Left on the Bench — 2022–2025');
M.push('');
M.push(`Every team-week measured against the best lineup that roster could have started. ${results.length} team-weeks, 68 per manager, so totals compare directly.`);
M.push('');
M.push('## Method');
M.push('');
M.push('For each team-week the best legal lineup is solved exactly (max-weight assignment of players to starting slots), then compared to what was actually started. The gap is **points left on the bench**.');
M.push('');
M.push('- Starting slots were 2 QB, 2 RB, 2 WR, TE, FLEX, K, D/ST **plus an IDP slot in 2022–23** — dropped from 2024.');
M.push('- Slot eligibility comes from the data: every starting slot a player was actually used in league-wide, plus the defaults for their position. This picks up multi-position eligibility rather than assuming it.');
M.push('- **IR players are excluded** — ESPN would not have allowed them to start.');
M.push('- This is measured with hindsight. It is the cost of the lineup actually set, not a claim the manager could have known.');
M.push('');
M.push(`League-wide the average team leaves **${fmt(results.reduce((a, r) => a + r.left, 0) / results.length)} points** on the bench per week. Only ${results.filter(r => r.left === 0).length} of ${results.length} lineups (${(results.filter(r => r.left === 0).length / results.length * 100).toFixed(1)}%) were perfect.`);
M.push('');

M.push('## Overall — all four seasons');
M.push('');
M.push('Best lineup managers first. **Efficiency** is points scored as a share of points available.');
M.push('');
const all = rankTable(results);
M.push(...all.lines);
M.push('');
M.push(`🏆 **Best:** ${all.rank[0][0]} — ${fmt(all.rank[0][1].left)} left over four years (${fmt(all.rank[0][1].left / 68)}/week)`);
M.push('');
M.push(`💀 **Worst:** ${all.rank[all.rank.length-1][0]} — ${fmt(all.rank[all.rank.length-1][1].left)} left (${fmt(all.rank[all.rank.length-1][1].left / 68)}/week)`);
M.push('');
const spread = all.rank[all.rank.length-1][1].left - all.rank[0][1].left;
M.push(`The gap between best and worst is **${fmt(spread)} points** across four seasons — about ${fmt(spread / 68)} points a week.`);
M.push('');

M.push('## Per season');
M.push('');
const seasonWinners = [];
for (const y of YEARS) {
  const rows = results.filter(r => r.year === y);
  const t = rankTable(rows);
  M.push(`### ${y}`);
  M.push('');
  M.push(...t.lines);
  M.push('');
  seasonWinners.push({ y, best: t.rank[0], worst: t.rank[t.rank.length - 1] });
}

M.push('### Season winners and losers at a glance');
M.push('');
M.push('| Season | 🏆 Best lineup manager | Left | 💀 Worst | Left |');
M.push('|---|---|---:|---|---:|');
for (const s of seasonWinners)
  M.push(`| ${s.y} | ${s.best[0]} | ${fmt(s.best[1].left)} | ${s.worst[0]} | ${fmt(s.worst[1].left)} |`);
M.push('');

M.push('## Biggest single weeks');
M.push('');
M.push('### Worst lineup decisions');
M.push('');
M.push('| Year | Wk | Manager | Started | Available | Left | Cost the game? | Biggest miss |');
M.push('|---|---:|---|---:|---:|---:|---|---|');
for (const r of results.slice(0, 15)) {
  const bm = r.missed.slice().sort((a, b) => b.pts - a.pts)[0];
  M.push(`| ${r.year} | ${r.week} | ${r.manager} | ${fmt(r.actual)} | ${fmt(r.optimal)} | **${fmt(r.left)}** | ${r.costGame ? 'yes' : 'no'} | ${bm ? `${bm.name} (${fmt(bm.pts)})` : '—'} |`);
}
M.push('');
M.push('### Perfect weeks');
M.push('');
M.push('Lineups that left nothing on the bench, ranked by what they scored.');
M.push('');
M.push('| Year | Wk | Manager | Points | Notes |');
M.push('|---|---:|---|---:|---|');
const perfect = results.filter(r => r.left === 0).sort((a, b) => b.actual - a.actual);
for (const r of perfect.slice(0, 15))
  M.push(`| ${r.year} | ${r.week} | ${r.manager} | ${fmt(r.actual)} | perfect lineup |`);
M.push('');
M.push(`${perfect.length} perfect lineups in total.`);
M.push('');

M.push('## When it actually cost a game');
M.push('');
M.push(`**${flipList.length} losses** would have been wins with the optimal lineup — ${(flipList.length / (matchups.length * 2) * 100).toFixed(1)}% of all games played. These are the ones that mattered.`);
M.push('');
const costBy = new Map(managers.map(m => [m, 0]));
for (const f of flipList) costBy.set(f.manager, costBy.get(f.manager) + 1);
M.push('| Manager | Losses caused by lineup |');
M.push('|---|---:|');
for (const [m, n] of [...costBy.entries()].sort((a, b) => b[1] - a[1])) M.push(`| ${m} | ${n} |`);
M.push('');
M.push('### Most painful');
M.push('');
M.push('Games lost by the smallest margin that the bench would have covered.');
M.push('');
M.push('| Year | Wk | Manager | Scored | Opponent | Opp scored | Lost by | Had available |');
M.push('|---|---:|---|---:|---|---:|---:|---:|');
for (const f of flipList.slice().sort((a, b) => a.deficit - b.deficit).slice(0, 15))
  M.push(`| ${f.year} | ${f.week} | ${f.manager} | ${fmt(f.actual)} | ${f.oppManager} | ${fmt(f.oppActual)} | ${fmt(f.deficit)} | ${fmt(f.optimal)} |`);
M.push('');

M.push('## Caveats');
M.push('');
M.push('- Hindsight. Benching a player who then goes off is only a mistake after the fact; this measures cost, not foreseeability.');
M.push('- Optimal lineups assume the opponent still scores what they actually scored. In reality both managers were guessing.');
M.push('- Eligibility is inferred from observed usage plus position defaults. A player who was never started anywhere in a slot he was technically eligible for could be slightly under-credited.');
M.push('- IR players are excluded, but a player left in a normal bench slot while injured still counts as available — that is a roster-management cost the numbers include.');
M.push('');
M.push('Generated by `../.espn-automation/analyze_bench.js`. Week-level data in `../data/bench-points-by-week.csv`.');
M.push('');

fs.writeFileSync(path.join(ROOT, 'analysis/bench-points-analysis.md'), M.join('\n'));
console.log(`wrote analysis/bench-points-analysis.md (${M.length} lines)`);
