const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.connectOverCDP('http://127.0.0.1:9222');
  const context = browser.contexts()[0];
  const page = context.pages()[0];

  const out = await page.evaluate(async () => {
    const H = { 'x-fantasy-platform':'espn-fantasy-web','x-fantasy-source':'kona','accept':'application/json' };
    const u = 'https://lm-api-reads.fantasy.espn.com/apis/v3/games/ffl/seasons/2025/players?scoringPeriodId=0&view=players_wl';
    const r = await fetch(u, { credentials:'include', headers:H });
    let j; try { j = await r.json(); } catch(e){ return { status:r.status, err:'json parse '+e.message }; }
    const arr = Array.isArray(j) ? j : (j.players || []);
    const res = { status:r.status, isArray:Array.isArray(j), count:arr.length };
    res.sample = arr[0];
    // check a known drafted player id 4362628 (Chase)
    const find = arr.find(p => (p.id||(p.player&&p.player.id)) === 4362628);
    res.chaseFound = !!find;
    res.chaseSample = find;
    return res;
  });
  console.log(JSON.stringify(out, null, 2).slice(0, 2000));
  // do not close: this browser is the user's live session, attached over CDP
  process.exit(0);
})();
