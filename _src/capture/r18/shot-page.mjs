// R18: page shots of projects/writing-station.html at 1440 — the full page and the top viewport; plus a 390px phone check.
import { Browser, sleep } from '/Users/janetmao/.claude/skills/design-taste-frontend/scripts/lib/cdp.mjs';
const [outDir = 'shots-r18'] = process.argv.slice(2);
const URL = 'http://127.0.0.1:5197/projects/writing-station.html';
const b = await Browser.launch({ width: 1440, height: 900 });
const settle = `(async () => { for (let y = 0; y < document.body.scrollHeight; y += 600) { scrollTo(0, y); await new Promise(r => setTimeout(r, 120)); } scrollTo(0, 0); })()`;
try {
  const p = await b.newPage({ width: 1440, height: 900, dsf: 1 });
  await p.goto(URL, { settleMs: 1500 });
  await p.eval(settle);
  await sleep(1200);
  await p.screenshot({ path: `${outDir}/writing-station-1440-full.jpg`, format: 'jpeg', quality: 85, fullPage: true });
  await p.screenshot({ path: `${outDir}/writing-station-1440-top.jpg`, format: 'jpeg', quality: 85 });
  const m = await b.newPage({ width: 390, height: 844, dsf: 2, mobile: true });
  await m.goto(URL, { settleMs: 1500 });
  await m.eval(settle);
  await sleep(1000);
  await m.screenshot({ path: `${outDir}/writing-station-390-full.jpg`, format: 'jpeg', quality: 70, fullPage: true });
  console.log('errors:', p.consoleErrors.concat(m.consoleErrors));
} finally { await b.close(); }
