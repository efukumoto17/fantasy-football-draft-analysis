const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.connectOverCDP('http://127.0.0.1:9222');
  const page = browser.contexts()[0].pages()[0];
  const out = await page.evaluate(async () => {
    const H = { 'x-fantasy-platform':'espn-fantasy-web','x-fantasy-source':'kona','accept':'application/json' };
    const res = {};
    for (let y=2018; y<=2025; y++){
      const r = await fetch(`https://lm-api-reads.fantasy.espn.com/apis/v3/games/ffl/seasons/${y}/segments/0/leagues/275797?view=mTeam`, { credentials:'include', headers:H });
      const j = await r.json();
      const mem = new Map((j.members||[]).map(m=>[m.id,{first:m.firstName,last:m.lastName,disp:m.displayName}]));
      res[y] = (j.teams||[]).map(t=>{
        const o = (t.owners||[])[0];
        const m = mem.get(o)||{};
        return { g:o, name:[m.first,m.last].filter(Boolean).join(' ')||m.disp };
      });
    }
    return res;
  });
  // build GUID -> set of names
  const guidNames = {};
  for (const y of Object.keys(out)) for (const t of out[y]) { (guidNames[t.g]=guidNames[t.g]||new Set()).add(t.name); }
  console.log('=== GUID -> names seen (across years) ===');
  Object.entries(guidNames).forEach(([g,names])=>console.log(g, '->', [...names].join(' | ')));
  console.log('\n=== per-year roster (GUID short) ===');
  for (const y of Object.keys(out)) console.log(y+':', out[y].map(t=>t.name+' ['+t.g.slice(1,5)+']').join(', '));
  // do not close: this browser is the user's live session, attached over CDP
  process.exit(0);
})();
