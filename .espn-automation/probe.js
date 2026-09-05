const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.connectOverCDP('http://127.0.0.1:9222');
  const context = browser.contexts()[0];
  const page = context.pages().find(p => p.url().includes('editdraftstrategy')) || context.pages()[0];

  const info = await page.evaluate(() => {
    const out = {};
    // Find the ranking table rows
    const rows = Array.from(document.querySelectorAll('tr'));
    out.trCount = rows.length;

    // Look at a data row: find one containing a known player name
    const dataRows = rows.filter(r => /Gibbs|Bijan|Chase|Nacua/.test(r.textContent || ''));
    out.sampleRowCount = dataRows.length;
    if (dataRows[0]) {
      const r = dataRows[0];
      out.sampleRowHTML = r.outerHTML.slice(0, 2000);
      // collect data-* attributes on row and descendants
      const attrs = [];
      r.querySelectorAll('*').forEach(el => {
        for (const a of el.attributes) {
          if (a.name.startsWith('data-') || a.name === 'draggable' || a.name.includes('id')) {
            attrs.push(el.tagName + '[' + a.name + '=' + a.value.slice(0, 40) + ']');
          }
        }
      });
      out.rowAttrs = [...new Set(attrs)].slice(0, 40);
    }

    // How many player rows total currently in DOM (virtualization check)
    const nameCells = Array.from(document.querySelectorAll('a, span'))
      .filter(el => /^[A-Z][a-z].*\s[A-Z]/.test((el.textContent||'').trim()) && (el.textContent||'').length < 30);
    out.approxNameNodes = nameCells.length;

    // Save button?
    const buttons = Array.from(document.querySelectorAll('button, a, [role=button]'))
      .map(b => (b.textContent||'').trim())
      .filter(t => t && t.length < 30);
    out.buttonTexts = [...new Set(buttons)].slice(0, 40);

    // Is there a scroll container?
    out.pageScrollHeight = document.documentElement.scrollHeight;
    out.windowHeight = window.innerHeight;
    return out;
  });

  console.log(JSON.stringify(info, null, 2));
  // do not close: this browser is the user's live session, attached over CDP
  process.exit(0);
})();
