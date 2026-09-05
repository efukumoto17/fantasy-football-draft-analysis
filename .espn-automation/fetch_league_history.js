// Pulls weekly rosters (actual + projected points), matchup results, and trade/
// transaction history for the last 4 completed seasons. Writes raw JSON per year
// to .espn-automation/raw/ and tidy CSVs to data/.
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const ROOT = '/Users/evanfukumoto/Documents/VSCodeRepos/fantasy-football';
const RAW = path.join(ROOT, '.espn-automation/raw');
const OUT = path.join(ROOT, 'data');
const LEAGUE = 275797;
const YEARS = [2022, 2023, 2024, 2025];
const API = 'https://lm-api-reads.fantasy.espn.com/apis/v3/games/ffl';
const H = { 'x-fantasy-platform': 'espn-fantasy-web', 'x-fantasy-source': 'kona', accept: 'application/json' };

const POS = { 1:'QB', 2:'RB', 3:'WR', 4:'TE', 5:'K', 16:'D/ST', 9:'DT', 10:'DE', 11:'LB', 12:'CB', 13:'S', 14:'DB', 15:'DL' };
const SLOT = { 0:'QB', 1:'TQB', 2:'RB', 3:'RB/WR', 4:'WR', 5:'WR/TE', 6:'TE', 7:'OP', 8:'DT', 9:'DE', 10:'LB',
  11:'DL', 12:'CB', 13:'S', 14:'DB', 15:'DP', 16:'D/ST', 17:'K', 18:'P', 19:'HC', 20:'BE', 21:'IR', 23:'FLEX', 24:'ER' };
const BENCH = new Set([20, 21, 24]);

const csvEsc = (v) => {
  if (v === null || v === undefined) return '';
  const s = String(v);
  return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
};
const writeCsv = (file, header, rows) => {
  const out = [header.join(',')].concat(rows.map(r => r.map(csvEsc).join(','))).join('\n') + '\n';
  fs.writeFileSync(file, out);
  console.log(`  wrote ${path.relative(ROOT, file)} (${rows.length} rows)`);
};
const r1 = (n) => (n === null || n === undefined) ? null : Math.round(n * 100) / 100;

(async () => {
  fs.mkdirSync(RAW, { recursive: true });
  fs.mkdirSync(OUT, { recursive: true });
  const browser = await chromium.connectOverCDP('http://127.0.0.1:9222');
  const req = browser.contexts()[0].request;

  const get = async (url, filter) => {
    const headers = { ...H };
    if (filter) headers['x-fantasy-filter'] = JSON.stringify(filter);
    for (let attempt = 1; attempt <= 4; attempt++) {
      try {
        const r = await req.get(url, { headers, timeout: 60000 });
        if (r.status() === 200) return await r.json();
        if (r.status() === 404) return null;
        console.log(`    retry ${attempt} (status ${r.status()}) ${url.slice(-70)}`);
      } catch (e) {
        console.log(`    retry ${attempt} (${e.message.slice(0, 60)})`);
      }
      await new Promise(res => setTimeout(res, 800 * attempt));
    }
    throw new Error('failed after retries: ' + url);
  };

  // ---- pro team id -> abbrev (stable across years; pull once) ----
  const proTeams = {};
  const pt = await get(`${API}/seasons/2024?view=proTeamSchedules_wl`);
  for (const t of (pt && pt.settings && pt.settings.proTeams) || []) proTeams[t.id] = t.abbrev ? t.abbrev.toUpperCase() : '';
  proTeams[0] = 'FA';
  console.log(`pro teams mapped: ${Object.keys(proTeams).length}`);

  const rosterRows = [], matchupRows = [], tradeRows = [], txnRows = [];
  const managerRows = [];

  for (const year of YEARS) {
    console.log(`\n=== ${year} ===`);
    const meta = await get(`${API}/seasons/${year}/segments/0/leagues/${LEAGUE}?view=mTeam&view=mSettings&view=mStatus`);
    const memberById = new Map((meta.members || []).map(m => [m.id, m]));
    const mgrName = (m) => m ? ([m.firstName, m.lastName].filter(Boolean).join(' ') || m.displayName) : 'Unknown';
    const teamInfo = new Map();
    for (const t of meta.teams || []) {
      const name = (t.name || `${t.location || ''} ${t.nickname || ''}`).trim();
      const manager = mgrName(memberById.get((t.owners || [])[0]));
      teamInfo.set(t.id, { name, manager, abbrev: (t.abbrev || '').trim() });
      managerRows.push([year, t.id, name, (t.abbrev || '').trim(), manager]);
    }
    const sched = meta.settings.scheduleSettings;
    const finalSP = meta.status.finalScoringPeriod;
    // scoringPeriod -> matchupPeriod
    const sp2mp = new Map();
    for (const [mp, sps] of Object.entries(sched.matchupPeriods || {})) for (const sp of sps) sp2mp.set(sp, Number(mp));
    console.log(`teams=${teamInfo.size} finalScoringPeriod=${finalSP} matchupPeriods=${sched.matchupPeriodCount} playoffTeams=${sched.playoffTeamCount}`);

    // ---------- weekly rosters + matchups ----------
    const rawWeeks = {};
    for (let sp = 1; sp <= finalSP; sp++) {
      const j = await get(`${API}/seasons/${year}/segments/0/leagues/${LEAGUE}?view=mMatchup&view=mMatchupScore&view=mRoster&scoringPeriodId=${sp}`);
      const mp = sp2mp.get(sp);
      const games = (j.schedule || []).filter(m => m.matchupPeriodId === mp);
      const seen = new Set();
      const weekRosters = [];

      const sideRows = (side) => {
        if (!side) return { entries: [], actual: null, proj: null };
        const roster = side.rosterForCurrentScoringPeriod || side.rosterForMatchupPeriod;
        const entries = (roster && roster.entries) || [];
        let proj = 0;
        const rows = [];
        for (const e of entries) {
          const p = (e.playerPoolEntry && e.playerPoolEntry.player) || {};
          const stats = p.stats || [];
          const act = stats.find(s => s.scoringPeriodId === sp && s.statSourceId === 0 && s.statSplitTypeId === 1);
          const prj = stats.find(s => s.scoringPeriodId === sp && s.statSourceId === 1 && s.statSplitTypeId === 1);
          const started = !BENCH.has(e.lineupSlotId);
          if (started) proj += (prj ? prj.appliedTotal : 0);
          rows.push({
            playerId: e.playerId, name: p.fullName || '', pos: POS[p.defaultPositionId] || p.defaultPositionId,
            nfl: proTeams[p.proTeamId] !== undefined ? proTeams[p.proTeamId] : p.proTeamId,
            slot: SLOT[e.lineupSlotId] !== undefined ? SLOT[e.lineupSlotId] : e.lineupSlotId,
            started, actual: act ? act.appliedTotal : (started ? 0 : null),
            projected: prj ? prj.appliedTotal : null,
            injury: e.injuryStatus || p.injuryStatus || '',
          });
        }
        return { entries: rows, actual: side.totalPoints, proj };
      };

      for (const g of games) {
        const home = sideRows(g.home), away = sideRows(g.away);
        for (const [side, tid] of [[home, g.home && g.home.teamId], [away, g.away && g.away.teamId]]) {
          if (!tid) continue;
          seen.add(tid);
          const ti = teamInfo.get(tid) || { name: '?', manager: '?' };
          for (const e of side.entries) {
            rosterRows.push([year, sp, mp, tid, ti.name, ti.manager, e.playerId, e.name, e.pos, e.nfl,
              e.slot, e.started ? 1 : 0, r1(e.actual), r1(e.projected), e.injury]);
          }
          weekRosters.push({ teamId: tid, entries: side.entries });
        }
        if (g.home && g.away) {
          const hp = g.home.pointsByScoringPeriod ? g.home.pointsByScoringPeriod[sp] : null;
          const ap = g.away.pointsByScoringPeriod ? g.away.pointsByScoringPeriod[sp] : null;
          const ha = hp !== null && hp !== undefined ? hp : g.home.totalPoints;
          const aa = ap !== null && ap !== undefined ? ap : g.away.totalPoints;
          const hti = teamInfo.get(g.home.teamId) || {}, ati = teamInfo.get(g.away.teamId) || {};
          matchupRows.push([year, sp, mp, g.playoffTierType || 'NONE', g.id,
            g.home.teamId, hti.name, hti.manager, r1(ha), r1(home.proj),
            g.away.teamId, ati.name, ati.manager, r1(aa), r1(away.proj),
            g.winner, r1(Math.abs((ha || 0) - (aa || 0)))]);
        }
      }

      // any team without a matchup this week (playoff byes) -> pull its roster directly
      const missing = [...teamInfo.keys()].filter(t => !seen.has(t));
      if (missing.length) {
        const rj = await get(`${API}/seasons/${year}/segments/0/leagues/${LEAGUE}?view=mRoster&scoringPeriodId=${sp}`);
        for (const t of (rj.teams || []).filter(t => missing.includes(t.id))) {
          const ti = teamInfo.get(t.id) || {};
          for (const e of ((t.roster && t.roster.entries) || [])) {
            const p = (e.playerPoolEntry && e.playerPoolEntry.player) || {};
            const stats = p.stats || [];
            const act = stats.find(s => s.scoringPeriodId === sp && s.statSourceId === 0 && s.statSplitTypeId === 1);
            const prj = stats.find(s => s.scoringPeriodId === sp && s.statSourceId === 1 && s.statSplitTypeId === 1);
            const started = !BENCH.has(e.lineupSlotId);
            rosterRows.push([year, sp, mp, t.id, ti.name, ti.manager, e.playerId, p.fullName || '',
              POS[p.defaultPositionId] || p.defaultPositionId,
              proTeams[p.proTeamId] !== undefined ? proTeams[p.proTeamId] : p.proTeamId,
              SLOT[e.lineupSlotId] !== undefined ? SLOT[e.lineupSlotId] : e.lineupSlotId,
              started ? 1 : 0, r1(act ? act.appliedTotal : null), r1(prj ? prj.appliedTotal : null),
              e.injuryStatus || p.injuryStatus || '']);
          }
        }
      }
      rawWeeks[sp] = { matchups: games.length, teamsCovered: seen.size + missing.length, missing };
      process.stdout.write(`  wk${sp}: ${games.length} games, ${seen.size + missing.length}/${teamInfo.size} teams${missing.length ? ' (fallback:' + missing.join(',') + ')' : ''}\n`);
    }

    // ---------- transactions ----------
    const byId = new Map();
    for (let sp = 0; sp <= finalSP + 1; sp++) {
      const j = await get(`${API}/seasons/${year}/segments/0/leagues/${LEAGUE}?view=mTeam&view=mTransactions2&scoringPeriodId=${sp}`);
      for (const t of ((j && j.transactions) || [])) byId.set(t.id, t);
    }
    const txns = [...byId.values()].sort((a, b) => a.proposedDate - b.proposedDate);
    console.log(`  transactions: ${txns.length} unique`);
    fs.writeFileSync(path.join(RAW, `transactions-${year}.json`), JSON.stringify(txns, null, 2));

    // player id -> name lookup built from every roster row we saw this year
    const pname = new Map(), ppos = new Map();
    for (const r of rosterRows) { if (r[0] === year) { pname.set(r[6], r[7]); ppos.set(r[6], r[8]); } }

    const typeCounts = {};
    for (const t of txns) {
      typeCounts[t.type] = (typeCounts[t.type] || 0) + 1;
      const mem = memberById.get(t.memberId);
      for (const it of (t.items || [])) {
        txnRows.push([year, t.scoringPeriodId, new Date(t.proposedDate).toISOString().replace('T', ' ').slice(0, 19),
          t.type, t.status || '', it.type, t.teamId, (teamInfo.get(t.teamId) || {}).manager || '',
          it.playerId, pname.get(it.playerId) || '', ppos.get(it.playerId) || '',
          it.fromTeamId, it.fromTeamId ? (teamInfo.get(it.fromTeamId) || {}).name || '' : 'FA/Waivers',
          it.toTeamId, it.toTeamId ? (teamInfo.get(it.toTeamId) || {}).name || '' : 'FA/Waivers',
          t.bidAmount || 0, t.id]);
      }
    }
    console.log(`  types: ${JSON.stringify(typeCounts)}`);

    // ---------- executed trades ----------
    // The authoritative record of a completed trade is a TRADE_ACCEPT with
    // status EXECUTED whose items move players between two real teams.
    const executed = txns.filter(t => t.type === 'TRADE_ACCEPT' && t.status === 'EXECUTED'
      && (t.items || []).some(it => it.fromTeamId && it.toTeamId));
    console.log(`  executed trades: ${executed.length}`);
    for (const t of executed) {
      const teams = [...new Set(t.items.flatMap(it => [it.fromTeamId, it.toTeamId]).filter(Boolean))];
      const label = teams.map(id => (teamInfo.get(id) || {}).manager || id).join(' <-> ');
      for (const it of (t.items || [])) {
        if (!it.fromTeamId || !it.toTeamId) continue;
        tradeRows.push([year, t.scoringPeriodId, new Date(t.proposedDate).toISOString().replace('T', ' ').slice(0, 19),
          t.id, label, it.playerId, pname.get(it.playerId) || '', ppos.get(it.playerId) || '',
          it.fromTeamId, (teamInfo.get(it.fromTeamId) || {}).name || '', (teamInfo.get(it.fromTeamId) || {}).manager || '',
          it.toTeamId, (teamInfo.get(it.toTeamId) || {}).name || '', (teamInfo.get(it.toTeamId) || {}).manager || '']);
      }
    }
    fs.writeFileSync(path.join(RAW, `weeks-${year}.json`), JSON.stringify(rawWeeks, null, 2));
  }

  console.log('\n=== writing CSVs ===');
  writeCsv(path.join(OUT, 'weekly-rosters-2022-2025.csv'),
    ['Year','Week','MatchupPeriod','TeamId','TeamName','Manager','PlayerId','Player','Position','NFLTeam','LineupSlot','Started','ActualPoints','ProjectedPoints','InjuryStatus'],
    rosterRows);
  writeCsv(path.join(OUT, 'weekly-matchups-2022-2025.csv'),
    ['Year','Week','MatchupPeriod','PlayoffTier','MatchupId','HomeTeamId','HomeTeam','HomeManager','HomeActual','HomeProjected','AwayTeamId','AwayTeam','AwayManager','AwayActual','AwayProjected','Winner','Margin'],
    matchupRows);
  writeCsv(path.join(OUT, 'trades-2022-2025.csv'),
    ['Year','Week','Date','TradeId','Trade','PlayerId','Player','Position','FromTeamId','FromTeam','FromManager','ToTeamId','ToTeam','ToManager'],
    tradeRows);
  writeCsv(path.join(OUT, 'transactions-2022-2025.csv'),
    ['Year','Week','Date','TxnType','Status','ItemType','ActingTeamId','ActingManager','PlayerId','Player','Position','FromTeamId','FromTeam','ToTeamId','ToTeam','BidAmount','TxnId'],
    txnRows);
  writeCsv(path.join(OUT, 'team-managers-2022-2025.csv'),
    ['Year','TeamId','TeamName','Abbrev','Manager'], managerRows);
  // do not close: this browser is the user's live session, attached over CDP
  process.exit(0);
  console.log('\nDONE');
})();
