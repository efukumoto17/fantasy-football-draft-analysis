const { chromium } = require('playwright');
const fs = require('fs');
const posMap={1:'QB',2:'RB',3:'WR',4:'TE',5:'K',16:'D/ST'};
const SLOT={0:'QB',2:'RB',4:'WR',6:'TE',16:'D/ST',17:'K',23:'FLEX',20:'BE',21:'IR',7:'OP',18:'P',19:'HC'};
(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9222');
  const req = b.contexts()[0].request;
  const H={'x-fantasy-platform':'espn-fantasy-web','x-fantasy-source':'kona',accept:'application/json'};
  const out={};
  for (const lid of [5197183, 1886395567]) {
    const u=`https://lm-api-reads.fantasy.espn.com/apis/v3/games/ffl/seasons/2026/segments/0/leagues/${lid}?view=mTeam&view=mSettings&view=mRoster&view=mDraftDetail`;
    const r = await req.get(u,{headers:H,timeout:60000});
    if (r.status()!==200) { console.log(`league ${lid}: HTTP ${r.status()}`); continue; }
    const j = await r.json();
    const s=j.settings||{}, rs=s.rosterSettings||{}, sc=s.scoringSettings||{}, dr=s.draftSettings||{};
    const lineup=rs.lineupSlotCounts||{};
    const starters=Object.entries(lineup).filter(([k,v])=>v>0 && !['20','21','24'].includes(k))
      .map(([k,v])=>`${v}${SLOT[k]||k}`).join(' ');
    const rec = (sc.scoringItems||[]).find(i=>i.statId===53);
    const ppr = rec ? (rec.points||0) : 0;
    console.log(`\n=== ${s.name || '(league '+lid+')'} — id ${lid} ===`);
    console.log(`  teams: ${s.size} | starters: ${starters} | bench: ${lineup['20']||0} | PPR: ${ppr}`);
    console.log(`  draft: ${dr.type} | date ${dr.date? new Date(dr.date).toISOString().slice(0,16).replace('T',' '):'?'} | drafted: ${j.draftDetail && j.draftDetail.drafted}`);
    const mine=(j.teams||[]).filter(t=>(t.owners||[]).some(o=>o.includes('2E369BC9')));
    for (const t of mine) {
      const nm=(t.name||`${t.location||''} ${t.nickname||''}`).trim();
      console.log(`  MY TEAM: "${nm}" (id ${t.id})`);
      const entries=(t.roster&&t.roster.entries)||[];
      console.log(`  roster size: ${entries.length}`);
      out[lid]={league:s.name,size:s.size,starters,ppr,drafted:j.draftDetail&&j.draftDetail.drafted,
                team:nm, players:entries.map(e=>{const p=e.playerPoolEntry.player;
                  return {id:p.id,name:p.fullName,pos:posMap[p.defaultPositionId]||'?',slot:SLOT[e.lineupSlotId]||e.lineupSlotId};})};
    }
  }
  fs.writeFileSync('/private/tmp/claude-501/-Users-evanfukumoto-Documents-VSCodeRepos-fantasy-football/e1d95394-e3b1-4eac-9258-92554aeea5e4/scratchpad/other_leagues.json', JSON.stringify(out,null,2));
  process.exit(0);
})();
