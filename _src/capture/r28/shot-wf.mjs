// R28: the writing-framework section (startup-research.html #writing) at 1440 and 390, plus a hover state and measurements.
import { Browser, sleep } from '/Users/janetmao/.claude/skills/design-taste-frontend/scripts/lib/cdp.mjs';
import { writeFileSync } from 'node:fs';
const [outDir = 'shots-r28', port = '5199'] = process.argv.slice(2);
const U = `http://127.0.0.1:${port}/projects/startup-research.html`;
const rect = sel => `(() => { const r = document.querySelector('${sel}').getBoundingClientRect(); return { x: r.left + scrollX, y: r.top + scrollY, width: r.width, height: r.height }; })()`;
const shot = async (pg, path, c) => { const { data } = await pg.send('Page.captureScreenshot', { format: 'jpeg', quality: 90, captureBeyondViewport: true, clip: { scale: 1, ...c } }, 45000); writeFileSync(path, Buffer.from(data, 'base64')); };
const info = `(() => { const sh = [...document.querySelectorAll('.tp-sheet')]; return { sheets: sh.map(s => { const r = s.getBoundingClientRect(), l = s.querySelector('.tp-list').lastElementChild.getBoundingClientRect(), f = s.querySelector('.tp-f').getBoundingClientRect();
  return { w: Math.round(r.width), h: Math.round(r.height), top: Math.round(r.top), lastBlockBottom: Math.round(l.bottom - r.top), footTop: Math.round(f.top - r.top), blocks: s.querySelectorAll('.tp-b').length, dots: [...s.querySelectorAll('.tp-n')].filter(n => n.textContent.trim() === '·').length }; }),
  overflow: document.documentElement.scrollWidth > innerWidth }; })()`;
const errors = [];
const b = await Browser.launch({ width: 1440, height: 900 });
try {
  for (const [w, h, tag, mobile] of [[1440, 900, '1440', false], [390, 844, '390', true]]) {
    const p = await b.newPage({ width: w, height: h, dsf: 2, mobile });
    await p.goto(U, { settleMs: 600 });
    await p.eval(`document.querySelector('#writing').scrollIntoView(); document.querySelectorAll('#writing *').forEach(e => e.style.opacity === '0' && (e.style.opacity = 1))`); await sleep(1200);
    console.log(tag, JSON.stringify(await p.eval(info)));
    await shot(p, `${outDir}/writing-${tag}.jpg`, await p.eval(rect('#writing')));
    await shot(p, `${outDir}/spread-${tag}.jpg`, await p.eval(rect('.tp')));
    if (!mobile) {
      const c = await p.eval(`(() => { const r = document.querySelectorAll('.tp-sec')[1].getBoundingClientRect(); return { x: r.left + 40, y: r.top + 10 }; })()`);
      await p.send('Input.dispatchMouseEvent', { type: 'mouseMoved', ...c }); await sleep(400);
      await shot(p, `${outDir}/hover-1440.jpg`, await p.eval(rect('.tp')));
    }
    errors.push(...p.consoleErrors);
  }
  console.log('errors:', errors);
} finally { await b.close(); }
