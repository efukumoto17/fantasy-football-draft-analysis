// Joins the 2026 draft picks to the player universe and writes the full board.
// League is 2-QB, so SUPERFLEX rank is the valuation baseline; ESPN's public ADP
// comes from mostly 1-QB leagues and systematically under-prices quarterbacks.
const fs = require('fs');
const path = require('path');

const ROOT = '/Users/evanfukumoto/Documents/VSCodeRepos/fantasy-football';
const A = path.join(ROOT, '.espn-automation');
const posMap = { 1: 'QB', 2: 'RB', 3: 'WR', 4: 'TE', 5: 'K', 16: 'DST' };
const teamMap = {0:'FA',1:'ATL',2:'BUF',3:'CHI',4:'CIN',5:'CLE',6:'DAL',7:'DEN',8:'DET',9:'GB',10:'TEN',11:'IND',12:'KC',13:'LV',14:'LAR',15:'MIA',16:'MIN',17:'NE',18:'NO',19:'NYG',20:'NYJ',21:'PHI',22:'ARI',23:'PIT',24:'LAC',25:'SF',26:'SEA',27:'TB',28:'WSH',29:'CAR',30:'JAX',33:'BAL',34:'HOU'};

const league = JSON.parse(fs.readFileSync(path.join(A, 'draft2026_raw.json'), 'utf8'));
const universe = JSON.parse(fs.readFileSync(path.join(A, 'players2026_raw.json'), 'utf8'));

const stat = (p, src, season) => {
  const s = (p.stats || []).find(x => x.statSourceId === src && x.seasonId === season && x.statSplitTypeId === 0);
  return s ? s.appliedTotal : null;
};

const P = new Map();
for (const e of universe.players) {
  const p = e.player;
  const r = p.draftRanksByRankType || {};
  P.set(p.id, {
    id: p.id,
    name: p.fullName,
    pos: posMap[p.defaultPositionId] || '?',
    nfl: teamMap[p.proTeamId] || 'FA',
    adp: p.ownership ? p.ownership.averageDraftPosition : null,
    pctOwned: p.ownership ? p.ownership.percentOwned : null,
    rankPPR: r.PPR ? r.PPR.rank : null,
    rankSF: r.SUPERFLEX ? r.SUPERFLEX.rank : null,
    auction: r.PPR ? r.PPR.auctionValue : null,
    proj26: stat(p, 1, 2026),
    act25: stat(p, 0, 2025),
    injured: !!p.injured,
    injStatus: p.injuryStatus || '',
    outlook: (p.seasonOutlook || '').replace(/\s+/g, ' ').trim(),
  });
}

// team id -> manager
const memberName = new Map(league.members.map(m => [m.id, `${m.firstName} ${m.lastName}`]));
const teams = new Map();
for (const t of league.teams) {
  const mgrs = [...new Set((t.owners || []).map(o => memberName.get(o)).filter(Boolean))];
  teams.set(t.id, {
    id: t.id,
    name: t.name || `${t.location || ''} ${t.nickname || ''}`.trim(),
    abbrev: t.abbrev,
    manager: mgrs.join(' / ') || 'unknown',
    draftPos: null,
    picks: [],
    roster: (t.roster ? t.roster.entries : []).map(e => e.playerId),
  });
}

const picks = league.draftDetail.picks
  .slice()
  .sort((a, b) => a.overallPickNumber - b.overallPickNumber)
  .map(pk => {
    const pl = P.get(pk.playerId) || { name: `unknown#${pk.playerId}`, pos: '?', nfl: '?' };
    return {
      overall: pk.overallPickNumber,
      round: pk.roundId,
      roundPick: pk.roundPickNumber,
      teamId: pk.teamId,
      manager: teams.get(pk.teamId) ? teams.get(pk.teamId).manager : '?',
      teamName: teams.get(pk.teamId) ? teams.get(pk.teamId).name : '?',
      auto: pk.autoDraftTypeId !== 0,
      keeper: pk.keeper,
      ...pl,
    };
  });

for (const pk of picks) {
  const t = teams.get(pk.teamId);
  t.picks.push(pk);
  if (pk.round === 1) t.draftPos = pk.roundPick;
}

// Value: pick number vs. where ESPN ranked the player (SUPERFLEX for this 2QB league).
// Positive = got him later than his rank (surplus); negative = reached.
for (const pk of picks) {
  pk.valSF = pk.rankSF ? pk.overall - pk.rankSF : null;
  pk.valPPR = pk.rankPPR ? pk.overall - pk.rankPPR : null;
  pk.valADP = pk.adp ? pk.overall - pk.adp : null;
}

const csvEsc = v => {
  const s = v === null || v === undefined ? '' : String(v);
  return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
};
const cols = ['overall','round','roundPick','manager','teamName','name','pos','nfl','rankSF','rankPPR','adp','proj26','act25','auction','valSF','valADP','injStatus','auto','keeper','id'];
const csv = [cols.join(',')]
  .concat(picks.map(p => cols.map(c => csvEsc(typeof p[c] === 'number' ? Math.round(p[c] * 100) / 100 : p[c])).join(',')))
  .join('\n');
fs.writeFileSync(path.join(ROOT, 'draft-board-2026.csv'), csv + '\n');

// Undrafted players still on the board, by superflex rank — for "who was available"
const drafted = new Set(picks.map(p => p.id));
const undrafted = [...P.values()]
  .filter(p => !drafted.has(p.id) && p.rankSF)
  .sort((a, b) => a.rankSF - b.rankSF)
  .slice(0, 80);

fs.writeFileSync(path.join(A, 'draft2026_board.json'), JSON.stringify({
  league: { id: league.id, season: league.seasonId, name: league.settings.name,
            lineupSlots: league.settings.rosterSettings.lineupSlotCounts,
            scoring: league.settings.scoringSettings.scoringType },
  teams: [...teams.values()],
  picks,
  undrafted,
}, null, 1));

console.log('picks', picks.length, 'rounds', Math.max(...picks.map(p => p.round)));
console.log('unresolved names:', picks.filter(p => p.name.startsWith('unknown#')).length);
console.log('missing SF rank:', picks.filter(p => !p.rankSF).length, picks.filter(p=>!p.rankSF).map(p=>p.name+'/'+p.pos).join(', '));
console.log('\nDraft order (round 1):');
for (const p of picks.filter(x => x.round === 1)) console.log(`  ${p.roundPick}. ${p.manager} — ${p.name} (${p.pos})`);
console.log('\nEvan roster size:', [...teams.values()].find(t => t.manager.includes('Evan')).picks.length);
