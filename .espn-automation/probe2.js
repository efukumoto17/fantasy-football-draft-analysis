const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.connectOverCDP('http://127.0.0.1:9222');
  const context = browser.contexts()[0];
  const page = context.pages().find(p => p.url().includes('editdraftstrategy')) || context.pages()[0];

  const info = await page.evaluate(() => {
    const out = {};
    // scroll parents of a row
    const row = document.querySelector('tr[data-player-row]');
    const chain = [];
    let el = row;
    while (el && el !== document.body) {
      const st = getComputedStyle(el);
      if (/(auto|scroll)/.test(st.overflowY) || el.scrollHeight > el.clientHeight + 20) {
        chain.push({ tag: el.tagName, cls: (el.className||'').toString().slice(0,60), overflowY: st.overflowY, scrollH: el.scrollHeight, clientH: el.clientHeight });
      }
      el = el.parentElement;
    }
    out.scrollAncestors = chain;

    // pagination / filter controls near the table
    const controls = Array.from(document.querySelectorAll('select, .dropdown, [class*=pagination], [class*=Pagination], [class*=filter], [class*=Filter], [class*=tabs], [role=tab]'))
      .map(e => ({ tag: e.tagName, cls: (e.className||'').toString().slice(0,50), txt: (e.textContent||'').trim().slice(0,60) }))
      .filter(e => e.txt || e.tag === 'SELECT');
    out.controls = controls.slice(0, 30);

    // select options (position/count filters)
    out.selects = Array.from(document.querySelectorAll('select')).map(s => ({
      cls: (s.className||'').toString().slice(0,40),
      options: Array.from(s.options).map(o => o.textContent.trim())
    }));

    // any text mentioning count like "Showing" or "1-50"
    out.bodyMentionsShow = (document.body.innerText.match(/showing[^\n]{0,40}|\b1\s*-\s*50\b|\b50 of\b|\bof \d{2,3}\b/gi) || []).slice(0,5);
    return out;
  });
  console.log(JSON.stringify(info, null, 2));
  // do not close: this browser is the user's live session, attached over CDP
  process.exit(0);
})();
