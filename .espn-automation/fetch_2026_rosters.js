// Pulls the current 2026 rosters for ESPN league 275797 (post-draft).
// Reuses your logged-in ESPN session via the CDP Chrome from launch.js.
// Writes data/rosters-2026.csv (committed) + .espn-automation/raw/rosters-2026.json (gitignored).
//
// Run on your Mac, from the repo dir:
//   node .espn-automation/launch.js            # if Chrome isn't already up; log into ESPN in the window
//   node .espn-automation/fetch_2026_rosters.js
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const RAW = path.join(ROOT, '.espn-automation', 'raw');
const OUT = path.join(ROOT, 'data');
const LEAGUE = 275797;
const YEAR = 2026;
const API = 'https://lm-api-reads.fantasy.espn.com/apis/v3/games/ffl';
const H = { 'x-fantasy-platform': 'espn-fantasy-web', 'x-fantasy-source': 'kona', accept: 'application/json' };

const POS = { 1: 'QB', 2: 'RB', 3: 'WR', 4: 'TE', 5: 'K', 16: 'D/ST' };
const SLOT = { 0: 'QB', 1: 'TQB', 2: 'RB', 3: 'RB/WR', 4: 'WR', 5: 'WR/TE', 6: 'TE', 7: 'OP', 8: 'DT', 9: 'DE', 10: 'LB',
  11: 'DL', 12: 'CB', 13: 'S', 14: 'DB', 15: 'DP', 16: 'D/ST', 17: 'K', 18: 'P', 19: 'HC', 20: 'BE', 21: 'IR', 23: 'FLEX', 24: 'ER' };

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

(async () => {
  let browser;
  try {
    browser = await chromium.connectOverCDP('http://127.0.0.1:9222');
  } catch (e) {
    console.error('Could not reach Chrome over CDP. Start it first:\n  node .espn-automation/launch.js');
    process.exit(1);
  }
  const req = browser.contexts()[0].request;

  const get = async (url) => {
    for (let attempt = 1; attempt <= 4; attempt++) {
      try {
        const r = await req.get(url, { headers: H, timeout: 60000 });
        if (r.status() === 200) return await r.json();
        if (r.status() === 401 || r.status() === 403) return null; // session dead
        if (r.status() === 404) return null;
        console.log(`    retry ${attempt} (status ${r.status()})`);
      } catch (e) {
        console.log(`    retry ${attempt} (${e.message.slice(0, 60)})`);
      }
      await new Promise(res => setTimeout(res, 800 * attempt));
    }
    throw new Error('failed after retries: ' + url);
  };

  console.log(`=== ${YEAR} rosters (league ${LEAGUE}) ===`);
  const meta = await get(`${API}/seasons/${YEAR}/segments/0/leagues/${LEAGUE}?view=mTeam&view=mRoster&view=mSettings`);
  if (!meta || !meta.teams || !meta.teams.length) {
    console.error('League not visible — the ESPN session in the Chrome window has expired.\nLog into ESPN in that window, then re-run this script.');
    process.exit(1);
  }

  const memberById = new Map((meta.members || []).map(m => [m.id, m]));
  const mgrName = (m) => m ? ([m.firstName, m.lastName].filter(Boolean).join(' ') || m.displayName) : 'Unknown';

  const proTeams = { 0: 'FA' };
  const pt = await get(`${API}/seasons/${YEAR}?view=proTeamSchedules_wl`);
  for (const t of (pt && pt.settings && pt.settings.proTeams) || []) {
    proTeams[t.id] = t.abbrev ? t.abbrev.toUpperCase() : '';
  }

  const rows = [];
  const teams = [...(meta.teams || [])].sort((a, b) => a.id - b.id);
  for (const t of teams) {
    const name = (t.name || `${t.location || ''} ${t.nickname || ''}`).trim();
    const manager = mgrName(memberById.get((t.owners || [])[0]));
    const abbrev = (t.abbrev || '').trim();
    const entries = (t.roster && t.roster.entries) || [];
    for (const e of entries) {
      const p = (e.playerPoolEntry && e.playerPoolEntry.player) || {};
      rows.push([YEAR, t.id, name, abbrev, manager, e.playerId, p.fullName || '',
        POS[p.defaultPositionId] || p.defaultPositionId,
        proTeams[p.proTeamId] !== undefined ? proTeams[p.proTeamId] : p.proTeamId,
        SLOT[e.lineupSlotId] !== undefined ? SLOT[e.lineupSlotId] : e.lineupSlotId,
        e.injuryStatus || p.injuryStatus || '']);
    }
    console.log(`  ${name} (${manager}): ${entries.length} players`);
  }

  fs.mkdirSync(RAW, { recursive: true });
  fs.mkdirSync(OUT, { recursive: true });
  fs.writeFileSync(path.join(RAW, `rosters-${YEAR}.json`), JSON.stringify(meta));
  console.log(`  wrote .espn-automation/raw/rosters-${YEAR}.json (raw API dump)`);
  writeCsv(path.join(OUT, `rosters-${YEAR}.csv`),
    ['year', 'teamId', 'teamName', 'abbrev', 'manager', 'playerId', 'playerName', 'pos', 'nflTeam', 'lineupSlot', 'injuryStatus'],
    rows);

  console.log(`done: ${rows.length} roster rows across ${teams.length} teams`);
  // do not close: this browser is the user's live session, attached over CDP
  process.exit(0);
})();
