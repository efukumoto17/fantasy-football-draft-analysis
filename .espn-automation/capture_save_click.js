const { chromium } = require('playwright');
const fs = require('fs');

(async () => {
  const browser = await chromium.connectOverCDP('http://127.0.0.1:9222');
  const context = browser.contexts()[0];
  const page = context.pages().find(p => p.url().includes('editdraftstrategy')) || context.pages()[0];

  const reqs = [];
  page.on('request', (req) => {
    const u = req.url(), m = req.method();
    if (/lm-api-writes/i.test(u) || (/lm-api|fantasy\.espn\.com\/apis/i.test(u) && m !== 'GET' && !/gen_204|heartbeat|presence|lastRead|collect/i.test(u)))
      reqs.push({ method: m, url: u, headers: req.headers(), postData: req.postData() || '' });
  });
  page.on('response', async (resp) => {
    const u = resp.url();
    if (/lm-api-writes/i.test(u) || (/lm-api/i.test(u) && resp.request().method() !== 'GET')) {
      const r = reqs.find(x => x.url === u && !x._status);
      if (r) { r._status = resp.status(); try { r._respBody = (await resp.text()).slice(0,1000); } catch(e){} }
    }
  });

  const btn = page.locator('button.save-rankings-btn').first();
  const visible = await btn.isVisible().catch(()=>false);
  console.log('save-rankings button visible:', visible);
  await btn.scrollIntoViewIfNeeded().catch(()=>{});
  await btn.click({ timeout: 5000 }).catch(e => console.log('click err', e.message));
  console.log('clicked Save Rankings, waiting...');
  await page.waitForTimeout(5000);

  // capture any confirmation/toast text
  const toast = await page.evaluate(() => {
    const t = document.body.innerText.match(/saved|success|error|updated/gi);
    return t ? [...new Set(t)].slice(0,5) : [];
  });
  console.log('page toast hints:', JSON.stringify(toast));

  console.log('captured write requests:', reqs.length);
  reqs.forEach(r => {
    console.log(`\n${r.method} ${r.url}\n  status: ${r._status}\n  postData(len=${r.postData.length}): ${r.postData.slice(0,1500)}\n  respBody: ${(r._respBody||'').slice(0,400)}`);
  });
  fs.writeFileSync(__dirname + '/save_request.json', JSON.stringify(reqs, null, 2));
  await browser.close();
})();
