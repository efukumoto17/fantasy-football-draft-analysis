// All-time head-to-head between every pair of managers, 2022-2025.
// Includes playoff meetings (flagged separately) since a bracket game is the
// most meaningful version of a rivalry.
const fs = require('fs');
const path = require('path');
const ROOT = '/Users/evanfukumoto/Documents/VSCodeRepos/fantasy-football';

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

const matchups = parseCsv(path.join(ROOT, 'data/weekly-matchups-2022-2025.csv'));
const managers = [...new Set(matchups.flatMap(m => [m.HomeManager, m.AwayManager]))].sort();

// every meeting, from both perspectives
const meet = new Map();  // A|B -> record for A against B
const allGames = [];
for (const m of matchups) {
  const h = { me: m.HomeManager, opp: m.AwayManager, mine: Number(m.HomeActual), theirs: Number(m.AwayActual) };
  const a = { me: m.AwayManager, opp: m.HomeManager, mine: Number(m.AwayActual), theirs: Number(m.HomeActual) };
  for (const g of [h, a]) {
    const k = `${g.me}|${g.opp}`;
    if (!meet.has(k)) meet.set(k, { w: 0, l: 0, t: 0, pf: 0, pa: 0, games: [] });
    const r = meet.get(k);
    r.pf += g.mine; r.pa += g.theirs;
    if (g.mine > g.theirs) r.w++; else if (g.mine < g.theirs) r.l++; else r.t++;
    r.games.push({ year: m.Year, week: Number(m.Week), tier: m.PlayoffTier, mine: g.mine, theirs: g.theirs,
      margin: r1(g.mine - g.theirs) });
  }
  allGames.push({ year: m.Year, week: Number(m.Week), tier: m.PlayoffTier,
    a: m.HomeManager, b: m.AwayManager, aPts: Number(m.HomeActual), bPts: Number(m.AwayActual),
    margin: r1(Math.abs(Number(m.HomeActual) - Number(m.AwayActual))),
    winner: Number(m.HomeActual) > Number(m.AwayActual) ? m.HomeManager
          : Number(m.AwayActual) > Number(m.HomeActual) ? m.AwayManager : 'TIE' });
}

console.log(`managers: ${managers.length}, matchups: ${matchups.length}, pairs: ${managers.length*(managers.length-1)/2}`);
const totals = managers.map(m => {
  let w = 0, l = 0, t = 0;
  for (const o of managers) { const r = meet.get(`${m}|${o}`); if (r) { w += r.w; l += r.l; t += r.t; } }
  return { m, w, l, t };
});
console.log('\noverall H2H records (all games incl playoffs):');
for (const x of totals.sort((a, b) => (b.w - b.l) - (a.w - a.l)))
  console.log(`  ${x.m.padEnd(21)} ${x.w}-${x.l}${x.t?'-'+x.t:''}`);

// ---------- markdown ----------
const M = [];
M.push('# Rivalry Matrix — 2022–2025');
M.push('');
M.push(`Every head-to-head between all ${managers.length} managers. ${matchups.length} matchups over four seasons, playoffs included.`);
M.push('');
M.push('## How to read the matrix');
M.push('');
M.push('Each cell is the **row manager\'s record against the column manager**. Read left to right: your row is your record against everyone.');
M.push('');
const short = (n) => { const p = n.split(' '); return p[0].slice(0, 4) + ' ' + (p[1] || '').slice(0, 3); };
M.push('| | ' + managers.map(m => `**${short(m)}**`).join(' | ') + ' | **Total** |');
M.push('|---|' + managers.map(() => '---:').join('|') + '|---:|');
for (const a of managers) {
  const cells = managers.map(b => {
    if (a === b) return '—';
    const r = meet.get(`${a}|${b}`);
    if (!r || r.w + r.l + r.t === 0) return '·';
    const rec = `${r.w}–${r.l}${r.t ? '–' + r.t : ''}`;
    return r.w > r.l ? `**${rec}**` : rec;
  });
  const tt = totals.find(x => x.m === a);
  M.push(`| **${a}** | ${cells.join(' | ')} | ${tt.w}–${tt.l}${tt.t ? '–' + tt.t : ''} |`);
}
M.push('');
M.push('Bold = winning record in that matchup.');
M.push('');

M.push('## Overall head-to-head records');
M.push('');
M.push('| Manager | Record | Win % | Winning matchups | Losing matchups |');
M.push('|---|---|---:|---:|---:|');
for (const x of totals.slice().sort((a, b) => (b.w / (b.w + b.l)) - (a.w / (a.w + a.l)))) {
  let win = 0, lose = 0;
  for (const o of managers) {
    if (o === x.m) continue;
    const r = meet.get(`${x.m}|${o}`); if (!r) continue;
    if (r.w > r.l) win++; else if (r.l > r.w) lose++;
  }
  M.push(`| ${x.m} | ${x.w}–${x.l}${x.t ? '–' + x.t : ''} | ${(x.w / (x.w + x.l + x.t) * 100).toFixed(1)}% | ${win} | ${lose} |`);
}
M.push('');

// most lopsided / most even
const pairs = [];
for (let i = 0; i < managers.length; i++) for (let j = i + 1; j < managers.length; j++) {
  const a = managers[i], b = managers[j];
  const r = meet.get(`${a}|${b}`); if (!r) continue;
  const n = r.w + r.l + r.t;
  pairs.push({ a, b, n, aw: r.w, bw: r.l, t: r.t, diff: Math.abs(r.w - r.l),
    pf: r1(r.pf), pa: r1(r.pa), games: r.games });
}
M.push('## Most one-sided rivalries');
M.push('');
M.push('| Matchup | Record | Meetings | Points |');
M.push('|---|---|---:|---|');
for (const p of pairs.slice().sort((x, y) => y.diff - x.diff || y.n - x.n).slice(0, 10)) {
  // orient so the manager who won the series is named first
  const flip = p.bw > p.aw;
  const [wn, ln] = flip ? [p.b, p.a] : [p.a, p.b];
  const [ww, lw] = flip ? [p.bw, p.aw] : [p.aw, p.bw];
  const [wp, lp] = flip ? [p.pa, p.pf] : [p.pf, p.pa];
  M.push(`| ${wn} over ${ln} | ${ww}–${lw}${p.t ? '–' + p.t : ''} | ${p.n} | ${wp.toFixed(1)} – ${lp.toFixed(1)} |`);
}
M.push('');
M.push('## Dead-even rivalries');
M.push('');
M.push('| Matchup | Record | Meetings | Points |');
M.push('|---|---|---:|---|');
for (const p of pairs.filter(p => p.diff <= 1 && p.n >= 4).sort((x, y) => y.n - x.n).slice(0, 10))
  M.push(`| ${p.a} vs ${p.b} | ${p.aw}–${p.bw}${p.t ? '–' + p.t : ''} | ${p.n} | ${p.pf.toFixed(1)} – ${p.pa.toFixed(1)} |`);
M.push('');

M.push('## Biggest blowouts');
M.push('');
M.push('| Year | Wk | Winner | Score | Loser | Margin | Stage |');
M.push('|---|---:|---|---|---|---:|---|');
for (const g of allGames.slice().sort((a, b) => b.margin - a.margin).slice(0, 12)) {
  const [wp, lp] = g.aPts > g.bPts ? [g.aPts, g.bPts] : [g.bPts, g.aPts];
  const loser = g.winner === g.a ? g.b : g.a;
  M.push(`| ${g.year} | ${g.week} | ${g.winner} | ${wp.toFixed(1)}–${lp.toFixed(1)} | ${loser} | **${g.margin.toFixed(1)}** | ${g.tier === 'NONE' ? 'regular' : g.tier.replace(/_/g, ' ').toLowerCase()} |`);
}
M.push('');
M.push('## Closest games');
M.push('');
M.push('| Year | Wk | Winner | Score | Loser | Margin | Stage |');
M.push('|---|---:|---|---|---|---:|---|');
for (const g of allGames.slice().sort((a, b) => a.margin - b.margin).slice(0, 12)) {
  const [wp, lp] = g.aPts > g.bPts ? [g.aPts, g.bPts] : [g.bPts, g.aPts];
  const loser = g.winner === g.a ? g.b : g.a;
  M.push(`| ${g.year} | ${g.week} | ${g.winner === 'TIE' ? '_tie_' : g.winner} | ${wp.toFixed(1)}–${lp.toFixed(1)} | ${g.winner === 'TIE' ? '_tie_' : loser} | ${g.margin.toFixed(1)} | ${g.tier === 'NONE' ? 'regular' : g.tier.replace(/_/g, ' ').toLowerCase()} |`);
}
M.push('');

const playoffGames = allGames.filter(g => g.tier !== 'NONE');
M.push('## Playoff meetings');
M.push('');
M.push(`${playoffGames.length} of the ${allGames.length} games were played in a bracket.`);
M.push('');
M.push('| Year | Wk | Bracket | Winner | Score | Loser |');
M.push('|---|---:|---|---|---|---|');
for (const g of playoffGames.filter(g => g.tier === 'WINNERS_BRACKET').sort((a, b) => a.year.localeCompare(b.year) || a.week - b.week)) {
  const [wp, lp] = g.aPts > g.bPts ? [g.aPts, g.bPts] : [g.bPts, g.aPts];
  const loser = g.winner === g.a ? g.b : g.a;
  M.push(`| ${g.year} | ${g.week} | championship side | ${g.winner} | ${wp.toFixed(1)}–${lp.toFixed(1)} | ${loser} |`);
}
M.push('');

M.push('## Caveats');
M.push('');
M.push('- Schedules are not balanced — some pairs meet twice a season, others once, so meeting counts vary. A 4–0 over four meetings is thinner evidence than 6–2 over eight.');
M.push('- Playoff games are included in every record here, unlike the luck-adjusted standings, which use the regular season only.');
M.push('- Head-to-head says who won, not who was better. Cross-reference all-play % in `luck-adjusted-standings.md`.');
M.push('');
M.push('Generated by `../.espn-automation/analyze_rivalry.js`. Pair-level data in `../data/rivalry-head-to-head.csv`.');
M.push('');

fs.writeFileSync(path.join(ROOT, 'analysis/rivalry-matrix.md'), M.join('\n'));
console.log(`\nwrote analysis/rivalry-matrix.md (${M.length} lines)`);

fs.writeFileSync(path.join(ROOT, 'data/rivalry-head-to-head.csv'),
  ['ManagerA,ManagerB,Meetings,A_Wins,B_Wins,Ties,A_PointsFor,B_PointsFor,AvgMargin,PlayoffMeetings']
    .concat(pairs.map(p => [p.a, p.b, p.n, p.aw, p.bw, p.t, p.pf.toFixed(1), p.pa.toFixed(1),
      r1(p.games.reduce((a, g) => a + Math.abs(g.margin), 0) / p.n).toFixed(1),
      p.games.filter(g => g.tier !== 'NONE').length].map(csvEsc).join(','))).join('\n') + '\n');
console.log(`wrote data/rivalry-head-to-head.csv (${pairs.length} pairs)`);
