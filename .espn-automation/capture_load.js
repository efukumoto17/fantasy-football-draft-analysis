const { chromium } = require('playwright');
const fs = require('fs');

(async () => {
  const browser = await chromium.connectOverCDP('http://127.0.0.1:9222');
  const context = browser.contexts()[0];
  const page = context.pages().find(p => p.url().includes('editdraftstrategy')) || context.pages()[0];

  const calls = [];
  const interesting = (u) => /fantasy\.espn\.com\/apis|lm-api|draftranks|players|rankings|draftdetail|league/i.test(u)
    && !/\.png|\.jpg|\.svg|\.css|\.woff|combiner/i.test(u);

  page.on('response', async (resp) => {
    const url = resp.url();
    const req = resp.request();
    if (req.resourceType() === 'xhr' || req.resourceType() === 'fetch') {
      if (interesting(url)) {
        let bodyPreview = '';
        let bodyLen = 0;
        try {
          const txt = await resp.text();
          bodyLen = txt.length;
          bodyPreview = txt.slice(0, 600);
          // Save full body of rank-ish responses
          if (/rank|draft/i.test(url) && txt.length > 200) {
            const safe = url.replace(/[^a-z0-9]/gi, '_').slice(-60);
            fs.writeFileSync(__dirname + '/resp_' + safe + '.json', txt);
          }
        } catch (e) { bodyPreview = '<<' + e.message + '>>'; }
        calls.push({ method: req.method(), status: resp.status(), url, bodyLen, bodyPreview });
      }
    }
  });

  console.log('reloading to capture load requests...');
  await page.reload({ waitUntil: 'networkidle' }).catch(e => console.log('reload note', e.message));
  await page.waitForTimeout(2500);

  fs.writeFileSync(__dirname + '/load_calls.json', JSON.stringify(calls, null, 2));
  console.log('captured', calls.length, 'api calls');
  for (const c of calls) console.log(`${c.method} ${c.status} len=${c.bodyLen} ${c.url.slice(0, 160)}`);
  await browser.close();
})();
