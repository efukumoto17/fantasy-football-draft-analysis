const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.connectOverCDP('http://127.0.0.1:9222');
  const page = browser.contexts()[0].pages()[0];
  const out = await page.evaluate(async () => {
    const H = { 'x-fantasy-platform':'espn-fantasy-web','x-fantasy-source':'kona','accept':'application/json' };
    const ids = [4362628, 4429795, 4430807];
    const tries = {};
    const run = async (label, url, filter) => {
      const h = { ...H }; if (filter) h['x-fantasy-filter'] = JSON.stringify(filter);
      const r = await fetch(url, { credentials:'include', headers:h });
      let arr=[]; let st=r.status; try{ const j=await r.json(); arr=Array.isArray(j)?j:(j.players||[]); }catch(e){}
      const found = arr.filter(p => ids.includes(p.id||(p.player&&p.player.id))).map(p=>(p.player&&p.player.fullName)||p.fullName);
      tries[label] = { status:st, count:arr.length, foundTargets:found };
    };
    const P = 'https://lm-api-reads.fantasy.espn.com/apis/v3/games/ffl/seasons/2025/players?scoringPeriodId=0&view=players_wl';
    const L = 'https://lm-api-reads.fantasy.espn.com/apis/v3/games/ffl/seasons/2025/segments/0/leagues/275797';
    await run('limit1500', P, { players:{ limit:1500 } });
    await run('filterIds_active', P, { players:{ filterIds:{value:ids}, filterActive:{value:true}, limit:100 } });
    await run('kona_filterIds', L+'?view=kona_player_info', { players:{ filterIds:{value:ids}, limit:100 } });
    await run('kona_limit', L+'?view=kona_player_info', { players:{ limit:100 } });
    return tries;
  });
  console.log(JSON.stringify(out, null, 2));
  // do not close: this browser is the user's live session, attached over CDP
  process.exit(0);
})();
