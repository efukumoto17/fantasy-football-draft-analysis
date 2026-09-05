const { chromium } = require('playwright');
const fs = require('fs');

const ROOT = '/Users/evanfukumoto/Documents/VSCodeRepos/ridetrainingscheduling';
const YEARS = [2022, 2023, 2024, 2025];
const LEAGUE = 275797;
const posMap = {1:'QB',2:'RB',3:'WR',4:'TE',5:'K',16:'D/ST',
  9:'DT',10:'DE',11:'LB',12:'CB',13:'S',14:'DB',15:'DL'};
const teamMap = {0:'FA',1:'ATL',2:'BUF',3:'CHI',4:'CIN',5:'CLE',6:'DAL',7:'DEN',8:'DET',9:'GB',10:'TEN',11:'IND',12:'KC',13:'LV',14:'LAR',15:'MIA',16:'MIN',17:'NE',18:'NO',19:'NYG',20:'NYJ',21:'PHI',22:'ARI',23:'PIT',24:'LAC',25:'SF',26:'SEA',27:'TB',28:'WSH',29:'CAR',30:'JAX',33:'BAL',34:'HOU'};

const csvCell = (s) => {
  s = (s == null ? '' : String(s));
  return /[",\n]/.test(s) ? '"' + s.replace(/"/g,'""') + '"' : s;
};

(async () => {
  const browser = await chromium.connectOverCDP('http://127.0.0.1:9222');
  const page = browser.contexts()[0].pages()[0];

  const summary = [];
  const mappingRows = [['Year','Team Name','Manager','ESPN Display Name']];

  for (const year of YEARS) {
    const data = await page.evaluate(async ({ year, LEAGUE }) => {
      const H = { 'x-fantasy-platform':'espn-fantasy-web','x-fantasy-source':'kona','accept':'application/json' };
      const base = `https://lm-api-reads.fantasy.espn.com/apis/v3/games/ffl/seasons/${year}/segments/0/leagues/${LEAGUE}`;
      const lr = await fetch(`${base}?view=mDraftDetail&view=mTeam&view=mSettings`, { credentials:'include', headers:H });
      if (!lr.ok) return { error:`league ${lr.status}` };
      const j = await lr.json();
      const picks = (j.draftDetail && j.draftDetail.picks) || [];
      const teams = (j.teams||[]).map(t => ({ id:t.id, name:(t.name || ((t.location||'')+' '+(t.nickname||'')).trim()), abbrev:t.abbrev, owners:t.owners||[] }));
      const members = (j.members||[]).map(m => ({ id:m.id, displayName:m.displayName, first:m.firstName, last:m.lastName }));

      // fetch player info for drafted ids via X-Fantasy-Filter
      const ids = [...new Set(picks.map(p => p.playerId))];
      let players = [];
      if (ids.length) {
        const filter = { players: { filterIds: { value: ids }, limit: ids.length + 10 } };
        const pr = await fetch(`https://lm-api-reads.fantasy.espn.com/apis/v3/games/ffl/seasons/${year}/players?view=players_wl`,
          { credentials:'include', headers:{ ...H, 'x-fantasy-filter': JSON.stringify(filter) } });
        if (pr.ok) { const pj = await pr.json(); players = Array.isArray(pj) ? pj : (pj.players||[]); }
      }
      return { picks, teams, members, players };
    }, { year, LEAGUE });

    if (data.error) { summary.push(`${year}: ERROR ${data.error}`); continue; }

    const memberById = new Map(data.members.map(m => [m.id, m]));
    const managerName = (m) => {
      if (!m) return 'Unknown';
      const full = [m.first, m.last].filter(Boolean).join(' ').trim();
      return full || m.displayName || 'Unknown';
    };
    // team -> manager (primary owner; join co-owners)
    const teamById = new Map();
    for (const t of data.teams) {
      const names = (t.owners||[]).map(o => managerName(memberById.get(o))).filter(Boolean);
      const uniq = [...new Set(names)];
      teamById.set(t.id, { name:t.name, manager: uniq.join(' / ') || 'Unknown',
        display: (t.owners||[]).map(o => (memberById.get(o)||{}).displayName).filter(Boolean).join(' / ') });
    }

    const playerById = new Map();
    for (const p of data.players) {
      const pl = p.player || p;
      playerById.set(pl.id, { name: pl.fullName || [pl.firstName,pl.lastName].filter(Boolean).join(' '),
        team: teamMap[pl.proTeamId] != null ? teamMap[pl.proTeamId] : ('T'+pl.proTeamId),
        pos: posMap[pl.defaultPositionId] || ('P'+pl.defaultPositionId) });
    }

    const picks = data.picks.slice().sort((a,b) => a.overallPickNumber - b.overallPickNumber);
    const lines = ['Player,Team,Position,Drafting Owner'];
    let missing = 0;
    for (const pk of picks) {
      const pl = playerById.get(pk.playerId) || { name:'(unknown id '+pk.playerId+')', team:'', pos:'' };
      if (!playerById.get(pk.playerId)) missing++;
      const owner = (teamById.get(pk.teamId) || {}).manager || 'Unknown';
      lines.push([csvCell(pl.name), csvCell(pl.team), csvCell(pl.pos), csvCell(owner)].join(','));
    }
    const outPath = `${ROOT}/draft-history-${year}.csv`;
    fs.writeFileSync(outPath, lines.join('\n') + '\n');

    // mapping rows
    for (const t of data.teams) {
      const tb = teamById.get(t.id);
      mappingRows.push([year, tb.name, tb.manager, tb.display]);
    }
    summary.push(`${year}: ${picks.length} picks, ${data.teams.length} teams, ${missing} unresolved players -> draft-history-${year}.csv`);
  }

  fs.writeFileSync(`${ROOT}/draft-history-team-managers.csv`, mappingRows.map(r => r.map(csvCell).join(',')).join('\n') + '\n');
  console.log(summary.join('\n'));
  console.log('\nwrote draft-history-team-managers.csv');
  // do not close: this browser is the user's live session, attached over CDP
  process.exit(0);
})();
