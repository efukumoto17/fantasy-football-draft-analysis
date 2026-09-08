const fs = require('fs');
const path = require('path');
const ROOT = '/Users/evanfukumoto/Documents/VSCodeRepos/fantasy-football';
const B = JSON.parse(fs.readFileSync(path.join(ROOT, '.espn-automation/draft2026_board.json'), 'utf8'));
const ME = 'Evan Fukumoto';
const pool = B.picks.concat(B.undrafted.map(u => ({ ...u, overall: Infinity, manager: 'UNDRAFTED' })));

// --- How flat is each position? Drop from the best drafted player to the last
// one who would still start somewhere in the league.
console.log('=== POSITIONAL SCARCITY: is it worth paying up? ===');
console.log('pos  starters  best  last-starter  drop   drop/week');
for (const [pos, need] of [['QB', 20], ['RB', 25], ['WR', 27], ['TE', 12]]) {
  const r = pool.filter(p => p.pos === pos && p.proj26 != null).sort((a, b) => b.proj26 - a.proj26);
  const top = r[0].proj26, last = r[need - 1].proj26;
  console.log(`${pos.padEnd(4)} ${String(need).padStart(8)}  ${String(Math.round(top)).padStart(4)}  ${String(Math.round(last)).padStart(12)}  ${String(Math.round(top - last)).padStart(4)}   ${((top - last) / 17).toFixed(1)}`);
}
const qbs = pool.filter(p => p.pos === 'QB' && p.proj26 != null).sort((a, b) => b.proj26 - a.proj26);
console.log('\nQB curve:', [1, 5, 10, 15, 20, 25].map(n => `QB${n}=${Math.round(qbs[n - 1].proj26)}`).join('  '));
const rbs = pool.filter(p => p.pos === 'RB' && p.proj26 != null).sort((a, b) => b.proj26 - a.proj26);
console.log('RB curve:', [1, 5, 10, 15, 20, 25].map(n => `RB${n}=${Math.round(rbs[n - 1].proj26)}`).join('  '));

// --- Where does Evan rank at each starting slot?
const byMgr = new Map();
for (const p of B.picks) { if (!byMgr.has(p.manager)) byMgr.set(p.manager, []); byMgr.get(p.manager).push(p); }
function slots(r) {
  const g = { QB: [], RB: [], WR: [], TE: [], K: [], DST: [] };
  for (const p of r) if (g[p.pos]) g[p.pos].push(p);
  for (const k in g) g[k].sort((a, b) => (b.proj26 || 0) - (a.proj26 || 0));
  const flex = [...g.RB.slice(2), ...g.WR.slice(2), ...g.TE.slice(1)].sort((a, b) => (b.proj26 || 0) - (a.proj26 || 0))[0];
  const sum = a => a.reduce((s, p) => s + (p.proj26 || 0), 0);
  return { QB: sum(g.QB.slice(0, 2)), RB: sum(g.RB.slice(0, 2)), WR: sum(g.WR.slice(0, 2)),
           TE: sum(g.TE.slice(0, 1)), FLEX: flex ? flex.proj26 : 0, g,
           QB3: g.QB[2] ? g.QB[2].proj26 : 0 };
}
const S = new Map([...byMgr.entries()].map(([m, r]) => [m, slots(r)]));
console.log('\n=== YOUR RANK AT EACH STARTING SLOT (of 10) ===');
for (const slot of ['QB', 'RB', 'WR', 'TE', 'FLEX', 'QB3']) {
  const ord = [...S.entries()].sort((a, b) => b[1][slot] - a[1][slot]);
  const rank = ord.findIndex(([m]) => m === ME) + 1;
  const mine = Math.round(ord[rank - 1][1][slot]);
  const best = Math.round(ord[0][1][slot]);
  console.log(`  ${slot.padEnd(5)} rank ${String(rank).padStart(2)}/10   you ${String(mine).padStart(4)}   league best ${String(best).padStart(4)} (${ord[0][0]})   gap ${String(Math.round(mine - best)).padStart(5)}`);
}

// --- Roster composition + risk
const mine = byMgr.get(ME);
const cnt = {};
for (const p of mine) cnt[p.pos] = (cnt[p.pos] || 0) + 1;
console.log('\n=== ROSTER ===', Object.entries(cnt).map(([k, v]) => `${k}:${v}`).join(' '));
console.log('Injury flags:', mine.filter(p => p.injStatus && p.injStatus !== 'ACTIVE').map(p => `${p.name}(${p.injStatus})`).join(', ') || 'none');

// --- Best undrafted players still on waivers
console.log('\n=== TOP UNDRAFTED (waiver targets) ===');
B.undrafted.filter(p => p.proj26).sort((a, b) => b.proj26 - a.proj26).slice(0, 15)
  .forEach(p => console.log(`  ${p.name.padEnd(24)} ${p.pos.padEnd(4)} ${p.nfl.padEnd(4)} proj ${Math.round(p.proj26)}`));

// --- The counterfactual: what if Evan had taken a top-6 QB in round 2 instead of Walker?
const walker = mine.find(p => p.name.includes('Walker'));
const hurts = B.picks.find(p => p.name === 'Jalen Hurts');
console.log('\n=== COUNTERFACTUAL: QB early vs. RB early ===');
console.log(`You took ${walker.name} at 19 (proj ${Math.round(walker.proj26)}). ${hurts.name} went next at 20 (proj ${Math.round(hurts.proj26)}).`);
console.log(`Swapping would have upgraded QB2 by ${Math.round(hurts.proj26 - S.get(ME).g.QB[1].proj26)} pts but cost you the RB slot:`);
console.log(`  your RB2 today: ${S.get(ME).g.RB.slice(0,2).map(p=>p.name+' '+Math.round(p.proj26)).join(' + ')}`);
console.log(`  RB available at your next pick (22): ${pool.filter(p=>p.pos==='RB'&&p.overall>=22).sort((a,b)=>b.proj26-a.proj26)[0].name}`);
