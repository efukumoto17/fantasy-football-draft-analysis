const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.connectOverCDP('http://127.0.0.1:9222');
  const page = browser.contexts()[0].pages()[0];
  const out = await page.evaluate(async () => {
    const H = { 'x-fantasy-platform':'espn-fantasy-web','x-fantasy-source':'kona','accept':'application/json' };
    // known 2025 drafted ids include 4362628 (Chase pick 1). Try a few strategies.
    const ids = [4362628, 4429795, 4430807]; // Chase, Gibbs, Bijan
    const results = {};

    // A: filterIds via players_wl for 2025
    const fA = { players: { filterIds: { value: ids }, limit: 100 } };
    let r = await fetch('https://lm-api-reads.fantasy.espn.com/apis/v3/games/ffl/seasons/2025/players?scoringPeriodId=0&view=players_wl',
      { credentials:'include', headers:{...H,'x-fantasy-filter':JSON.stringify(fA)} });
    let j = await r.json(); let arr = Array.isArray(j)?j:(j.players||[]);
    results.A_filterIds_players_wl = { status:r.status, count:arr.length, ids: arr.slice(0,5).map(p=>(p.id||p.player&&p.player.id)) };

    // B: kona_player_info on league endpoint with filter
    const fB = { players: { filterIds: { value: ids }, limit: 100 } };
    r = await fetch('https://lm-api-reads.fantasy.espn.com/apis/v3/games/ffl/seasons/2025/segments/0/leagues/275797?view=kona_player_info',
      { credentials:'include', headers:{...H,'x-fantasy-filter':JSON.stringify(fB)} });
    j = await r.json(); arr = (j.players||[]);
    results.B_kona_player_info = { status:r.status, count:arr.length, sample: arr[0] ? { id:arr[0].id||arr[0].player&&arr[0].player.id, name:(arr[0].player&&arr[0].player.fullName)} : null };

    // C: players endpoint no filter but check default count for 2025
    r = await fetch('https://lm-api-reads.fantasy.espn.com/apis/v3/games/ffl/seasons/2025/players?scoringPeriodId=0&view=players_wl',
      { credentials:'include', headers:H });
    j = await r.json(); arr = Array.isArray(j)?j:(j.players||[]);
    results.C_nofilter = { status:r.status, count:arr.length };

    return results;
  });
  console.log(JSON.stringify(out, null, 2));
  // do not close: this browser is the user's live session, attached over CDP
  process.exit(0);
})();
