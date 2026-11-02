// R41 deliverables into shots-r41/ (mock only). Needs a static server on the repo root: node shots.mjs <port>
//   lexiai-1440.jpg / lexiai-390.jpg / research-1440.jpg / research-390.jpg   full page, after the reveals
//   motion-1..3-lexiai-1440.jpg   mid-animation frames (animations slowed 5× through DevTools so the in-between states are caught)
//   r41-motion.mp4                LexiAI loading and scrolling, real speed (screencast frames -> ffmpeg)
// Also checks: layout shift (CLS) while everything reveals, and the slideshow fade.
import { Browser, sleep } from '/Users/janetmao/.claude/skills/design-taste-frontend/scripts/lib/cdp.mjs';
import { writeFileSync, mkdirSync, rmSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
const [port = '5241', outDir = 'shots-r41'] = process.argv.slice(2);
const BASE = `http://127.0.0.1:${port}/_src/mock-taste/projects/`;
mkdirSync(outDir, { recursive: true });
const walk = `(async () => { for (let y = 0; y < document.body.scrollHeight; y += innerHeight / 3) { scrollTo(0, y); await new Promise(r => setTimeout(r, 220)); } scrollTo(0, 0); })()`;
const shotView = async (p, path) => { const { data } = await p.send('Page.captureScreenshot', { format: 'jpeg', quality: 85 }); writeFileSync(path, Buffer.from(data, 'base64')); };

const b = await Browser.launch({ width: 1440, height: 900 });
try {
  // 1. full pages + CLS
  for (const [w, h, mobile] of [[1440, 900, false], [390, 844, true]]) for (const n of ['lexiai', 'research']) {
    const p = await b.newPage({ width: w, height: h, dsf: mobile ? 2 : 1, mobile });
    await p.send('Page.addScriptToEvaluateOnNewDocument', { source: `window.__cls = 0; new PerformanceObserver(l => l.getEntries().forEach(e => { if (!e.hadRecentInput) window.__cls += e.value; })).observe({ type: 'layout-shift', buffered: true });` });
    await p.goto(BASE + n + '.html', { settleMs: 600 });
    await p.eval(walk);
    await sleep(2000);
    const H = await p.eval('document.documentElement.scrollHeight');
    const cls = await p.eval('window.__cls');
    const { data } = await p.send('Page.captureScreenshot', { format: 'jpeg', quality: 85, captureBeyondViewport: true, clip: { x: 0, y: 0, width: w, height: H, scale: 1 } });
    writeFileSync(`${outDir}/${n}-${w}.jpg`, Buffer.from(data, 'base64'));
    console.log(n, w, 'height', H, 'CLS', cls.toFixed(4), 'errors', p.consoleErrors.length);
    await p.close();
  }

  // 2. three mid-animation frames, LexiAI at 1440
  {
    const p = await b.newPage({ width: 1440, height: 900 });
    await p.send('Animation.enable');
    await p.send('Animation.setPlaybackRate', { playbackRate: 0.2 });
    await p.goto(BASE + 'lexiai.html', { settleMs: 0 });
    await sleep(700);                                   // ≈140ms of real time: title in, summary still rising
    await shotView(p, `${outDir}/motion-1-lexiai-1440.jpg`);
    await sleep(6000);                                  // let the top settle
    await p.eval(`scrollTo(0, document.querySelectorAll('.lx-h')[1].offsetTop - 60)`);
    await sleep(1300);                                  // ≈260ms: heading in, picture rising, callout not yet
    await shotView(p, `${outDir}/motion-2-lexiai-1440.jpg`);
    await sleep(2300);                                  // ≈720ms: picture in, ring settling, note sliding in
    await shotView(p, `${outDir}/motion-3-lexiai-1440.jpg`);
    await p.close();
  }

  // 3. the slideshow fade: opacity of the track just after "next", and after it settles
  {
    const p = await b.newPage({ width: 1440, height: 900 });
    await p.goto(BASE + 'research-aiterm-rag.html', { settleMs: 800 });
    const r = await p.eval(`(async () => { const t = document.querySelector('.ss-track'); document.querySelector('[data-ss-next]').click();
      await new Promise(r => setTimeout(r, 120)); const mid = +getComputedStyle(t).opacity;
      await new Promise(r => setTimeout(r, 700)); return { mid, end: +getComputedStyle(t).opacity, n: document.querySelector('.ss-n b').textContent, slide: Math.round(t.scrollLeft / t.clientWidth) + 1 }; })()`);
    console.log('slideshow fade', JSON.stringify(r));
    await p.close();
  }

  // 4. reduced motion: nothing hidden, nothing moving
  {
    const p = await b.newPage({ width: 1440, height: 900, reducedMotion: true });
    await p.goto(BASE + 'lexiai.html', { settleMs: 300 });
    const r = await p.eval(`(() => ({ m41: document.documentElement.classList.contains('m41'), hidden: [...document.querySelectorAll('main *')].filter(e => getComputedStyle(e).opacity === '0').length }))()`);
    console.log('reduced motion', JSON.stringify(r));
    await p.close();
  }

  // 5. the video: screencast frames with their timestamps, while the page loads and scrolls at a reading pace
  {
    const tmp = '/tmp/r41-frames'; rmSync(tmp, { recursive: true, force: true }); mkdirSync(tmp, { recursive: true });
    const p = await b.newPage({ width: 1440, height: 900 });
    const frames = [];
    b.on(p.sessionId, 'Page.screencastFrame', ({ data, metadata, sessionId }) => {
      const f = `${tmp}/f${String(frames.length).padStart(5, '0')}.jpg`;
      writeFileSync(f, Buffer.from(data, 'base64'));
      frames.push({ f, t: metadata.timestamp });
      p.send('Page.screencastFrameAck', { sessionId }).catch(() => {});
    });
    await p.goto('about:blank', { settleMs: 0 });
    await p.send('Page.startScreencast', { format: 'jpeg', quality: 80, maxWidth: 1440, maxHeight: 900, everyNthFrame: 1 });
    await sleep(300);
    await p.send('Page.navigate', { url: BASE + 'lexiai.html' });
    await sleep(2200);
    for (let i = 0; i < 22; i++) { await p.wheel(220, { step: 55, pauseMs: 16 }); await sleep(380); }
    await sleep(1200);
    await p.send('Page.stopScreencast');
    await p.close();
    // concat with each frame's real duration, then a constant 30 fps mp4
    const list = frames.map((fr, i) => `file '${fr.f}'\nduration ${Math.max(0.001, ((frames[i + 1]?.t ?? fr.t + 0.5) - fr.t)).toFixed(4)}`).join('\n') + `\nfile '${frames.at(-1).f}'\n`;
    writeFileSync(`${tmp}/list.txt`, list);
    execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'concat', '-safe', '0', '-i', `${tmp}/list.txt`, '-vf', 'fps=30,scale=1440:-2', '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', '23', '-movflags', '+faststart', `${outDir}/r41-motion.mp4`]);
    console.log('video frames', frames.length, 'span', (frames.at(-1).t - frames[0].t).toFixed(1) + 's');
  }
} finally { await b.close(); }
