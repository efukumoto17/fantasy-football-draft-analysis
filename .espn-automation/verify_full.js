const { chromium } = require('playwright');
const fs = require('fs');

(async () => {
  const browser = await chromium.connectOverCDP('http://127.0.0.1:9222');
  const context = browser.contexts()[0];
  const page = context.pages().find(p => p.url().includes('editdraftstrategy')) || context.pages()[0];

  const expected = JSON.parse(fs.readFileSync(__dirname + '/payload.json','utf8')).draftStrategy.draftList.map(x=>x.playerId);

  const saved = await page.evaluate(async () => {
    const u = 'https://lm-api-reads.fantasy.espn.com/apis/v3/games/ffl/seasons/2026/segments/0/leagues/275797?view=mTeam';
    const r = await fetch(u, { credentials:'include', headers:{'x-fantasy-platform':'espn-fantasy-web','x-fantasy-source':'kona','accept':'application/json'} });
    const j = await r.json();
    const team = (j.teams||[]).find(t => t.id === 4);
    return team.draftStrategy.draftList.map(x => x.playerId);
  });

  let firstDiff = -1;
  const N = expected.length;
  for (let i=0;i<N;i++){ if (saved[i] !== expected[i]) { firstDiff = i; break; } }
  console.log('expected length:', expected.length, ' saved length:', saved.length);
  console.log('first mismatch index (over all 1028):', firstDiff);
  // Specifically check the 209 CSV players (the meaningful part)
  let csvMatch = true;
  for (let i=0;i<209;i++){ if (saved[i] !== expected[i]) { csvMatch=false; console.log('CSV-region mismatch at rank', i+1); break; } }
  console.log('CSV ranks 1-209 exact match:', csvMatch);

  // Reload UI so it reflects saved state
  await page.reload({ waitUntil: 'domcontentloaded' }).catch(()=>{});
  await page.waitForTimeout(3500);
  await page.screenshot({ path: __dirname + '/final_state.png' });
  const topUI = await page.evaluate(() => Array.from(document.querySelectorAll('tr[data-player-row]')).slice(0,15)
    .map(tr => (tr.querySelector('.ranking')?.textContent||'')+' '+(tr.querySelector('.player-column__athlete a')?.textContent||'')));
  console.log('UI top15 after reload:');
  topUI.forEach(t=>console.log('  '+t));
  await browser.close();
})();
