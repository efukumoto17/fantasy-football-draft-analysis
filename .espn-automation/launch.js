// Launches a visible, persistent Chrome with a CDP endpoint so other scripts
// can attach step-by-step. Keeps running until killed.
const { chromium } = require('playwright');

(async () => {
  const context = await chromium.launchPersistentContext(
    __dirname + '/profile',
    {
      headless: false,
      channel: 'chrome',
      viewport: null,
      args: ['--remote-debugging-port=9222'],
    }
  );
  const page = context.pages()[0] || (await context.newPage());
  await page.goto('https://fantasy.espn.com/football/editdraftstrategy?leagueId=275797', {
    waitUntil: 'domcontentloaded',
  }).catch((e) => console.log('goto note:', e.message));
  console.log('READY: browser is open on the ESPN page (CDP at http://127.0.0.1:9222)');
  // Keep alive
  await new Promise(() => {});
})();
