const fs=require('fs');
const ROOT='/Users/evanfukumoto/Documents/VSCodeRepos/ridetrainingscheduling';
const posMap={1:'QB',2:'RB',3:'WR',4:'TE',5:'K',16:'D/ST',9:'DT',10:'DE',11:'LB',12:'CB',13:'S',14:'DB',15:'DL'};
const skill=new Set(['QB','RB','WR','TE']);
const norm=s=>s.toLowerCase().replace(/[.'`]/g,'').replace(/-/g,' ').replace(/ (jr|sr|ii|iii|iv|v)$/,'').replace(/\s+/g,' ').trim();
const pr=JSON.parse(fs.readFileSync(`${ROOT}/.espn-automation/season_points.json`,'utf8'));
const yr={};
for(const y of [2022,2023,2024,2025]){
  const arr=pr[y].map(p=>({...p,pos:posMap[p.posId]||('P'+p.posId)}));
  const g={};for(const p of arr){(g[p.pos]=g[p.pos]||[]).push(p);}
  for(const pos in g){g[pos].sort((a,b)=>b.pts-a.pts).forEach((p,i)=>p.posFinish=i+1);}
  const m=new Map();for(const p of arr){const k=norm(p.name);if(!m.has(k))m.set(k,[]);m.get(k).push(p);}
  yr[y]={map:m};
}
const lookup=(y,name,pos)=>{const l=yr[y].map.get(norm(name));if(!l)return null;return l.find(e=>e.pos===pos)||(l.length===1?l[0]:null);};
const L=fs.readFileSync(`${ROOT}/draft-history-combined.csv`,'utf8').trim().split('\n');L.shift();
const picks=L.map(l=>{const c=l.split(',');return{year:+c[0],round:+c[1],overall:+c[3],player:c[4].replace(/^"|"$/g,''),pos:c[6],mgr:c[7].replace(/^"|"$/g,'')};}).filter(p=>p.year>=2022);
picks.sort((a,b)=>a.year-b.year||a.overall-b.overall);
const pd={};
for(const p of picks){const k=p.year+'|'+p.pos;pd[k]=(pd[k]||0)+1;p.posDraftRank=pd[k];const m=lookup(p.year,p.player,p.pos);p.pts=m?m.pts:0;p.posFinish=m?m.posFinish:null;p.delta=p.posFinish!=null?p.posFinish-p.posDraftRank:null;}
const rAvg={};for(let r=1;r<=18;r++){const ps=picks.filter(p=>p.round===r);rAvg[r]=ps.length?ps.reduce((a,b)=>a+b.pts,0)/ps.length:0;}
const val=ps=>Math.round(ps.reduce((a,b)=>a+(b.pts-rAvg[b.round]),0));
const last=n=>n.split(' ').filter(w=>!/^(jr|sr|ii|iii|iv|v)$/i.test(w)).slice(-1)[0];
const mgrs=[...new Set(picks.map(p=>p.mgr))];
const ranked=mgrs.map(m=>({m,total:val(picks.filter(p=>p.mgr===m))})).sort((a,b)=>b.total-a.total);

for(const {m,total} of ranked){
  const mp=picks.filter(p=>p.mgr===m);
  const E=val(mp.filter(p=>p.round<=2)),R3=val(mp.filter(p=>p.round===3)),MID=val(mp.filter(p=>p.round>=4&&p.round<=9)),LATE=val(mp.filter(p=>p.round>=10));
  console.log(`\n########## ${m}  (total ${total} | early ${E}, R3 ${R3}, mid ${MID}, late ${LATE}) ##########`);
  // round table
  const rd=[];
  for(let r=1;r<=18;r++){const ps=mp.filter(p=>p.round===r);if(!ps.length)continue;const a=ps.reduce((x,y)=>x+y.pts,0)/ps.length;const d=a-rAvg[r];
    const det=ps.map(p=>`${String(p.year).slice(2)}:${last(p.player)} ${p.pts}${p.posFinish!=null?`(${p.pos}${p.posFinish})`:''}`).join(', ');
    rd.push(`  R${String(r).padStart(2)} ${a.toFixed(0).padStart(3)} vs ${rAvg[r].toFixed(0).padStart(3)}  ${(d>=0?'+':'')+d.toFixed(0)}  | ${det}`);}
  console.log('ROUND | you vs lg  diff | picks'); console.log(rd.join('\n'));
  // positional R1-6
  console.log('POS R1-6 (finish-draftRank; + = underperform):');
  for(const pos of ['QB','RB','WR','TE']){const ps=mp.filter(p=>p.pos===pos&&p.round<=6&&p.delta!=null);if(!ps.length)continue;
    const ad=ps.reduce((a,b)=>a+b.delta,0)/ps.length;const ap=ps.reduce((a,b)=>a+b.pts,0)/ps.length;
    console.log(`  ${pos}: ${ps.length} picks, avgPts ${ap.toFixed(0)}, avgDelta ${(ad>=0?'+':'')+ad.toFixed(1)}`);}
  const sk=mp.filter(p=>skill.has(p.pos)&&p.delta!=null);
  console.log('BUSTS(R<=8): '+sk.filter(p=>p.round<=8).sort((a,b)=>b.delta-a.delta).slice(0,5).map(p=>`${p.player} '${String(p.year).slice(2)} R${p.round} ${p.pos}${p.posDraftRank}->${p.pos}${p.posFinish} (${p.pts})`).join('  |  '));
  console.log('STEALS: '+sk.sort((a,b)=>a.delta-b.delta).slice(0,5).map(p=>`${p.player} '${String(p.year).slice(2)} R${p.round} ${p.pos}${p.posDraftRank}->${p.pos}${p.posFinish} (${p.pts})`).join('  |  '));
}
