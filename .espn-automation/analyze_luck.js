// Luck-adjusted standings. Each week every team is scored against all nine
// others (all-play), which removes the schedule from the record. Expected wins
// = all-play win rate x games; luck = actual wins - expected wins.
// Regular season only (weeks 1-14) — that is what decides seeding.
const fs = require('fs');
const path = require('path');
const ROOT = '/Users/evanfukumoto/Documents/VSCodeRepos/fantasy-football';
const YEARS = ['2022', '2023', '2024', '2025'];
const REG_WEEKS = 14;

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
const r1 = (n) => Math.round(n * 100) / 100;
const sgn = (n) => (n > 0 ? '+' : '') + n.toFixed(2);

const matchups = parseCsv(path.join(ROOT, 'data/weekly-matchups-2022-2025.csv'));

// flatten to one row per team-game
const games = [];
for (const m of matchups) {
  games.push({ year: m.Year, week: Number(m.Week), tier: m.PlayoffTier,
    manager: m.HomeManager, team: m.HomeTeam, pts: Number(m.HomeActual),
    oppManager: m.AwayManager, oppPts: Number(m.AwayActual), side: 'HOME', winner: m.Winner });
  games.push({ year: m.Year, week: Number(m.Week), tier: m.PlayoffTier,
    manager: m.AwayManager, team: m.AwayTeam, pts: Number(m.AwayActual),
    oppManager: m.HomeManager, oppPts: Number(m.HomeActual), side: 'AWAY', winner: m.Winner });
}
const reg = games.filter(g => g.tier === 'NONE' && g.week <= REG_WEEKS);
const managers = [...new Set(games.map(g => g.manager))].sort();

// ---- all-play: every team vs every other team, each week ----
const weekScores = new Map();   // year|week -> [{manager, pts}]
for (const g of reg) {
  const k = `${g.year}|${g.week}`;
  if (!weekScores.has(k)) weekScores.set(k, []);
  weekScores.get(k).push({ manager: g.manager, pts: g.pts });
}
const allPlay = new Map();      // year|manager -> {w,l,t}
const apWeekly = [];
for (const [k, arr] of weekScores) {
  const [year, week] = k.split('|');
  for (const a of arr) {
    let w = 0, l = 0, t = 0;
    for (const b of arr) {
      if (a.manager === b.manager) continue;
      if (a.pts > b.pts) w++; else if (a.pts < b.pts) l++; else t++;
    }
    const kk = `${year}|${a.manager}`;
    if (!allPlay.has(kk)) allPlay.set(kk, { w: 0, l: 0, t: 0 });
    const ap = allPlay.get(kk);
    ap.w += w; ap.l += l; ap.t += t;
    apWeekly.push({ year, week: Number(week), manager: a.manager, pts: a.pts, beat: w, lostTo: l, tied: t });
  }
}

// ---- per manager-season ----
const rows = [];
for (const y of YEARS) {
  for (const m of managers) {
    const mine = reg.filter(g => g.year === y && g.manager === m);
    if (!mine.length) continue;
    let W = 0, L = 0, T = 0, pf = 0, pa = 0;
    for (const g of mine) {
      pf += g.pts; pa += g.oppPts;
      if (g.pts > g.oppPts) W++; else if (g.pts < g.oppPts) L++; else T++;
    }
    const ap = allPlay.get(`${y}|${m}`);
    const apGames = ap.w + ap.l + ap.t;
    const apRate = (ap.w + ap.t * 0.5) / apGames;
    const expW = apRate * mine.length;
    const actW = W + T * 0.5;
    const scores = mine.map(g => g.pts);
    const mean = pf / scores.length;
    const sd = Math.sqrt(scores.reduce((a, s) => a + (s - mean) ** 2, 0) / scores.length);
    rows.push({ year: y, manager: m, games: mine.length, W, L, T, actW,
      pf: r1(pf), pa: r1(pa), apW: ap.w, apL: ap.l, apT: ap.t, apRate,
      expW, luck: actW - expW, mean: r1(mean), sd: r1(sd),
      high: r1(Math.max(...scores)), low: r1(Math.min(...scores)) });
  }
}

// standings: actual (record, then PF) vs expected (all-play rate)
for (const y of YEARS) {
  const yr = rows.filter(r => r.year === y);
  yr.slice().sort((a, b) => b.actW - a.actW || b.pf - a.pf).forEach((r, i) => r.actualSeed = i + 1);
  yr.slice().sort((a, b) => b.apRate - a.apRate || b.pf - a.pf).forEach((r, i) => r.expSeed = i + 1);
  yr.forEach(r => r.seedDelta = r.expSeed - r.actualSeed);
}

// ---- four-year totals ----
const tot = managers.map(m => {
  const mine = rows.filter(r => r.manager === m);
  const s = (k) => mine.reduce((a, r) => a + r[k], 0);
  const apG = s('apW') + s('apL') + s('apT');
  const apRate = (s('apW') + s('apT') * 0.5) / apG;
  return { manager: m, games: s('games'), W: s('W'), L: s('L'), T: s('T'), actW: s('actW'),
    pf: r1(s('pf')), pa: r1(s('pa')), apW: s('apW'), apL: s('apL'), apT: s('apT'), apRate,
    expW: s('expW'), luck: s('actW') - s('expW'),
    mean: r1(s('pf') / s('games')),
    playoffs: mine.filter(r => r.actualSeed <= 6).length,
    expPlayoffs: mine.filter(r => r.expSeed <= 6).length };
});

console.log('=== FOUR-YEAR LUCK (actual wins - expected wins) ===');
for (const t of tot.slice().sort((a, b) => b.luck - a.luck))
  console.log(`${t.manager.padEnd(21)} ${t.W}-${t.L}  actual ${t.actW.toFixed(1).padStart(5)}  expected ${t.expW.toFixed(1).padStart(5)}  luck ${sgn(t.luck).padStart(7)}  allplay ${(t.apRate*100).toFixed(1)}%  PF ${t.pf}`);

fs.writeFileSync(path.join(ROOT, 'data/luck-adjusted-standings.csv'),
  ['Year,Manager,Games,Wins,Losses,Ties,PointsFor,PointsAgainst,AllPlayW,AllPlayL,AllPlayT,AllPlayPct,ExpectedWins,Luck,ActualSeed,ExpectedSeed,SeedDelta,AvgScore,StdDev,High,Low']
    .concat(rows.map(r => [r.year, r.manager, r.games, r.W, r.L, r.T, r.pf, r.pa, r.apW, r.apL, r.apT,
      (r.apRate*100).toFixed(1)+'%', r.expW.toFixed(2), sgn(r.luck), r.actualSeed, r.expSeed,
      r.seedDelta > 0 ? '+'+r.seedDelta : r.seedDelta, r.mean, r.sd, r.high, r.low].map(csvEsc).join(','))).join('\n') + '\n');
console.log(`\nwrote data/luck-adjusted-standings.csv (${rows.length} rows)`);

fs.writeFileSync(path.join(ROOT, '.espn-automation/luck.json'), JSON.stringify({ rows, tot, apWeekly }, null, 2));
module.exports = { rows, tot, managers, YEARS, reg, games };

// ---------------- markdown report ----------------
const M = [];
const pct = (x) => (x * 100).toFixed(1) + '%';
M.push('# Luck-Adjusted Standings — 2022–2025');
M.push('');
M.push('What the record would look like if the schedule were fair. Regular season only (weeks 1–14), 56 games per manager.');
M.push('');
M.push('## Method');
M.push('');
M.push('In a 10-team league you play one opponent a week, but you scored against the whole league whether you played them or not. **All-play** records each team against all nine others every week — 5,040 comparisons over four seasons — which strips the schedule out entirely.');
M.push('');
M.push('- **All-play %** — share of those head-to-heads won. This is the honest measure of how good a team was.');
M.push('- **Expected wins** — all-play % × games played. What the record *should* have been.');
M.push('- **Luck** — actual wins minus expected wins. Positive means the schedule was kind.');
M.push('');
M.push('Luck sums to zero across the league by construction: every lucky win is somebody else\'s unlucky loss.');
M.push('');

M.push('## Four-year luck');
M.push('');
M.push('| Manager | Record | Actual W | Expected W | **Luck** | All-play % | Points for |');
M.push('|---|---|---:|---:|---:|---:|---:|');
for (const t of tot.slice().sort((a, b) => b.luck - a.luck))
  M.push(`| ${t.manager} | ${t.W}–${t.L}${t.T ? '–' + t.T : ''} | ${t.actW.toFixed(1)} | ${t.expW.toFixed(1)} | **${sgn(t.luck)}** | ${pct(t.apRate)} | ${t.pf.toFixed(1)} |`);
M.push('');
const lucky = tot.slice().sort((a, b) => b.luck - a.luck)[0];
const unlucky = tot.slice().sort((a, b) => a.luck - b.luck)[0];
M.push(`🍀 **Luckiest:** ${lucky.manager} — ${sgn(lucky.luck)} wins above what his scoring earned.`);
M.push('');
M.push(`🎯 **Unluckiest:** ${unlucky.manager} — ${sgn(unlucky.luck)} wins. He has the ${tot.slice().sort((a,b)=>b.apRate-a.apRate).findIndex(t=>t.manager===unlucky.manager)+1}${['st','nd','rd','th'][Math.min(tot.slice().sort((a,b)=>b.apRate-a.apRate).findIndex(t=>t.manager===unlucky.manager),3)] || 'th'}-best all-play record in the league and a losing record to show for it.`);
M.push('');

M.push('## True power ranking');
M.push('');
M.push('Sorted by all-play %, the schedule-free measure of team strength. The gap between the two rank columns is the schedule.');
M.push('');
M.push('| Rank | Manager | All-play % | Actual record | Record rank | Gap |');
M.push('|---:|---|---:|---|---:|---:|');
const byAp = tot.slice().sort((a, b) => b.apRate - a.apRate);
const byRec = tot.slice().sort((a, b) => b.actW - a.actW || b.pf - a.pf);
byAp.forEach((t, i) => {
  const rr = byRec.findIndex(x => x.manager === t.manager) + 1;
  const gap = rr - (i + 1);
  M.push(`| ${i + 1} | ${t.manager} | ${pct(t.apRate)} | ${t.W}–${t.L} | ${rr} | ${gap > 0 ? '+' + gap : gap === 0 ? '—' : gap} |`);
});
M.push('');
M.push('A positive gap means the record understates them.');
M.push('');

M.push('## Season by season');
M.push('');
for (const y of YEARS) {
  const yr = rows.filter(r => r.year === y).sort((a, b) => a.actualSeed - b.actualSeed);
  M.push(`### ${y}`);
  M.push('');
  M.push('| Seed | Manager | Record | PF | PA | All-play % | Expected W | Luck | Should have seeded |');
  M.push('|---:|---|---|---:|---:|---:|---:|---:|---:|');
  for (const r of yr) {
    const mark = r.seedDelta >= 3 ? ' 🎯' : r.seedDelta <= -3 ? ' 🍀' : '';
    M.push(`| ${r.actualSeed} | ${r.manager}${mark} | ${r.W}–${r.L}${r.T ? '–' + r.T : ''} | ${r.pf.toFixed(1)} | ${r.pa.toFixed(1)} | ${pct(r.apRate)} | ${r.expW.toFixed(1)} | ${sgn(r.luck)} | ${r.expSeed} |`);
  }
  M.push('');
}
M.push('🎯 = should have seeded at least 3 places higher · 🍀 = at least 3 places lower');
M.push('');

M.push('## Biggest injustices');
M.push('');
M.push('Single seasons where the record most misrepresented the team.');
M.push('');
M.push('| Year | Manager | Record | Expected W | Luck | Seed | Deserved seed |');
M.push('|---|---|---|---:|---:|---:|---:|');
for (const r of rows.slice().sort((a, b) => a.luck - b.luck).slice(0, 8))
  M.push(`| ${r.year} | ${r.manager} | ${r.W}–${r.L} | ${r.expW.toFixed(1)} | **${sgn(r.luck)}** | ${r.actualSeed} | ${r.expSeed} |`);
M.push('');
M.push('### And the gifts');
M.push('');
M.push('| Year | Manager | Record | Expected W | Luck | Seed | Deserved seed |');
M.push('|---|---|---|---:|---:|---:|---:|');
for (const r of rows.slice().sort((a, b) => b.luck - a.luck).slice(0, 8))
  M.push(`| ${r.year} | ${r.manager} | ${r.W}–${r.L} | ${r.expW.toFixed(1)} | **${sgn(r.luck)}** | ${r.actualSeed} | ${r.expSeed} |`);
M.push('');

M.push('## Playoff berths, earned vs. received');
M.push('');
M.push('Six of ten make the playoffs. This compares who actually got in against who the all-play standings say should have.');
M.push('');
M.push('| Manager | Playoff seasons | Deserved | Difference |');
M.push('|---|---:|---:|---:|');
for (const t of tot.slice().sort((a, b) => (b.playoffs - b.expPlayoffs) - (a.playoffs - a.expPlayoffs))) {
  const d = t.playoffs - t.expPlayoffs;
  M.push(`| ${t.manager} | ${t.playoffs} | ${t.expPlayoffs} | ${d > 0 ? '+' + d : d === 0 ? '—' : d} |`);
}
M.push('');

M.push('## Schedule strength and consistency');
M.push('');
M.push('**Points against** is pure schedule luck — you do not choose who you face. **Std dev** is week-to-week volatility: a high-variance team wins big and loses big.');
M.push('');
M.push('| Manager | Avg score | Std dev | Points against (4yr) | Best week | Worst week |');
M.push('|---|---:|---:|---:|---:|---:|');
for (const t of tot.slice().sort((a, b) => b.mean - a.mean)) {
  const mine = rows.filter(r => r.manager === t.manager);
  const sd = mine.reduce((a, r) => a + r.sd, 0) / mine.length;
  M.push(`| ${t.manager} | ${t.mean.toFixed(1)} | ${sd.toFixed(1)} | ${t.pa.toFixed(1)} | ${Math.max(...mine.map(r => r.high)).toFixed(1)} | ${Math.min(...mine.map(r => r.low)).toFixed(1)} |`);
}
M.push('');

M.push('## Caveats');
M.push('');
M.push('- All-play assumes every week counts equally. It does not know you rested starters in week 14 with a bye locked up.');
M.push('- Expected wins measures scoring, not roster construction. A team that scores well and loses is unlucky, but scoring well is itself partly luck.');
M.push('- Regular season only. Playoff results are excluded because the bracket is not a fair sample — see the rivalry report for head-to-head including playoffs.');
M.push('- Luck here is schedule luck. It says nothing about injuries, which show up as lower scoring rather than as luck.');
M.push('');
M.push('Generated by `../.espn-automation/analyze_luck.js`. Per-season data in `../data/luck-adjusted-standings.csv`.');
M.push('');

fs.writeFileSync(path.join(ROOT, 'analysis/luck-adjusted-standings.md'), M.join('\n'));
console.log(`wrote analysis/luck-adjusted-standings.md (${M.length} lines)`);
