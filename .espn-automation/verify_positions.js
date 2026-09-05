const { chromium } = require('playwright');
const POS={1:'QB',2:'RB',3:'WR',4:'TE',5:'K',16:'DST'};
(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9222');
  const req = b.contexts()[0].request;
  const H={'x-fantasy-platform':'espn-fantasy-web','x-fantasy-source':'kona',accept:'application/json'};
  const j = await (await req.get('https://lm-api-reads.fantasy.espn.com/apis/v3/games/ffl/seasons/2026/segments/0/leagues/275797?view=mTeam',{headers:H})).json();
  const ds = j.teams.find(t=>t.id===4).draftStrategy;
  let mins=0;
  for (const e of ds.positionStrategy.slice().sort((a,b)=>a.positionId-b.positionId)) {
    mins+=e.minimum;
    console.log(`  ${POS[e.positionId].padEnd(4)} min ${e.minimum}  max ${e.maximum===-1?'none':e.maximum}`);
  }
  console.log(`\n  forced by minimums: ${mins} of 16 -> ${16-mins} free pick(s)`);
  console.log(`  draftList ${ds.draftList.length} · excluded ${ds.excludedPlayerIds.length}`);
  // do not close: this browser is the user's live session, attached over CDP
  process.exit(0);
})();
