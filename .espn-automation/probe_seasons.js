const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.connectOverCDP('http://127.0.0.1:9222');
  const page = browser.contexts()[0].pages()[0];
  const out = await page.evaluate(async () => {
    const H = { 'x-fantasy-platform':'espn-fantasy-web','x-fantasy-source':'kona','accept':'application/json' };
    const rows = [];
    for (let y=2014; y<=2026; y++){
      try {
        const r = await fetch(`https://lm-api-reads.fantasy.espn.com/apis/v3/games/ffl/seasons/${y}/segments/0/leagues/275797?view=mDraftDetail&view=mSettings`,
          { credentials:'include', headers:H });
        if (!r.ok) { rows.push({ y, status:r.status }); continue; }
        const j = await r.json();
        const picks = (j.draftDetail && j.draftDetail.picks) || [];
        const size = j.settings ? j.settings.size : null;
        const ls = j.settings && j.settings.rosterSettings ? j.settings.rosterSettings.lineupSlotCounts : {};
        const idp = Object.keys(ls).some(k=>['8','9','10','11','12','13','14','15'].includes(k) && ls[k]>0);
        const qbStart = ls['0']||0;
        rows.push({ y, status:r.status, picks:picks.length, size, rounds: picks.length&&size?picks.length/size:null, idp, qbStart, drafted: j.draftDetail?j.draftDetail.drafted:null });
      } catch(e){ rows.push({ y, err:e.message }); }
    }
    return rows;
  });
  out.forEach(r=>console.log(JSON.stringify(r)));
  await browser.close();
})();
