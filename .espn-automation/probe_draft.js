const { chromium } = require('playwright');
const fs = require('fs');

(async () => {
  const browser = await chromium.connectOverCDP('http://127.0.0.1:9222');
  const context = browser.contexts()[0];
  const page = context.pages()[0];

  const out = await page.evaluate(async () => {
    const H = { 'x-fantasy-platform':'espn-fantasy-web','x-fantasy-source':'kona','accept':'application/json' };
    const u = 'https://lm-api-reads.fantasy.espn.com/apis/v3/games/ffl/seasons/2025/segments/0/leagues/275797?view=mDraftDetail&view=mTeam&view=mSettings';
    const r = await fetch(u, { credentials:'include', headers:H });
    const j = await r.json();
    const res = { status: r.status, topKeys: Object.keys(j) };
    res.draftDetailKeys = j.draftDetail ? Object.keys(j.draftDetail) : null;
    res.pickCount = j.draftDetail && j.draftDetail.picks ? j.draftDetail.picks.length : null;
    res.samplePick = j.draftDetail && j.draftDetail.picks ? j.draftDetail.picks[0] : null;
    res.teamCount = j.teams ? j.teams.length : null;
    res.sampleTeam = j.teams ? { id:j.teams[0].id, name:(j.teams[0].name||((j.teams[0].location||'')+' '+(j.teams[0].nickname||''))), abbrev:j.teams[0].abbrev, owners:j.teams[0].owners } : null;
    res.memberCount = j.members ? j.members.length : null;
    res.sampleMember = j.members ? j.members[0] : null;
    return res;
  });
  console.log(JSON.stringify(out, null, 2));
  // do not close: this browser is the user's live session, attached over CDP
  process.exit(0);
})();
