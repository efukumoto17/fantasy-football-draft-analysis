const { chromium } = require('playwright');
const fs = require('fs');

(async () => {
  const browser = await chromium.connectOverCDP('http://127.0.0.1:9222');
  const context = browser.contexts()[0];
  const page = context.pages().find(p => p.url().includes('editdraftstrategy')) || context.pages()[0];

  const writes = [];
  page.on('request', (req) => {
    const m = req.method();
    const u = req.url();
    if ((m === 'POST' || m === 'PUT' || m === 'PATCH') && /fantasy\.espn\.com|lm-api/i.test(u) && !/google|doubleclick|rubicon|collect/i.test(u)) {
      writes.push({ method: m, url: u, headers: req.headers(), postData: (req.postData() || '').slice(0, 3000) });
    }
  });

  // Perform a drag: move row at data-idx=1 above data-idx=0
  const src = page.locator('tr[data-player-row] .grabber').nth(1);
  const dst = page.locator('tr[data-player-row] .grabber').nth(0);
  console.log('attempting drag of row 2 -> row 1 ...');
  try {
    const sb = await src.boundingBox();
    const db = await dst.boundingBox();
    if (sb && db) {
      await page.mouse.move(sb.x + sb.width/2, sb.y + sb.height/2);
      await page.mouse.down();
      await page.mouse.move(sb.x + sb.width/2, sb.y + sb.height/2 - 10, { steps: 5 });
      await page.mouse.move(db.x + db.width/2, db.y + db.height/2 - 5, { steps: 15 });
      await page.mouse.move(db.x + db.width/2, db.y + db.height/2 - 20, { steps: 5 });
      await page.mouse.up();
    } else {
      console.log('no bounding boxes');
    }
  } catch (e) { console.log('drag err', e.message); }

  await page.waitForTimeout(2500);

  // Report the new top-3 order to see if drag worked
  const top = await page.evaluate(() => Array.from(document.querySelectorAll('tr[data-player-row]')).slice(0,3)
    .map(tr => (tr.querySelector('.ranking')?.textContent||'') + ':' + (tr.querySelector('.player-column__athlete a')?.textContent||'')));
  console.log('top3 after drag:', JSON.stringify(top));

  fs.writeFileSync(__dirname + '/write_calls.json', JSON.stringify(writes, null, 2));
  console.log('captured writes:', writes.length);
  for (const w of writes) console.log(`${w.method} ${w.url.slice(0,150)}\n   body: ${w.postData.slice(0,400)}`);
  // do not close: this browser is the user's live session, attached over CDP
  process.exit(0);
})();
