const { chromium } = require('playwright');
const fs = require('fs');
const ROOT = '/Users/evanfukumoto/Documents/VSCodeRepos/ridetrainingscheduling';
const posMap = {1:'QB',2:'RB',3:'WR',4:'TE',5:'K',16:'D/ST',9:'DT',10:'DE',11:'LB',12:'CB',13:'S',14:'DB',15:'DL'};

(async () => {
  const browser = await chromium.connectOverCDP('http://127.0.0.1:9222');
  const page = browser.contexts()[0].pages()[0];
  const all = {};
  for (const year of [2022,2023,2024,2025]) {
    const data = await page.evaluate(async ({year}) => {
      const H = { 'x-fantasy-platform':'espn-fantasy-web','x-fantasy-source':'kona','accept':'application/json' };
      const filter = { players:{ limit:2000,
        filterStatsForSplitTypeIds:{value:[0]}, filterStatsForSourceIds:{value:[0]},
        sortAppliedStatTotal:{sortAsc:false,sortPriority:1,value:"00"+year} } };
      const r = await fetch(`https://lm-api-reads.fantasy.espn.com/apis/v3/games/ffl/seasons/${year}/segments/0/leagues/275797?view=kona_player_info`,
        { credentials:'include', headers:{...H,'x-fantasy-filter':JSON.stringify(filter)} });
      const j = await r.json();
      return (j.players||[]).map(e=>{ const p=e.player;
        const s=(p.stats||[]).find(s=>s.statSplitTypeId===0 && s.statSourceId===0 && s.seasonId===year);
        return { id:p.id, name:p.fullName, posId:p.defaultPositionId, pts: s?Math.round(s.appliedTotal*10)/10:0 };
      });
    }, {year});
    all[year] = data;
    console.log(`${year}: ${data.length} players, top: ${data[0].name} ${data[0].pts}`);
  }
  fs.writeFileSync(`${ROOT}/.espn-automation/season_points.json`, JSON.stringify(all));
  // do not close: this browser is the user's live session, attached over CDP
  process.exit(0);
})();
