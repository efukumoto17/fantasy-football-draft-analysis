// Post-processing: (1) resolve any missing player names, (2) flag each trade row
// against the verified weekly-roster snapshots, (3) derive a complete
// week-over-week player movement log from those snapshots.
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const ROOT = '/Users/evanfukumoto/Documents/VSCodeRepos/fantasy-football';
const OUT = path.join(ROOT, 'data');
const RAW = path.join(ROOT, '.espn-automation/raw');
const YEARS = [2022, 2023, 2024, 2025];
const API = 'https://lm-api-reads.fantasy.espn.com/apis/v3/games/ffl';
const H = { 'x-fantasy-platform':'espn-fantasy-web','x-fantasy-source':'kona',accept:'application/json' };
const POS = { 1:'QB',2:'RB',3:'WR',4:'TE',5:'K',16:'D/ST' };

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
const csvEsc = (v) => { const s = v === null || v === undefined ? '' : String(v); return /[",\n]/.test(s) ? '"' + s.replace(/"/g,'""') + '"' : s; };
const writeCsv = (file, header, rows) => {
  fs.writeFileSync(file, [header.join(',')].concat(rows.map(r => r.map(csvEsc).join(','))).join('\n') + '\n');
  console.log(`  wrote ${path.relative(ROOT, file)} (${rows.length} rows)`);
};

(async () => {
  const rosters = parseCsv(path.join(OUT, 'weekly-rosters-2022-2025.csv'));
  const trades  = parseCsv(path.join(OUT, 'trades-2022-2025.csv'));
  const teams   = parseCsv(path.join(OUT, 'team-managers-2022-2025.csv'));

  const teamKey = new Map(teams.map(t => [`${t.Year}|${t.TeamId}`, t]));
  const nameById = new Map(), posById = new Map();
  for (const r of rosters) { if (r.Player) { nameById.set(r.PlayerId, r.Player); posById.set(r.PlayerId, r.Position); } }

  // ---- resolve player ids that never appeared on a roster ----
  const needed = new Set();
  for (const t of trades) if (!nameById.has(t.PlayerId)) needed.add(t.PlayerId);
  for (const y of YEARS) {
    for (const t of JSON.parse(fs.readFileSync(path.join(RAW, `transactions-${y}.json`), 'utf8')))
      for (const it of (t.items || [])) if (!nameById.has(String(it.playerId))) needed.add(String(it.playerId));
  }
  console.log(`player ids needing lookup: ${needed.size}`);
  if (needed.size) {
    const browser = await chromium.connectOverCDP('http://127.0.0.1:9222');
    const req = browser.contexts()[0].request;
    const ids = [...needed].map(Number).filter(n => !Number.isNaN(n));
    for (const y of YEARS) {
      const filter = { players: { filterIds: { value: ids }, limit: 2000 } };
      const r = await req.get(`${API}/seasons/${y}/players?scoringPeriodId=0&view=players_wl`,
        { headers: { ...H, 'x-fantasy-filter': JSON.stringify(filter) }, timeout: 60000 });
      if (r.status() !== 200) continue;
      for (const p of await r.json()) {
        if (p.fullName && !nameById.has(String(p.id))) {
          nameById.set(String(p.id), p.fullName);
          posById.set(String(p.id), POS[p.defaultPositionId] || p.defaultPositionId);
        }
      }
      if ([...needed].every(id => nameById.has(id))) break;
    }
    await browser.close();
    console.log(`  still unresolved: ${[...needed].filter(id => !nameById.has(id)).join(', ') || 'none'}`);
  }

  // ---- ownership index from verified weekly snapshots ----
  const own = new Map();               // year|week|playerId -> teamId
  const weeksByYear = new Map();
  for (const r of rosters) {
    own.set(`${r.Year}|${r.Week}|${r.PlayerId}`, r.TeamId);
    if (!weeksByYear.has(r.Year)) weeksByYear.set(r.Year, new Set());
    weeksByYear.get(r.Year).add(Number(r.Week));
  }

  // ---- flag trade rows against snapshots ----
  const tradeOut = [];
  for (const t of trades) {
    const w = Number(t.Week);
    const next = own.get(`${t.Year}|${w + 1}|${t.PlayerId}`);
    const prev = own.get(`${t.Year}|${w}|${t.PlayerId}`);
    let verdict;
    if (next === t.ToTeamId) verdict = 'CONFIRMED';
    else if (next === undefined) verdict = 'DROPPED_AFTER';
    else verdict = 'CONFLICT';
    tradeOut.push([t.Year, t.Week, t.Date, t.TradeId, t.Trade, t.PlayerId,
      t.Player || nameById.get(t.PlayerId) || '', t.Position || posById.get(t.PlayerId) || '',
      t.FromTeamId, t.FromTeam, t.FromManager, t.ToTeamId, t.ToTeam, t.ToManager,
      verdict, prev === undefined ? '' : prev, next === undefined ? '' : next]);
  }
  const vc = {}; tradeOut.forEach(r => vc[r[14]] = (vc[r[14]] || 0) + 1);
  console.log('trade row verification:', JSON.stringify(vc));
  writeCsv(path.join(OUT, 'trades-2022-2025.csv'),
    ['Year','Week','Date','TradeId','Trade','PlayerId','Player','Position','FromTeamId','FromTeam','FromManager',
     'ToTeamId','ToTeam','ToManager','RosterVerification','OwnerTradeWeek','OwnerNextWeek'], tradeOut);

  // ---- derive every ownership change from the snapshots ----
  // Classify each change against the transaction log rather than by guessing:
  // an executed waiver/FA ADD onto the receiving team explains a pickup, an
  // executed TRADE item explains a trade. Anything left is a move ESPN did not log.
  const txnsAll = parseCsv(path.join(OUT, 'transactions-2022-2025.csv'));
  const addIdx = new Set(), tradeIdx = new Set();
  for (const x of txnsAll) {
    if (x.ItemType === 'ADD' && x.Status === 'EXECUTED' && (x.TxnType === 'WAIVER' || x.TxnType === 'FREEAGENT'))
      addIdx.add(`${x.Year}|${x.PlayerId}|${x.ToTeamId}|${x.Week}`);
    if (x.ItemType === 'TRADE' && x.Status === 'EXECUTED' && x.TxnType === 'TRADE_ACCEPT')
      tradeIdx.add(`${x.Year}|${x.PlayerId}|${x.FromTeamId}|${x.ToTeamId}|${x.Week}`);
  }

  const moves = [];
  for (const [year, wset] of weeksByYear) {
    const wks = [...wset].sort((a, b) => a - b);
    const players = new Set(rosters.filter(r => r.Year === year).map(r => r.PlayerId));
    for (let i = 1; i < wks.length; i++) {
      const pw = wks[i - 1], cw = wks[i];
      const changes = [];
      for (const pid of players) {
        const a = own.get(`${year}|${pw}|${pid}`), b = own.get(`${year}|${cw}|${pid}`);
        if (a && b && a !== b) changes.push({ pid, from: a, to: b });
      }
      for (const c of changes) {
        const inWindow = (build) => [pw, cw].some(w => build(w));
        const isAdd = inWindow(w => addIdx.has(`${year}|${c.pid}|${c.to}|${w}`));
        const isTrade = inWindow(w => tradeIdx.has(`${year}|${c.pid}|${c.from}|${c.to}|${w}`));
        const recip = changes.some(o => o.from === c.to && o.to === c.from);
        const type = isTrade ? 'TRADE (ESPN log)' : isAdd ? 'WAIVER/FA PICKUP'
          : recip ? 'UNLOGGED (reciprocal - likely trade)' : 'UNLOGGED';
        const ft = teamKey.get(`${year}|${c.from}`) || {}, tt = teamKey.get(`${year}|${c.to}`) || {};
        moves.push([year, pw, cw, c.pid, nameById.get(c.pid) || '', posById.get(c.pid) || '',
          c.from, ft.TeamName || '', ft.Manager || '', c.to, tt.TeamName || '', tt.Manager || '',
          type, recip ? 1 : 0]);
      }
    }
  }
  const mc = {}; moves.forEach(r => mc[r[12]] = (mc[r[12]] || 0) + 1);
  console.log('movement classification:', JSON.stringify(mc, null, 1));
  writeCsv(path.join(OUT, 'player-movements-2022-2025.csv'),
    ['Year','FromWeek','ToWeek','PlayerId','Player','Position','FromTeamId','FromTeam','FromManager',
     'ToTeamId','ToTeam','ToManager','MoveType','ReciprocalSameWindow'], moves);

  // ---- backfill names in the full transaction log ----
  const txns = txnsAll;
  let filled = 0;
  const txOut = txns.map(x => {
    if (!x.Player && nameById.has(x.PlayerId)) { x.Player = nameById.get(x.PlayerId); x.Position = posById.get(x.PlayerId) || ''; filled++; }
    return ['Year','Week','Date','TxnType','Status','ItemType','ActingTeamId','ActingManager','PlayerId','Player',
            'Position','FromTeamId','FromTeam','ToTeamId','ToTeam','BidAmount','TxnId'].map(k => x[k]);
  });
  console.log(`transaction names backfilled: ${filled}`);
  writeCsv(path.join(OUT, 'transactions-2022-2025.csv'),
    ['Year','Week','Date','TxnType','Status','ItemType','ActingTeamId','ActingManager','PlayerId','Player',
     'Position','FromTeamId','FromTeam','ToTeamId','ToTeam','BidAmount','TxnId'], txOut);
})();
