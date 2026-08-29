const fs=require('fs');
const ROOT='/Users/evanfukumoto/Documents/VSCodeRepos/ridetrainingscheduling';
// reuse the sim module pieces by requiring? simpler: re-load pool building via eval of relevant parts.
// Quick approach: reconstruct pool + bdge as in draft_sim, then inspect.
const posMap={1:'QB',2:'RB',3:'WR',4:'TE',5:'K',16:'D/ST'};
const teamMap={0:'FA',1:'ATL',2:'BUF',3:'CHI',4:'CIN',5:'CLE',6:'DAL',7:'DEN',8:'DET',9:'GB',10:'TEN',11:'IND',12:'KC',13:'LV',14:'LAR',15:'MIA',16:'MIN',17:'NE',18:'NO',19:'NYG',20:'NYJ',21:'PHI',22:'ARI',23:'PIT',24:'LAC',25:'SF',26:'SEA',27:'TB',28:'WSH',29:'CAR',30:'JAX',33:'BAL',34:'HOU'};
const inputs=JSON.parse(fs.readFileSync(`${ROOT}/.espn-automation/sim_inputs.json`,'utf8'));
const universe=JSON.parse(fs.readFileSync(`${ROOT}/.espn-automation/resp_egy_platformVersion_96e7cdc122a61e6c778b4087703c10d123d0565d.json`,'utf8')).players.map(e=>e.player);
const nameAlias={'kenneth gainwell':'kenny gainwell'};
const SUFFIX=new Set(['jr','sr','ii','iii','iv','v']);
const norm=s=>s.toLowerCase().replace(/[.'`]/g,'').replace(/-/g,' ').replace(/\s+/g,' ').trim();
const stripSuffix=n=>{const p=n.split(' ');while(p.length>1&&SUFFIX.has(p[p.length-1]))p.pop();return p.join(' ');};
const uni=universe.map(p=>({id:p.id,name:p.fullName||[p.firstName,p.lastName].filter(Boolean).join(' '),pos:posMap[p.defaultPositionId]||('P'+p.defaultPositionId),team:teamMap[p.proTeamId]||'FA',n:stripSuffix(norm((p.firstName||'')+' '+(p.lastName||'')))}));
const byName=new Map();for(const p of uni){if(!byName.has(p.n))byName.set(p.n,[]);byName.get(p.n).push(p);}
const teamAlias={JAC:'JAX',WAS:'WSH',LVR:'LV',OAK:'LV',SD:'LAC',STL:'LAR'};
const csv=fs.readFileSync(`${ROOT}/bdge-draft-rankings-ppr-2026.csv`,'utf8').trim().split(/\r?\n/).slice(1).map(l=>{const c=l.split(',');return{rank:+c[0],name:c[1],team:(teamAlias[c[2]]||c[2]),pos:c[3]};});
const bdgeRankById=new Map();const used=new Set();let matched=0;
for(const row of csv){let key=stripSuffix(norm(row.name));if(nameAlias[key])key=nameAlias[key];let cands=(byName.get(key)||[]).filter(p=>!used.has(p.id));if(cands.length>1){const bp=cands.filter(p=>p.pos===row.pos);if(bp.length)cands=bp;}if(cands.length>1){const bt=cands.filter(p=>p.team===row.team);if(bt.length)cands=bt;}if(cands.length>=1){used.add(cands[0].id);bdgeRankById.set(cands[0].id,row.rank);matched++;}}
console.log('BDGE matched:',matched,'/',csv.length);
const uniById=new Map(uni.map(p=>[p.id,p]));
const pool=new Map();
for(const p of inputs.players){const meta=uniById.get(p.id)||{name:p.name,pos:posMap[p.pos]||('P'+p.pos),team:teamMap[p.proTeam]||'FA'};pool.set(p.id,{id:p.id,name:meta.name,pos:meta.pos,team:meta.team,adp:(p.adp&&p.adp>0&&p.adp<400)?p.adp:(p.pprRank||260),bdge:bdgeRankById.get(p.id)||Infinity});}
for(const [id,rank] of bdgeRankById){if(!pool.has(id)){const m=uniById.get(id);if(m)pool.set(id,{id,name:m.name,pos:m.pos,team:m.team,adp:250+rank/5,bdge:rank});}}
const finite=[...pool.values()].filter(p=>isFinite(p.bdge));
console.log('pool size:',pool.size,' with finite bdge:',finite.length);
console.log('\nBDGE board top 30 (as seen by sim):');
finite.sort((a,b)=>a.bdge-b.bdge).slice(0,30).forEach(p=>console.log('  ',String(p.bdge).padStart(3),p.pos.padEnd(4),'adp',String(p.adp).padStart(5),p.name));
console.log('\nBDGE QBs and their ranks:');
finite.filter(p=>p.pos==='QB').sort((a,b)=>a.bdge-b.bdge).slice(0,12).forEach(p=>console.log('  bdge',String(p.bdge).padStart(3),'adp',String(p.adp).padStart(5),p.name));
