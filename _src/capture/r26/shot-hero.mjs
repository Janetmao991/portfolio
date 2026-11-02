// R26: story-only hero disc. Frames for scenes 1/2/3, the hold and the fade at 1440 and 390, a real-time loop check,
// a reduced-motion still, and GIF frames. Frames are seeked with the Web Animations API (all paused at one story time).
import { Browser, sleep } from '/Users/janetmao/.claude/skills/design-taste-frontend/scripts/lib/cdp.mjs';
import { writeFileSync } from 'node:fs';
const [outDir = 'shots-r26', port = '5199', gifDir = ''] = process.argv.slice(2);
const U = `http://127.0.0.1:${port}/index.html`;
const rect = `(() => { const r = document.querySelector('.hero-v').getBoundingClientRect(); return { x: r.left + scrollX, y: r.top + scrollY, width: r.width, height: r.height }; })()`;
const shot = async (pg, path, c) => { const { data } = await pg.send('Page.captureScreenshot', { format: path.endsWith('png') ? 'png' : 'jpeg', quality: 90, clip: { scale: 1, ...c } }, 45000); writeFileSync(path, Buffer.from(data, 'base64')); };
const label = `[...document.querySelectorAll('.fx-c span')].filter(s => +getComputedStyle(s).opacity > .5).map(s => s.textContent).join('|')`;
const seek = t => `(() => { document.getAnimations().forEach(a => { a.pause(); a.currentTime = ${t * 1000}; }); return ${label}; })()`;
const info = `({ cls: document.querySelector('.fx').className, href: document.querySelector('.fx').getAttribute('href'), label: ${label},
  storyOpacity: getComputedStyle(document.querySelector('.fx-story')).opacity, icons: document.querySelectorAll('.fx-i, .fx-c [data-href]').length,
  overflow: document.documentElement.scrollWidth > innerWidth })`;
const errors = [];
const b = await Browser.launch({ width: 1440, height: 900 });
try {
  for (const [w, h, tag, mobile] of [[1440, 900, '1440', false], [390, 844, '390', true]]) {
    const p = await b.newPage({ width: w, height: h, dsf: 2, mobile });
    await p.goto(U, { settleMs: 300 });
    const c = await p.eval(rect);
    for (const [name, t] of [['1-bored', 2.0], ['2-sees-ai', 4.2], ['3-learning', 7.0], ['4-hold', 8.6], ['5-fade', 9.2]]) {
      console.log(tag, name, 'label:', await p.eval(seek(t)));
      await sleep(150); await shot(p, `${outDir}/${name}-${tag}.jpg`, c);
    }
    if (gifDir && tag === '1440') for (let f = 0; f <= 95; f++) { await p.eval(seek(f / 10)); await sleep(60); await shot(p, `${gifDir}/f${String(f).padStart(3, '0')}.png`, c); }
    // real time: one full pass (9.5s) and into the second, which should be back on scene 1
    await p.goto(U, { settleMs: 0 });
    await sleep(8000); console.log(tag, 'real 8s:', JSON.stringify(await p.eval(info)));
    await sleep(3200); console.log(tag, 'real 11.2s (loop 2):', JSON.stringify(await p.eval(info)));
    await shot(p, `${outDir}/6-loop2-bored-${tag}.jpg`, c);
    errors.push(...p.consoleErrors);
    const r = await b.newPage({ width: w, height: h, dsf: 2, mobile, reducedMotion: true });
    await r.goto(U, { settleMs: 800 });
    console.log(tag, 'reduced:', JSON.stringify(await r.eval(info)));
    await shot(r, `${outDir}/reduced-motion-${tag}.jpg`, await r.eval(rect));
    await shot(r, `${outDir}/home-top-${tag}.jpg`, { x: 0, y: 0, width: w, height: h });
    errors.push(...r.consoleErrors);
  }
  console.log('errors:', errors);
} finally { await b.close(); }
