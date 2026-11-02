// R36: the Startup Research raw-material band plus the new "Also" line, at 1440 and 390 (close-up + checks).
import { Browser, sleep } from '/Users/janetmao/.claude/skills/design-taste-frontend/scripts/lib/cdp.mjs';
import { writeFileSync } from 'node:fs';
const [outDir = 'shots-r36', port = '5236'] = process.argv.slice(2);
const b = await Browser.launch({ width: 1440, height: 900 });
try {
  for (const [w, h, m] of [[1440, 900, false], [390, 844, true]]) {
    const p = await b.newPage({ width: w, height: h, dsf: 2, mobile: m });
    await p.goto(`http://127.0.0.1:${port}/projects/startup-research.html`, { settleMs: 600 });
    await p.eval(`document.querySelector('.tr-src').scrollIntoView({block:'center'})`); await sleep(800);
    console.log(w, JSON.stringify(await p.eval(`(() => {
      const r = e => e.getBoundingClientRect(), also = document.querySelector('.tr-also'), a = also.querySelector('a'), cs = getComputedStyle(also);
      const band = r(document.querySelector('.tr-srcs')), ar = r(also), src = r(document.querySelector('.tr-src')), root = r(document.querySelector('.tr-root'));
      const range = document.createRange(); range.selectNodeContents(also); const txt = range.getBoundingClientRect();
      const line = getComputedStyle(also, '::before');
      return { text: also.textContent, href: a.getAttribute('href'), linkOk: a.href.endsWith('/projects/ai-terms.html'),
        alsoW: Math.round(ar.width), bandW: Math.round(band.width), sameWidth: Math.round(ar.width) === Math.round(band.width), maxWidth: cs.maxWidth,
        font: cs.fontSize, color: cs.color, chipCaption: getComputedStyle(document.querySelector('.tr-sc span')).color,
        lines: Math.round(ar.height / parseFloat(cs.lineHeight) - .3), textRight: Math.round(txt.right - ar.left), centre: Math.round(ar.width / 2),
        textClearsCentreLine: line.display === 'none' || txt.right < ar.left + ar.width / 2 - 8, centreLine: line.display,
        chips: [...document.querySelectorAll('.tr-sc')].map(c => [Math.round(r(c).width), Math.round(r(c).height)]),
        gapToRoot: Math.round(root.top - src.bottom), overflow: document.documentElement.scrollWidth > innerWidth };
    })()`)));
    const c = await p.eval(`(() => { const r = document.querySelector('.tr-src').getBoundingClientRect(); return { x: r.left + scrollX - 16, y: r.top + scrollY - 16, width: r.width + 32, height: r.height + 110 }; })()`);
    const { data } = await p.send('Page.captureScreenshot', { format: 'jpeg', quality: 90, captureBeyondViewport: true, clip: { scale: 1, ...c } });
    writeFileSync(`${outDir}/src-${w}.jpg`, Buffer.from(data, 'base64'));
    const v = await p.send('Page.captureScreenshot', { format: 'jpeg', quality: 85 });
    writeFileSync(`${outDir}/view-${w}.jpg`, Buffer.from(v.data, 'base64'));
    console.log(w, 'console errors', p.consoleErrors.length, p.consoleErrors);
  }
} finally { await b.close(); }
