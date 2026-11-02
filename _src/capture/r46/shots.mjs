// R46 checks + shots for the live homepage (hero eyes + colour A+B). Needs a static server on the repo root:
//   node _src/capture/r46/shots.mjs <port>
//   home-1440.jpg       settled after the story, cursor on "Janet" (she looks at it); home-full-1440.jpg the whole page
//   home-mid-1440.jpg   pollen rising out of the book, frozen at 4.9s
//   home-390.jpg        phone, settled;  home-reduced-1440.jpg  reduced motion
// Checks: hero box identical to the R45 mock, overflow, console errors, CLS, the pollen/aurora hand-off, reduced motion,
// and the other pages (style.css is shared) for overflow / errors.
import { Browser, sleep } from '/Users/janetmao/.claude/skills/design-taste-frontend/scripts/lib/cdp.mjs';
import { writeFileSync, mkdirSync } from 'node:fs';
const [port = '5246', outDir = 'shots-r46'] = process.argv.slice(2);
const ROOT = `http://127.0.0.1:${port}/`;
mkdirSync(outDir, { recursive: true });

const MARKS = `window.__cls = 0; new PerformanceObserver(l => l.getEntries().forEach(e => { if (!e.hadRecentInput) window.__cls += e.value; })).observe({ type: 'layout-shift', buffered: true });
addEventListener('DOMContentLoaded', () => {
  const c = document.createElement('div');
  c.innerHTML = '<svg width="18" height="24" viewBox="0 0 18 24"><path d="M1 1v19l5-5 3.5 7.5 3-1.4L9 13.8h7z" fill="#111" stroke="#fff" stroke-width="1.4" stroke-linejoin="round"/></svg>';
  c.style.cssText = 'position:fixed;left:0;top:0;z-index:99;pointer-events:none;display:none;margin:-1px 0 0 -1px';
  document.body.append(c);
  addEventListener('pointermove', e => { if (e.pointerType !== 'mouse') return; c.style.display = 'block'; c.style.transform = 'translate(' + e.clientX + 'px,' + e.clientY + 'px)'; }, true);
});`;
const b = await Browser.launch({ width: 1440, height: 900 });
const page = async (o) => { const p = await b.newPage(o); await p.send('Page.addScriptToEvaluateOnNewDocument', { source: MARKS }); return p; };
const shot = async (p, path, opt = {}) => { const { data } = await p.send('Page.captureScreenshot', { format: 'jpeg', quality: 88, ...opt }); writeFileSync(path, Buffer.from(data, 'base64')); };
const move = (p, x, y) => p.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: Math.round(x), y: Math.round(y) });
const glide = async (p, from, to, ms) => { const n = Math.max(2, Math.round(ms / 16)); for (let i = 1; i <= n; i++) { const k = i / n; await move(p, from[0] + (to[0] - from[0]) * k, from[1] + (to[1] - from[1]) * k); await sleep(16); } };
const center = (p, sel, i = 0) => p.eval(`(() => { const r = document.querySelectorAll(${JSON.stringify(sel)})[${i}].getBoundingClientRect(); return [r.left + r.width / 2, r.top + r.height / 2]; })()`);
const box = p => p.eval(`(() => { const r = document.querySelector('.forest').getBoundingClientRect(); return [r.x, r.y + scrollY, r.width, r.height].map(v => Math.round(v * 10) / 10).join(','); })()`);
const overflow = p => p.eval(`document.documentElement.scrollWidth - innerWidth`);
const freeze = (p, T) => p.eval(`document.getAnimations().forEach(a => { if (a instanceof CSSAnimation) { a.pause(); a.currentTime = ${T}; } })`);
const heroClip = async (p) => { const [x, y, w, h] = (await p.eval(`(() => { const r = document.querySelector('.fx').getBoundingClientRect(); return [r.x, r.y, r.width, r.height]; })()`)); return { clip: { x: x - 10, y: y - 10, width: w + 20, height: h + 20, scale: 1 } }; };
const report = async (p, label, bx, refBx) => console.log(label, 'box', bx, refBx ? (bx === refBx ? '(same as R45 mock)' : `(DIFFERS from mock ${refBx})`) : '',
  'overflow', await overflow(p), 'CLS', (await p.eval('window.__cls')).toFixed(4), 'errors', p.consoleErrors.length ? p.consoleErrors : 0);

try {
  const ref = {};
  for (const [url, live] of [['_src/mock-hero/color-ab.html', false], ['index.html', true]]) {
    { // 1440 settled, cursor on "Janet"
      const p = await page({ width: 1440, height: 900 });
      await p.goto(ROOT + url, { settleMs: 9500 });
      const eye = await center(p, '.eye', 1), mark = await center(p, '.hero h1 mark');
      await glide(p, [eye[0] + 200, eye[1] + 260], mark, 500); await sleep(500);
      const bx = await box(p);
      if (!live) { ref[1440] = bx; await p.close(); continue; }
      console.log('look (cursor on Janet)', await p.eval(`document.querySelectorAll('.look')[1].style.transform`));
      await shot(p, `${outDir}/home-1440.jpg`);
      await report(p, 'live 1440', bx, ref[1440]);
      const h = await p.eval('document.documentElement.scrollHeight');
      await shot(p, `${outDir}/home-full-1440.jpg`, { captureBeyondViewport: true, clip: { x: 0, y: 0, width: 1440, height: h, scale: 1 } });
      await p.close();
    }
    { // 390 settled
      const p = await page({ width: 390, height: 844, dsf: 2, mobile: true });
      await p.goto(ROOT + url, { settleMs: 300 });
      await p.eval(`scrollTo(0, document.querySelector('.forest').getBoundingClientRect().top + scrollY - 260)`);
      await sleep(9500);
      const bx = await box(p);
      if (!live) { ref[390] = bx; await p.close(); continue; }
      await shot(p, `${outDir}/home-390.jpg`);
      await report(p, 'live 390 ', bx, ref[390]);
      await p.close();
    }
  }
  { // mid-story, frozen + the pollen -> aurora hand-off
    const p = await page({ width: 1440, height: 900 });
    await p.goto(ROOT + 'index.html', { settleMs: 1200 });
    await freeze(p, 4900); await sleep(200);
    await shot(p, `${outDir}/home-mid-1440.jpg`);
    const tl = [];
    for (let T = 3000; T <= 11000; T += 400) {
      await freeze(p, T); await sleep(60);
      tl.push(await p.eval(`(() => { const fx = document.querySelector('.fx'), op = s => [...fx.querySelectorAll(s)].map(e => +getComputedStyle(e).opacity);
        const r = n => Math.round(n * 100) / 100; return [${T} / 1000, r(Math.max(0, ...op('.pn'))), r(op('.wglow')[0]), r(op('.aur')[0])]; })()`));
    }
    const overlap = tl.filter(([, pn, , au]) => pn > .01 && au > .01);
    console.log('timeline [s, pollenMax, glow, aurora]', JSON.stringify(tl), '\n  frames with pollen AND aurora:', overlap.length);
    await p.close();
  }
  { // blink -> mote wiring: force the time gate open, then fire blinks until one qualifies
    const p = await page({ width: 1440, height: 900 });
    await p.goto(ROOT + 'index.html', { settleMs: 13000 });
    const n = await p.eval(`new Promise(res => { const fx = document.querySelector('.fx'), m = fx.querySelector('.motes'); let seen = 0;
      new MutationObserver(r => r.forEach(x => seen += x.addedNodes.length)).observe(m, { childList: true });
      for (let i = 0; i < 12; i++) fx.dispatchEvent(new CustomEvent('blink')); setTimeout(() => res(seen), 300); })`);
    console.log('blink motes after 12 forced blinks (30s gap => expect 1):', n, 'errors', p.consoleErrors.length ? p.consoleErrors : 0);
    await p.close();
  }
  { // reduced motion
    const p = await page({ width: 1440, height: 900, reducedMotion: true });
    await p.goto(ROOT + 'index.html', { settleMs: 1500 });
    const eye = await center(p, '.eye', 1);
    await move(p, eye[0] - 400, eye[1] - 100); await sleep(600);
    const r = await p.eval(`(() => { const fx = document.querySelector('.fx'), op = s => [...fx.querySelectorAll(s)].map(e => +getComputedStyle(e).opacity);
      return { tell: fx.classList.contains('tell'), running: fx.getAnimations({ subtree: true }).length,
        aurora: op('.aur')[0], glow: op('.wglow')[0], pollenMax: Math.max(0, ...op('.pn')), motes: fx.querySelector('.motes').childElementCount,
        leafEdge: getComputedStyle(fx.querySelector('.lf-l path')).stroke, look: document.querySelectorAll('.look')[1].style.transform }; })()`);
    await shot(p, `${outDir}/home-reduced-1440.jpg`, await heroClip(p));
    console.log('reduced', JSON.stringify(r), 'errors', p.consoleErrors.length ? p.consoleErrors : 0);
    await p.close();
  }
  for (const pg of ['projects/lexiai.html', 'projects/ai-terms.html', 'projects/research.html']) for (const w of [1440, 390]) {
    const p = await page(w === 390 ? { width: 390, height: 844, dsf: 2, mobile: true } : { width: 1440, height: 900 });
    await p.goto(ROOT + pg, { settleMs: 1500 });
    await report(p, `${pg} ${w}`, '', '');
    await p.close();
  }
} finally { await b.close(); }
