// Pulls the completed 2026 draft: every pick, every roster, settings.
// Uses context.request (shares cookies, no CORS) per the pipeline notes.
const { chromium } = require('playwright');
const fs = require('fs');

const LEAGUE = 275797;
const SEASON = 2026;

(async () => {
  const browser = await chromium.connectOverCDP('http://127.0.0.1:9222');
  const context = browser.contexts()[0];
  const H = {
    'x-fantasy-platform': 'espn-fantasy-web',
    'x-fantasy-source': 'kona',
    'accept': 'application/json',
  };
  const base = `https://lm-api-reads.fantasy.espn.com/apis/v3/games/ffl/seasons/${SEASON}/segments/0/leagues/${LEAGUE}`;
  const url = base + '?view=mDraftDetail&view=mTeam&view=mSettings&view=mRoster&view=mMatchup';
  const r = await context.request.get(url, { headers: H });
  console.log('status', r.status());
  if (r.status() !== 200) { console.log((await r.text()).slice(0, 500)); process.exit(1); }
  const j = await r.json();
  fs.writeFileSync(__dirname + '/draft2026_raw.json', JSON.stringify(j));
  console.log('topKeys', Object.keys(j).join(','));
  console.log('drafted', j.draftDetail && j.draftDetail.drafted, 'picks', j.draftDetail && j.draftDetail.picks && j.draftDetail.picks.length);
  console.log('teams', j.teams && j.teams.length);
  console.log('samplePick', JSON.stringify(j.draftDetail && j.draftDetail.picks && j.draftDetail.picks[0]));
  console.log('sampleTeam', JSON.stringify(j.teams && { id: j.teams[0].id, name: j.teams[0].name, abbrev: j.teams[0].abbrev, owners: j.teams[0].owners, entries: j.teams[0].roster && j.teams[0].roster.entries.length }));
  console.log('members', JSON.stringify(j.members && j.members.map(m => ({ id: m.id, dn: m.displayName, fn: m.firstName, ln: m.lastName }))));
  console.log('lineupSlots', JSON.stringify(j.settings && j.settings.rosterSettings && j.settings.rosterSettings.lineupSlotCounts));
  process.exit(0);
})();
