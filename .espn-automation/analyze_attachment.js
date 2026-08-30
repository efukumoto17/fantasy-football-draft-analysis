// Manager <-> player attachment. Measures how repeatedly each manager rosters
// the same player: weeks held, seasons, separate stints (re-acquisitions), the
// share of that player's league-wide rostered weeks that went to them, and
// repeat drafting back to 2018.
const fs = require('fs');
const path = require('path');
const ROOT = '/Users/evanfukumoto/Documents/VSCodeRepos/fantasy-football';
const YEARS = ['2022', '2023', '2024', '2025'];

const parseCsv = (f) => {
  const txt = fs.readFileSync(f, 'utf8');
  const rows = []; let cur = [], field = '', q = false;
  for (let i = 0; i < txt.length; i++) {
    const c = txt[i];
    if (q) { if (c === '"') { if (txt[i+1] === '"') { field += '"'; i++; } else q = false; } else field += c; }
    else if (c === '"') q = true;
    else if (c === ',') { cur.push(field); field = ''; }
    else if (c === '\n') { cur.push(field); rows.push(cur); cur = []; field = ''; }
    else if (c !== '\r') field += c;
  }
  if (field || cur.length) { cur.push(field); rows.push(cur); }
  const head = rows.shift();
  return rows.filter(r => r.length === head.length).map(r => Object.fromEntries(head.map((h, i) => [h, r[i]])));
};
const csvEsc = (v) => { const s = v == null ? '' : String(v); return /[",\n]/.test(s) ? '"' + s.replace(/"/g,'""') + '"' : s; };

// "Jeff Chan" (2018) and "Jeffrey Chan" are the same person.
const ALIAS = { 'Jeff Chan': 'Jeffrey Chan' };
const norm = (m) => ALIAS[m] || m;

const rosters = parseCsv(path.join(ROOT, 'data/weekly-rosters-2022-2025.csv'));
const drafts  = parseCsv(path.join(ROOT, 'draft-history-combined.csv'));

// ---- weekly ownership ----
const pair = new Map();       // manager|playerId -> record
const leagueWeeks = new Map(); // playerId -> total weeks rostered by anyone
const playerMeta = new Map();  // playerId -> {name, pos}
const mgrWeeks = new Map();    // manager -> total roster-weeks

for (const r of rosters) {
  const m = norm(r.Manager), pid = r.PlayerId, y = r.Year, w = Number(r.Week);
  playerMeta.set(pid, { name: r.Player, pos: r.Position });
  leagueWeeks.set(pid, (leagueWeeks.get(pid) || 0) + 1);
  mgrWeeks.set(m, (mgrWeeks.get(m) || 0) + 1);
  const k = `${m}|${pid}`;
  if (!pair.has(k)) pair.set(k, { manager: m, pid, weeks: 0, byYear: {}, seen: new Map(), started: 0, points: 0 });
  const p = pair.get(k);
  p.weeks++;
  p.byYear[y] = (p.byYear[y] || 0) + 1;
  if (!p.seen.has(y)) p.seen.set(y, []);
  p.seen.get(y).push(w);
  if (r.Started === '1') { p.started++; p.points += r.ActualPoints === '' ? 0 : Number(r.ActualPoints); }
}

// stints = contiguous runs of weeks, counted within each season
for (const p of pair.values()) {
  let stints = 0;
  for (const [, wks] of p.seen) {
    const s = wks.slice().sort((a, b) => a - b);
    for (let i = 0; i < s.length; i++) if (i === 0 || s[i] !== s[i-1] + 1) stints++;
  }
  p.stints = stints;
  p.seasons = p.seen.size;
}

// ---- draft history (2018-2025) ----
const draftCount = new Map();   // manager|playerName -> [years]
const draftedBy = new Map();    // playerName -> Set(managers)
for (const d of drafts) {
  const m = norm(d.Manager);
  const k = `${m}|${d.Player}`;
  if (!draftCount.has(k)) draftCount.set(k, []);
  draftCount.get(k).push({ year: d.Year, round: d.Round, overall: d['Overall Pick'], pos: d.Position });
  if (!draftedBy.has(d.Player)) draftedBy.set(d.Player, new Set());
  draftedBy.get(d.Player).add(m);
}

// ---- assemble ----
const recs = [];
for (const p of pair.values()) {
  const meta = playerMeta.get(p.pid);
  const lw = leagueWeeks.get(p.pid);
  const dk = draftCount.get(`${p.manager}|${meta.name}`) || [];
  recs.push({
    manager: p.manager, pid: p.pid, name: meta.name, pos: meta.pos,
    weeks: p.weeks, seasons: p.seasons, stints: p.stints,
    leagueWeeks: lw, share: p.weeks / lw,
    yrs: YEARS.filter(y => p.byYear[y]),
    starts: p.started, points: Math.round(p.points * 10) / 10,
    drafts: dk.map(d => d.year).sort(), nDrafts: dk.length,
  });
}
recs.sort((a, b) => b.weeks - a.weeks || a.manager.localeCompare(b.manager));

fs.writeFileSync(path.join(ROOT, 'data/manager-player-attachment.csv'),
  ['Manager,PlayerId,Player,Position,WeeksRostered,Seasons,SeasonList,Stints,LeagueWeeksRostered,OwnershipShare,Starts,StarterPoints,TimesDrafted,DraftYears']
    .concat(recs.map(r => [r.manager, r.pid, r.name, r.pos, r.weeks, r.seasons, r.yrs.join('/'), r.stints,
      r.leagueWeeks, (r.share * 100).toFixed(1) + '%', r.starts, r.points, r.nDrafts, r.drafts.join('/')]
      .map(csvEsc).join(','))).join('\n') + '\n');
console.log(`wrote data/manager-player-attachment.csv (${recs.length} manager-player pairs)`);

const managers = [...new Set(recs.map(r => r.manager))].sort();
console.log(`\nmanagers: ${managers.length}, distinct players: ${playerMeta.size}`);
console.log(`\nmulti-season holds (same mgr, 3+ seasons): ${recs.filter(r => r.seasons >= 3).length}`);
console.log(`4-season holds: ${recs.filter(r => r.seasons === 4).length}`);

console.log('\n=== TOP ATTACHMENTS (weeks held) ===');
for (const r of recs.slice(0, 15))
  console.log(`${r.manager.padEnd(21)} ${r.name.padEnd(23)} ${String(r.weeks).padStart(2)}wk  ${r.seasons}sn  ${(r.share*100).toFixed(0).padStart(3)}%  ${r.yrs.join(',')}`);

const repeats = [...draftCount.entries()].filter(([, v]) => v.length >= 3)
  .map(([k, v]) => ({ m: k.split('|')[0], p: k.split('|')[1], n: v.length, yrs: v.map(d => d.year).sort() }))
  .sort((a, b) => b.n - a.n);
console.log(`\n=== REPEAT DRAFTS (same manager drafted same player 3+ times, 2018-2025): ${repeats.length} ===`);
for (const r of repeats.slice(0, 20)) console.log(`  ${r.m.padEnd(21)} ${r.p.padEnd(23)} ${r.n}x  ${r.yrs.join(',')}`);



// ---- repeat rate: share of a season's roster-weeks spent on players that
//      manager already rostered in an earlier season ----
const byMY = new Map();
for (const r of rosters) {
  const k = `${norm(r.Manager)}|${r.Year}`;
  if (!byMY.has(k)) byMY.set(k, []);
  byMY.get(k).push(r.PlayerId);
}
const repeatRate = new Map();
for (const m of managers) {
  const prior = new Set(); const per = {};
  for (const y of YEARS) {
    const wks = byMY.get(`${m}|${y}`) || [];
    if (y !== YEARS[0] && wks.length) per[y] = wks.filter(p => prior.has(p)).length / wks.length;
    wks.forEach(p => prior.add(p));
  }
  const vals = Object.values(per);
  repeatRate.set(m, { per, avg: vals.reduce((a, b) => a + b, 0) / vals.length });
}

const pct = (x) => (x * 100).toFixed(1) + '%';
const M = [];
M.push('# Player Attachment — Which Managers Keep Coming Back to the Same Players');
M.push('');
M.push(`How repeatedly each manager rosters the same player. Built from ${rosters.length.toLocaleString()} weekly roster records (2022–2025, 17 weeks a season) and ${drafts.length.toLocaleString()} draft picks (2018–2025).`);
M.push('');
M.push('## What is measured');
M.push('');
M.push('- **Weeks** — total weeks that manager had that player on their roster. The ceiling is 68 (4 seasons × 17 weeks).');
M.push('- **Seasons** — how many different seasons they rostered him.');
M.push('- **Share** — of every week that player spent on *anyone\'s* roster in this league, the percentage that was this manager. 100% means nobody else ever had him.');
M.push('- **Stints** — separate unbroken spells. More stints than seasons means they let him go and brought him back.');
M.push('- **Repeat drafts** — how many separate drafts they spent a pick on him, going back to 2018.');
M.push('');
M.push('Weekly roster data covers 2022–2025. Draft data goes back to 2018, so the repeat-draft section reaches further than the rest.');
M.push('');

M.push('## Strongest attachments');
M.push('');
M.push('Manager–player pairs by total weeks held.');
M.push('');
M.push('| Manager | Player | Pos | Weeks | Seasons | Share | Stints | Seasons held | Drafted |');
M.push('|---|---|---|---:|---:|---:|---:|---|---:|');
for (const r of recs.slice(0, 25))
  M.push(`| ${r.manager} | ${r.name} | ${r.pos} | **${r.weeks}** | ${r.seasons} | ${pct(r.share)} | ${r.stints} | ${r.yrs.join(', ')} | ${r.nDrafts || '—'} |`);
M.push('');

M.push('## Loyalty index');
M.push('');
M.push('Share of each season\'s roster-weeks spent on players that manager had already rostered in an earlier season. Higher means more return business.');
M.push('');
M.push('| Manager | 2023 | 2024 | 2025 | Average | Multi-season holds (3+ seasons) |');
M.push('|---|---:|---:|---:|---:|---:|');
const loyalRank = managers.slice().sort((a, b) => repeatRate.get(b).avg - repeatRate.get(a).avg);
for (const m of loyalRank) {
  const rr = repeatRate.get(m);
  const held = recs.filter(r => r.manager === m && r.seasons >= 3).length;
  M.push(`| ${m} | ${rr.per['2023'] ? pct(rr.per['2023']) : '—'} | ${rr.per['2024'] ? pct(rr.per['2024']) : '—'} | ${rr.per['2025'] ? pct(rr.per['2025']) : '—'} | **${pct(rr.avg)}** | ${held} |`);
}
M.push('');
M.push('2022 has no column because it is the first season with roster data — there is nothing earlier to repeat from.');
M.push('');

M.push('## Exclusive holds');
M.push('');
M.push('Players who spent a meaningful stretch in this league and were **never rostered by anyone else**.');
M.push('');
M.push('| Manager | Player | Pos | Weeks | Seasons |');
M.push('|---|---|---|---:|---|');
const excl = recs.filter(r => r.share === 1 && r.weeks >= 17).sort((a, b) => b.weeks - a.weeks);
for (const r of excl.slice(0, 20)) M.push(`| ${r.manager} | ${r.name} | ${r.pos} | ${r.weeks} | ${r.yrs.join(', ')} |`);
M.push('');
M.push(`${excl.length} players were held 17+ weeks by one manager and never touched by another.`);
M.push('');

M.push('## Repeat drafting, 2018–2025');
M.push('');
M.push('Same manager spending a draft pick on the same player in three or more separate drafts.');
M.push('');
M.push('| Manager | Player | Times | Draft years |');
M.push('|---|---|---:|---|');
for (const r of repeats) M.push(`| ${r.m} | ${r.p} | ${r.n} | ${r.yrs.join(', ')} |`);
M.push('');

M.push('## Let go, then re-acquired');
M.push('');
M.push('Pairs where the manager dropped or traded the player away and later brought him back. Ranked by how many times they went back.');
M.push('');
M.push('| Manager | Player | Pos | Stints | Seasons | Weeks | Seasons held |');
M.push('|---|---|---|---:|---:|---:|---|');
const reacq = recs.filter(r => r.stints > r.seasons)
  .sort((a, b) => (b.stints - b.seasons) - (a.stints - a.seasons) || b.weeks - a.weeks);
for (const r of reacq.slice(0, 20))
  M.push(`| ${r.manager} | ${r.name} | ${r.pos} | ${r.stints} | ${r.seasons} | ${r.weeks} | ${r.yrs.join(', ')} |`);
M.push('');
M.push(`${reacq.length} manager–player pairs involved at least one re-acquisition.`);
M.push('');

M.push('## By manager');
M.push('');
for (const m of loyalRank) {
  const mine = recs.filter(r => r.manager === m);
  const rr = repeatRate.get(m);
  M.push(`### ${m}`);
  M.push('');
  M.push(`Repeat rate **${pct(rr.avg)}** · ${mine.filter(r => r.seasons >= 3).length} players held 3+ seasons · ${mine.length} distinct players rostered`);
  M.push('');
  M.push('| Player | Pos | Weeks | Seasons | Share | Seasons held | Drafted |');
  M.push('|---|---|---:|---:|---:|---|---:|');
  for (const r of mine.slice(0, 8))
    M.push(`| ${r.name} | ${r.pos} | ${r.weeks} | ${r.seasons} | ${pct(r.share)} | ${r.yrs.join(', ')} | ${r.nDrafts || '—'} |`);
  const rp = repeats.filter(x => x.m === m);
  if (rp.length) {
    M.push('');
    M.push(`**Drafted repeatedly:** ${rp.map(x => `${x.p} (${x.n}× — ${x.yrs.join(', ')})`).join('; ')}`);
  }
  M.push('');
}

M.push('## Caveats');
M.push('');
M.push('- Weekly roster data starts in 2022, so a bond that formed earlier only counts from then. The repeat-draft table is the one place earlier seasons show up.');
M.push('- Share is measured against weeks *rostered in this league*, not NFL availability. A player who was mostly a free agent can reach a high share on few weeks — the weeks column is the check on that.');
M.push('- Attachment is not the same as good process: a manager can keep re-rostering a player because he keeps being available on waivers, not because they are chasing him.');
M.push('- "Jeff Chan" in the 2018 draft data is the same person as Jeffrey Chan and is merged. Daniel Ota (2019–20) appears only in draft data and has no weekly roster history here.');
M.push('');
M.push('Generated by `../.espn-automation/analyze_attachment.js`. Full pair-level data in `../data/manager-player-attachment.csv`.');
M.push('');

fs.writeFileSync(path.join(ROOT, 'analysis/player-attachment-analysis.md'), M.join('\n'));
console.log(`\nwrote analysis/player-attachment-analysis.md (${M.length} lines)`);
console.log(`exclusive holds (17+ wks, 100% share): ${excl.length}`);
console.log(`re-acquisition pairs: ${reacq.length}`);
