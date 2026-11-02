// R16: page shots — full page at 1440, plus a 1440 viewport crop of the "Which sense" section.
import { Browser, sleep } from '/Users/janetmao/.claude/skills/design-taste-frontend/scripts/lib/cdp.mjs';
const [outDir = 'shots-r16'] = process.argv.slice(2);
const URL = 'http://127.0.0.1:5197/projects/lexiai.html';
const b = await Browser.launch({ width: 1440, height: 900 });
try {
  const p = await b.newPage({ width: 1440, height: 900, dsf: 1 });
  await p.goto(URL, { settleMs: 1500 });
  await p.eval(`(async () => { for (let y = 0; y < document.body.scrollHeight; y += 600) { scrollTo(0, y); await new Promise(r => setTimeout(r, 120)); } scrollTo(0, 0); })()`);
  await sleep(1200);
  await p.screenshot({ path: `${outDir}/lexiai-1440-full.jpg`, format: 'jpeg', quality: 85, fullPage: true });
  const r = await p.send('Runtime.evaluate', { expression: `(() => { const s = document.querySelectorAll('.lx-h')[1]; scrollTo(0, s.getBoundingClientRect().top + scrollY - 40); return scrollY; })()`, returnByValue: true });
  await sleep(600);
  await p.screenshot({ path: `${outDir}/lexiai-sentence.jpg`, format: 'jpeg', quality: 85 });
  console.log('sentence section at', r.result.value);
} finally { await b.close(); }
