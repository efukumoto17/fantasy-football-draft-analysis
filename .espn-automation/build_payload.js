const fs = require('fs');
const path = require('path');

const ROOT = '/Users/evanfukumoto/Documents/VSCodeRepos/ridetrainingscheduling';
const posMap = {1:'QB',2:'RB',3:'WR',4:'TE',5:'K',16:'DST'};
const teamMap = {0:'FA',1:'ATL',2:'BUF',3:'CHI',4:'CIN',5:'CLE',6:'DAL',7:'DEN',8:'DET',9:'GB',10:'TEN',11:'IND',12:'KC',13:'LV',14:'LAR',15:'MIA',16:'MIN',17:'NE',18:'NO',19:'NYG',20:'NYJ',21:'PHI',22:'ARI',23:'PIT',24:'LAC',25:'SF',26:'SEA',27:'TB',28:'WSH',29:'CAR',30:'JAX',33:'BAL',34:'HOU'};
// CSV team spellings -> normalize to ESPN abbrev where they differ
const teamAlias = { JAC:'JAX', WAS:'WSH', LVR:'LV', OAK:'LV', SD:'LAC', STL:'LAR' };

// CSV name (normalized, suffix-stripped) -> ESPN name (normalized) for nickname/spelling diffs
const nameAlias = { 'kenneth gainwell':'kenny gainwell' };
const SUFFIX = new Set(['jr','sr','ii','iii','iv','v']);
function norm(s) {
  return s.toLowerCase()
    .replace(/[.'`]/g,'')
    .replace(/[-]/g,' ')
    .replace(/\s+/g,' ')
    .trim();
}
function stripSuffix(nrm) {
  const parts = nrm.split(' ');
  while (parts.length > 1 && SUFFIX.has(parts[parts.length-1])) parts.pop();
  return parts.join(' ');
}

// --- Load ESPN players ---
const raw = JSON.parse(fs.readFileSync(path.join(ROOT, '.espn-automation/resp_egy_platformVersion_96e7cdc122a61e6c778b4087703c10d123d0565d.json'),'utf8'));
const espn = raw.players.map(e => {
  const p = e.player;
  const full = ((p.firstName||'') + ' ' + (p.lastName||'')).trim();
  return { id: p.id, name: full, pos: posMap[p.defaultPositionId]||('P'+p.defaultPositionId), team: teamMap[p.proTeamId]||('T'+p.proTeamId),
           n: stripSuffix(norm(full)) };
});
// index by normalized name
const byName = new Map();
for (const p of espn) { if (!byName.has(p.n)) byName.set(p.n, []); byName.get(p.n).push(p); }

// --- Parse CSV ---
const csvText = fs.readFileSync(path.join(ROOT,'bdge-draft-rankings-ppr-2026.csv'),'utf8').trim();
const lines = csvText.split(/\r?\n/); lines.shift(); // header
const csv = lines.map(l => {
  const c = l.split(',');
  return { rank:+c[0], name:c[1], team:(teamAlias[c[2]]||c[2]), pos:c[3] };
});

// --- Match ---
const matched = []; const unmatched = []; const used = new Set();
for (const row of csv) {
  let key = stripSuffix(norm(row.name));
  if (nameAlias[key]) key = nameAlias[key];
  let cands = (byName.get(key)||[]).filter(p => !used.has(p.id));
  if (cands.length > 1) { const byPos = cands.filter(p => p.pos === row.pos); if (byPos.length) cands = byPos; }
  if (cands.length > 1) { const byTeam = cands.filter(p => p.team === row.team); if (byTeam.length) cands = byTeam; }
  if (cands.length === 1) { used.add(cands[0].id); matched.push({ row, espn:cands[0] }); }
  else if (cands.length > 1) { // still ambiguous
    unmatched.push({ row, reason:'ambiguous', cands: cands.map(c=>`${c.id}:${c.name}/${c.pos}/${c.team}`) });
  } else {
    unmatched.push({ row, reason:'no-name-match' });
  }
}

// --- Build ordered playerId list ---
const csvIds = matched.map(m => m.espn.id);
const current = JSON.parse(fs.readFileSync(path.join(ROOT,'.espn-automation/save_request.json'),'utf8'))[0];
const currentList = JSON.parse(current.postData).draftStrategy.draftList.map(x => x.playerId);
const csvSet = new Set(csvIds);
const rest = currentList.filter(id => !csvSet.has(id));
const finalOrder = [...csvIds, ...rest];

const payload = { draftStrategy: { draftList: finalOrder.map(id => ({ playerId: id })) } };
fs.writeFileSync(path.join(ROOT,'.espn-automation/payload.json'), JSON.stringify(payload));

// --- Report ---
console.log('CSV players:', csv.length);
console.log('matched:', matched.length, ' unmatched:', unmatched.length);
console.log('final ordered list length:', finalOrder.length, '(csv', csvIds.length, '+ rest', rest.length, ')');
console.log('\n-- first 12 matched (CSV rank -> ESPN) --');
matched.slice(0,12).forEach(m => console.log(`  ${String(m.row.rank).padStart(3)} ${m.row.name} (${m.row.pos} ${m.row.team})  ->  ${m.espn.id} ${m.espn.name} (${m.espn.pos} ${m.espn.team})`));
if (unmatched.length) {
  console.log('\n-- UNMATCHED (need attention) --');
  unmatched.forEach(u => console.log(`  rank ${u.row.rank}: ${u.row.name} (${u.row.pos} ${u.row.team}) [${u.reason}]${u.cands?' cands='+JSON.stringify(u.cands):''}`));
}
// sanity: any position/team mismatches among matched?
const mism = matched.filter(m => m.espn.pos !== m.row.pos || (m.espn.team !== m.row.team && m.espn.team!=='FA'));
if (mism.length) {
  console.log('\n-- matched but pos/team differ (verify) --');
  mism.forEach(m => console.log(`  rank ${m.row.rank}: CSV ${m.row.name}/${m.row.pos}/${m.row.team}  vs ESPN ${m.espn.name}/${m.espn.pos}/${m.espn.team} (id ${m.espn.id})`));
}
