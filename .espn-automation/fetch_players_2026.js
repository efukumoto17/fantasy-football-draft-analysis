// Pulls the 2026 player universe: names, positions, ESPN ADP/rank, and season projections.
const { chromium } = require('playwright');
const fs = require('fs');

const SEASON = 2026;

(async () => {
  const browser = await chromium.connectOverCDP('http://127.0.0.1:9222');
  const context = browser.contexts()[0];
  const filter = {
    players: {
      limit: 1200,
      sortDraftRanks: { sortPriority: 100, sortAsc: true, value: 'PPR' },
    },
  };
  const H = {
    'x-fantasy-platform': 'espn-fantasy-web',
    'x-fantasy-source': 'kona',
    'accept': 'application/json',
    'x-fantasy-filter': JSON.stringify(filter),
  };
  const url = `https://lm-api-reads.fantasy.espn.com/apis/v3/games/ffl/seasons/${SEASON}/segments/0/leagues/275797?view=kona_player_info`;
  const r = await context.request.get(url, { headers: H });
  console.log('status', r.status());
  if (r.status() !== 200) { console.log((await r.text()).slice(0, 800)); process.exit(1); }
  const j = await r.json();
  fs.writeFileSync(__dirname + '/players2026_raw.json', JSON.stringify(j));
  console.log('players', j.players && j.players.length);
  const p = j.players[0];
  console.log('samplePlayerKeys', Object.keys(p.player).join(','));
  console.log('sample', JSON.stringify({
    id: p.player.id, name: p.player.fullName, pos: p.player.defaultPositionId,
    adp: p.player.ownership && p.player.ownership.averageDraftPosition,
    pctOwned: p.player.ownership && p.player.ownership.percentOwned,
    ranks: p.player.draftRanksByRankType,
    stats: (p.player.stats || []).map(s => ({ id: s.id, sp: s.scoringPeriodId, ss: s.seasonId, src: s.statSourceId, split: s.statSplitTypeId, apt: s.appliedTotal })),
  }, null, 1));
  process.exit(0);
})();
