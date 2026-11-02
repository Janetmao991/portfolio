// R39: the gap between the "Also: AI Terms explainers" line and "How I take a startup apart", at 1440 and 390.
// Reports every connector pseudo-element that could draw in that gap, and saves a close-up.
import { Browser, sleep } from '/Users/janetmao/.claude/skills/design-taste-frontend/scripts/lib/cdp.mjs';
import { writeFileSync } from 'node:fs';
const [outDir = 'shots-r39', port = '5239', tag = 'after'] = process.argv.slice(2);
const b = await Browser.launch({ width: 1440, height: 900 });
try {
  for (const [w, h, m] of [[1440, 900, false], [390, 844, true]]) {
    const p = await b.newPage({ width: w, height: h, dsf: 2, mobile: m });
    await p.goto(`http://127.0.0.1:${port}/projects/startup-research.html`, { settleMs: 600 });
    await p.eval(`document.querySelector('.tr-src').scrollIntoView({block:'center'})`); await sleep(800);
    console.log(tag, w, JSON.stringify(await p.eval(`(() => {
      const r = e => e.getBoundingClientRect(), src = document.querySelector('.tr-src'), also = document.querySelector('.tr-also'), root = document.querySelector('.tr-root');
      const pe = (el, k) => { const s = getComputedStyle(el, k); return { display: s.display, left: s.left, height: s.height }; };
      return { trunkBelowBand: pe(src, '::after'), alsoCentreLine: pe(also, '::before'),
        alsoBottomToRoot: Math.round(r(root).top - r(also).bottom), overflow: document.documentElement.scrollWidth > innerWidth };
    })()`)));
    const c = await p.eval(`(() => { const a = document.querySelector('.tr-also').getBoundingClientRect(), r = document.querySelector('.tr-root').getBoundingClientRect();
      return { x: 0, y: a.top + scrollY - 140, width: innerWidth, height: r.bottom - a.top + 200 }; })()`);
    const { data } = await p.send('Page.captureScreenshot', { format: 'jpeg', quality: 90, captureBeyondViewport: true, clip: { scale: 1, ...c } });
    writeFileSync(`${outDir}/${tag}-${w}.jpg`, Buffer.from(data, 'base64'));
    console.log(tag, w, 'console errors', p.consoleErrors.length);
  }
} finally { await b.close(); }
