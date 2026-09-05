const { chromium } = require('playwright');
const fs = require('fs');

(async () => {
  const browser = await chromium.connectOverCDP('http://127.0.0.1:9222');
  const context = browser.contexts()[0];
  const page = context.pages().find(p => p.url().includes('editdraftstrategy')) || context.pages()[0];

  const payload = JSON.parse(fs.readFileSync(__dirname + '/payload.json','utf8'));
  const url = 'https://lm-api-writes.fantasy.espn.com/apis/v3/games/ffl/seasons/2026/segments/0/leagues/275797/teams/4?platformVersion=96e7cdc122a61e6c778b4087703c10d123d0565d';

  const res = await page.evaluate(async ({ url, payload }) => {
    const r = await fetch(url, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'accept': 'application/json',
        'content-type': 'application/json',
        'x-fantasy-platform': 'espn-fantasy-web',
        'x-fantasy-source': 'kona',
      },
      body: JSON.stringify(payload),
    });
    const text = await r.text();
    return { status: r.status, ok: r.ok, bodyStart: text.slice(0, 300) };
  }, { url, payload });

  console.log('POST status:', res.status, 'ok:', res.ok);
  console.log('response start:', res.bodyStart);

  // Verify: read back the saved draftList directly from the read endpoint
  const verify = await page.evaluate(async () => {
    const u = 'https://lm-api-reads.fantasy.espn.com/apis/v3/games/ffl/seasons/2026/segments/0/leagues/275797?view=mTeam';
    const r = await fetch(u, { credentials:'include', headers:{'x-fantasy-platform':'espn-fantasy-web','x-fantasy-source':'kona','accept':'application/json'} });
    const j = await r.json();
    const team = (j.teams||[]).find(t => t.id === 4);
    const dl = team && team.draftStrategy && team.draftStrategy.draftList;
    return dl ? dl.slice(0, 12).map(x => x.playerId) : null;
  });
  console.log('read-back top12 playerIds:', JSON.stringify(verify));
  // do not close: this browser is the user's live session, attached over CDP
  process.exit(0);
})();
