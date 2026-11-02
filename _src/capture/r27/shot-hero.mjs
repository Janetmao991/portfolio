// R27: book-forest hero. A frame per scene + the living forest at 1440 and 390, a real-time check, a parallax check,
// a reduced-motion still, and GIF frames. Frames are seeked with the Web Animations API (all paused at one story time).
import { Browser, sleep } from '/Users/janetmao/.claude/skills/design-taste-frontend/scripts/lib/cdp.mjs';
import { writeFileSync } from 'node:fs';
const [outDir = 'shots-r27', port = '5199', gifDir = ''] = process.argv.slice(2);
const U = `http://127.0.0.1:${port}/index.html`;
const rect = `(() => { const r = document.querySelector('.hero-v').getBoundingClientRect(); return { x: r.left + scrollX, y: r.top + scrollY, width: r.width, height: r.height }; })()`;
const shot = async (pg, path, c) => { const { data } = await pg.send('Page.captureScreenshot', { format: path.endsWith('png') ? 'png' : 'jpeg', quality: 90, clip: { scale: 1, ...c } }, 45000); writeFileSync(path, Buffer.from(data, 'base64')); };
const label = `[...document.querySelectorAll('.fx-c span')].filter(s => +getComputedStyle(s).opacity > .5).map(s => s.textContent).join('|')`;
const words = `[...document.querySelectorAll('.fx-story text')].filter(s => +getComputedStyle(s).opacity > .5).map(s => s.textContent).join(',')`;
const seek = t => `(() => { document.getAnimations().forEach(a => { a.pause(); a.currentTime = ${t * 1000}; }); return ${label} + ' / words: ' + ${words}; })()`;
const info = `({ cls: document.querySelector('.fx').className, tag: document.querySelector('.fx').tagName, links: document.querySelectorAll('.hero-v a').length,
  label: ${label}, words: ${words}, anims: document.getAnimations().length, running: document.getAnimations().filter(a => a.playState === 'running').length,
  overflow: document.documentElement.scrollWidth > innerWidth, svgW: Math.round(document.querySelector('.fx-story').getBoundingClientRect().width) })`;
const errors = [];
const b = await Browser.launch({ width: 1440, height: 900 });
try {
  for (const [w, h, tag, mobile] of [[1440, 900, '1440', false], [390, 844, '390', true]]) {
    const p = await b.newPage({ width: w, height: h, dsf: 2, mobile });
    await p.goto(U, { settleMs: 300 });
    const c = await p.eval(rect);
    for (const [name, t] of [['1-bored', 2.2], ['2-opens', 3.6], ['3-forest-grows', 5.3], ['4-words', 9.0], ['5-living-forest', 14.5]]) {
      console.log(tag, name, await p.eval(seek(t)));
      await sleep(150); await shot(p, `${outDir}/${name}-${tag}.jpg`, c);
    }
    if (gifDir && tag === '1440') for (let f = 0; f <= 120; f++) { await p.eval(seek(f / 10)); await sleep(50); await shot(p, `${gifDir}/f${String(f).padStart(3, '0')}.png`, c); }
    // real time
    await p.goto(U, { settleMs: 0 });
    await sleep(1500); console.log(tag, 'real 1.5s:', JSON.stringify(await p.eval(info)));
    await sleep(8000); console.log(tag, 'real 9.5s:', JSON.stringify(await p.eval(info)));
    await sleep(8000); console.log(tag, 'real 17.5s:', JSON.stringify(await p.eval(info)));
    if (!mobile) {  // parallax: move the mouse to the far left, then far right
      for (const [mx, nm] of [[700, 'left'], [1430, 'right']]) {
        await p.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: mx, y: 300 }); await sleep(1100);
        console.log('parallax', nm, await p.eval(`getComputedStyle(document.querySelector('.fx')).getPropertyValue('--mx') + ' ' + getComputedStyle(document.querySelectorAll('.fx-story .pl')[5]).transform`));
        await shot(p, `${outDir}/parallax-${nm}-1440.jpg`, c);
      }
    }
    // off-screen pause
    await p.eval(`scrollTo(0, 3000)`); await sleep(600);
    console.log(tag, 'scrolled away:', JSON.stringify(await p.eval(info)));
    await p.eval(`scrollTo(0, 0)`); await sleep(400);
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
