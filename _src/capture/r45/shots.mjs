// R45 deliverables into shots-r45/ (mock only). Needs a static server on the repo root: node shots.mjs <port>
//   ab-1440.jpg  ab-390.jpg   settled, after the story (cursor on "Janet", she looks at it)
//   ab-mid-1440.jpg           pollen rising from the book, frozen at 4.9s
//   ab.mp4                    screencast at real speed: the whole story, then the cursor wanders
// Also: the pollen / glow / aurora timeline (sampled frozen frames), and how often blink motes appear over 90s.
// Also checks: layout shift, console errors, sideways overflow, same hero box as option A, reduced motion, eye still follows.
import { Browser, sleep } from '/Users/janetmao/.claude/skills/design-taste-frontend/scripts/lib/cdp.mjs';
import { writeFileSync, mkdirSync, rmSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
const [port = '5245', outDir = 'shots-r45'] = process.argv.slice(2);
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

const MID = { 'color-ab': 4900 };
const NAME = { 'color-ab': 'ab' };
const ref = {};
try {
  for (const v of ['option-a', 'color-ab']) {
    { // 1440 settled: cursor on "Janet", she looks at it
      const p = await page({ width: 1440, height: 900 });
      await p.goto(BASE + v + '.html', { settleMs: 9500 });
      const eye = await center(p, '.eye', 1), mark = await center(p, '.hero h1 mark');
      await glide(p, [eye[0] + 200, eye[1] + 260], mark, 500); await sleep(500);
      const look = await p.eval(`document.querySelectorAll('.look')[1].style.transform`);
      const bx = await box(p); if (v === 'option-a') ref[1440] = bx;
      if (v !== 'option-a') await shot(p, `${outDir}/${NAME[v]}-1440.jpg`);
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
      if (v !== 'option-a') await shot(p, `${outDir}/${NAME[v]}-390.jpg`);
      console.log(v, '390 ', 'box', bx, bx === ref[390] ? '(same as A)' : '(DIFFERS)', 'overflow', await overflow(p),
        'CLS', (await p.eval('window.__cls')).toFixed(4), 'errors', p.consoleErrors.length ? p.consoleErrors : 0);
      await p.close();
    }
    if (v === 'option-a') continue;
    { // mid-story, frozen
      const p = await page({ width: 1440, height: 900 });
      await p.goto(BASE + v + '.html', { settleMs: 1200 });
      await freeze(p, MID[v]); await sleep(200);
      await shot(p, `${outDir}/${NAME[v]}-mid-1440.jpg`);
      const tl = [];
      for (let T = 3000; T <= 11000; T += 400) {
        await freeze(p, T); await sleep(60);
        tl.push(await p.eval(`(() => { const fx = document.querySelector('.fx'), op = s => [...fx.querySelectorAll(s)].map(e => +getComputedStyle(e).opacity);
          const r = n => Math.round(n * 100) / 100; return [${T} / 1000, r(Math.max(0, ...op('.pn'))), op('.pn').filter(o => o > .05).length, r(op('.wglow')[0]), r(op('.aur')[0])]; })()`));
      }
      console.log('timeline [s, pollenMax, pollenVisible, glow, aurora]'); tl.forEach(r => console.log('  ', JSON.stringify(r)));
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
      await shot(p, `${outDir}/ab-reduced-1440.jpg`, await heroClip(p));
      console.log(v, 'reduced', JSON.stringify(r));
      await p.close();
    }
    { // video: the whole story from the first frame, then the cursor wanders and she follows
      const p = await page({ width: 1440, height: 900 });
      const rec = record(p, `/tmp/r45-${v}-frames`);
      await rec.start();
      await p.goto(BASE + v + '.html', { settleMs: 10500 });
      const [ex, ey] = await center(p, '.eye', 1);
      const path = [[ex + 360, ey + 260], [430, 240], [ex - 60, 130], [ex + 320, 170], [ex + 120, ey + 330], [ex + 20, ey + 6]];
      await move(p, ...path[0]);
      for (let i = 1; i < path.length; i++) { await glide(p, path[i - 1], path[i], 1000); await sleep(600); }
      await sleep(9000);   // long enough (~30s) that a blink mote (allowed from 12s) has a fair chance to show
      await rec.stop(`${outDir}/${NAME[v]}.mp4`); await p.close();
    }
  }
  { // blink motes: count blinks and motes for 90s at real speed
    const p = await page({ width: 1440, height: 900 });
    await p.goto(BASE + 'color-ab.html', { settleMs: 300 });
    await p.eval(`window.__bl = []; window.__mo = []; const fx = document.querySelector('.fx'), t0 = performance.now();
      fx.addEventListener('blink', () => __bl.push(Math.round((performance.now() - t0) / 100) / 10));
      new MutationObserver(m => m.forEach(r => r.addedNodes.length && __mo.push(Math.round((performance.now() - t0) / 100) / 10))).observe(fx.querySelector('.motes'), { childList: true })`);
    await sleep(90000);
    console.log('90s: blinks', JSON.stringify(await p.eval('__bl')), 'motes at', JSON.stringify(await p.eval('__mo')));
    await p.close();
  }
} finally { await b.close(); }
