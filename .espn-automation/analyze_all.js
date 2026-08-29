const fs=require('fs');
const ROOT='/Users/evanfukumoto/Documents/VSCodeRepos/ridetrainingscheduling';
const posMap={1:'QB',2:'RB',3:'WR',4:'TE',5:'K',16:'D/ST',9:'DT',10:'DE',11:'LB',12:'CB',13:'S',14:'DB',15:'DL'};
const skill=new Set(['QB','RB','WR','TE']);
const norm=s=>s.toLowerCase().replace(/[.'`]/g,'').replace(/-/g,' ').replace(/ (jr|sr|ii|iii|iv|v)$/,'').replace(/\s+/g,' ').trim();

const pr=JSON.parse(fs.readFileSync(`${ROOT}/.espn-automation/season_points.json`,'utf8'));
const yr={};
for(const y of [2022,2023,2024,2025]){
  const arr=pr[y].map(p=>({...p,pos:posMap[p.posId]||('P'+p.posId)}));
  const g={}; for(const p of arr){(g[p.pos]=g[p.pos]||[]).push(p);}
  for(const pos in g){ g[pos].sort((a,b)=>b.pts-a.pts).forEach((p,i)=>p.posFinish=i+1); }
  // key by name -> list of entries (to resolve same-name collisions by position)
  const m=new Map(); for(const p of arr){ const k=norm(p.name); if(!m.has(k))m.set(k,[]); m.get(k).push(p); }
  yr[y]={map:m};
}
function lookup(y, name, pos){
  const list=yr[y].map.get(norm(name)); if(!list) return null;
  return list.find(e=>e.pos===pos) || (list.length===1?list[0]:null);
}
const L=fs.readFileSync(`${ROOT}/draft-history-combined.csv`,'utf8').trim().split('\n');L.shift();
const picks=L.map(l=>{const c=l.split(',');return{year:+c[0],round:+c[1],overall:+c[3],player:c[4].replace(/^"|"$/g,''),pos:c[6],mgr:c[7].replace(/^"|"$/g,'')};}).filter(p=>p.year>=2022);
picks.sort((a,b)=>a.year-b.year||a.overall-b.overall);
const posDraft={};
for(const p of picks){
  const k=p.year+'|'+p.pos; posDraft[k]=(posDraft[k]||0)+1; p.posDraftRank=posDraft[k];
  const m=lookup(p.year,p.player,p.pos); p.pts=m?m.pts:0; p.posFinish=m?m.posFinish:null; p.delta=(p.posFinish!=null)?p.posFinish-p.posDraftRank:null; p.matched=!!m;
}
const rAvg={}; for(let r=1;r<=18;r++){const ps=picks.filter(p=>p.round===r); rAvg[r]=ps.length?ps.reduce((a,b)=>a+b.pts,0)/ps.length:0;}

const mgrs=[...new Set(picks.map(p=>p.mgr))].sort();
const val=(ps)=>Math.round(ps.reduce((a,b)=>a+(b.pts-rAvg[b.round]),0));
const rows=mgrs.map(m=>{
  const mp=picks.filter(p=>p.mgr===m);
  return { m,
    early:val(mp.filter(p=>p.round<=2)),
    r3:val(mp.filter(p=>p.round===3)),
    mid:val(mp.filter(p=>p.round>=4&&p.round<=9)),
    late:val(mp.filter(p=>p.round>=10)),
    total:val(mp),
    mp };
});
rows.sort((a,b)=>b.total-a.total);

console.log('MANAGER DRAFT VALUE vs league-avg-per-round (total pts over/under), 2022-25');
console.log('rank  manager            total | R1-2  R3   R4-9  R10-18');
rows.forEach((r,i)=>console.log(`${String(i+1).padStart(2)}. ${r.m.padEnd(20)} ${String(r.total).padStart(5)} | ${String(r.early).padStart(4)} ${String(r.r3).padStart(4)} ${String(r.mid).padStart(4)} ${String(r.late).padStart(5)}`));

// per manager busts/steals
console.log('\n===== PER-MANAGER busts & steals (skill pos) =====');
for(const r of rows){
  const sk=r.mp.filter(p=>skill.has(p.pos)&&p.delta!=null);
  const busts=sk.filter(p=>p.round<=8).sort((a,b)=>b.delta-a.delta).slice(0,3)
    .map(p=>`${p.player}(${p.year} R${p.round}: ${p.pos}${p.posDraftRank}→${p.pos}${p.posFinish})`);
  const steals=sk.sort((a,b)=>a.delta-b.delta).slice(0,3)
    .map(p=>`${p.player}(${p.year} R${p.round}: ${p.pos}${p.posDraftRank}→${p.pos}${p.posFinish})`);
  console.log(`\n-- ${r.m} --`);
  console.log('  BUSTS : '+busts.join('  |  '));
  console.log('  STEALS: '+steals.join('  |  '));
}
fs.writeFileSync(`${ROOT}/.espn-automation/all_mgr_value.json`, JSON.stringify(rows.map(({mp,...r})=>r),null,2));
