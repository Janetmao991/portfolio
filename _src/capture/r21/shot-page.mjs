// R21: startup-research page shots — full page + tree area at 1440, Competition branch open, 390 phone.
import { Browser, sleep } from '/Users/janetmao/.claude/skills/design-taste-frontend/scripts/lib/cdp.mjs';
const [outDir = 'shots-r21', port = '5197'] = process.argv.slice(2);
const URL = `http://127.0.0.1:${port}/projects/startup-research.html`;
import { writeFileSync } from 'node:fs';
const clipShot = async (pg, path, c) => { const { data } = await pg.send('Page.captureScreenshot', { format: 'jpeg', quality: 88, captureBeyondViewport: true, clip: { scale: 1, x: c.x - 20, y: c.y - 20, width: c.width + 40, height: c.height + 40 } }, 45000); writeFileSync(path, Buffer.from(data, 'base64')); };
const b = await Browser.launch({ width: 1440, height: 900 });
const settle = `(async () => { for (let y = 0; y < document.body.scrollHeight; y += 500) { scrollTo(0, y); await new Promise(r => setTimeout(r, 150)); } scrollTo(0, 0); })()`;
const rect = `(() => { const r = document.querySelector('#framework').getBoundingClientRect(); return { x: r.left + scrollX, y: r.top + scrollY, width: r.width, height: r.height }; })()`;
try {
  const p = await b.newPage({ width: 1440, height: 900, dsf: 1 });
  await p.goto(URL, { settleMs: 1500 });
  await p.eval(settle); await sleep(3500);
  await p.screenshot({ path: `${outDir}/startup-1440-full.jpg`, format: 'jpeg', quality: 85, fullPage: true });
  let c = await p.eval(rect);
  await clipShot(p, `${outDir}/startup-tree-1440.jpg`, c);
  await p.eval(`document.querySelector('.tr-x').click()`); await sleep(900);
  c = await p.eval(rect);
  await clipShot(p, `${outDir}/startup-tree-competition-open.jpg`, c);
  const m = await b.newPage({ width: 390, height: 844, dsf: 2, mobile: true });
  await m.goto(URL, { settleMs: 1500 });
  await m.eval(settle); await sleep(3500);
  await m.screenshot({ path: `${outDir}/startup-390.jpg`, format: 'jpeg', quality: 70, fullPage: true });
  console.log('errors:', p.consoleErrors.concat(m.consoleErrors));
} finally { await b.close(); }
