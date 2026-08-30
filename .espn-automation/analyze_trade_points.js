// Trade points analysis. For each trade, a manager's return is what the players
// they acquired went on to score while on their roster; their cost is what the
// players they gave up scored for the partner. Windows are read from the weekly
// roster snapshots and close as soon as the player leaves that roster, so a
// player traded away (or traded back) is not double-counted.
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
const ledger  = parseCsv(path.join(ROOT, 'data/trades-consolidated-2022-2025.csv'));
const teams   = parseCsv(path.join(ROOT, 'data/team-managers-2022-2025.csv'));

const mgrOf = new Map(teams.map(t => [`${t.Year}|${t.TeamId}`, t.Manager]));
const teamIdOf = new Map(teams.map(t => [`${t.Year}|${t.Manager}`, t.TeamId]));

// ownership + scoring, per player-week
const own = new Map();      // year|week|pid -> teamId
const box = new Map();      // year|week|pid -> {actual, started}
const weeksOf = new Map();  // year -> sorted weeks
for (const r of rosters) {
  own.set(`${r.Year}|${r.Week}|${r.PlayerId}`, r.TeamId);
  box.set(`${r.Year}|${r.Week}|${r.PlayerId}`, {
    actual: r.ActualPoints === '' ? 0 : Number(r.ActualPoints),
    started: r.Started === '1',
  });
  if (!weeksOf.has(r.Year)) weeksOf.set(r.Year, new Set());
  weeksOf.get(r.Year).add(Number(r.Week));
}
for (const [y, s] of weeksOf) weeksOf.set(y, [...s].sort((a, b) => a - b));

// points a player scored for `teamId`, starting at the first week >= from where
// they are on that roster, ending when they leave it
const stint = (year, pid, teamId, from) => {
  const wks = weeksOf.get(year) || [];
  let start = null;
  for (const w of wks) { if (w >= from && own.get(`${year}|${w}|${pid}`) === teamId) { start = w; break; } }
  if (start === null) return { total: 0, starter: 0, weeks: 0, startWeek: null, endWeek: null };
  let total = 0, starter = 0, weeks = 0, end = start;
  for (const w of wks) {
    if (w < start) continue;
    if (own.get(`${year}|${w}|${pid}`) !== teamId) break;
    const b = box.get(`${year}|${w}|${pid}`);
    if (b) { total += b.actual; if (b.started) starter += b.actual; }
    weeks++; end = w;
  }
  return { total, starter, weeks, startWeek: start, endWeek: end };
};

// group ledger into trades
const trades = new Map();
for (const r of ledger) {
  const k = `${r.Year}|${r.TradeKey}`;
  if (!trades.has(k)) trades.set(k, { year: r.Year, week: Number(r.Week), date: r.Date, key: r.TradeKey, source: r.Source, items: [] });
  trades.get(k).items.push(r);
}

const detail = [];
const perTrade = [];
for (const t of [...trades.values()].sort((a, b) => a.year.localeCompare(b.year) || a.week - b.week)) {
  const involved = [...new Set(t.items.flatMap(i => [i.FromManager, i.ToManager]))];
  const legs = t.items.map(i => {
    const toTeam = teamIdOf.get(`${t.year}|${i.ToManager}`);
    const s = stint(t.year, i.PlayerId, toTeam, t.week);
    detail.push([t.year, t.week, t.key, t.source.startsWith('Roster') ? 'derived' : 'espn-log',
      i.Player, i.Position, i.FromManager, i.ToManager,
      s.startWeek || '', s.endWeek || '', s.weeks,
      Math.round(s.total * 10) / 10, Math.round(s.starter * 10) / 10]);
    return { ...i, s };
  });
  const side = {};
  for (const m of involved) {
    const got = legs.filter(l => l.ToManager === m);
    const gave = legs.filter(l => l.FromManager === m);
    side[m] = {
      inTotal: got.reduce((a, l) => a + l.s.total, 0),
      inStart: got.reduce((a, l) => a + l.s.starter, 0),
      outTotal: gave.reduce((a, l) => a + l.s.total, 0),
      outStart: gave.reduce((a, l) => a + l.s.starter, 0),
      nGot: got.length, nGave: gave.length,
    };
  }
  perTrade.push({ ...t, involved, side });
}

// aggregate
const managers = [...new Set(ledger.flatMap(r => [r.FromManager, r.ToManager]))].sort();
const blank = () => ({ trades: 0, inTotal: 0, inStart: 0, outTotal: 0, outStart: 0, won: 0, lost: 0, tied: 0 });
const agg = new Map();   // manager -> year|ALL -> stats
for (const m of managers) { agg.set(m, new Map(YEARS.concat('ALL').map(y => [y, blank()]))); }
for (const t of perTrade) {
  for (const m of t.involved) {
    const s = t.side[m];
    for (const scope of [t.year, 'ALL']) {
      const a = agg.get(m).get(scope);
      a.trades++; a.inTotal += s.inTotal; a.inStart += s.inStart;
      a.outTotal += s.outTotal; a.outStart += s.outStart;
      const net = s.inStart - s.outStart;
      if (net > 0) a.won++; else if (net < 0) a.lost++; else a.tied++;
    }
  }
}

const r1 = (n) => Math.round(n * 10) / 10;
const sgn = (n) => (n > 0 ? '+' : '') + r1(n).toFixed(1);

console.log('=== NET STARTER POINTS VIA TRADES (overall) ===');
const ranked = managers.slice().sort((a, b) =>
  (agg.get(b).get('ALL').inStart - agg.get(b).get('ALL').outStart) -
  (agg.get(a).get('ALL').inStart - agg.get(a).get('ALL').outStart));
for (const m of ranked) {
  const a = agg.get(m).get('ALL');
  console.log(`${m.padEnd(22)} ${sgn(a.inStart - a.outStart).padStart(8)}  (in ${r1(a.inStart).toFixed(1).padStart(7)} / out ${r1(a.outStart).toFixed(1).padStart(7)})  ${a.trades} trades, ${a.won}W-${a.lost}L${a.tied ? '-' + a.tied + 'T' : ''}`);
}
const zero = managers.reduce((s, m) => s + agg.get(m).get('ALL').inStart - agg.get(m).get('ALL').outStart, 0);
console.log(`\nleague-wide net (should be ~0): ${r1(zero)}`);

fs.writeFileSync(path.join(ROOT, 'data/trade-points-detail.csv'),
  ['Year,TradeWeek,TradeKey,Source,Player,Position,FromManager,ToManager,StintStartWeek,StintEndWeek,WeeksHeld,PointsForNewTeam,StarterPointsForNewTeam']
    .concat(detail.map(r => r.map(csvEsc).join(','))).join('\n') + '\n');
console.log(`\nwrote data/trade-points-detail.csv (${detail.length} rows)`);

fs.writeFileSync(path.join(ROOT, '.espn-automation/trade_points.json'),
  JSON.stringify({ perTrade, agg: Object.fromEntries([...agg].map(([m, v]) => [m, Object.fromEntries(v)])) }, null, 2));

// ---------------- markdown report ----------------
const M = [];
M.push('# Trade Points Analysis — 2022–2025');
M.push('');
M.push(`Who actually gained points by trading. ${perTrade.length} trades, ${detail.length} player moves, league 275797.`);
M.push('');
M.push('## Method');
M.push('');
M.push('For each trade, a manager\'s **return** is what the players they acquired went on to score while on their roster; their **cost** is what the players they gave up scored for the trade partner over the same kind of window. **Net = return − cost.**');
M.push('');
M.push('Scoring windows come from the weekly roster snapshots and close the moment a player leaves that roster — so a player who is later dropped or traded on stops counting, and the back-and-forth trades in this league are not double-counted.');
M.push('');
M.push('Two measures are reported:');
M.push('');
M.push('- **Starter points** — points scored while actually in the starting lineup. This is value the manager realized. It is the headline number.');
M.push('- **Roster points** — everything scored while on the roster, bench included. This measures the asset acquired, independent of lineup decisions.');
M.push('');
M.push('Because one manager\'s return is the other\'s cost, net points sum to exactly zero league-wide. This is a zero-sum ledger: it measures trades against each other, not against a waiver-wire alternative.');
M.push('');

const table = (scope) => {
  const out = [];
  out.push('| Manager | Trades | Won–Lost | Starter pts in | Starter pts out | **Net starter** | Net roster |');
  out.push('|---|---:|---:|---:|---:|---:|---:|');
  const rk = managers.slice().filter(m => agg.get(m).get(scope).trades > 0)
    .sort((a, b) => (agg.get(b).get(scope).inStart - agg.get(b).get(scope).outStart)
                  - (agg.get(a).get(scope).inStart - agg.get(a).get(scope).outStart));
  for (const m of rk) {
    const a = agg.get(m).get(scope);
    const wl = a.tied ? `${a.won}–${a.lost}–${a.tied}` : `${a.won}–${a.lost}`;
    out.push(`| ${m} | ${a.trades} | ${wl} | ${r1(a.inStart).toFixed(1)} | ${r1(a.outStart).toFixed(1)} | **${sgn(a.inStart - a.outStart)}** | ${sgn(a.inTotal - a.outTotal)} |`);
  }
  return out;
};

M.push('## Overall — all four seasons');
M.push('');
M.push(...table('ALL'));
M.push('');

for (const y of YEARS) {
  M.push(`## ${y}`);
  M.push('');
  const n = perTrade.filter(t => t.year === y).length;
  M.push(`${n} trades.`);
  M.push('');
  M.push(...table(y));
  M.push('');
}

// most lopsided individual trades
const lop = [];
for (const t of perTrade) {
  const [a, b] = t.involved;
  const net = t.side[a].inStart - t.side[a].outStart;
  const win = net >= 0 ? a : b, lose = net >= 0 ? b : a;
  lop.push({ t, win, lose, margin: Math.abs(net) });
}
lop.sort((x, y) => y.margin - x.margin);
M.push('## Most lopsided trades');
M.push('');
M.push('Ranked by starter-point margin. "Won by" is how many more points the winner\'s side of the deal produced.');
M.push('');
M.push('| Year | Week | Winner | Loser | Won by | Winner received | Winner gave |');
M.push('|---|---:|---|---|---:|---|---|');
for (const l of lop.slice(0, 15)) {
  const got = l.t.items.filter(i => i.ToManager === l.win).map(i => i.Player).join(', ') || '—';
  const gave = l.t.items.filter(i => i.FromManager === l.win).map(i => i.Player).join(', ') || '—';
  M.push(`| ${l.t.year} | ${l.t.week} | ${l.win} | ${l.lose} | ${r1(l.margin).toFixed(1)} | ${got} | ${gave} |`);
}
M.push('');

// best individual pickups
M.push('## Biggest single-player returns');
M.push('');
M.push('Starter points a single acquired player produced for their new team after the trade.');
M.push('');
M.push('| Year | Player | Pos | From | To | Weeks held | Starter pts |');
M.push('|---|---|---|---|---|---:|---:|');
for (const d of detail.slice().sort((a, b) => b[12] - a[12]).slice(0, 15)) {
  M.push(`| ${d[0]} | ${d[4]} | ${d[5]} | ${d[6]} | ${d[7]} | ${d[10]} | ${r1(d[12]).toFixed(1)} |`);
}
M.push('');

M.push('## Caveats');
M.push('');
const zeroWeek = detail.filter(d => d[10] === 0).length;
M.push(`- ${zeroWeek} acquired players never appear on the receiving roster in any later snapshot and score 0 here. These are the trades where ESPN's log conflicts with the roster data (see \`trades-2022-2025.csv\`), not players who genuinely produced nothing.`);
M.push('- Trades recovered from roster snapshots are dated to a week range, so their scoring window starts from the later week. A trade made mid-week may lose a game of credit.');
M.push('- This is zero-sum by construction. A manager can show negative net and still have traded well — giving up a productive player for one who fit a need is scored purely on points.');
M.push('- A tie (third number in Won–Lost) is a trade where neither side scored any starter points — typically a late-season deal or players dropped immediately.');
M.push('- Starter points depend on lineup decisions. A manager who acquired a good player and benched him is charged for that here; the roster-points column is the lineup-independent view.');
M.push('');
M.push('Generated by `../.espn-automation/analyze_trade_points.js` from `../data/trades-consolidated-2022-2025.csv` and `../data/weekly-rosters-2022-2025.csv`. Per-player detail in `../data/trade-points-detail.csv`.');
M.push('');

fs.writeFileSync(path.join(ROOT, 'analysis/trade-points-analysis.md'), M.join('\n'));
console.log(`wrote analysis/trade-points-analysis.md (${M.length} lines)`);
