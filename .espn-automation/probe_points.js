const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.connectOverCDP('http://127.0.0.1:9222');
  const page = browser.contexts()[0].pages()[0];
  const out = await page.evaluate(async () => {
    const H = { 'x-fantasy-platform':'espn-fantasy-web','x-fantasy-source':'kona','accept':'application/json' };
    const ids = [4429795, 4362628, 3117251]; // Gibbs, Chase, CMC
    const filter = { players: { filterIds:{value:ids}, limit:10 } };
    const r = await fetch('https://lm-api-reads.fantasy.espn.com/apis/v3/games/ffl/seasons/2024/segments/0/leagues/275797?view=kona_player_info',
      { credentials:'include', headers:{...H,'x-fantasy-filter':JSON.stringify(filter)} });
    const j = await r.json();
    const res = { status:r.status, count:(j.players||[]).length };
    res.samples = (j.players||[]).map(e=>{
      const p=e.player;
      const stats=(p.stats||[]).map(s=>({ seasonId:s.seasonId, srcId:s.statSourceId, splitType:s.statSplitTypeId, scoringPeriodId:s.scoringPeriodId, appliedTotal:s.appliedTotal, appliedAvg:s.appliedAverage }));
      return { id:p.id, name:p.fullName, statsEntries:stats };
    });
    return res;
  });
  console.log(JSON.stringify(out, null, 2).slice(0, 2500));
  await browser.close();
})();
