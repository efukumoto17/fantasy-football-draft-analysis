const fs = require('fs');
const ROOT = '/Users/evanfukumoto/Documents/VSCodeRepos/fantasy-football';

// Seeded RNG: comparing two boards needs identical noise, otherwise the
// difference between runs is partly just randomness.
const SEED = +(process.env.SEED || 12345);
let _s = SEED >>> 0;
function rnd(){ _s |= 0; _s = (_s + 0x6D2B79F5) | 0;
  let t = Math.imul(_s ^ (_s >>> 15), 1 | _s);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }

const posMap = {1:'QB',2:'RB',3:'WR',4:'TE',5:'K',16:'D/ST'};
const teamMap = {0:'FA',1:'ATL',2:'BUF',3:'CHI',4:'CIN',5:'CLE',6:'DAL',7:'DEN',8:'DET',9:'GB',10:'TEN',11:'IND',12:'KC',13:'LV',14:'LAR',15:'MIA',16:'MIN',17:'NE',18:'NO',19:'NYG',20:'NYJ',21:'PHI',22:'ARI',23:'PIT',24:'LAC',25:'SF',26:'SEA',27:'TB',28:'WSH',29:'CAR',30:'JAX',33:'BAL',34:'HOU'};

// ---------- inputs ----------
const inputs = JSON.parse(fs.readFileSync(`${ROOT}/.espn-automation/sim_inputs.json`,'utf8'));
const universe = JSON.parse(fs.readFileSync(`${ROOT}/.espn-automation/resp_egy_platformVersion_96e7cdc122a61e6c778b4087703c10d123d0565d.json`,'utf8')).players.map(e=>e.player);

// ---------- BDGE board matching (reuse logic) ----------
const nameAlias = { 'kenneth gainwell':'kenny gainwell' };
const SUFFIX = new Set(['jr','sr','ii','iii','iv','v']);
const norm = s => s.toLowerCase().replace(/[.'`]/g,'').replace(/-/g,' ').replace(/\s+/g,' ').trim();
const stripSuffix = n => { const p=n.split(' '); while(p.length>1&&SUFFIX.has(p[p.length-1]))p.pop(); return p.join(' '); };
const uni = universe.map(p=>({ id:p.id, name:p.fullName||[p.firstName,p.lastName].filter(Boolean).join(' '),
  pos: posMap[p.defaultPositionId]||('P'+p.defaultPositionId), team: teamMap[p.proTeamId]||'FA',
  n: stripSuffix(norm((p.firstName||'')+' '+(p.lastName||''))) }));
const byName = new Map(); for(const p of uni){ if(!byName.has(p.n))byName.set(p.n,[]); byName.get(p.n).push(p); }
const teamAlias={JAC:'JAX',WAS:'WSH',LVR:'LV',OAK:'LV',SD:'LAC',STL:'LAR'};
const BOARD = process.env.BOARD || 'bdge-draft-rankings-ppr-2026.csv';
const csv = fs.readFileSync(`${ROOT}/${BOARD}`,'utf8').trim().split(/\r?\n/).slice(1)
  .map(l=>{const c=l.split(','); return { rank:+c[0], name:c[1], team:(teamAlias[c[2]]||c[2]), pos:c[3] };});
const bdgeRankById = new Map(); const used=new Set();
for(const row of csv){
  let key=stripSuffix(norm(row.name)); if(nameAlias[key])key=nameAlias[key];
  let cands=(byName.get(key)||[]).filter(p=>!used.has(p.id));
  if(cands.length>1){const bp=cands.filter(p=>p.pos===row.pos); if(bp.length)cands=bp;}
  if(cands.length>1){const bt=cands.filter(p=>p.team===row.team); if(bt.length)cands=bt;}
  if(cands.length>=1){ used.add(cands[0].id); bdgeRankById.set(cands[0].id, row.rank); }
}

// ---------- draft pool ----------
const uniById = new Map(uni.map(p=>[p.id,p]));
const pool = new Map();
for(const p of inputs.players){
  const meta = uniById.get(p.id) || { name:p.name, pos:posMap[p.pos]||('P'+p.pos), team:teamMap[p.proTeam]||'FA' };
  pool.set(p.id, { id:p.id, name:meta.name, pos:meta.pos, team:meta.team,
    adp: (p.adp&&p.adp>0&&p.adp<400)?p.adp:(p.pprRank||260), bdge: bdgeRankById.get(p.id)||Infinity });
}
// ensure all BDGE players present
for(const [id,rank] of bdgeRankById){ if(!pool.has(id)){ const m=uniById.get(id); if(m) pool.set(id,{ id, name:m.name, pos:m.pos, team:m.team, adp:250+rank/5, bdge:rank }); } }

// ---------- QB scarcity: empirical target pick for k-th QB (2QB league, from 2024-25) ----------
// cumulative QBs drafted by end of round r (standard-era avg): [pick, cumQB]
const cum = [[0,0],[10,2],[20,3.5],[30,5.5],[40,7],[50,8.5],[60,12],[70,16],[80,17],[90,19.5],[100,22],[110,25],[120,25.5],[160,29]];
function qbTargetPick(k){ // k-th QB (1-indexed)
  for(let i=1;i<cum.length;i++){ if(cum[i][1]>=k){ const [p0,c0]=cum[i-1],[p1,c1]=cum[i]; return Math.round(p0+(p1-p0)*(k-c0)/(c1-c0)); } }
  return 160;
}
// order QBs by ADP, assign target pick as their effective ADP
const qbs = [...pool.values()].filter(p=>p.pos==='QB').sort((a,b)=>a.adp-b.adp);
qbs.forEach((q,i)=>{ q.qbTarget = qbTargetPick(i+1); });

// ---------- managers / order ----------
const memberById=new Map(inputs.members.map(m=>[m.id,m]));
const mgrName=t=>{const m=memberById.get(t.owners[0]); return m?[m.first,m.last].filter(Boolean).join(' '):'Unknown';};
const teamById=new Map(inputs.teams.map(t=>[t.id,t]));
const slotMgr = inputs.pickOrder.map(tid=>mgrName(teamById.get(tid)));  // slot i -> manager name
const EVAN_SLOT = slotMgr.findIndex(n=>n==='Evan Fukumoto'); // 0-indexed
const N=10, ROUNDS=16;
// build full pick sequence of slot indices (snake)
const seq=[];
for(let r=0;r<ROUNDS;r++){ const order=[...Array(N).keys()]; if(r%2===1)order.reverse(); for(const s of order) seq.push(s); }

// manager QB aggression multiplier (lower = earlier QB)
const qbAggr = { 'Rollin Odama-Wong':0.6, 'Darwin Hu':0.72, 'Christopher Pascual':0.85, 'Ikaika Stone':0.9 };
// early-round positional lean nudges (subtracted from effADP in rounds<=5)
const lean = {
  'Justin Ho': {RB:-6}, 'Chase Mizoguchi': {WR:-6}, 'Jeffrey Chan': {WR:-5}, 'Ikaika Stone': {WR:-7},
  'Prashanth Balaraman': {WR:-4}, 'Harvey Wang': {TE:+30}, 'Evan Fukumoto': {}
};

const CAP={QB:3,RB:6,WR:7,TE:2,K:1,'D/ST':1};
const STARTERS={QB:2,RB:2,WR:2,TE:1,K:1,'D/ST':1}; // +1 FLEX(RB/WR/TE)
function rosterOf(){ return {QB:[],RB:[],WR:[],TE:[],K:[],'D/ST':[]}; }
function count(r,pos){ return r[pos].length; }
function totalPicks(r){ return Object.values(r).reduce((a,b)=>a+b.length,0); }
function needMandatory(r, roundsLeft){
  // positions still missing required starters/slots we must secure
  const miss=[];
  for(const pos of ['QB','TE','K','D/ST','RB','WR']){ if(count(r,pos)<STARTERS[pos]) miss.push(pos); }
  return miss;
}
function allowed(r, pos, roundNum){
  if(count(r,pos)>=CAP[pos]) return false;
  if((pos==='K'||pos==='D/ST') && roundNum < ROUNDS-2) return false; // only last 3 rounds
  return true;
}

function pickOpponent(mgr, r, avail, roundNum, pickNum){
  const rl = ROUNDS - roundNum + 1;
  const slotsLeft = rl; // picks remaining incl current
  const mand = needMandatory(r, rl).filter(pos=> (pos!=='K'&&pos!=='D/ST')||roundNum>=ROUNDS-2 );
  // force-fill if remaining picks == number of mandatory holes
  const mustFill = mand.length >= slotsLeft;
  let best=null, bestVal=Infinity;
  for(const p of avail){
    if(!allowed(r,p.pos,roundNum)) continue;
    if(mustFill && !mand.includes(p.pos)) continue;
    let eff = p.pos==='QB' ? Math.min(p.adp, p.qbTarget*(qbAggr[mgr]||1)) : p.adp;
    if(roundNum<=5 && lean[mgr] && lean[mgr][p.pos]) eff += lean[mgr][p.pos];
    // small need bonus to fill starters
    if(count(r,p.pos)<STARTERS[p.pos]) eff -= 3;
    eff += (rnd()-0.5)*8; // ADP noise
    if(eff<bestVal){bestVal=eff;best=p;}
  }
  if(!best){ // fallback: any allowed
    for(const p of avail){ if(count(r,p.pos)<CAP[p.pos]){best=p;break;} }
  }
  return best;
}
// Board-driven but roster-aware: follow BDGE best-available, but don't hoard a
// position past sensible needs (esp. a 3rd QB) while starters are open.
function evanEligible(r, pos, roundNum, p, mode){
  const c=count(r,pos);
  if(pos==='QB'){
    if(mode==='waitQB'){
      // only grab a QB early if an elite one (BDGE<=9, i.e., Allen/Lamar) slides; else wait to R5+
      if(c>=2 && roundNum<10) return false;
      if(c>=3) return false;
      if(roundNum<5 && !(p && p.bdge<=9)) return false;
      return true;
    }
    return c<2 || (roundNum>=10 && c<3);
  }
  if(pos==='TE') return c<1 || (roundNum>=11 && c<2);
  if(pos==='RB') return c<CAP.RB;
  if(pos==='WR') return c<CAP.WR;
  if(pos==='K')  return roundNum>=ROUNDS-1 && c<1;
  if(pos==='D/ST') return roundNum>=ROUNDS-1 && c<1;
  return false;
}
function pickEvan(r, avail, roundNum, mode){
  const rl=ROUNDS-roundNum+1;
  const mand=needMandatory(r,rl).filter(pos=>(pos!=='K'&&pos!=='D/ST')||roundNum>=ROUNDS-2);
  const mustFill = mand.length>=rl;
  let best=null,bestRank=Infinity, bestAdp=Infinity;
  for(const p of avail){
    if(count(r,p.pos)>=CAP[p.pos]) continue;
    if(!evanEligible(r,p.pos,roundNum,p,mode)) continue;
    if(mustFill && !mand.includes(p.pos)) continue;
    const rank=p.bdge;
    if(rank<bestRank || (rank===bestRank && p.adp<bestAdp)){ bestRank=rank; bestAdp=p.adp; best=p; }
  }
  if(!best){ for(const p of avail.slice().sort((a,b)=>a.adp-b.adp)){ if(count(r,p.pos)<CAP[p.pos] && ((p.pos!=='K'&&p.pos!=='D/ST')||roundNum>=ROUNDS-2)){best=p;break;} } }
  return best;
}

function runDraft(mode){
  const rosters = Array.from({length:N},()=>rosterOf());
  const drafted=new Set();
  let avail=[...pool.values()];
  for(let i=0;i<seq.length;i++){
    const slot=seq[i]; const roundNum=Math.floor(i/N)+1; const mgr=slotMgr[slot];
    avail = avail.filter(p=>!drafted.has(p.id));
    const pick = (slot===EVAN_SLOT) ? pickEvan(rosters[slot],avail,roundNum,mode)
                                    : pickOpponent(mgr,rosters[slot],avail,roundNum,i+1);
    if(pick){ drafted.add(pick.id); rosters[slot][pick.pos].push({...pick, round:roundNum, overall:i+1}); }
  }
  return rosters;
}

// ---------- run many ----------
const RUNS=300;
const MODE = process.env.MODE || 'strict';
const evanRosters=[];
for(let k=0;k<RUNS;k++){ const rs=runDraft(MODE); evanRosters.push(rs[EVAN_SLOT]); }
const TAG = process.env.TAG || '';
fs.writeFileSync(`${ROOT}/.espn-automation/sim_results_${MODE}${TAG}.json`, JSON.stringify({ mode:MODE, board:BOARD, seed:SEED, evanSlot:EVAN_SLOT+1, slotMgr, evanRosters }, null, 2));
console.log('STRATEGY MODE:', MODE, '\n');

// aggregate
const flat = evanRosters.flatMap(r=>Object.entries(r).flatMap(([pos,arr])=>arr.map(p=>({...p,pos}))));
const freq={}; for(const p of flat){ freq[p.name]=(freq[p.name]||0)+1; }
const posByRound={};
for(const r of evanRosters){ for(const [pos,arr] of Object.entries(r)){ for(const p of arr){ (posByRound[p.round]=posByRound[p.round]||{}); posByRound[p.round][pos]=(posByRound[p.round][pos]||0)+1; } } }

// 3 example rosters (distinct-ish runs)
function fmtRoster(r){
  const all=Object.entries(r).flatMap(([pos,arr])=>arr.map(p=>({...p,pos}))).sort((a,b)=>a.round-b.round);
  return all.map(p=>`  R${String(p.round).padStart(2)} (${String(p.overall).padStart(3)})  ${p.pos.padEnd(4)} ${p.name} (${p.team})  [BDGE ${isFinite(p.bdge)?p.bdge:'-'}, ADP ${typeof p.adp==='number'?p.adp.toFixed(0):p.adp}]`).join('\n');
}
console.log('===== THREE EXAMPLE DRAFTS (slot 2, snake) =====');
for(const idx of [0, Math.floor(RUNS/2), RUNS-1]){
  console.log(`\n--- Example ${idx===0?'A':idx===RUNS-1?'C':'B'} ---`);
  console.log(fmtRoster(evanRosters[idx]));
}
console.log('\n');
console.log(`Evan draft slot: ${EVAN_SLOT+1}\n`);
console.log('MOST LIKELY PICK BY ROUND (Evan, over '+RUNS+' sims):');
for(let r=1;r<=ROUNDS;r++){ const m=posByRound[r]||{}; const s=Object.entries(m).sort((a,b)=>b[1]-a[1]).map(([p,c])=>`${p} ${(100*c/RUNS).toFixed(0)}%`).join(', '); console.log(`  R${String(r).padStart(2)}: ${s}`); }

console.log('\nMOST FREQUENT PLAYERS ON EVAN\'S TEAM:');
Object.entries(freq).sort((a,b)=>b[1]-a[1]).slice(0,25).forEach(([n,c])=>console.log(`  ${(100*c/RUNS).toFixed(0).padStart(3)}%  ${n}`));

// positional composition avg
const comp={QB:0,RB:0,WR:0,TE:0,K:0,'D/ST':0};
for(const r of evanRosters){ for(const pos of Object.keys(comp)) comp[pos]+=r[pos].length; }
console.log('\nAVG ROSTER COMPOSITION:', Object.entries(comp).map(([p,c])=>`${p}:${(c/RUNS).toFixed(1)}`).join('  '));

// how often 2 QBs by end of round R
const qb2by={}; for(const r of evanRosters){ const qs=r.QB.map(p=>p.round).sort((a,b)=>a-b); const second=qs[1]||99; qb2by[second]=(qb2by[second]||0)+1; }
console.log('Round Evan gets his 2nd QB (dist):', Object.entries(qb2by).sort((a,b)=>a[0]-b[0]).map(([r,c])=>`R${r}:${(100*c/RUNS).toFixed(0)}%`).join(' '));
