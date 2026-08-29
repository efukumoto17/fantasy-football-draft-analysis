// Attaches to the running Chrome via CDP and reports the current page state.
const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.connectOverCDP('http://127.0.0.1:9222');
  const context = browser.contexts()[0];
  const page = context.pages().find(p => p.url().includes('espn')) || context.pages()[0];
  await page.bringToFront().catch(() => {});
  const url = page.url();
  const title = await page.title().catch(() => '');
  // Heuristics for whether we're logged in vs. on a login wall
  const bodyText = (await page.evaluate(() => document.body ? document.body.innerText.slice(0, 400) : '').catch(() => '')) || '';
  const hasLogin = /log ?in|sign ?in/i.test(bodyText) && !/draft strateg/i.test(bodyText.toLowerCase());
  await page.screenshot({ path: __dirname + '/state.png', fullPage: false }).catch(e => console.log('shot err', e.message));
  console.log(JSON.stringify({ url, title, hasLoginHint: hasLogin, bodyPreview: bodyText.replace(/\n/g, ' ').slice(0, 300) }, null, 2));
  await browser.close(); // detaches CDP, does NOT close the browser
})();
