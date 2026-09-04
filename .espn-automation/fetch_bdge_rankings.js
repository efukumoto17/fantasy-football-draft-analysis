// Pulls the BDGE draft board straight from bdge.co instead of a manual CSV export.
//
// Takes the SUPERFLEX list, which is the correct format for this 2-QB league
// (their 1QB list is a different board — only 3 of 206 ranks agree), plus the
// separate kicker and defense lists, and each player's tags.
//
// Credentials come from the environment, never from a file:
//   BDGE_EMAIL=... BDGE_PASS=... node .espn-automation/fetch_bdge_rankings.js
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const ROOT = '/Users/evanfukumoto/Documents/VSCodeRepos/fantasy-football';
const EMAIL = process.env.BDGE_EMAIL, PASS = process.env.BDGE_PASS;
if (!EMAIL || !PASS) {
  console.error('error: set BDGE_EMAIL and BDGE_PASS in the environment.');
  process.exit(2);
}
const SEASON = 2026;
const csvEsc = (v) => { const s = v == null ? '' : String(v); return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s; };

(async () => {
  const browser = await chromium.launch({ headless: true, channel: 'chrome' });
  const ctx = await browser.newContext();
  const page = await ctx.newPage();

  await page.goto('https://bdge.co/fantasy-football/draft-rankings', { waitUntil: 'networkidle', timeout: 60000 }).catch(() => {});
  await page.getByRole('button', { name: /log in/i }).first().click({ timeout: 15000 }).catch(() => {});
  await page.waitForTimeout(2000);
  await page.locator('#login-email').fill(EMAIL);
  await page.locator('#input-login-password').fill(PASS);
  await page.getByRole('button', { name: /^(log ?in|sign ?in|continue)/i }).last().click({ timeout: 15000 }).catch(() => {});
  await page.waitForTimeout(5000);
  if (/login|sign ?up/i.test(page.url())) { console.error('error: login failed.'); await browser.close(); process.exit(1); }
  console.log('logged in as', EMAIL);

  const get = async (p) => {
    const r = await ctx.request.get(`https://bdge.co${p}`, { timeout: 60000 });
    if (r.status() !== 200) throw new Error(`${p} -> HTTP ${r.status()}`);
    return r.json();
  };
  const lists = await get('/api/redraft-rankings');
  const tags = await get('/api/nfl-player-tags');
  const tagName = new Map((Array.isArray(tags) ? tags : tags.tags || []).map(t => [t.id, t.name || t.label || t.slug]));
  console.log(`tags defined: ${tagName.size} -> ${[...tagName.values()].join(', ')}`);

  const bySlug = new Map(lists.map(l => [l.slug, l]));
  const pick = (slug) => {
    const l = bySlug.get(slug);
    if (!l) throw new Error(`missing list ${slug}; available: ${[...bySlug.keys()].join(', ')}`);
    return l;
  };
  const board = pick(`redraft-superflex-${SEASON}`);
  const kList = pick(`redraft-k-${SEASON}`);
  const dList = pick(`redraft-dst-${SEASON}`);
  console.log(`superflex ${board.entries.length} · K ${kList.entries.length} · D/ST ${dList.entries.length}`);
  console.log(`updated: board ${String(board.updatedAt).slice(0,10)} · K ${String(kList.updatedAt).slice(0,10)} · D/ST ${String(dList.updatedAt).slice(0,10)}`);

  const tierOf = (list) => {
    const m = new Map((list.tiers || []).map(t => [t.id, t.name || t.label || `Tier ${t.sortOrder + 1}`]));
    return (e) => e.tier || m.get(e.tierId) || '';
  };
  const row = (e, tier) => {
    const p = e.player;
    const names = (p.tagIds || []).map(id => tagName.get(id)).filter(Boolean);
    return {
      rank: e.rank, name: p.name, team: p.team || '', pos: p.position,
      posRank: p.adpPositionRank || '', bye: p.byeWeek ?? '',
      adp: p.adpOverall ?? '', adpEspn: p.adpEspn ?? '',
      tier: tier(e), tags: names.join('; '), notes: (e.notes || '').replace(/\s+/g, ' ').trim(),
    };
  };

  const boardRows = board.entries.map(e => row(e, tierOf(board))).sort((a, b) => a.rank - b.rank);
  const HEAD = ['Rank','Player','Team','Pos','Pos Rank','Bye','ADP','ESPN ADP','Tier','Tags','Notes'];
  const toCsv = (rows) => [HEAD.join(',')].concat(rows.map(r =>
    [r.rank, r.name, r.team, r.pos, r.posRank, r.bye, r.adp, r.adpEspn, r.tier, r.tags, r.notes].map(csvEsc).join(','))).join('\n') + '\n';

  fs.writeFileSync(path.join(ROOT, 'bdge-draft-rankings-ppr-2026.csv'), toCsv(boardRows));
  console.log(`wrote bdge-draft-rankings-ppr-2026.csv (${boardRows.length} players)`);

  const kd = kList.entries.map(e => row(e, tierOf(kList))).sort((a, b) => a.rank - b.rank)
    .concat(dList.entries.map(e => row(e, tierOf(dList))).sort((a, b) => a.rank - b.rank));
  fs.writeFileSync(path.join(ROOT, 'bdge-k-dst-rankings-2026.csv'), toCsv(kd));
  console.log(`wrote bdge-k-dst-rankings-2026.csv (${kd.length} rows)`);

  const counts = {};
  for (const r of boardRows.concat(kd)) for (const t of r.tags.split('; ').filter(Boolean)) counts[t] = (counts[t] || 0) + 1;
  console.log('tagged players:', JSON.stringify(counts));
  await browser.close();
})();
