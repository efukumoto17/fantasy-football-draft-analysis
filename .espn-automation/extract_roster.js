const { chromium } = require('playwright');
const fs = require('fs');

(async () => {
  const browser = await chromium.connectOverCDP('http://127.0.0.1:9222');
  const context = browser.contexts()[0];
  const page = context.pages().find(p => p.url().includes('editdraftstrategy')) || context.pages()[0];

  const rows = await page.evaluate(() => {
    const trs = Array.from(document.querySelectorAll('tr[data-player-row]'));
    return trs.map(tr => {
      const rankEl = tr.querySelector('.ranking');
      const nameEl = tr.querySelector('.player-column__athlete a.AnchorLink');
      const team = tr.querySelector('.playerinfo__playerteam');
      const pos = tr.querySelector('.playerinfo__playerpos');
      // player id from exclude checkbox input[data-idx] or headshot url
      let pid = null;
      const input = tr.querySelector('input[data-idx]');
      if (input) pid = input.getAttribute('data-idx');
      if (!pid) {
        const img = tr.querySelector('img[src*="/players/full/"]');
        if (img) { const m = img.src.match(/players\/full\/(\d+)\.png/); if (m) pid = m[1]; }
      }
      return {
        idx: tr.getAttribute('data-idx'),
        rank: rankEl ? rankEl.textContent.trim() : null,
        name: nameEl ? nameEl.textContent.trim() : null,
        team: team ? team.textContent.trim() : null,
        pos: pos ? pos.textContent.trim() : null,
        pid,
      };
    });
  });

  fs.writeFileSync(__dirname + '/espn_roster.json', JSON.stringify(rows, null, 2));
  console.log('rows extracted:', rows.length);
  console.log('first 3:', JSON.stringify(rows.slice(0, 3)));
  console.log('last 3:', JSON.stringify(rows.slice(-3)));
  const missingPid = rows.filter(r => !r.pid).length;
  const missingName = rows.filter(r => !r.name).length;
  console.log('missing pid:', missingPid, ' missing name:', missingName);
  // do not close: this browser is the user's live session, attached over CDP
  process.exit(0);
})();
