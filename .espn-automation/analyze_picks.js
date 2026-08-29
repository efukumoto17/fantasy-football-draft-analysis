const fs=require('fs');
const ROOT='/Users/evanfukumoto/Documents/VSCodeRepos/ridetrainingscheduling';
const posMap={1:'QB',2:'RB',3:'WR',4:'TE',5:'K',16:'D/ST',9:'DT',10:'DE',11:'LB',12:'CB',13:'S',14:'DB',15:'DL'};
const IDP=new Set(['DT','DE','LB','CB','S','DB','DL']);
const norm=s=>s.toLowerCase().replace(/[.'`]/g,'').replace(/-/g,' ').replace(/ (jr|sr|ii|iii|iv|v)$/,'').replace(/\s+/g,' ').trim();

const pointsRaw=JSON.parse(fs.readFileSync(`${ROOT}/.espn-automation/season_points.json`,'utf8'));
// build per-year: name->{pts,pos}; and positional finish ranks
const byYear={};
for(const y of [2022,2023,2024,2025]){
  const arr=pointsRaw[y].map(p=>({...p,pos:posMap[p.posId]||('P'+p.posId)}));
  // positional finish
  const posGroups={};
  for(const p of arr){ (posGroups[p.pos]=posGroups[p.pos]||[]).push(p); }
  for(const pos in posGroups){ posGroups[pos].sort((a,b)=>b.pts-a.pts).forEach((p,i)=>p.posFinish=i+1); }
  const nameMap=new Map();
  for(const p of arr){ nameMap.set(norm(p.name), p); }
  byYear[y]={arr,nameMap};
}

// load picks
const L=fs.readFileSync(`${ROOT}/draft-history-combined.csv`,'utf8').trim().split('\n');L.shift();
const picks=L.map(l=>{const c=l.split(',');return{year:+c[0],round:+c[1],overall:+c[3],player:c[4].replace(/^"|"$/g,''),pos:c[6],mgr:c[7].replace(/^"|"$/g,'')};})
  .filter(p=>p.year>=2022);

// join points + positional draft rank (order taken at pos leaguewide that year)
const posDraftCount={};
picks.sort((a,b)=>a.year-b.year||a.overall-b.overall);
for(const p of picks){
  const key=p.year+'|'+p.pos; posDraftCount[key]=(posDraftCount[key]||0)+1; p.posDraftRank=posDraftCount[key];
  const m=byYear[p.year].nameMap.get(norm(p.player));
  p.pts=m?m.pts:null; p.posFinish=m?m.posFinish:null; p.matched=!!m;
}
const unmatched=picks.filter(p=>!p.matched);
console.log('total picks:',picks.length,' matched:',picks.filter(p=>p.matched).length,' unmatched:',unmatched.length);
if(unmatched.length) console.log('unmatched sample:', unmatched.slice(0,15).map(p=>p.year+' '+p.player+'('+p.pos+')').join(', '));

// ---- league expected points per round (avg of all matched picks in round) ----
const roundAvg={};
for(let r=1;r<=18;r++){ const ps=picks.filter(p=>p.round===r&&p.pts!=null); roundAvg[r]=ps.length?ps.reduce((a,b)=>a+b.pts,0)/ps.length:null; }

// ---- Evan ----
const evan=picks.filter(p=>p.mgr==='Evan Fukumoto');
console.log('\n===== EVAN: points per round vs league avg =====');
console.log('Rnd | Evan avg | Lg avg | diff | picks(yr:player pts posFin)');
for(let r=1;r<=18;r++){
  const ep=evan.filter(p=>p.round===r&&p.pts!=null); if(!ep.length) continue;
  const ea=ep.reduce((a,b)=>a+b.pts,0)/ep.length; const la=roundAvg[r];
  const detail=ep.map(p=>`${String(p.year).slice(2)}:${p.player.split(' ').slice(-1)[0]} ${p.pts}(${p.pos}${p.posFinish})`).join(', ');
  console.log(`${String(r).padStart(3)} | ${ea.toFixed(1).padStart(7)} | ${la.toFixed(1).padStart(6)} | ${(ea-la>=0?'+':'')+(ea-la).toFixed(1)} | ${detail}`);
}

// ---- biggest busts & steals (by positional finish vs positional draft rank), skill positions ----
const skill=new Set(['QB','RB','WR','TE']);
const withDelta=evan.filter(p=>p.matched&&skill.has(p.pos)).map(p=>({...p, delta:p.posFinish-p.posDraftRank}));
console.log('\n===== BIGGEST BUSTS (finished far below where drafted at position) =====');
console.log('year Rnd  player            pos  drafted-as  finished  pts');
withDelta.filter(p=>p.round<=8).sort((a,b)=>b.delta-a.delta).slice(0,12).forEach(p=>
  console.log(`${p.year} R${String(p.round).padStart(2)}  ${p.player.padEnd(20)} ${p.pos.padEnd(3)}  ${(p.pos+p.posDraftRank).padEnd(6)}     ${(p.pos+p.posFinish).padEnd(6)}  ${p.pts}`));
console.log('\n===== BEST VALUE PICKS (finished far above draft slot) =====');
withDelta.sort((a,b)=>a.delta-b.delta).slice(0,10).forEach(p=>
  console.log(`${p.year} R${String(p.round).padStart(2)}  ${p.player.padEnd(20)} ${p.pos.padEnd(3)}  ${(p.pos+p.posDraftRank).padEnd(6)}     ${(p.pos+p.posFinish).padEnd(6)}  ${p.pts}`));

// ---- by position: Evan avg positional finish of his early picks ----
console.log('\n===== EVAN early-round (R1-6) value by position =====');
for(const pos of ['QB','RB','WR','TE']){
  const ps=evan.filter(p=>p.pos===pos&&p.round<=6&&p.matched);
  if(!ps.length) continue;
  const avgDelta=ps.reduce((a,b)=>a+(b.posFinish-b.posDraftRank),0)/ps.length;
  const avgPts=ps.reduce((a,b)=>a+b.pts,0)/ps.length;
  console.log(`${pos}: ${ps.length} picks, avg pts ${avgPts.toFixed(1)}, avg (finish - draftRank) ${(avgDelta>=0?'+':'')+avgDelta.toFixed(1)} ${avgDelta>3?' <-- underperforms':avgDelta<-3?' <-- overperforms':''}`);
}

// save evan picks with pts
fs.writeFileSync(`${ROOT}/.espn-automation/evan_picks_pts.json`, JSON.stringify(evan,null,2));
