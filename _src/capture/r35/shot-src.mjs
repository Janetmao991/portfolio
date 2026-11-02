// R35: the Startup Research raw-material band at 1440 and 390 (width of the chips, and a close-up shot).
import { Browser, sleep } from '/Users/janetmao/.claude/skills/design-taste-frontend/scripts/lib/cdp.mjs';
import { writeFileSync } from 'node:fs';
const [outDir = 'shots-r35', port = '5235', tag = 'src'] = process.argv.slice(2);
const b = await Browser.launch({ width: 1440, height: 900 });
try {
  for (const [w, h, m] of [[1440, 900, false], [390, 844, true]]) {
    const p = await b.newPage({ width: w, height: h, dsf: 2, mobile: m });
    await p.goto(`http://127.0.0.1:${port}/projects/startup-research.html`, { settleMs: 600 });
    await p.eval(`document.querySelector('.tr-src').scrollIntoView({block:'center'})`); await sleep(800);
    console.log(w, JSON.stringify(await p.eval(`(() => ({ band: document.querySelector('.tr-srcs').getBoundingClientRect().width,
      chips: [...document.querySelectorAll('.tr-sc')].map(c => [c.querySelector('b').textContent, Math.round(c.getBoundingClientRect().width), Math.round(c.getBoundingClientRect().height)]),
      overflow: document.documentElement.scrollWidth > innerWidth, errors: 0 }))()`)));
    const c = await p.eval(`(() => { const r = document.querySelector('.tr-src').getBoundingClientRect(); return { x: r.left + scrollX - 16, y: r.top + scrollY - 16, width: r.width + 32, height: r.height + 110 }; })()`);
    const { data } = await p.send('Page.captureScreenshot', { format: 'jpeg', quality: 90, captureBeyondViewport: true, clip: { scale: 1, ...c } });
    writeFileSync(`${outDir}/${tag}-${w}.jpg`, Buffer.from(data, 'base64'));
    if (p.consoleErrors.length) console.log('errors', p.consoleErrors);
  }
} finally { await b.close(); }
