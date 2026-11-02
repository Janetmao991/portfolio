// R24: hero story frames (scene 1/2/3 + cycle) at 1440 and 390, a reduced-motion still, and frames for a strip/GIF.
// Frames are seeked with the Web Animations API (every CSS animation paused at the same story time).
import { Browser, sleep } from '/Users/janetmao/.claude/skills/design-taste-frontend/scripts/lib/cdp.mjs';
import { writeFileSync } from 'node:fs';
const [outDir = 'shots-r24', port = '5199', gifDir = ''] = process.argv.slice(2);
const U = `http://127.0.0.1:${port}/index.html`;
const rect = `(() => { const r = document.querySelector('.hero-v').getBoundingClientRect(); return { x: r.left + scrollX, y: r.top + scrollY, width: r.width, height: r.height }; })()`;
const shot = async (pg, path, c, pad = 0) => { const { data } = await pg.send('Page.captureScreenshot', { format: path.endsWith('png') ? 'png' : 'jpeg', quality: 90, clip: { scale: 1, x: c.x - pad, y: c.y - pad, width: c.width + 2 * pad, height: c.height + 2 * pad } }, 45000); writeFileSync(path, Buffer.from(data, 'base64')); };
const seek = t => `(() => { document.getAnimations().forEach(a => { a.pause(); a.currentTime = ${t * 1000}; }); return [...document.querySelectorAll('.fx-c span')].filter(s => +getComputedStyle(s).opacity > .5).map(s => s.textContent).join('|'); })()`;
const errors = [];
const b = await Browser.launch({ width: 1440, height: 900 });
try {
  for (const [w, h, tag, mobile] of [[1440, 900, '1440', false], [390, 844, '390', true]]) {
    const p = await b.newPage({ width: w, height: h, dsf: 2, mobile });
    await p.goto(U, { settleMs: 300 });
    const c = await p.eval(rect);
    for (const [name, t] of [['1-bored', 2.0], ['2-sees-ai', 4.2], ['3-learning', 7.0]]) {
      console.log(tag, name, 'label:', await p.eval(seek(t)));
      await sleep(150); await shot(p, `${outDir}/${name}-${tag}.jpg`, c);
    }
    if (gifDir && tag === '1440') for (let f = 0; f <= 80; f++) { await p.eval(seek(f / 10)); await sleep(60); await shot(p, `${gifDir}/f${String(f).padStart(3, '0')}.png`, c); }
    await p.goto(U, { settleMs: 300 });
    await sleep(10500);
    console.log(tag, 'cycle class:', await p.eval(`document.querySelector('.fx').className`), 'href:', await p.eval(`document.querySelector('.fx').getAttribute('href')`));
    await shot(p, `${outDir}/4-final-cycle-${tag}.jpg`, c);
    errors.push(...p.consoleErrors);
    const r = await b.newPage({ width: w, height: h, dsf: 2, mobile, reducedMotion: true });
    await r.goto(U, { settleMs: 800 });
    console.log(tag, 'reduced:', await r.eval(`document.querySelector('.fx').className + ' ' + document.querySelector('.fx').getAttribute('href')`));
    await shot(r, `${outDir}/reduced-motion-${tag}.jpg`, await r.eval(rect));
    if (tag === '390') await shot(r, `${outDir}/home-top-390.jpg`, { x: 0, y: 0, width: w, height: h });
  }
  console.log('errors:', errors);
} finally { await b.close(); }
