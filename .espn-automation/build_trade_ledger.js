// Consolidated trade ledger. ESPN's transaction log stores items for only a
// minority of this league's executed trades, so it is merged with trades
// recovered from the weekly roster snapshots (which reconcile exactly to the
// scored lineups and are therefore treated as ground truth).
const fs = require('fs');
const path = require('path');
const ROOT = '/Users/evanfukumoto/Documents/VSCodeRepos/fantasy-football';
const OUT = path.join(ROOT, 'data');

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
const writeCsv = (file, header, rows) => {
  fs.writeFileSync(file, [header.join(',')].concat(rows.map(r => r.map(csvEsc).join(','))).join('\n') + '\n');
  console.log(`  wrote ${path.relative(ROOT, file)} (${rows.length} rows)`);
};

const trades = parseCsv(path.join(OUT, 'trades-2022-2025.csv'));
const moves  = parseCsv(path.join(OUT, 'player-movements-2022-2025.csv'));

const rows = [];
// 1) ESPN-logged executed trades
const logged = new Map();
for (const t of trades) {
  if (!logged.has(t.TradeId)) logged.set(t.TradeId, []);
  logged.get(t.TradeId).push(t);
}
for (const [tid, items] of logged) {
  const wk = items[0].Week;
  for (const it of items) {
    rows.push([it.Year, wk, it.Date.slice(0, 10), `espn:${tid.slice(0, 8)}`, 'ESPN transaction log',
      it.RosterVerification, it.PlayerId, it.Player, it.Position, it.FromManager, it.FromTeam, it.ToManager, it.ToTeam]);
  }
}

// 2) trades visible only in the roster snapshots: cluster unlogged moves by
//    (season, week window, team pair) and keep the clusters where both teams
//    both gave and received a player.
const groups = new Map();
for (const m of moves) {
  if (!m.MoveType.startsWith('UNLOGGED')) continue;
  const pair = [m.FromTeamId, m.ToTeamId].sort().join('-');
  const key = `${m.Year}|${m.FromWeek}|${m.ToWeek}|${pair}`;
  if (!groups.has(key)) groups.set(key, []);
  groups.get(key).push(m);
}
let derived = 0;
for (const [key, g] of groups) {
  if (new Set(g.map(m => m.FromTeamId)).size !== 2) continue;   // one-directional => not a trade
  derived++;
  const [year, fw, tw] = key.split('|');
  for (const m of g) {
    rows.push([year, tw, `between wk${fw} and wk${tw}`, `derived:${key.split('|')[3]}-w${tw}`,
      'Roster snapshots (missing from ESPN log)', 'ROSTER_DERIVED',
      m.PlayerId, m.Player, m.Position, m.FromManager, m.FromTeam, m.ToManager, m.ToTeam]);
  }
}

rows.sort((a, b) => a[0].localeCompare(b[0]) || Number(a[1]) - Number(b[1]));
console.log(`ESPN-logged trades: ${logged.size}   roster-derived trades: ${derived}   total player moves: ${rows.length}`);
writeCsv(path.join(OUT, 'trades-consolidated-2022-2025.csv'),
  ['Year','Week','Date','TradeKey','Source','Verification','PlayerId','Player','Position','FromManager','FromTeam','ToManager','ToTeam'],
  rows);
