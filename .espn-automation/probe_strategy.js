const { chromium } = require('playwright');
const fs = require('fs');
(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9222');
  const ctx = b.contexts()[0];
  const req = ctx.request;
  const H = {'x-fantasy-platform':'espn-fantasy-web','x-fantasy-source':'kona',accept:'application/json'};
  const R='https://lm-api-reads.fantasy.espn.com/apis/v3/games/ffl/seasons/2026/segments/0/leagues/275797';
  const r = await req.get(`${R}?view=mTeam&view=mDraftDetail&view=mSettings`, {headers:H});
  const j = await r.json();
  const team = (j.teams||[]).find(t=>t.id===4);
  console.log('team:', team && team.name, '| abbrev:', team && team.abbrev);
  const ds = team && team.draftStrategy;
  console.log('\ndraftStrategy keys:', ds ? Object.keys(ds) : 'NONE');
  if (ds) {
    for (const [k,v] of Object.entries(ds))
      console.log(`  ${k}:`, Array.isArray(v) ? `${v.length} items` : JSON.stringify(v).slice(0,120));
    if (ds.draftList) console.log('  current top 8 ids:', ds.draftList.slice(0,8).map(x=>x.playerId||x));
  }
  // full team object keys, in case strategy lives elsewhere
  console.log('\nteam object keys:', Object.keys(team||{}).join(', '));
  const ss = j.settings && j.settings.draftSettings;
  console.log('\ndraftSettings keys:', ss ? Object.keys(ss).join(', ') : 'none');
  if (ss) console.log('  type:', ss.type, '| date:', ss.date ? new Date(ss.date).toISOString() : '?', '| timePerSelection:', ss.timePerSelection);
  fs.writeFileSync('/private/tmp/claude-501/-Users-evanfukumoto-Documents-VSCodeRepos-fantasy-football/e1d95394-e3b1-4eac-9258-92554aeea5e4/scratchpad/team_strategy.json', JSON.stringify({team, draftSettings:ss}, null, 2));
  // do not close: this browser is the user's live session, attached over CDP
  process.exit(0);
})();
