const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.connectOverCDP('http://127.0.0.1:9222');
  const page = browser.contexts()[0].pages()[0];
  const out = await page.evaluate(async () => {
    const H = { 'x-fantasy-platform':'espn-fantasy-web','x-fantasy-source':'kona','accept':'application/json' };
    const L='https://lm-api-reads.fantasy.espn.com/apis/v3/games/ffl/seasons/2024/segments/0/leagues/275797?view=kona_player_info';
    const ids=[4429795,4362628];
    const seasonTotal = p => { const s=(p.stats||[]).find(s=>s.statSplitTypeId===0 && s.statSourceId===0 && s.seasonId===2024); return s?s.appliedTotal:null; };
    const res={};
    const run=async(label,filter)=>{
      try{
        const r=await fetch(L,{credentials:'include',headers:{...H,'x-fantasy-filter':JSON.stringify(filter)}});
        const st=r.status; let arr=[]; try{const j=await r.json();arr=j.players||[];}catch(e){}
        const p0=arr[0]&&arr[0].player;
        res[label]={status:st,count:arr.length,first:p0?{name:p0.fullName,seasonTotal:seasonTotal(p0),statSplits:[...new Set((p0.stats||[]).map(s=>s.statSplitTypeId+'/'+s.statSourceId))]}:null};
      }catch(e){res[label]={err:String(e).slice(0,60)};}
    };
    await run('T1_sort002024', {players:{limit:60,filterStatsForSplitTypeIds:{value:[0]},sortAppliedStatTotal:{sortAsc:false,sortPriority:1,value:"002024"}}});
    await run('T2_ids_split0', {players:{filterIds:{value:ids},filterStatsForSplitTypeIds:{value:[0]},limit:50}});
    await run('T3_sortStd', {players:{limit:60,sortAppliedStatTotal:{sortAsc:false,sortPriority:1,value:"002024"},filterStatsForSourceIds:{value:[0]}}});
    return res;
  });
  console.log(JSON.stringify(out, null, 2));
  // do not close: this browser is the user's live session, attached over CDP
  process.exit(0);
})();
