const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.connectOverCDP('http://127.0.0.1:9222');
  const page = browser.contexts()[0].pages()[0];
  const out = await page.evaluate(async () => {
    const H = { 'x-fantasy-platform':'espn-fantasy-web','x-fantasy-source':'kona','accept':'application/json' };
    const r = await fetch('https://lm-api-reads.fantasy.espn.com/apis/v3/games/ffl/seasons/2024/players?view=kona_playercard',
      { credentials:'include', headers:H });
    const j = await r.json();
    const arr = Array.isArray(j)?j:(j.players||[]);
    const find = id => arr.find(e=>(e.player&&e.player.id)===id || e.id===id);
    const dump = id => { const e=find(id); const p=e&&(e.player||e); if(!p) return null;
      return { name:p.fullName, stats:(p.stats||[]).map(s=>({seasonId:s.seasonId,src:s.statSourceId,split:s.statSplitTypeId,spId:s.scoringPeriodId,appliedTotal:s.appliedTotal,externalId:s.externalId})) }; };
    return { total:arr.length, gibbs:dump(4429795), chase:dump(4362628), henry:dump(3043078) };
  });
  console.log(JSON.stringify(out, null, 2).slice(0,2500));
  // do not close: this browser is the user's live session, attached over CDP
  process.exit(0);
})();
