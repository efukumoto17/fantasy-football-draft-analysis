const { chromium } = require('playwright');
const fs = require('fs');
const posMap={1:'QB',2:'RB',3:'WR',4:'TE',5:'K',16:'D/ST'};
(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9222');
  const req = b.contexts()[0].request;
  const H={'x-fantasy-platform':'espn-fantasy-web','x-fantasy-source':'kona',accept:'application/json'};
  const out={};
  for (const lid of [5197183, 1886395567]) {
    const filter={players:{filterStatus:{value:['FREEAGENT','WAIVERS']},limit:400,
      sortPercOwned:{sortPriority:1,sortAsc:false}}};
    const r=await req.get(`https://lm-api-reads.fantasy.espn.com/apis/v3/games/ffl/seasons/2026/segments/0/leagues/${lid}?view=kona_player_info`,
      {headers:{...H,'x-fantasy-filter':JSON.stringify(filter)},timeout:60000});
    if(r.status()!==200){console.log(lid,'HTTP',r.status());continue;}
    const j=await r.json();
    out[lid]=(j.players||[]).map(e=>({name:e.player.fullName,pos:posMap[e.player.defaultPositionId]||'?'}));
    console.log(`league ${lid}: ${out[lid].length} free agents`);
  }
  fs.writeFileSync('/private/tmp/claude-501/-Users-evanfukumoto-Documents-VSCodeRepos-fantasy-football/e1d95394-e3b1-4eac-9258-92554aeea5e4/scratchpad/fa.json', JSON.stringify(out));
  process.exit(0);
})();
