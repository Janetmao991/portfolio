// R22: startup-research tree collapsed (with raw material band), band close-up, worked-example line, 390 phone.
import { Browser, sleep } from '/Users/janetmao/.claude/skills/design-taste-frontend/scripts/lib/cdp.mjs';
import { writeFileSync } from 'node:fs';
const [outDir = 'shots-r22', port = '5198'] = process.argv.slice(2);
const URL = `http://127.0.0.1:${port}/projects/startup-research.html`;
const clipShot = async (pg, path, c, pad = 20) => { const { data } = await pg.send('Page.captureScreenshot', { format: 'jpeg', quality: 90, captureBeyondViewport: true, clip: { scale: c.scale || 1, x: c.x - pad, y: c.y - pad, width: c.width + 2 * pad, height: c.height + 2 * pad } }, 45000); writeFileSync(path, Buffer.from(data, 'base64')); };
const rect = sel => `(() => { const r = document.querySelector('${sel}').getBoundingClientRect(); return { x: r.left + scrollX, y: r.top + scrollY, width: r.width, height: r.height }; })()`;
const settle = `(async () => { for (let y = 0; y < document.body.scrollHeight; y += 500) { scrollTo(0, y); await new Promise(r => setTimeout(r, 150)); } scrollTo(0, 0); })()`;
const b = await Browser.launch({ width: 1440, height: 900 });
try {
  const p = await b.newPage({ width: 1440, height: 900, dsf: 2 });
  await p.goto(URL, { settleMs: 1500 });
  await p.eval(settle); await sleep(3500);
  await p.eval(`document.querySelector('.tr-key.open .tr-x') && document.querySelector('.tr-x').click()`); await sleep(900);
  await clipShot(p, `${outDir}/tree-collapsed-1440.jpg`, await p.eval(rect('#framework')));
  const band = await p.eval(`(() => { const a = document.querySelector('.tr-src').getBoundingClientRect(), r = document.querySelector('.tr-root').getBoundingClientRect(); return { x: a.left + scrollX, y: a.top + scrollY, width: a.width, height: r.bottom - a.top }; })()`);
  await clipShot(p, `${outDir}/raw-material-band.jpg`, band, 24);
  await clipShot(p, `${outDir}/worked-example-line.jpg`, await p.eval(`(() => { const a = document.querySelector('.funnel').getBoundingClientRect(), r = document.querySelector('.funnel-n').getBoundingClientRect(); return { x: a.left + scrollX, y: a.top + scrollY, width: Math.max(a.width, r.width), height: r.bottom - a.top }; })()`));
  console.log('links:', await p.eval(`[...document.querySelectorAll('.tr-sc a, .funnel-n a')].map(a => a.href).join(' ')`));
  console.log('key chip outline:', await p.eval(`getComputedStyle(document.querySelector('.tr-sc-key')).borderColor`));
  const m = await b.newPage({ width: 390, height: 844, dsf: 2, mobile: true });
  await m.goto(URL, { settleMs: 1500 });
  await m.eval(settle); await sleep(3500);
  await clipShot(m, `${outDir}/tree-390.jpg`, await m.eval(rect('#framework')), 0);
  console.log('errors:', p.consoleErrors.concat(m.consoleErrors));
} finally { await b.close(); }
