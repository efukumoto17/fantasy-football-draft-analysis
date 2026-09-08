// Evan-focused 2026 draft analysis: optimal lineup, positional VOR, best-available
// at each pick, and the QB-scarcity picture that drives this 2-QB league.
const fs = require('fs');
const path = require('path');
const ROOT = '/Users/evanfukumoto/Documents/VSCodeRepos/fantasy-football';
const B = JSON.parse(fs.readFileSync(path.join(ROOT, '.espn-automation/draft2026_board.json'), 'utf8'));
const ME = 'Evan Fukumoto';
const picks = B.picks;
const byMgr = new Map();
for (const p of picks) {
  if (!byMgr.has(p.manager)) byMgr.set(p.manager, []);
  byMgr.get(p.manager).push(p);
}

// --- Optimal starting lineup: 2QB 2RB 2WR 1TE 1FLEX(RB/WR/TE) 1K 1DST
function lineup(roster) {
  const pool = { QB: [], RB: [], WR: [], TE: [], K: [], DST: [] };
  for (const p of roster) if (pool[p.pos]) pool[p.pos].push(p);
  for (const k in pool) pool[k].sort((a, b) => (b.proj26 || 0) - (a.proj26 || 0));
  const take = (pos, n) => pool[pos].splice(0, n);
  const st = { QB: take('QB', 2), RB: take('RB', 2), WR: take('WR', 2), TE: take('TE', 1), K: take('K', 1), DST: take('DST', 1) };
  const flexPool = [...pool.RB, ...pool.WR, ...pool.TE].sort((a, b) => (b.proj26 || 0) - (a.proj26 || 0));
  st.FLEX = flexPool.slice(0, 1);
  const all = [].concat(...Object.values(st));
  const total = all.reduce((s, p) => s + (p.proj26 || 0), 0);
  const starterIds = new Set(all.map(p => p.id));
  const bench = roster.filter(p => !starterIds.has(p.id)).sort((a, b) => (b.proj26 || 0) - (a.proj26 || 0));
  return { st, total, bench, holes: Object.entries({ QB: 2, RB: 2, WR: 2, TE: 1, K: 1, DST: 1 })
    .filter(([pos, n]) => st[pos].length < n).map(([pos, n]) => `${pos} short ${n - st[pos].length}`) };
}

const rows = [...byMgr.entries()].map(([m, r]) => {
  const L = lineup(r);
  const cnt = {};
  for (const p of r) cnt[p.pos] = (cnt[p.pos] || 0) + 1;
  return { m, total: L.total, L, cnt, roster: r,
    qbStart: L.st.QB.reduce((s, p) => s + (p.proj26 || 0), 0),
    rbStart: L.st.RB.reduce((s, p) => s + (p.proj26 || 0), 0),
    wrStart: L.st.WR.reduce((s, p) => s + (p.proj26 || 0), 0),
    teStart: L.st.TE.reduce((s, p) => s + (p.proj26 || 0), 0),
    flexStart: L.st.FLEX.reduce((s, p) => s + (p.proj26 || 0), 0),
    benchTop3: L.bench.slice(0, 3).reduce((s, p) => s + (p.proj26 || 0), 0),
    avgValSF: r.reduce((s, p) => s + (p.valSF || 0), 0) / r.length };
});
rows.sort((a, b) => b.total - a.total);

console.log('=== PROJECTED STARTING LINEUP STRENGTH (2QB/2RB/2WR/TE/FLEX/K/DST) ===');
console.log('rk  manager                total    QB2     RB2     WR2     TE     FLEX   bench3  QB#  RB#  WR#  TE#  avgValSF');
rows.forEach((r, i) => {
  const f = n => String(Math.round(n)).padStart(6);
  console.log(`${String(i + 1).padStart(2)}  ${r.m.padEnd(20)} ${f(r.total)} ${f(r.qbStart)} ${f(r.rbStart)} ${f(r.wrStart)} ${f(r.teStart)} ${f(r.flexStart)} ${f(r.benchTop3)}  ${String(r.cnt.QB || 0).padStart(2)}   ${String(r.cnt.RB || 0).padStart(2)}   ${String(r.cnt.WR || 0).padStart(2)}   ${String(r.cnt.TE || 0).padStart(2)}   ${r.avgValSF.toFixed(1).padStart(7)}${r.m === ME ? '   <== YOU' : ''}`);
});

// --- QB run
console.log('\n=== QB RUN (2-QB league: 20 starting QB slots) ===');
picks.filter(p => p.pos === 'QB').forEach((p, i) => {
  console.log(`  QB${String(i + 1).padStart(2)}  pick ${String(p.overall).padStart(3)} (R${p.round})  ${p.name.padEnd(22)} ${p.nfl.padEnd(4)} proj ${String(Math.round(p.proj26)).padStart(3)}  ${p.manager}${p.manager === ME ? '  <== YOU' : ''}`);
});

// --- Best available at each of Evan's picks (by proj26 among players taken later or undrafted)
console.log('\n=== BEST AVAILABLE AT EACH OF YOUR PICKS ===');
const mine = byMgr.get(ME);
const laterOrNever = new Map(); // playerId -> pick overall (Infinity if undrafted)
for (const p of picks) laterOrNever.set(p.id, p);
const undraftedPool = B.undrafted.map(u => ({ ...u, overall: Infinity }));
const allPool = picks.concat(undraftedPool);
for (const my of mine) {
  const avail = allPool.filter(x => x.overall >= my.overall && x.id !== my.id && x.pos !== 'K' && x.pos !== 'DST')
    .sort((a, b) => (b.proj26 || 0) - (a.proj26 || 0)).slice(0, 4);
  const better = avail.filter(x => (x.proj26 || 0) > (my.proj26 || 0));
  console.log(`\n  ${my.overall} (R${my.round}) ${my.name} ${my.pos} — proj ${Math.round(my.proj26)}`);
  if (!better.length) { console.log('      BEST AVAILABLE — nobody left projected higher'); continue; }
  for (const a of better.slice(0, 3)) {
    const gone = a.overall === Infinity ? 'went UNDRAFTED' : `went at ${a.overall} to ${a.manager}`;
    console.log(`      passed on ${a.name} (${a.pos}) proj ${Math.round(a.proj26)}  [+${Math.round(a.proj26 - my.proj26)}]  ${gone}`);
  }
}
