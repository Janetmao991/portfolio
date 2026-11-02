// R20: page shots of projects/lexispeak.html at 1440 — the full page and the coaching-report highlight.
import { Browser, sleep } from '/Users/janetmao/.claude/skills/design-taste-frontend/scripts/lib/cdp.mjs';
const [outDir = 'shots-r20'] = process.argv.slice(2);
const URL = 'http://127.0.0.1:5197/projects/lexispeak.html';
const b = await Browser.launch({ width: 1440, height: 900 });
const settle = `(async () => { for (let y = 0; y < document.body.scrollHeight; y += 600) { scrollTo(0, y); await new Promise(r => setTimeout(r, 120)); } scrollTo(0, 0); })()`;
try {
  const p = await b.newPage({ width: 1440, height: 900, dsf: 1 });
  await p.goto(URL, { settleMs: 1500 });
  await p.eval(settle);
  await sleep(1200);
  await p.screenshot({ path: `${outDir}/lexispeak-1440-full.jpg`, format: 'jpeg', quality: 85, fullPage: true });
  await p.eval(`[...document.querySelectorAll('.lx-h')].find(e => /coaching report/i.test(e.querySelector('h2').textContent)).scrollIntoView({ block: 'center' })`);
  await sleep(1500);
  const r = JSON.parse(await p.eval(`(() => { const s = [...document.querySelectorAll('.lx-h')].find(e => /coaching report/i.test(e.querySelector('h2').textContent)).getBoundingClientRect();
    return JSON.stringify({ x: s.left - 24, y: s.top + scrollY - 24, width: s.width + 48, height: s.height + 48 }); })()`));
  await p.screenshot({ path: `${outDir}/lexispeak-report.jpg`, format: 'jpeg', quality: 88, clip: r });
  console.log('errors:', p.consoleErrors);
} finally { await b.close(); }
