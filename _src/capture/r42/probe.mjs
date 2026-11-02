// R42 working checks (not deliverables): node probe.mjs <port> -> /tmp/r42-probe/*.jpg + numbers on stdout
import { Browser, sleep } from '/Users/janetmao/.claude/skills/design-taste-frontend/scripts/lib/cdp.mjs';
import { writeFileSync, mkdirSync } from 'node:fs';
const [port = '5242'] = process.argv.slice(2);
const BASE = `http://127.0.0.1:${port}/_src/mock-hero/`;
const out = '/tmp/r42-probe'; mkdirSync(out, { recursive: true });
const mouse = (p, x, y, type = 'mouseMoved') => p.send('Input.dispatchMouseEvent', { type, x, y, button: type === 'mouseMoved' ? 'none' : 'left', clickCount: 1 });
const shot = async (p, name, clip) => { const { data } = await p.send('Page.captureScreenshot', { format: 'jpeg', quality: 85, ...(clip ? { clip: { ...clip, scale: 1 } } : {}) }); writeFileSync(`${out}/${name}.jpg`, Buffer.from(data, 'base64')); };

const b = await Browser.launch({ width: 1440, height: 900 });
try {
  // A: eye transform for cursor in four directions
  const p = await b.newPage({ width: 1440, height: 900, dsf: 2 });
  await p.goto(BASE + 'option-a.html', { settleMs: 7500 });
  const eye = await p.eval(`(() => { const r = document.querySelectorAll('.eye')[1].getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; })()`);
  console.log('eye at', eye);
  for (const [n, dx, dy] of [['left', -600, 0], ['right', 500, 0], ['up', 0, -300], ['down', 0, 300], ['near', 8, 4]]) {
    await mouse(p, Math.round(eye.x + dx), Math.round(eye.y + dy)); await sleep(400);
    const t = await p.eval(`document.querySelectorAll('.look')[1].style.transform`);
    console.log('A', n, t);
    await shot(p, `a-eye-${n}`, { x: eye.x - 60, y: eye.y - 50, width: 120, height: 100 });
  }
  await shot(p, 'a-full');
  console.log('A errors', p.consoleErrors);
  await p.close();

  // B: hover a word, click, keyboard
  const q = await b.newPage({ width: 1440, height: 900 });
  await q.goto(BASE + 'option-b.html', { settleMs: 11000 });
  const pos = await q.eval(`[...document.querySelectorAll('.lf')].map(l => { const t = l.querySelector('text'), r = t.getBoundingClientRect(); return { w: t.textContent, o: getComputedStyle(t).opacity, x: r.left + r.width / 2, y: r.top + r.height / 2 }; })`);
  console.log('B words', JSON.stringify(pos));
  const v = pos.find(w => +w.o > .8);
  if (v) {
    await mouse(q, Math.round(v.x), Math.round(v.y)); await sleep(400);
    console.log('B hover', await q.eval(`({ held: document.querySelector('.lf.hold')?.querySelector('text').textContent, card: document.querySelector('.def').textContent, on: document.querySelector('.def').className, cursor: getComputedStyle(document.querySelector('.forest')).cursor })`));
    await shot(q, 'b-hover');
    await sleep(2500);
    console.log('B still held after 2.5s', await q.eval(`document.querySelector('.lf.hold')?.querySelector('text').textContent`), await q.eval(`getComputedStyle(document.querySelector('.lf.hold text')).opacity`));
    await mouse(q, 200, 800); await sleep(500);
    console.log('B after leave', await q.eval(`({ held: !!document.querySelector('.lf.hold'), on: document.querySelector('.def').className })`));
  }
  // keyboard: tab from the last hero link into the leaves
  await q.eval(`document.querySelector('.hero-t .links a:last-child').focus()`);
  await q.send('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Tab', code: 'Tab', windowsVirtualKeyCode: 9 });
  await q.send('Input.dispatchKeyEvent', { type: 'keyUp', key: 'Tab', code: 'Tab', windowsVirtualKeyCode: 9 });
  await sleep(400);
  console.log('B keyboard', await q.eval(`({ focus: document.activeElement.getAttribute('aria-label'), card: document.querySelector('.def').textContent, ring: document.querySelector('.def-ring').className })`));
  await shot(q, 'b-key');
  console.log('B errors', q.consoleErrors);
  await q.close();
} finally { await b.close(); }
