const { chromium } = require('playwright');
const fs = require('fs');

(async () => {
  const browser = await chromium.connectOverCDP('http://127.0.0.1:9222');
  const context = browser.contexts()[0];
  const page = context.pages().find(p => p.url().includes('editdraftstrategy')) || context.pages()[0];

  const reqs = [];
  const keep = (u, m, rt) => {
    if (/google|doubleclick|rubicon|gen_204|heartbeat|presence|combiner|\.png|\.css|\.js($|\?)|serverComponent|lastReadByMember/i.test(u)) return false;
    if (/lm-api-writes/i.test(u)) return true;
    if (/lm-api|fantasy\.espn\.com\/apis/i.test(u) && m !== 'GET') return true;
    if (rt === 'ping') return true;
    return false;
  };
  page.on('request', (req) => {
    if (keep(req.url(), req.method(), req.resourceType()))
      reqs.push({ t: 'req', method: req.method(), rt: req.resourceType(), url: req.url(), postData: (req.postData()||'').slice(0,4000) });
  });

  // Look for save/done buttons
  const buttons = await page.evaluate(() => Array.from(document.querySelectorAll('button, a, [role=button]'))
    .map(b => ({ txt: (b.textContent||'').trim(), cls: (b.className||'').toString().slice(0,50) }))
    .filter(b => /save|done|apply|finish|submit|confirm/i.test(b.txt) && b.txt.length < 40));
  console.log('save-like buttons:', JSON.stringify(buttons));

  // Do another drag (row3 -> row1) then wait long
  await page.evaluate(() => {
    const rows = Array.from(document.querySelectorAll('tr[data-player-row]'));
    const src = rows[2], tgt = rows[0];
    const dt = new DataTransfer();
    const fire = (el, type, top) => { const r = el.getBoundingClientRect();
      el.dispatchEvent(new DragEvent(type, { bubbles:true, cancelable:true, composed:true, dataTransfer:dt, clientX:r.x+r.width/2, clientY:r.y+(top?2:r.height/2)})); };
    fire(src,'dragstart'); fire(tgt,'dragenter'); fire(tgt,'dragover',true); fire(tgt,'drop',true); fire(src,'dragend');
  });
  console.log('did drag, waiting 8s for any save...');
  await page.waitForTimeout(8000);

  console.log('captured requests:', reqs.length);
  for (const r of reqs) console.log(`${r.method} [${r.rt}] ${r.url.slice(0,170)}\n   body: ${(r.postData||'').slice(0,500)}`);
  fs.writeFileSync(__dirname + '/write_calls.json', JSON.stringify(reqs, null, 2));
  // do not close: this browser is the user's live session, attached over CDP
  process.exit(0);
})();
