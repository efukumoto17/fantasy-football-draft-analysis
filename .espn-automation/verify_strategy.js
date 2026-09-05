const { chromium } = require('playwright');
const fs = require('fs');
const posMap = {1:'QB',2:'RB',3:'WR',4:'TE',5:'K',16:'DST'};
(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9222');
  const req = b.contexts()[0].request;
  const H = {'x-fantasy-platform':'espn-fantasy-web','x-fantasy-source':'kona',accept:'application/json'};
  const j = await (await req.get('https://lm-api-reads.fantasy.espn.com/apis/v3/games/ffl/seasons/2026/segments/0/leagues/275797?view=mTeam',{headers:H})).json();
  const ds = j.teams.find(t=>t.id===4).draftStrategy;
  const uni = JSON.parse(fs.readFileSync(__dirname+'/resp_egy_platformVersion_96e7cdc122a61e6c778b4087703c10d123d0565d.json','utf8')).players;
  const name = new Map(uni.map(e=>[e.player.id, {n:((e.player.firstName||'')+' '+(e.player.lastName||'')).trim(), p:posMap[e.player.defaultPositionId]||'?'}]));
  console.log('SAVED  draftList:', ds.draftList.length, '| excluded:', ds.excludedPlayerIds.length,
              '| positionStrategy:', ds.positionStrategy.length, 'entries');
  console.log('\ntop 20 of the saved queue:');
  ds.draftList.slice(0,20).forEach((x,i)=>{ const m=name.get(x.playerId)||{n:'?',p:'?'};
    console.log(`  ${String(i+1).padStart(2)}. ${m.p.padEnd(3)} ${m.n}`); });
  console.log('\nexcluded (autodraft can never take these):');
  ds.excludedPlayerIds.forEach(id=>{ const m=name.get(id)||{n:'?',p:'?'}; console.log(`  ${m.p.padEnd(3)} ${m.n}`); });
  const firstQB = ds.draftList.findIndex(x=>(name.get(x.playerId)||{}).p==='QB');
  const firstTE = ds.draftList.findIndex(x=>(name.get(x.playerId)||{}).p==='TE');
  console.log(`\nfirst QB at slot ${firstQB+1} · first TE at slot ${firstTE+1}`);
  const c={}; ds.draftList.slice(0,60).forEach(x=>{const p=(name.get(x.playerId)||{}).p||'?';c[p]=(c[p]||0)+1;});
  console.log('positions in first 60:', JSON.stringify(c));
  // do not close: this browser is the user's live session, attached over CDP
  process.exit(0);
})();
