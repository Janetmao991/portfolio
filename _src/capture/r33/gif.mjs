// R33: a short GIF of the map: scroll into view (pop-in, edges drawing, dots starting), then hover LexiAI and podcast-dig.
// Grabs screenshots as fast as Chrome gives them, keeps each frame's real timestamp, and lets ffmpeg build the GIF.
import { Browser, sleep } from '/Users/janetmao/.claude/skills/design-taste-frontend/scripts/lib/cdp.mjs';
import { writeFileSync, mkdirSync, rmSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
const [outDir = 'shots-r33', port = '5233'] = process.argv.slice(2);
const tmp = `${outDir}/_frames`; rmSync(tmp, { recursive: true, force: true }); mkdirSync(tmp, { recursive: true });
const b = await Browser.launch({ width: 1440, height: 900 });
const list = [];
try {
  const p = await b.newPage({ width: 1440, height: 900, dsf: 1 });
  await p.goto(`http://127.0.0.1:${port}/index.html`, { settleMs: 600 });
  await p.eval(`document.querySelector('.fit').scrollIntoView({ block: 'center' })`);
  const clip = await p.eval(`(() => { const r = document.querySelector('.fit').getBoundingClientRect(); return { x: r.left + scrollX, y: r.top + scrollY, width: r.width, height: r.height, scale: .62 }; })()`);
  const pt = id => p.eval(`(() => { const r = document.querySelector('.nd[data-id="${id}"] .ic').getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; })()`);
  const lexi = await pt('lexiai'), pod = await pt('podcast-dig');
  const t0 = Date.now(); let n = 0, last = t0;
  const grab = async () => {
    const { data } = await p.send('Page.captureScreenshot', { format: 'png', clip });
    const f = `f${String(n++).padStart(4, '0')}.png`; writeFileSync(`${tmp}/${f}`, Buffer.from(data, 'base64'));
    const now = Date.now(); if (list.length) list[list.length - 1].d = (now - last) / 1000; last = now; list.push({ f, d: .08 });
  };
  const until = async ms => { while (Date.now() - t0 < ms) await grab(); };
  await until(6500);                                                      // intro + a little living state
  await p.send('Input.dispatchMouseEvent', { type: 'mouseMoved', ...lexi }); await until(9000);
  await p.send('Input.dispatchMouseEvent', { type: 'mouseMoved', ...pod }); await until(11500);
  await p.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: 5, y: 5 }); await until(13000);
} finally { await b.close(); }
writeFileSync(`${tmp}/list.txt`, list.map(({ f, d }) => `file '${f}'\nduration ${d.toFixed(3)}`).join('\n') + `\nfile '${list.at(-1).f}'\n`);
const vf = 'fps=15,scale=800:-1:flags=lanczos,split[a][b];[a]palettegen=stats_mode=diff[p];[b][p]paletteuse=dither=bayer:bayer_scale=4';
execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'concat', '-safe', '0', '-i', `${tmp}/list.txt`, '-vf', vf, '-loop', '0', `${outDir}/map-motion.gif`]);
console.log('frames', list.length, 'gif', `${outDir}/map-motion.gif`);
rmSync(tmp, { recursive: true, force: true });
