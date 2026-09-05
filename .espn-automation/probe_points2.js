const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.connectOverCDP('http://127.0.0.1:9222');
  const page = browser.contexts()[0].pages()[0];
  const out = await page.evaluate(async () => {
    const H = { 'x-fantasy-platform':'espn-fantasy-web','x-fantasy-source':'kona','accept':'application/json' };
    const ids = [4429795, 4362628];
    const results = {};
    const tryOne = async (label, url, filter) => {
      const h={...H}; if(filter) h['x-fantasy-filter']=JSON.stringify(filter);
      let st, cnt=0, sample=null;
      try{
        const r=await fetch(url,{credentials:'include',headers:h}); st=r.status;
        const j=await r.json(); const arr=Array.isArray(j)?j:(j.players||[]); cnt=arr.length;
        const p0=arr[0]&&(arr[0].player||arr[0]);
        if(p0){ const s=(p0.stats||[]).find(s=>s.statSourceId===0&&s.statSplitTypeId===0&&s.seasonId===2024);
          sample={ name:p0.fullName, hasStats:!!(p0.stats&&p0.stats.length), actualSeasonTotal:s?s.appliedTotal:null, statsLen:(p0.stats||[]).length }; }
      }catch(e){ st='ERR '+e.message; }
      results[label]={ status:st, count:cnt, sample };
    };
    const L='https://lm-api-reads.fantasy.espn.com/apis/v3/games/ffl/seasons/2024/segments/0/leagues/275797';
    const PL='https://lm-api-reads.fantasy.espn.com/apis/v3/games/ffl/seasons/2024';
    await tryOne('A_league_kona_sp0', `${L}?scoringPeriodId=0&view=kona_player_info`, {players:{filterIds:{value:ids},limit:10}});
    await tryOne('B_players_kona_playercard', `${PL}/players?view=kona_playercard`, {players:{filterIds:{value:ids},limit:10}});
    await tryOne('C_league_kona_statfilter', `${L}?view=kona_player_info`, {players:{filterIds:{value:ids},limit:10,filterStatsForTopScoringPeriodIds:{value:[]},filterStatsForSplitTypeIds:{value:[0]}}});
    await tryOne('D_players_wl_stats', `${PL}/players?view=players_wl`, {players:{filterIds:{value:ids},limit:10}});
    await tryOne('E_league_mRoster_kona', `${L}?view=kona_player_info&view=mStats`, {players:{filterIds:{value:ids},limit:10}});
    return results;
  });
  console.log(JSON.stringify(out, null, 2));
  // do not close: this browser is the user's live session, attached over CDP
  process.exit(0);
})();
