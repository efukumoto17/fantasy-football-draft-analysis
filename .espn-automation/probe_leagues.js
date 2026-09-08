const { chromium } = require('playwright');
const fs = require('fs');
(async () => {
  const b = await chromium.connectOverCDP('http://127.0.0.1:9222');
  const ctx = b.contexts()[0];
  // SWID identifies the fan; needed for the fan API
  const cookies = await ctx.cookies('https://fantasy.espn.com');
  const swid = (cookies.find(c=>c.name==='SWID')||{}).value;
  console.log('SWID present:', !!swid);
  const req = ctx.request;
  const H = {'x-fantasy-platform':'espn-fantasy-web','x-fantasy-source':'kona',accept:'application/json'};
  const tries = [
    `https://fan.api.espn.com/apis/v2/fans/${encodeURIComponent(swid||'')}?featureFlags=challengeEntries&showAirings=false&source=ESPN.com%2B-%2BFantasy%2BLeague%2BManager&lang=en&section=espn&region=us`,
    'https://lm-api-reads.fantasy.espn.com/apis/v3/games/ffl/seasons/2026?view=chui_default',
  ];
  for (const u of tries) {
    try {
      const r = await req.get(u, {headers:H, timeout:45000});
      const t = await r.text();
      console.log(`\n${r.status()} len=${t.length} :: ${u.slice(0,80)}`);
      if (r.status()===200 && t.length>50) {
        fs.writeFileSync('/private/tmp/claude-501/-Users-evanfukumoto-Documents-VSCodeRepos-fantasy-football/e1d95394-e3b1-4eac-9258-92554aeea5e4/scratchpad/fan.json', t);
        try {
          const j = JSON.parse(t);
          const prefs = j.preferences||[];
          console.log('  preferences:', prefs.length);
          for (const p of prefs) {
            const m = p.metaData && p.metaData.entry;
            if (m && m.gameId===1) console.log(`   FFL league ${m.groups&&m.groups[0]&&m.groups[0].groupId} · team "${m.entryMetadata&&m.entryMetadata.teamName||m.name}" · season ${m.seasonId}`);
          }
        } catch(e){ console.log('  parse note:', e.message); }
      }
    } catch(e){ console.log('  ERR', e.message.slice(0,80)); }
  }
  process.exit(0);
})();
