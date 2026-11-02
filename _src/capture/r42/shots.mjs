// R42 deliverables into shots-r42/ (mock only). Needs a static server on the repo root: node shots.mjs <port>
//   a-1440.jpg  a-390.jpg  b-1440-tooltip.jpg  b-390-tooltip.jpg   (+ a-eyes-1440.jpg: the eye, 4 cursor directions, 2× crops)
//   a.mp4  b.mp4   screencasts at real speed
// Screenshots and video don't include the system cursor, so a small drawn arrow (mouse) or ring (tap) is added to the
// capture to show where the pointer is. It is injected by this script only; the mocks don't contain it.
// Also checks: layout shift (CLS) while interacting, reduced motion, console errors.
import { Browser, sleep } from '/Users/janetmao/.claude/skills/design-taste-frontend/scripts/lib/cdp.mjs';
import { writeFileSync, readFileSync, mkdirSync, rmSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
const [port = '5242', outDir = 'shots-r42'] = process.argv.slice(2);
const BASE = `http://127.0.0.1:${port}/_src/mock-hero/`;
mkdirSync(outDir, { recursive: true });

const MARKS = `window.__cls = 0; new PerformanceObserver(l => l.getEntries().forEach(e => { if (!e.hadRecentInput) window.__cls += e.value; })).observe({ type: 'layout-shift', buffered: true });
addEventListener('DOMContentLoaded', () => {
  const c = document.createElement('div');
  c.innerHTML = '<svg width="18" height="24" viewBox="0 0 18 24"><path d="M1 1v19l5-5 3.5 7.5 3-1.4L9 13.8h7z" fill="#111" stroke="#fff" stroke-width="1.4" stroke-linejoin="round"/></svg>';
  c.style.cssText = 'position:fixed;left:0;top:0;z-index:99;pointer-events:none;display:none;margin:-1px 0 0 -1px';
  document.body.append(c);
  addEventListener('pointermove', e => { if (e.pointerType !== 'mouse') return; c.style.display = 'block'; c.style.transform = 'translate(' + e.clientX + 'px,' + e.clientY + 'px)'; }, true);
  const t = document.createElement('div');
  t.style.cssText = 'position:fixed;left:0;top:0;z-index:99;pointer-events:none;width:34px;height:34px;margin:-17px 0 0 -17px;border-radius:50%;background:rgba(17,17,17,.14);box-shadow:0 0 0 1.5px rgba(17,17,17,.45);display:none';
  document.body.append(t);
  addEventListener('pointerdown', e => { if (e.pointerType === 'mouse') return; t.style.display = 'block'; t.style.transform = 'translate(' + e.clientX + 'px,' + e.clientY + 'px)'; }, true);
});`;

const b = await Browser.launch({ width: 1440, height: 900 });
const page = async (o) => { const p = await b.newPage(o); await p.send('Page.addScriptToEvaluateOnNewDocument', { source: MARKS }); return p; };
const shot = async (p, path, clip) => { const { data } = await p.send('Page.captureScreenshot', { format: 'jpeg', quality: 88, ...(clip ? { clip: { ...clip, scale: 1 } } : {}) }); writeFileSync(path, Buffer.from(data, 'base64')); };
const move = (p, x, y) => p.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: Math.round(x), y: Math.round(y) });
const click = async (p, x, y) => { for (const type of ['mousePressed', 'mouseReleased']) await p.send('Input.dispatchMouseEvent', { type, x: Math.round(x), y: Math.round(y), button: 'left', clickCount: 1 }); };
const tap = async (p, x, y) => { await p.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: Math.round(x), y: Math.round(y) }] }); await sleep(60); await p.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] }); };
const glide = async (p, from, to, ms) => { const n = Math.max(2, Math.round(ms / 16)); for (let i = 1; i <= n; i++) { const k = i / n, e = k < .5 ? 2 * k * k : 1 - (-2 * k + 2) ** 2 / 2; await move(p, from[0] + (to[0] - from[0]) * e, from[1] + (to[1] - from[1]) * e); await sleep(16); } };
const center = (p, sel, i = 0) => p.eval(`(() => { const r = document.querySelectorAll(${JSON.stringify(sel)})[${i}].getBoundingClientRect(); return [r.left + r.width / 2, r.top + r.height / 2]; })()`);
// a word that is fully showing and will stay so for a moment (lf-word: visible from 56% to 86% of its 6s fall)
const freshWord = p => p.eval(`(async () => { for (let i = 0; i < 80; i++) { for (const l of document.querySelectorAll('.lf')) { const t = l.querySelector('text'), a = t.getAnimations()[0];
  if (!a) return null; const ph = ((a.currentTime - parseFloat(getComputedStyle(l).getPropertyValue('--t')) * 1000) % 6000) / 6000;
  if (ph > .58 && ph < .7) { const r = t.getBoundingClientRect(); return { w: t.textContent, x: r.left + r.width / 2, y: r.top + r.height / 2 }; } }
  await new Promise(r => setTimeout(r, 100)); } return null; })()`);
const report = async (p, label) => console.log(label, 'CLS', (await p.eval('window.__cls')).toFixed(4), 'errors', p.consoleErrors.length ? p.consoleErrors : 0);

function record(p, tmp) {
  rmSync(tmp, { recursive: true, force: true }); mkdirSync(tmp, { recursive: true });
  const frames = [];
  b.on(p.sessionId, 'Page.screencastFrame', ({ data, metadata, sessionId }) => {
    const f = `${tmp}/f${String(frames.length).padStart(5, '0')}.jpg`;
    writeFileSync(f, Buffer.from(data, 'base64')); frames.push({ f, t: metadata.timestamp });
    p.send('Page.screencastFrameAck', { sessionId }).catch(() => {});
  });
  return {
    start: () => p.send('Page.startScreencast', { format: 'jpeg', quality: 82, maxWidth: 1440, maxHeight: 900, everyNthFrame: 1 }),
    stop: async (out) => {
      await p.send('Page.stopScreencast');
      const list = frames.map((fr, i) => `file '${fr.f}'\nduration ${Math.max(0.001, ((frames[i + 1]?.t ?? fr.t + 0.5) - fr.t)).toFixed(4)}`).join('\n') + `\nfile '${frames.at(-1).f}'\n`;
      writeFileSync(`${tmp}/list.txt`, list);
      execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'concat', '-safe', '0', '-i', `${tmp}/list.txt`, '-vf', 'fps=30,scale=1440:-2', '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', '22', '-movflags', '+faststart', out]);
      console.log(out, 'frames', frames.length, 'span', (frames.at(-1).t - frames[0].t).toFixed(1) + 's');
    },
  };
}

try {
  // ---------- A ----------
  { // 1440: cursor up-left over the heading; she looks at it
    const p = await page({ width: 1440, height: 900 });
    await p.goto(BASE + 'option-a.html', { settleMs: 7600 });
    const eye = await center(p, '.eye', 1);
    await glide(p, [eye[0] + 200, eye[1] + 300], [430, 240], 500); await sleep(500);
    await shot(p, `${outDir}/a-1440.jpg`);
    console.log('A 1440 look', await p.eval(`document.querySelectorAll('.look')[1].style.transform`));
    await report(p, 'A 1440'); await p.close();
  }
  { // the eye up close, cursor left / right / up / down (2× pixels)
    const p = await page({ width: 1440, height: 900, dsf: 2 });
    await p.goto(BASE + 'option-a.html', { settleMs: 7600 });
    const [ex, ey] = await center(p, '.eye', 1), parts = [];
    for (const [n, dx, dy] of [['left', -500, 0], ['right', 400, 0], ['up', 0, -320], ['down', 0, 320]]) {
      await move(p, ex + dx, ey + dy); await sleep(450);
      await p.eval(`document.querySelectorAll('.lid').forEach(l => l.getAnimations().forEach(a => a.finish()))`);
      await shot(p, `/tmp/r42-eye-${n}.jpg`, { x: ex - 55, y: ey - 45, width: 110, height: 90 }); parts.push(`/tmp/r42-eye-${n}.jpg`);
    }
    execFileSync('ffmpeg', ['-y', '-loglevel', 'error', ...parts.flatMap(f => ['-i', f]), '-filter_complex', 'hstack=4', `${outDir}/a-eyes-1440.jpg`]);
    await p.close();
  }
  { // 390 touch: tap the intro text above-left of her; she looks up at it
    const p = await page({ width: 390, height: 844, dsf: 2, mobile: true });
    await p.goto(BASE + 'option-a.html', { settleMs: 300 });
    await p.eval(`scrollTo(0, document.querySelector('.forest').getBoundingClientRect().top + scrollY - 300)`);
    await sleep(7600);
    await tap(p, 70, 120); await sleep(500);
    await shot(p, `${outDir}/a-390.jpg`);
    console.log('A 390 look after tap', await p.eval(`document.querySelectorAll('.look')[1].style.transform`));
    await sleep(4300);
    console.log('A 390 back to idle', await p.eval(`document.querySelectorAll('.look')[1].style.transform`));
    await report(p, 'A 390'); await p.close();
  }
  { // reduced motion: no breathing, no blinks, the eye still follows
    const p = await page({ width: 1440, height: 900, reducedMotion: true });
    await p.goto(BASE + 'option-a.html', { settleMs: 800 });
    const eye = await center(p, '.eye', 1);
    await move(p, eye[0] - 400, eye[1] - 100); await sleep(4000);
    console.log('A reduced', JSON.stringify(await p.eval(`({ tell: document.querySelector('.fx').classList.contains('tell'), breathe: getComputedStyle(document.querySelector('.breathe')).animationName,
      blinks: [...document.querySelectorAll('.lid')].reduce((n, l) => n + l.getAnimations().length, 0), look: document.querySelectorAll('.look')[1].style.transform })`)));
    await p.close();
  }
  { // breathing amplitude and blink cadence over 14s
    const p = await page({ width: 1440, height: 900 });
    await p.goto(BASE + 'option-a.html', { settleMs: 7000 });
    const r = await p.eval(`(async () => { const lids = document.querySelectorAll('.lid'), br = document.querySelector('.breathe'); let max = 1, min = 1, blinks = [];
      const t0 = performance.now(); let was = false;
      while (performance.now() - t0 < 14000) { const m = new DOMMatrix(getComputedStyle(br).transform === 'none' ? undefined : getComputedStyle(br).transform);
        max = Math.max(max, m.a); min = Math.min(min, m.a); const now = lids[1].getAnimations().length > 0; if (now && !was) blinks.push(Math.round(performance.now() - t0)); was = now;
        await new Promise(r => setTimeout(r, 30)); } return { scale: [min.toFixed(4), max.toFixed(4)], blinksAtMs: blinks }; })()`);
    console.log('A breathing + blinks', JSON.stringify(r));
    await p.close();
  }
  { // video: the story ends, then the cursor wanders and she follows; blinks happen on their own
    const p = await page({ width: 1440, height: 900 });
    const rec = record(p, '/tmp/r42-a-frames');
    await p.goto(BASE + 'option-a.html', { settleMs: 6200 });
    await rec.start(); await sleep(400);
    const [ex, ey] = await center(p, '.eye', 1);
    const path = [[ex + 360, ey + 260], [430, 240], [ex - 60, 130], [ex + 300, 160], [ex + 340, ey + 40], [ex + 120, ey + 330], [ex - 380, ey + 300], [ex + 20, ey + 6]];
    await move(p, ...path[0]);
    for (let i = 1; i < path.length; i++) { await glide(p, path[i - 1], path[i], 1100); await sleep(700); }
    await sleep(1600);
    await rec.stop(`${outDir}/a.mp4`); await p.close();
  }

  // ---------- B ----------
  { // 1440: hover a word that has just turned
    const p = await page({ width: 1440, height: 900 });
    await p.goto(BASE + 'option-b.html', { settleMs: 6000 });
    const w = await freshWord(p);
    await glide(p, [w.x - 160, w.y + 220], [w.x, w.y], 400); await sleep(450);
    await shot(p, `${outDir}/b-1440-tooltip.jpg`);
    console.log('B 1440', w.w, JSON.stringify(await p.eval(`({ held: document.querySelector('.lf.hold text')?.textContent, card: document.querySelector('.def').innerText, cursor: getComputedStyle(document.querySelector('.forest')).cursor })`)));
    await report(p, 'B 1440'); await p.close();
  }
  { // 390: tap a word
    const p = await page({ width: 390, height: 844, dsf: 2, mobile: true });
    await p.goto(BASE + 'option-b.html', { settleMs: 300 });
    await p.eval(`scrollTo(0, document.querySelector('.forest').getBoundingClientRect().top + scrollY - 330)`);
    await sleep(5800);
    const w = await freshWord(p);
    await tap(p, w.x, w.y); await sleep(500);
    await shot(p, `${outDir}/b-390-tooltip.jpg`);
    const s = await p.eval(`(() => { const d = document.querySelector('.def').getBoundingClientRect(), h = document.querySelector('.hero').getBoundingClientRect(); return { held: document.querySelector('.lf.hold text')?.textContent, card: [Math.round(d.left), Math.round(d.right)], plate: [Math.round(h.left), Math.round(h.right)] }; })()`);
    console.log('B 390', w.w, JSON.stringify(s));
    await sleep(2500);
    console.log('B 390 still held 2.5s later', await p.eval(`document.querySelector('.lf.hold text')?.textContent`));
    await tap(p, 40, 120); await sleep(300);
    console.log('B 390 tap elsewhere closes', await p.eval(`!document.querySelector('.lf.hold') && !document.querySelector('.def.on')`));
    await report(p, 'B 390'); await p.close();
  }
  { // every definition, on every leaf, at 1440 and 390: the card stays inside the hero plate (which clips)
    const js = readFileSync(new URL('../../mock-hero/assets/b.js', import.meta.url), 'utf8');
    const defs = JSON.parse(js.slice(js.indexOf('const DEFS = ') + 13, js.indexOf(';\nconst fx')));
    for (const [w, h, m] of [[1440, 900, false], [390, 844, true]]) {
      const p = await page({ width: w, height: h, mobile: m, reducedMotion: true });
      await p.goto(BASE + 'option-b.html', { settleMs: 500 });
      const r = await p.eval(`(async () => { const defs = ${JSON.stringify(defs)}, bad = []; let maxH = 0;
        const card = document.querySelector('.def'), plate = document.querySelector('.hero').getBoundingClientRect();
        for (const lf of document.querySelectorAll('.lf')) { lf.focus(); for (const [t, d] of Object.entries(defs)) {
          card.querySelector('.def-t').textContent = t; card.querySelector('.def-d').textContent = d; dispatchEvent(new Event('resize'));
          const c = card.getBoundingClientRect(); maxH = Math.max(maxH, c.height);
          if (c.left < plate.left || c.right > plate.right || c.top < plate.top || c.bottom > plate.bottom) bad.push(lf.getAttribute('aria-label') + ' / ' + t); } lf.blur(); }
        return { checked: document.querySelectorAll('.lf').length * Object.keys(defs).length, outside: bad, tallestCard: Math.round(maxH) }; })()`);
      console.log('B fit', w, JSON.stringify(r));
      await p.close();
    }
  }
  { // reduced motion: words sit still; clicking one still shows its line
    const p = await page({ width: 1440, height: 900, reducedMotion: true });
    await p.goto(BASE + 'option-b.html', { settleMs: 600 });
    const [x, y] = await center(p, '.lf text', 2);
    await click(p, x, y); await sleep(200);
    console.log('B reduced', JSON.stringify(await p.eval(`({ tell: document.querySelector('.fx').classList.contains('tell'), held: document.querySelector('.lf.hold text')?.textContent, on: document.querySelector('.def').classList.contains('on') })`)));
    await p.close();
  }
  { // keyboard: Tab from the last hero link into the leaves, Tab again, Escape
    const p = await page({ width: 1440, height: 900 });
    await p.goto(BASE + 'option-b.html', { settleMs: 7000 });
    await p.eval(`document.querySelector('.hero-t .links a:last-child').focus()`);
    const key = async (k, code, vk) => { for (const type of ['keyDown', 'keyUp']) await p.send('Input.dispatchKeyEvent', { type, key: k, code, windowsVirtualKeyCode: vk }); await sleep(250); };
    const state = () => p.eval(`({ focus: document.activeElement.getAttribute('aria-label'), card: document.querySelector('.def.on .def-t')?.textContent || null, ring: document.querySelector('.def-ring').classList.contains('on'), described: document.activeElement.getAttribute('aria-describedby') })`);
    await key('Tab', 'Tab', 9); console.log('B key Tab', JSON.stringify(await state()));
    await key('Tab', 'Tab', 9); console.log('B key Tab', JSON.stringify(await state()));
    await key('Escape', 'Escape', 27); console.log('B key Esc', JSON.stringify(await state()));
    await p.close();
  }
  { // video: hover one word, read, move off; click another (pinned), click away
    const p = await page({ width: 1440, height: 900 });
    const rec = record(p, '/tmp/r42-b-frames');
    await p.goto(BASE + 'option-b.html', { settleMs: 6500 });
    await rec.start(); await move(p, 980, 560); await sleep(900);
    let w = await freshWord(p);
    await glide(p, [980, 560], [w.x, w.y], 900); await sleep(2600);
    await glide(p, [w.x, w.y], [w.x - 30, w.y + 260], 700); await sleep(1500);
    const w2 = await freshWord(p);
    await glide(p, [w.x - 30, w.y + 260], [w2.x, w2.y], 900); await sleep(300);
    await click(p, w2.x, w2.y); await sleep(1200);
    await glide(p, [w2.x, w2.y], [w2.x + 40, w2.y + 230], 700); await sleep(2200);
    await click(p, w2.x + 40, w2.y + 230); await sleep(1800);
    await rec.stop(`${outDir}/b.mp4`); await p.close();
  }
} finally { await b.close(); }
