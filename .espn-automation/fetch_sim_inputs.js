const { chromium } = require('playwright');
const fs = require('fs');
const ROOT = '/Users/evanfukumoto/Documents/VSCodeRepos/ridetrainingscheduling';

(async () => {
  const browser = await chromium.connectOverCDP('http://127.0.0.1:9222');
  const page = browser.contexts()[0].pages()[0];

  const data = await page.evaluate(async () => {
    const H = { 'x-fantasy-platform':'espn-fantasy-web','x-fantasy-source':'kona','accept':'application/json' };
    const base = 'https://lm-api-reads.fantasy.espn.com/apis/v3/games/ffl/seasons/2026/segments/0/leagues/275797';

    // teams + members + draft order
    const lr = await fetch(`${base}?view=mTeam&view=mSettings`, { credentials:'include', headers:H });
    const j = await lr.json();
    const teams = (j.teams||[]).map(t => ({ id:t.id, name:t.name, owners:t.owners||[] }));
    const members = (j.members||[]).map(m => ({ id:m.id, first:m.firstName, last:m.lastName, display:m.displayName }));
    const pickOrder = j.settings.draftSettings.pickOrder;

    // ADP board: pull 300 players with ADP
    const filter = { players: { limit: 300, sortPercOwned: { sortPriority: 1, sortAsc: false } } };
    const pr = await fetch(`${base}?view=kona_player_info`, { credentials:'include', headers:{ ...H, 'x-fantasy-filter': JSON.stringify(filter) } });
    const pj = await pr.json();
    const players = (pj.players||[]).map(e => {
      const p = e.player;
      return { id:p.id, name:p.fullName, pos:p.defaultPositionId, proTeam:p.proTeamId,
        adp: p.ownership ? p.ownership.averageDraftPosition : null,
        pprRank: p.draftRanksByRankType && p.draftRanksByRankType.PPR ? p.draftRanksByRankType.PPR.rank : null };
    });
    return { teams, members, pickOrder, players };
  });

  fs.writeFileSync(`${ROOT}/.espn-automation/sim_inputs.json`, JSON.stringify(data, null, 2));

  // Map managers -> slot
  const memberById = new Map(data.members.map(m=>[m.id,m]));
  const mgr = (t)=>{ const o=t.owners[0]; const m=memberById.get(o); return m?[m.first,m.last].filter(Boolean).join(' '):'Unknown'; };
  const teamById = new Map(data.teams.map(t=>[t.id,t]));
  console.log('DRAFT ORDER (slot -> teamId -> manager):');
  data.pickOrder.forEach((tid,i)=>{ const t=teamById.get(tid); console.log(`  slot ${i+1}: team ${tid} = ${t?mgr(t):'??'} (${t?t.name:'?'})`); });
  console.log('\nplayers pulled:', data.players.length, ' with ADP:', data.players.filter(p=>p.adp&&p.adp>0&&p.adp<300).length);
  // do not close: this browser is the user's live session, attached over CDP
  process.exit(0);
})();
