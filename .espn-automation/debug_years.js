const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.connectOverCDP('http://127.0.0.1:9222');
  const page = browser.contexts()[0].pages()[0];
  const out = await page.evaluate(async () => {
    const H = { 'x-fantasy-platform':'espn-fantasy-web','x-fantasy-source':'kona','accept':'application/json' };
    const ids = [4362628, 4429795, 4430807];
    const filter = { players:{ filterIds:{value:ids}, limit:100 } };
    const res = {};
    for (const y of [2023,2024,2025,2026]) {
      // players_wl with filter, WITH and WITHOUT scoringPeriodId
      const mk = async (withSp) => {
        const url = `https://lm-api-reads.fantasy.espn.com/apis/v3/games/ffl/seasons/${y}/players?${withSp?'scoringPeriodId=0&':''}view=players_wl`;
        const r = await fetch(url, { credentials:'include', headers:{...H,'x-fantasy-filter':JSON.stringify(filter)} });
        let arr=[]; try{const j=await r.json();arr=Array.isArray(j)?j:(j.players||[]);}catch(e){}
        return { status:r.status, count:arr.length, found: arr.filter(p=>ids.includes(p.id)).length };
      };
      res[y] = { withSp: await mk(true), noSp: await mk(false) };
    }
    return res;
  });
  console.log(JSON.stringify(out, null, 2));
  await browser.close();
})();
