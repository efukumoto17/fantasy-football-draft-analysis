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
    if ((m === 'POST' || m === 'PUT' || m === 'PATCH') && /fantasy\.espn\.com|lm-api/i.test(u) && !/google|doubleclick|rubicon|collect|gen_204|heartbeat/i.test(u)) {
      writes.push({ method: m, url: u, headers: req.headers(), postData: (req.postData() || '').slice(0, 4000) });
    }
  });

  const before = await page.evaluate(() => Array.from(document.querySelectorAll('tr[data-player-row]')).slice(0,4)
    .map(tr => (tr.querySelector('.player-column__athlete a')?.textContent||'')));

  // Synthetic HTML5 drag: move row index 1 to before row index 0
  const result = await page.evaluate(() => {
    const rows = Array.from(document.querySelectorAll('tr[data-player-row]'));
    const src = rows[1], tgt = rows[0];
    if (!src || !tgt) return 'no rows';
    const dt = new DataTransfer();
    const fire = (el, type, extra={}) => {
      const r = el.getBoundingClientRect();
      const ev = new DragEvent(type, { bubbles: true, cancelable: true, composed: true, dataTransfer: dt,
        clientX: r.x + r.width/2, clientY: r.y + (extra.top ? 2 : r.height/2) });
      el.dispatchEvent(ev);
    };
    fire(src, 'dragstart');
    fire(tgt, 'dragenter');
    fire(tgt, 'dragover', { top: true });
    fire(tgt, 'drop', { top: true });
    fire(src, 'dragend');
    return 'fired';
  });

  await page.waitForTimeout(2500);
  const after = await page.evaluate(() => Array.from(document.querySelectorAll('tr[data-player-row]')).slice(0,4)
    .map(tr => (tr.querySelector('.player-column__athlete a')?.textContent||'')));

  console.log('drag result:', result);
  console.log('before:', JSON.stringify(before));
  console.log('after :', JSON.stringify(after));
  fs.writeFileSync(__dirname + '/write_calls.json', JSON.stringify(writes, null, 2));
  console.log('captured writes:', writes.length);
  for (const w of writes) console.log(`${w.method} ${w.url.slice(0,170)}\n   body: ${w.postData.slice(0,500)}`);
  await browser.close();
})();
