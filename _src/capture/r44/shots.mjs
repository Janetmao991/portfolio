// R44 deliverables into shots-r44/ (mock only). Needs a static server on the repo root: node shots.mjs <port>
//   color-{a,b,c}-1440.jpg  color-{a,b,c}-390.jpg   settled, after the story (cursor on "Janet", she looks at it)
//   color-{a,b,c}-mid-1440.jpg                      one mid-story frame, frozen at an exact time
//   color-c-beats-1440.jpg                          the three beats side by side (amber, green, blue-lilac)
//   color-{a,b,c}.mp4                               screencasts at real speed: the whole story, then the cursor
// Also checks: layout shift, console errors, sideways overflow, same hero box as option A, reduced motion, eye still follows.
import { Browser, sleep } from '/Users/janetmao/.claude/skills/design-taste-frontend/scripts/lib/cdp.mjs';
import { writeFileSync, mkdirSync, rmSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
const [port = '5244', outDir = 'shots-r44'] = process.argv.slice(2);
const BASE = `http://127.0.0.1:${port}/_src/mock-hero/`;
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
const shot = async (p, path, clip) => { const { data } = await p.send('Page.captureScreenshot', { format: 'jpeg', quality: 90, ...(clip ? { clip: { ...clip, scale: 1 } } : {}) }); writeFileSync(path, Buffer.from(data, 'base64')); };
const move = (p, x, y) => p.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: Math.round(x), y: Math.round(y) });
const glide = async (p, from, to, ms) => { const n = Math.max(2, Math.round(ms / 16)); for (let i = 1; i <= n; i++) { const k = i / n, e = k < .5 ? 2 * k * k : 1 - (-2 * k + 2) ** 2 / 2; await move(p, from[0] + (to[0] - from[0]) * e, from[1] + (to[1] - from[1]) * e); await sleep(16); } };
const center = (p, sel, i = 0) => p.eval(`(() => { const r = document.querySelectorAll(${JSON.stringify(sel)})[${i}].getBoundingClientRect(); return [r.left + r.width / 2, r.top + r.height / 2]; })()`);
const box = p => p.eval(`(() => { const r = document.querySelector('.forest').getBoundingClientRect(); return [r.x, r.y + scrollY, r.width, r.height].map(v => Math.round(v * 10) / 10).join(','); })()`);
const overflow = p => p.eval(`document.documentElement.scrollWidth - innerWidth`);
// freeze every CSS animation at story time T (ms since the story began); they all start together when hero.js adds .tell
const freeze = (p, T) => p.eval(`document.getAnimations().forEach(a => { if (a instanceof CSSAnimation) { a.pause(); a.currentTime = ${T}; } })`);
const heroClip = async (p) => { const [x, y, w, h] = (await p.eval(`(() => { const r = document.querySelector('.fx').getBoundingClientRect(); return [r.x, r.y, r.width, r.height]; })()`)); return { x: x - 10, y: y - 10, width: w + 20, height: h + 20 }; };

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

const MID = { 'color-a': 7600, 'color-b': 4900, 'color-c': 3200 };
const ref = {};
try {
  for (const v of ['option-a', 'color-a', 'color-b', 'color-c']) {
    { // 1440 settled: cursor on "Janet", she looks at it
      const p = await page({ width: 1440, height: 900 });
      await p.goto(BASE + v + '.html', { settleMs: 9500 });
      const eye = await center(p, '.eye', 1), mark = await center(p, '.hero h1 mark');
      await glide(p, [eye[0] + 200, eye[1] + 260], mark, 500); await sleep(500);
      const look = await p.eval(`document.querySelectorAll('.look')[1].style.transform`);
      const bx = await box(p); if (v === 'option-a') ref[1440] = bx;
      if (v !== 'option-a') await shot(p, `${outDir}/${v}-1440.jpg`);
      console.log(v, '1440', 'look', look, 'box', bx, bx === ref[1440] ? '(same as A)' : '(DIFFERS)', 'overflow', await overflow(p),
        'CLS', (await p.eval('window.__cls')).toFixed(4), 'errors', p.consoleErrors.length ? p.consoleErrors : 0);
      await p.close();
    }
    { // 390 settled
      const p = await page({ width: 390, height: 844, dsf: 2, mobile: true });
      await p.goto(BASE + v + '.html', { settleMs: 300 });
      await p.eval(`scrollTo(0, document.querySelector('.forest').getBoundingClientRect().top + scrollY - 260)`);
      await sleep(9500);
      const bx = await box(p); if (v === 'option-a') ref[390] = bx;
      if (v !== 'option-a') await shot(p, `${outDir}/${v}-390.jpg`);
      console.log(v, '390 ', 'box', bx, bx === ref[390] ? '(same as A)' : '(DIFFERS)', 'overflow', await overflow(p),
        'CLS', (await p.eval('window.__cls')).toFixed(4), 'errors', p.consoleErrors.length ? p.consoleErrors : 0);
      await p.close();
    }
    if (v === 'option-a') continue;
    { // mid-story, frozen
      const p = await page({ width: 1440, height: 900 });
      await p.goto(BASE + v + '.html', { settleMs: 1200 });
      await freeze(p, MID[v]); await sleep(200);
      await shot(p, `${outDir}/${v}-mid-1440.jpg`);
      if (v === 'color-c') { // the three beats at their peak, cropped to the hero
        const clip = await heroClip(p), parts = [];
        for (const [n, T] of [['amber', 3200], ['green', 4050], ['lilac', 5900]]) {
          await freeze(p, T); await sleep(150); await shot(p, `/tmp/r44-beat-${n}.jpg`, clip); parts.push(`/tmp/r44-beat-${n}.jpg`);
        }
        execFileSync('ffmpeg', ['-y', '-loglevel', 'error', ...parts.flatMap(f => ['-i', f]), '-filter_complex', 'hstack=3', `${outDir}/color-c-beats-1440.jpg`]);
      }
      await p.close();
    }
    { // reduced motion: colours still shown, nothing animating in the hero, the eye still turns to the cursor
      const p = await page({ width: 1440, height: 900, reducedMotion: true });
      await p.goto(BASE + v + '.html', { settleMs: 1500 });
      const eye = await center(p, '.eye', 1);
      await move(p, eye[0] - 400, eye[1] - 100); await sleep(600);
      const r = await p.eval(`(() => { const fx = document.querySelector('.fx'), op = s => [...fx.querySelectorAll(s)].map(e => +getComputedStyle(e).opacity);
        return { tell: fx.classList.contains('tell'), running: fx.getAnimations({ subtree: true }).filter(a => !(a.effect.target.closest && a.effect.target.closest('.look'))).length,
          aurora: op('.aur'), glow: op('.wglow'), pollenMax: Math.max(0, ...op('.pn')), beatsMax: Math.max(0, ...op('.bt')),
          leafEdge: getComputedStyle(fx.querySelector('.lf-l path')).stroke, look: document.querySelectorAll('.look')[1].style.transform }; })()`);
      if (v === 'color-a') await shot(p, `/tmp/r44-a-reduced.jpg`, await heroClip(p));
      console.log(v, 'reduced', JSON.stringify(r));
      await p.close();
    }
    { // video: the whole story from the first frame, then the cursor wanders and she follows
      const p = await page({ width: 1440, height: 900 });
      const rec = record(p, `/tmp/r44-${v}-frames`);
      await rec.start();
      await p.goto(BASE + v + '.html', { settleMs: 10500 });
      const [ex, ey] = await center(p, '.eye', 1);
      const path = [[ex + 360, ey + 260], [430, 240], [ex - 60, 130], [ex + 320, 170], [ex + 120, ey + 330], [ex + 20, ey + 6]];
      await move(p, ...path[0]);
      for (let i = 1; i < path.length; i++) { await glide(p, path[i - 1], path[i], 1000); await sleep(600); }
      await sleep(v === 'color-b' ? 6000 : 1500);   // B: a little longer, so a blink mote has a chance to show
      await rec.stop(`${outDir}/${v}.mp4`); await p.close();
    }
  }
} finally { await b.close(); }
