// Builds the ESPN autodraft payload from the current board.
//
// IMPORTANT: this deliberately does NOT use raw board order. The board is a
// superflex board, so quarterbacks sit at 3, 9, 16, 17 — feeding that straight
// to autodraft would take three QBs in the first four rounds and leave the
// roster broken. Instead each position gets an offset that encodes the drafting
// plan (backs and receivers early, quarterbacks in rounds 5-7, tight end mid),
// so the queue reproduces the intended draft rather than the raw rankings.
//
// Do Not Draft players go to excludedPlayerIds so autodraft can never take them.
const fs = require('fs');
const path = require('path');

const ROOT = '/Users/evanfukumoto/Documents/VSCodeRepos/fantasy-football';
const posMap = {1:'QB',2:'RB',3:'WR',4:'TE',5:'K',16:'DST'};
const teamMap = {0:'FA',1:'ATL',2:'BUF',3:'CHI',4:'CIN',5:'CLE',6:'DAL',7:'DEN',8:'DET',9:'GB',10:'TEN',11:'IND',12:'KC',13:'LV',14:'LAR',15:'MIA',16:'MIN',17:'NE',18:'NO',19:'NYG',20:'NYJ',21:'PHI',22:'ARI',23:'PIT',24:'LAC',25:'SF',26:'SEA',27:'TB',28:'WSH',29:'CAR',30:'JAX',33:'BAL',34:'HOU'};
const teamAlias = { JAC:'JAX', WAS:'WSH', LVR:'LV', OAK:'LV', SD:'LAC', STL:'LAR' };
const nameAlias = { 'kenneth gainwell':'kenny gainwell' };
const SUFFIX = new Set(['jr','sr','ii','iii','iv','v']);
const norm = s => s.toLowerCase().replace(/[.'`]/g,'').replace(/-/g,' ').replace(/\s+/g,' ').trim();
const stripSuffix = n => { const p=n.split(' '); while(p.length>1&&SUFFIX.has(p[p.length-1]))p.pop(); return p.join(' '); };

// Offsets in board-rank points. Larger = drafted later than the board says.
// Tuned so the queue lands QB1/QB2 around picks 42-59 and TE around pick 82,
// which is the plan the simulations settled on.
const OFFSET = { RB:0, WR:0, QB:26, TE:25, K:400, DST:400 };

const parseCsv = (f) => {
  const txt = fs.readFileSync(f,'utf8').trim().split(/\r?\n/);
  const head = txt.shift().split(',');
  return txt.map(l => { const c=l.split(','); return Object.fromEntries(head.map((h,i)=>[h,c[i]])); });
};

const universe = JSON.parse(fs.readFileSync(path.join(ROOT,'.espn-automation/resp_egy_platformVersion_96e7cdc122a61e6c778b4087703c10d123d0565d.json'),'utf8'))
  .players.map(e => { const p=e.player; const full=((p.firstName||'')+' '+(p.lastName||'')).trim();
    const pr = p.draftRanksByRankType && p.draftRanksByRankType.PPR;
    return { id:p.id, name:full, pos:posMap[p.defaultPositionId]||'?', team:teamMap[p.proTeamId]||'FA',
             proTeamId:p.proTeamId, rank: pr && pr.rank ? pr.rank : 9999,
             n:stripSuffix(norm(full)) }; });
const byName = new Map();
for (const p of universe) { if(!byName.has(p.n)) byName.set(p.n,[]); byName.get(p.n).push(p); }
// ESPN stores defenses as "<Nickname> D/ST" with no full name, so match them by
// pro team id instead of by the city name our board uses.
const teamIdByAbbrev = new Map(Object.entries(teamMap).map(([id,ab]) => [ab, Number(id)]));
const dstByTeamId = new Map(universe.filter(p=>p.pos==='DST').map(p=>[p.proTeamId,p]));

const match = (row) => {
  if (row.Pos === 'DST') {
    const tid = teamIdByAbbrev.get(teamAlias[row.Team] || row.Team);
    return (tid !== undefined && dstByTeamId.get(tid)) || null;
  }
  let key = stripSuffix(norm(row.Player)); if (nameAlias[key]) key = nameAlias[key];
  let c = byName.get(key) || [];
  if (c.length > 1) {
    const t = teamAlias[row.Team] || row.Team;
    const byTeam = c.filter(x => x.team === t);
    if (byTeam.length) c = byTeam;
    const byPos = c.filter(x => x.pos === (row.Pos === 'DST' ? 'DST' : row.Pos));
    if (byPos.length) c = byPos;
  }
  return c[0] || null;
};

const board = parseCsv(path.join(ROOT,'bdge-draft-rankings-ppr-2026.csv'));
const kdst  = parseCsv(path.join(ROOT,'bdge-k-dst-rankings-2026.csv'));
const tagsOf = (r) => (r.Tags||'').split(';').map(t=>t.trim()).filter(Boolean);

const ranked = [], excluded = [], unmatched = [];
for (const r of board.concat(kdst)) {
  const m = match(r);
  if (!m) { unmatched.push(r); continue; }
  const tags = tagsOf(r);
  if (tags.includes('Queasy')) { excluded.push({ id:m.id, name:r.Player, pos:r.Pos }); continue; }
  // K/DST are ranked within their own list, so bias them behind the skill board
  const base = r.Pos === 'K' || r.Pos === 'DST' ? Number(r.Rank) : Number(r.Rank);
  ranked.push({ id:m.id, name:r.Player, pos:r.Pos, boardRank:Number(r.Rank),
                eff: base + (OFFSET[r.Pos] ?? 0), tags });
}
ranked.sort((a,b) => a.eff - b.eff || a.boardRank - b.boardRank);

// depth: everything else ESPN knows about, by ADP, minus anything excluded
const inList = new Set(ranked.map(p=>p.id));
const excludedIds = new Set(excluded.map(p=>p.id));
const depth = universe
  .filter(p => !inList.has(p.id) && !excludedIds.has(p.id) && p.rank < 9999)
  .sort((a,b) => a.rank - b.rank);

const finalOrder = ranked.map(p=>p.id).concat(depth.map(p=>p.id));
const payload = {
  draftStrategy: {
    draftList: finalOrder.map(id => ({ playerId: id })),
    excludedPlayerIds: excluded.map(p => p.id),
  },
};
fs.writeFileSync(path.join(ROOT,'.espn-automation/payload.json'), JSON.stringify(payload));

console.log(`board ${board.length} + K/DST ${kdst.length} = ${board.length+kdst.length} ranked rows`);
console.log(`  matched into queue : ${ranked.length}`);
console.log(`  excluded (Queasy)  : ${excluded.length} -> ${excluded.map(e=>e.name).join(', ')}`);
console.log(`  unmatched          : ${unmatched.length}${unmatched.length?' -> '+unmatched.map(u=>u.Player).join(', '):''}`);
console.log(`  depth appended     : ${depth.length}`);
console.log(`  total queue length : ${finalOrder.length}`);
console.log('\nfirst 24 of the queue (what autodraft would take, roughly in order):');
ranked.slice(0,24).forEach((p,i)=>console.log(`  ${String(i+1).padStart(2)}. ${p.pos.padEnd(3)} ${p.name.padEnd(24)} board #${String(p.boardRank).padStart(3)}  eff ${p.eff}`));
const firstQB = ranked.findIndex(p=>p.pos==='QB');
const firstTE = ranked.findIndex(p=>p.pos==='TE');
console.log(`\nfirst QB at queue slot ${firstQB+1}, first TE at slot ${firstTE+1}`);
console.log('positions in first 60:', JSON.stringify(ranked.slice(0,60).reduce((a,p)=>{a[p.pos]=(a[p.pos]||0)+1;return a;},{})));
