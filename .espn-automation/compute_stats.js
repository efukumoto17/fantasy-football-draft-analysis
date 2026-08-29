const { chromium } = require('playwright');
const fs = require('fs');

const ROOT = '/Users/evanfukumoto/Documents/VSCodeRepos/ridetrainingscheduling';
const YEARS = [2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025];
const LEAGUE = 275797;
const posMap = {1:'QB',2:'RB',3:'WR',4:'TE',5:'K',16:'D/ST',9:'DT',10:'DE',11:'LB',12:'CB',13:'S',14:'DB',15:'DL'};
const teamMap = {0:'FA',1:'ATL',2:'BUF',3:'CHI',4:'CIN',5:'CLE',6:'DAL',7:'DEN',8:'DET',9:'GB',10:'TEN',11:'IND',12:'KC',13:'LV',14:'LAR',15:'MIA',16:'MIN',17:'NE',18:'NO',19:'NYG',20:'NYJ',21:'PHI',22:'ARI',23:'PIT',24:'LAC',25:'SF',26:'SEA',27:'TB',28:'WSH',29:'CAR',30:'JAX',33:'BAL',34:'HOU'};
const IDP = new Set(['DT','DE','LB','CB','S','DB','DL']);
const csvCell = (s) => { s = (s==null?'':String(s)); return /[",\n]/.test(s) ? '"'+s.replace(/"/g,'""')+'"' : s; };

(async () => {
  const browser = await chromium.connectOverCDP('http://127.0.0.1:9222');
  const page = browser.contexts()[0].pages()[0];
  const allPicks = [];

  for (const year of YEARS) {
    const data = await page.evaluate(async ({ year, LEAGUE }) => {
      const H = { 'x-fantasy-platform':'espn-fantasy-web','x-fantasy-source':'kona','accept':'application/json' };
      const base = `https://lm-api-reads.fantasy.espn.com/apis/v3/games/ffl/seasons/${year}/segments/0/leagues/${LEAGUE}`;
      const lr = await fetch(`${base}?view=mDraftDetail&view=mTeam`, { credentials:'include', headers:H });
      const j = await lr.json();
      const picks = (j.draftDetail && j.draftDetail.picks) || [];
      const teams = (j.teams||[]).map(t => ({ id:t.id, name:(t.name||''), owners:t.owners||[] }));
      const members = (j.members||[]).map(m => ({ id:m.id, displayName:m.displayName, first:m.firstName, last:m.lastName }));
      const ids = [...new Set(picks.map(p=>p.playerId))];
      const filter = { players:{ filterIds:{value:ids}, limit:ids.length+10 } };
      const pr = await fetch(`https://lm-api-reads.fantasy.espn.com/apis/v3/games/ffl/seasons/${year}/players?view=players_wl`,
        { credentials:'include', headers:{...H,'x-fantasy-filter':JSON.stringify(filter)} });
      const pj = await pr.json(); const players = Array.isArray(pj)?pj:(pj.players||[]);
      return { picks, teams, members, players };
    }, { year, LEAGUE });

    const memberById = new Map(data.members.map(m=>[m.id,m]));
    // canonical identity by GUID (merge alias accounts; keep genuinely different people distinct)
    const canonByGuid = {
      '{FA6276CE-FDF6-4F40-A276-CEFDF6DF40AB}':'Ikaika Stone',   // 2018 account
      '{CFA40B64-A9A8-485A-A40B-64A9A8E85A0E}':'Ikaika Stone',   // 2019+ account
      '{0E163951-26DF-4E97-B5B3-D017EE7862FE}':'Daniel Ota',
      '{EBEDCD76-6E3E-4A2C-8ACD-DA55826C9F9A}':'Jeff Chan',      // 10th seat 2018
      '{02AB00F5-CC9D-4CDE-A1B3-738ADCFC6C76}':'Jeffrey Chan',   // 10th seat 2021+
    };
    const mgrName = (m)=>{ if(!m) return 'Unknown'; const f=[m.first,m.last].filter(Boolean).join(' ').replace(/\s+/g,' ').trim(); return f||m.displayName||'Unknown'; };
    const resolve = (o)=> canonByGuid[o] || mgrName(memberById.get(o));
    const teamById = new Map();
    for (const t of data.teams) {
      const names=[...new Set((t.owners||[]).map(resolve))];
      teamById.set(t.id, { name:t.name, manager:names.join(' / ')||'Unknown' });
    }
    const playerById = new Map();
    for (const p of data.players) { const pl=p.player||p; playerById.set(pl.id, {
      name: pl.fullName||[pl.firstName,pl.lastName].filter(Boolean).join(' '),
      team: teamMap[pl.proTeamId]!=null?teamMap[pl.proTeamId]:('T'+pl.proTeamId),
      pos: posMap[pl.defaultPositionId]||('P'+pl.defaultPositionId) }); }

    for (const pk of data.picks) {
      const pl = playerById.get(pk.playerId)||{name:'?',team:'',pos:'?'};
      const tb = teamById.get(pk.teamId)||{name:'',manager:'Unknown'};
      allPicks.push({ year, overall:pk.overallPickNumber, round:pk.roundId, roundPick:pk.roundPickNumber,
        player:pl.name, nflTeam:pl.team, pos:pl.pos, posGroup: IDP.has(pl.pos)?'IDP':pl.pos,
        manager:tb.manager, teamName:tb.name, keeper:pk.keeper });
    }
  }
  await browser.close();

  // combined csv
  const header = 'Year,Round,Round Pick,Overall Pick,Player,NFL Team,Position,Manager,Team Name';
  const rows = allPicks.sort((a,b)=> a.year-b.year || a.overall-b.overall)
    .map(p=>[p.year,p.round,p.roundPick,p.overall,p.player,p.nflTeam,p.pos,p.manager,p.teamName].map(csvCell).join(','));
  fs.writeFileSync(`${ROOT}/draft-history-combined.csv`, header+'\n'+rows.join('\n')+'\n');

  // ---- position by round ----
  const GROUPS = ['QB','RB','WR','TE','K','D/ST','IDP'];
  const maxRound = Math.max(...allPicks.map(p=>p.round));
  // years that actually have each round
  const yearsWithRound = {};
  for (let r=1;r<=maxRound;r++){ yearsWithRound[r] = new Set(allPicks.filter(p=>p.round===r).map(p=>p.year)); }
  const byRound = {};
  for (let r=1;r<=maxRound;r++){
    byRound[r] = {}; const nYears = yearsWithRound[r].size;
    for (const g of GROUPS){
      const total = allPicks.filter(p=>p.round===r && p.posGroup===g).length;
      byRound[r][g] = { avg: total/nYears, total, nYears };
    }
  }

  // ---- per manager ----
  const managers = [...new Set(allPicks.map(p=>p.manager))].sort();
  const perMgr = {};
  for (const mg of managers){
    const mp = allPicks.filter(p=>p.manager===mg);
    const byYear = {};
    for (const y of YEARS){
      const yp = mp.filter(p=>p.year===y).sort((a,b)=>a.overall-b.overall);
      if (!yp.length) continue;
      const firstQB = yp.find(p=>p.pos==='QB');
      const firstTE = yp.find(p=>p.pos==='TE');
      const first6 = yp.filter(p=>p.round<=6);
      byYear[y] = {
        picks: yp.map(p=>({r:p.round, pos:p.pos, player:p.player})),
        firstQBRound: firstQB?firstQB.round:null,
        firstTERound: firstTE?firstTE.round:null,
        firstRBRound: (yp.find(p=>p.pos==='RB')||{}).round||null,
        firstWRRound: (yp.find(p=>p.pos==='WR')||{}).round||null,
        rbFirst6: first6.filter(p=>p.pos==='RB').length,
        wrFirst6: first6.filter(p=>p.pos==='WR').length,
        p1to3: yp.filter(p=>p.round<=3).map(p=>p.pos),
      };
    }
    // aggregate offensive counts
    const off = mp.filter(p=>['QB','RB','WR','TE'].includes(p.pos));
    const cnt = (pos)=>off.filter(p=>p.pos===pos).length;
    const avg = (arr)=> arr.length? (arr.reduce((a,b)=>a+b,0)/arr.length):null;
    perMgr[mg] = {
      byYear,
      totals: { QB:cnt('QB'), RB:cnt('RB'), WR:cnt('WR'), TE:cnt('TE'),
                K: mp.filter(p=>p.pos==='K').length, DST: mp.filter(p=>p.pos==='D/ST').length,
                IDP: mp.filter(p=>p.posGroup==='IDP').length },
      avgFirstQBRound: avg(Object.values(byYear).map(y=>y.firstQBRound).filter(Boolean)),
      avgFirstTERound: avg(Object.values(byYear).map(y=>y.firstTERound).filter(Boolean)),
      rbFirst6Total: Object.values(byYear).reduce((a,y)=>a+y.rbFirst6,0),
      wrFirst6Total: Object.values(byYear).reduce((a,y)=>a+y.wrFirst6,0),
      round1: Object.values(byYear).map(y=>y.picks.find(pp=>pp.r===1)).filter(Boolean).map(pp=>`${pp.pos}`),
    };
  }

  fs.writeFileSync(`${ROOT}/.espn-automation/analysis_stats.json`, JSON.stringify({ GROUPS, maxRound, byRound, perMgr, yearsWithRound: Object.fromEntries(Object.entries(yearsWithRound).map(([k,v])=>[k,[...v]])) }, null, 2));

  // pretty print position-by-round table
  console.log('POSITION BY ROUND (avg picks per round across years)\n');
  console.log('Rnd | ' + GROUPS.map(g=>g.padStart(5)).join(' ') + ' | yrs');
  for (let r=1;r<=maxRound;r++){
    console.log(String(r).padStart(3)+' | '+GROUPS.map(g=>byRound[r][g].avg.toFixed(1).padStart(5)).join(' ')+' | '+yearsWithRound[r].size);
  }
  console.log('\nManagers:', managers.join(', '));
  console.log('wrote draft-history-combined.csv and analysis_stats.json');
})();
