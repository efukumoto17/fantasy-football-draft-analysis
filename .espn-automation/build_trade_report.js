// Renders trades-by-owner.md from the consolidated trade ledger.
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

const rows = parseCsv(path.join(ROOT, 'data/trades-consolidated-2022-2025.csv'));
const YEARS = ['2022', '2023', '2024', '2025'];

// group ledger rows into trades
const trades = new Map();
for (const r of rows) {
  const k = `${r.Year}|${r.TradeKey}`;
  if (!trades.has(k)) trades.set(k, { year: r.Year, week: Number(r.Week), date: r.Date, key: r.TradeKey,
    source: r.Source, verification: new Set(), items: [] });
  const t = trades.get(k);
  t.verification.add(r.Verification);
  t.items.push(r);
}
const all = [...trades.values()].sort((a, b) => a.year.localeCompare(b.year) || a.week - b.week);

const managers = [...new Set(rows.flatMap(r => [r.FromManager, r.ToManager]))].sort();
const plist = (arr) => arr.length ? arr.map(i => `${i.Player} (${i.Position})`).join(', ') : '_nothing_';

// per-manager stats
const stat = new Map(managers.map(m => [m, { trades: [], in: 0, out: 0, partners: new Map(), byYear: {} }]));
for (const t of all) {
  const involved = [...new Set(t.items.flatMap(i => [i.FromManager, i.ToManager]))];
  for (const m of involved) {
    const s = stat.get(m);
    const got = t.items.filter(i => i.ToManager === m);
    const gave = t.items.filter(i => i.FromManager === m);
    const partner = involved.find(x => x !== m);
    s.trades.push({ ...t, got, gave, partner });
    s.in += got.length; s.out += gave.length;
    s.partners.set(partner, (s.partners.get(partner) || 0) + 1);
    s.byYear[t.year] = (s.byYear[t.year] || 0) + 1;
  }
}

const L = [];
L.push('# Trades by Owner — 2022–2025');
L.push('');
L.push(`League 275797 · **${all.length} completed trades** across four seasons · ${rows.length} player moves.`);
L.push('Every trade in this league was between exactly two managers. Each one is listed under **both** owners involved, so the trade counts below sum to twice the league total.');
L.push('');
L.push('Generated from `../data/trades-consolidated-2022-2025.csv`. See the caveat at the bottom on where this data comes from.');
L.push('');
L.push('## Summary');
L.push('');
L.push('| Manager | Trades | Players in | Players out | ' + YEARS.join(' | ') + ' | Most frequent partner |');
L.push('|---|---:|---:|---:|' + YEARS.map(() => '---:').join('|') + '|---|');
const ranked = managers.slice().sort((a, b) => stat.get(b).trades.length - stat.get(a).trades.length || a.localeCompare(b));
for (const m of ranked) {
  const s = stat.get(m);
  const top = [...s.partners.entries()].sort((a, b) => b[1] - a[1])[0];
  L.push(`| ${m} | ${s.trades.length} | ${s.in} | ${s.out} | `
    + YEARS.map(y => s.byYear[y] || '—').join(' | ')
    + ` | ${top ? `${top[0]} (${top[1]})` : '—'} |`);
}
L.push('');
const perYear = YEARS.map(y => `${y}: ${all.filter(t => t.year === y).length}`).join(' · ');
L.push(`**Trades per season** — ${perYear}`);
L.push('');
L.push('---');
L.push('');

for (const m of ranked) {
  const s = stat.get(m);
  L.push(`## ${m}`);
  L.push('');
  L.push(`${s.trades.length} trades · ${s.in} players acquired · ${s.out} players sent away`);
  L.push('');
  for (const y of YEARS) {
    const ts = s.trades.filter(t => t.year === y);
    if (!ts.length) continue;
    L.push(`### ${y}`);
    L.push('');
    for (const t of ts) {
      const when = t.date.startsWith('between') ? `Week ${t.week} (${t.date})` : `Week ${t.week} · ${t.date}`;
      const flag = t.source.startsWith('Roster') ? ' ⚠︎' : '';
      L.push(`**${when} — with ${t.partner}**${flag}`);
      L.push('');
      L.push(`- **Got:** ${plist(t.got)}`);
      L.push(`- **Gave:** ${plist(t.gave)}`);
      L.push('');
    }
  }
  L.push('---');
  L.push('');
}

const derived = all.filter(t => t.source.startsWith('Roster')).length;
L.push('## Where this data comes from');
L.push('');
L.push(`ESPN's transaction API stores the players involved for only **${all.length - derived} of these ${all.length} trades**. For the other ${derived} it kept the acceptance record but dropped the item list, so those trades cannot be read from the transaction log at all.`);
L.push('');
L.push('Those were recovered from the weekly roster snapshots, which are reliable — starter points reconcile to the reported team score on all 672 matchup sides, 2022–2025. A recovered trade is a week-over-week ownership change with no waiver or free-agent add behind it, where two teams both gave and received a player. Only 8 of 180 such moves had any add record, so this is not picking up waiver churn.');
L.push('');
L.push('Trades marked ⚠︎ are recovered ones. Because a snapshot only places them between two weeks, they carry a week range instead of a timestamp, and the exact date is unknown.');
L.push('');

const out = path.join(ROOT, 'analysis/trades-by-owner.md');
fs.writeFileSync(out, L.join('\n'));
console.log(`wrote analysis/trades-by-owner.md — ${all.length} trades, ${managers.length} managers, ${L.length} lines`);
