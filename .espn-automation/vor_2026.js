// Raw projections aren't comparable across positions (QBs out-score RBs by ~100
// points before anyone starts one). This scores every pick as value over
// replacement, where replacement = the last player at that position who would
// realistically start in a 10-team, 2-QB league.
const fs = require('fs');
const path = require('path');
const ROOT = '/Users/evanfukumoto/Documents/VSCodeRepos/fantasy-football';
const B = JSON.parse(fs.readFileSync(path.join(ROOT, '.espn-automation/draft2026_board.json'), 'utf8'));
const ME = 'Evan Fukumoto';
const pool = B.picks.concat(B.undrafted.map(u => ({ ...u, overall: Infinity, manager: 'UNDRAFTED' })));

// Starting demand in a 10-team league: 20 QB, 20 RB, 20 WR, 10 TE, +10 FLEX
// spread across RB/WR/TE. Replacement is the first player past that demand.
const DEMAND = { QB: 20, RB: 25, WR: 27, TE: 12, K: 10, DST: 10 };
const repl = {};
for (const pos of Object.keys(DEMAND)) {
  const ranked = pool.filter(p => p.pos === pos && p.proj26 != null).sort((a, b) => b.proj26 - a.proj26);
  repl[pos] = ranked[DEMAND[pos]] ? ranked[DEMAND[pos]].proj26 : (ranked[ranked.length - 1] || {}).proj26 || 0;
}
console.log('Replacement level (proj pts):', Object.entries(repl).map(([k, v]) => `${k} ${Math.round(v)}`).join('  '));

const vor = p => (p.proj26 == null ? 0 : p.proj26 - (repl[p.pos] || 0));
for (const p of pool) p.vor = vor(p);

const byMgr = new Map();
for (const p of B.picks) { if (!byMgr.has(p.manager)) byMgr.set(p.manager, []); byMgr.get(p.manager).push(p); }

// Team VOR counting only what can actually start (2QB/2RB/2WR/1TE/1FLEX/K/DST)
function startVor(r) {
  const g = { QB: [], RB: [], WR: [], TE: [], K: [], DST: [] };
  for (const p of r) if (g[p.pos]) g[p.pos].push(p);
  for (const k in g) g[k].sort((a, b) => b.vor - a.vor);
  const st = [...g.QB.slice(0, 2), ...g.RB.slice(0, 2), ...g.WR.slice(0, 2), ...g.TE.slice(0, 1), ...g.K.slice(0, 1), ...g.DST.slice(0, 1)];
  const flex = [...g.RB.slice(2), ...g.WR.slice(2), ...g.TE.slice(1)].sort((a, b) => b.vor - a.vor)[0];
  if (flex) st.push(flex);
  return { total: st.reduce((s, p) => s + p.vor, 0), st };
}

const rows = [...byMgr.entries()].map(([m, r]) => ({
  m, sv: startVor(r).total,
  draftVor: r.reduce((s, p) => s + p.vor, 0),
  best: r.slice().sort((a, b) => (b.overall - b.vor) - (a.overall - a.vor)).slice(0, 0),
})).sort((a, b) => b.sv - a.sv);

console.log('\n=== STARTING-LINEUP VALUE OVER REPLACEMENT ===');
rows.forEach((r, i) => console.log(`${String(i + 1).padStart(2)}  ${r.m.padEnd(21)} startVOR ${String(Math.round(r.sv)).padStart(5)}   totalDraftVOR ${String(Math.round(r.draftVor)).padStart(5)}${r.m === ME ? '   <== YOU' : ''}`));

console.log('\n=== YOUR PICKS, SCORED BY VOR (positional, not raw points) ===');
console.log('  pick  player                    pos  proj  VOR   bestAvailAtPos(VOR)  passedUp');
for (const my of byMgr.get(ME)) {
  const avail = pool.filter(x => x.overall >= my.overall && x.id !== my.id);
  const bestAny = avail.slice().sort((a, b) => b.vor - a.vor)[0];
  const gap = bestAny ? bestAny.vor - my.vor : 0;
  const tag = bestAny && gap > 0 ? `${bestAny.name} (${bestAny.pos}, VOR ${Math.round(bestAny.vor)}) [-${Math.round(gap)}]` : 'best available';
  console.log(`  ${String(my.overall).padStart(4)}  ${my.name.padEnd(24)} ${my.pos.padEnd(4)} ${String(Math.round(my.proj26)).padStart(4)}  ${String(Math.round(my.vor)).padStart(4)}   ${tag}`);
}

console.log('\n=== BIGGEST VALUES / REACHES, WHOLE DRAFT (VOR vs pick slot) ===');
const scored = B.picks.map(p => ({ ...p, surplus: p.vor - (200 - p.overall * 1.1) }));
const sortedV = B.picks.slice().sort((a, b) => b.vor - a.vor);
console.log('Top 12 picks by VOR:');
sortedV.slice(0, 12).forEach(p => console.log(`  VOR ${String(Math.round(p.vor)).padStart(4)}  pick ${String(p.overall).padStart(3)}  ${p.name.padEnd(22)} ${p.pos.padEnd(4)} ${p.manager}`));
console.log('\nWorst 10 picks inside the top 100 by VOR:');
B.picks.filter(p => p.overall <= 100).sort((a, b) => a.vor - b.vor).slice(0, 10)
  .forEach(p => console.log(`  VOR ${String(Math.round(p.vor)).padStart(4)}  pick ${String(p.overall).padStart(3)}  ${p.name.padEnd(22)} ${p.pos.padEnd(4)} ${p.manager}`));
