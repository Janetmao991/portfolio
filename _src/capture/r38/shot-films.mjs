// R38: Research list (Startups + AI Terms groups), the three AI Terms film pages (slideshow: arrow keys, buttons,
// swipe, full screen) and the AI Terms project page link, at 1440 and 390. Checks overflow, max-width, console errors.
import { Browser, sleep } from '/Users/janetmao/.claude/skills/design-taste-frontend/scripts/lib/cdp.mjs';
import { writeFileSync } from 'node:fs';
const [outDir = 'shots-r38', port = '5238'] = process.argv.slice(2);
const U = (p) => `http://127.0.0.1:${port}/${p}`;
const rect = (sel, pad = 0) => `(() => { const r = document.querySelector('${sel}').getBoundingClientRect(); return { x: Math.max(0, r.left + scrollX - ${pad}), y: Math.max(0, r.top + scrollY - ${pad}), width: Math.min(innerWidth, r.width + ${2 * pad}), height: r.height + ${2 * pad} }; })()`;
const shot = async (pg, path, c, beyond = true) => { const { data } = await pg.send('Page.captureScreenshot', { format: 'jpeg', quality: 88, captureBeyondViewport: beyond, clip: { scale: 1, ...c } }, 45000); writeFileSync(path, Buffer.from(data, 'base64')); };
const full = async (pg, path) => shot(pg, path, await pg.eval(`({ x: 0, y: 0, width: innerWidth, height: document.documentElement.scrollHeight })`));
const key = async (pg, k, code) => { for (const type of ['keyDown', 'keyUp']) await pg.send('Input.dispatchKeyEvent', { type, key: k, code, windowsVirtualKeyCode: code === 'ArrowRight' ? 39 : code === 'ArrowLeft' ? 37 : 27 }); };
const state = `(() => { const ss = document.querySelector('[data-ss]'); return { n: ss.querySelector('.ss-n').textContent, full: ss.classList.contains('is-full'),
  prevDisabled: ss.querySelector('[data-ss-prev]').disabled, nextDisabled: ss.querySelector('[data-ss-next]').disabled }; })()`;
const b = await Browser.launch({ width: 1440, height: 900 });
try {
  for (const [w, h, m] of [[1440, 900, false], [390, 844, true]]) {
    const p = await b.newPage({ width: w, height: h, dsf: 2, mobile: m });
    // Research list
    await p.goto(U('projects/research.html'), { settleMs: 600 });
    console.log(w, 'research', JSON.stringify(await p.eval(`(() => ({
      groups: [...document.querySelectorAll('.plate .ph h2')].map(e => e.textContent + ':' + e.closest('.plate').querySelectorAll('.posts li').length),
      rows: [...document.querySelectorAll('.posts a')].map(a => a.getAttribute('href') + ' | ' + a.querySelector('.pt b').textContent),
      introMax: [...document.querySelectorAll('.intro-l, .title .what')].map(e => getComputedStyle(e).maxWidth + ' ' + Math.round(e.getBoundingClientRect().width) + '/' + Math.round(e.parentElement.getBoundingClientRect().width)),
      overflow: document.documentElement.scrollWidth > innerWidth }))()`)));
    await full(p, `${outDir}/research-${w}.jpg`);
    console.log(w, 'research console errors', p.consoleErrors.length, p.consoleErrors);
    // film pages
    for (const slug of ['embedding', 'vector-database', 'rag']) {
      await p.goto(U(`projects/research-aiterm-${slug}.html`), { settleMs: 900 });
      const info = await p.eval(`(() => ({ h1: document.querySelector('h1').textContent, slides: document.querySelectorAll('.ss-s').length,
        caps: [...document.querySelectorAll('.ss-s figcaption')].map(f => f.querySelector('b').textContent),
        whatMax: getComputedStyle(document.querySelector('.title .what')).maxWidth, capMax: getComputedStyle(document.querySelector('.ss-s figcaption')).maxWidth,
        capW: Math.round(document.querySelector('.ss-s figcaption').getBoundingClientRect().width), trackW: Math.round(document.querySelector('.ss-track').getBoundingClientRect().width),
        imgs: [...document.querySelectorAll('.ss-s img')].map(i => i.currentSrc.split('/').pop()),
        overflow: document.documentElement.scrollWidth > innerWidth }))()`);
      console.log(w, slug, JSON.stringify(info));
      console.log(w, slug, 'start', JSON.stringify(await p.eval(state)));
      if (slug === 'embedding') await full(p, `${outDir}/film-${slug}-${w}.jpg`);
      await key(p, 'ArrowRight', 'ArrowRight'); await sleep(700);
      console.log(w, slug, 'after ArrowRight', JSON.stringify(await p.eval(state)));
      await p.eval(`document.querySelector('[data-ss-next]').click()`); await sleep(700);
      console.log(w, slug, 'after next button', JSON.stringify(await p.eval(state)));
      if (m) {
        const c = await p.eval(`(() => { const r = document.querySelector('.ss-track').getBoundingClientRect(); return { x: Math.round(r.left + r.width * .8), y: Math.round(r.top + r.height * .3) }; })()`);
        await p.send('Input.synthesizeScrollGesture', { ...c, xDistance: -260, yDistance: 0, gestureSourceType: 'touch', speed: 1200 }, 15000).catch(e => console.log('swipe err', e.message));
        await sleep(900);
        console.log(w, slug, 'after swipe left', JSON.stringify(await p.eval(state)));
      }
      await key(p, 'ArrowLeft', 'ArrowLeft'); await sleep(700);
      console.log(w, slug, 'after ArrowLeft', JSON.stringify(await p.eval(state)));
      await p.eval(`document.querySelector('[data-ss]').scrollIntoView({ block: 'center' })`); await sleep(300);
      await shot(p, `${outDir}/slides-${slug}-${w}.jpg`, await p.eval(rect('#slides')));
      if (slug !== 'vector-database') {
        await p.eval(`document.querySelectorAll('.ss-img')[[...document.querySelectorAll('.ss-s')].findIndex(s => !s.inert)].click()`); await sleep(800);
        console.log(w, slug, 'after click slide', JSON.stringify(await p.eval(state)));
        await shot(p, `${outDir}/fullscreen-${slug}-${w}.jpg`, { x: 0, y: await p.eval(`scrollY`), width: w, height: h }, false);
        await key(p, 'ArrowRight', 'ArrowRight'); await sleep(700);
        console.log(w, slug, 'full + ArrowRight', JSON.stringify(await p.eval(state)));
        await key(p, 'Escape', 'Escape'); await sleep(600);
        console.log(w, slug, 'after Escape', JSON.stringify(await p.eval(state)));
      }
      // jump to the last slide: next is disabled there
      for (let i = 0; i < 5; i++) { await p.eval(`document.querySelector('[data-ss-next]').click()`); await sleep(500); }
      console.log(w, slug, 'at end', JSON.stringify(await p.eval(state)));
      console.log(w, slug, 'console errors', p.consoleErrors.length, p.consoleErrors);
    }
    // AI Terms project page link
    await p.goto(U('projects/ai-terms.html'), { settleMs: 800 });
    const sel = await p.eval(`(() => { const a = [...document.querySelectorAll('a')].find(a => a.textContent.includes('See the finished films')); if (!a) return null; a.closest('.lx-coda').id = 'r38-coda'; a.scrollIntoView({ block: 'center' }); return a.getAttribute('href'); })()`);
    await sleep(400);
    console.log(w, 'ai-terms link', sel, 'overflow:', await p.eval(`document.documentElement.scrollWidth > innerWidth`));
    if (sel) await shot(p, `${outDir}/ai-terms-link-${w}.jpg`, await p.eval(rect('#r38-coda', 12)));
    console.log(w, 'ai-terms console errors', p.consoleErrors.length, p.consoleErrors);
  }
} finally { await b.close(); }
