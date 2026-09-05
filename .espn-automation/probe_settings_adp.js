const { chromium } = require('playwright');
const fs = require('fs');

(async () => {
  const browser = await chromium.connectOverCDP('http://127.0.0.1:9222');
  const page = browser.contexts()[0].pages()[0];

  const out = await page.evaluate(async () => {
    const H = { 'x-fantasy-platform':'espn-fantasy-web','x-fantasy-source':'kona','accept':'application/json' };
    const base = 'https://lm-api-reads.fantasy.espn.com/apis/v3/games/ffl/seasons/2026/segments/0/leagues/275797';
    // settings
    const sr = await fetch(`${base}?view=mSettings`, { credentials:'include', headers:H });
    const sj = await sr.json();
    const s = sj.settings || {};
    const res = { status: sr.status, size: sj.size || (s.size), name: s.name };
    res.roster = s.rosterSettings ? s.rosterSettings.lineupSlotCounts : null;
    res.draft = s.draftSettings ? { type: s.draftSettings.type, orderSet: !!(s.draftSettings.pickOrder && s.draftSettings.pickOrder.length), pickOrder: s.draftSettings.pickOrder, date: s.draftSettings.date } : null;
    res.scoringType = s.scoringSettings ? s.scoringSettings.scoringType : null;

    // ADP: kona_player_info, sorted by ADP
    const filter = { players: { limit: 300, sortDraftRanks: { sortPriority: 100, sortAsc: true, value: 'PPR' } } };
    const pr = await fetch(`${base}?view=kona_player_info`, { credentials:'include', headers:{ ...H, 'x-fantasy-filter': JSON.stringify(filter) } });
    const pj = await pr.json();
    const players = pj.players || [];
    res.playerCount = players.length;
    const sample = players[0] && players[0].player;
    res.sampleKeys = sample ? Object.keys(sample) : null;
    res.sampleOwnership = sample ? sample.ownership : null;
    res.sampleDraftRanks = sample ? sample.draftRanksByRankType : null;
    res.sampleName = sample ? sample.fullName : null;
    return res;
  });
  console.log(JSON.stringify(out, null, 2));
  // do not close: this browser is the user's live session, attached over CDP
  process.exit(0);
})();
