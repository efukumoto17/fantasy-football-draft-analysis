const { chromium } = require('playwright');
const fs = require('fs');

(async () => {
  const browser = await chromium.connectOverCDP('http://127.0.0.1:9222');
  const context = browser.contexts()[0];
  const page = context.pages().find(p => p.url().includes('editdraftstrategy')) || context.pages()[0];

  const countRows = () => page.evaluate(() => document.querySelectorAll('tr[data-player-row]').length);

  let prev = -1, stable = 0;
  for (let i = 0; i < 80; i++) {
    const c = await countRows();
    if (c === prev) { stable++; if (stable >= 4) break; } else { stable = 0; }
    prev = c;
    // scroll window and last row into view
    await page.evaluate(() => {
      window.scrollTo(0, document.documentElement.scrollHeight);
      const rows = document.querySelectorAll('tr[data-player-row]');
      if (rows.length) rows[rows.length - 1].scrollIntoView({ block: 'end' });
    });
    await page.waitForTimeout(400);
  }
  const finalCount = await countRows();

  const rows = await page.evaluate(() => {
    const trs = Array.from(document.querySelectorAll('tr[data-player-row]'));
    return trs.map(tr => {
      const rankEl = tr.querySelector('.ranking');
      const nameEl = tr.querySelector('.player-column__athlete a.AnchorLink');
      const team = tr.querySelector('.playerinfo__playerteam');
      const pos = tr.querySelector('.playerinfo__playerpos');
      let pid = null;
      const input = tr.querySelector('input[data-idx]');
      if (input) pid = input.getAttribute('data-idx');
      if (!pid) { const img = tr.querySelector('img[src*="/players/full/"]'); if (img) { const m = img.src.match(/players\/full\/(\d+)\.png/); if (m) pid = m[1]; } }
      return { rank: rankEl ? +rankEl.textContent.trim() : null, name: nameEl ? nameEl.textContent.trim() : null, team: team ? team.textContent.trim() : null, pos: pos ? pos.textContent.trim() : null, pid };
    });
  });

  fs.writeFileSync(__dirname + '/espn_roster.json', JSON.stringify(rows, null, 2));
  console.log('final DOM row count:', finalCount, ' extracted:', rows.length);
  console.log('missing pid:', rows.filter(r => !r.pid).length, ' missing name:', rows.filter(r => !r.name).length);
  console.log('last 3:', JSON.stringify(rows.slice(-3)));
  await browser.close();
})();
