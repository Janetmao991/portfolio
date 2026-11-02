// R31: the "How it fits together" mock at 1440 (rest + one node hovered), 390, and 1440 with reduced motion.
import { Browser, sleep } from '/Users/janetmao/.claude/skills/design-taste-frontend/scripts/lib/cdp.mjs';
import { writeFileSync } from 'node:fs';
const [outDir = 'shots-r31', port = '5231', hoverId = 'podcast-dig'] = process.argv.slice(2);
const U = `http://127.0.0.1:${port}/_src/mock-map/map.html`;
const rect = sel => `(() => { const r = document.querySelector('${sel}').getBoundingClientRect(); return { x: r.left + scrollX, y: r.top + scrollY, width: r.width, height: r.height }; })()`;
const shot = async (pg, path, c) => { const { data } = await pg.send('Page.captureScreenshot', { format: 'jpeg', quality: 90, captureBeyondViewport: true, clip: { scale: 1, ...c } }, 45000); writeFileSync(path, Buffer.from(data, 'base64')); };
// labels overlapping nodes or each other, nodes overlapping each other, sideways overflow
const info = `(() => {
  const box = e => e.getBoundingClientRect(), hit = (a, b) => a.left < b.right && b.left < a.right && a.top < b.bottom && b.top < a.bottom;
  const nds = [...document.querySelectorAll('.fit .nd, .fit .vp')].map(e => [e.dataset.id, box(e)]);
  const lbs = [...document.querySelectorAll('.fit .wl')].map(e => [e.textContent, box(e)]);
  const clash = [];
  lbs.forEach(([t, r]) => nds.forEach(([id, n]) => hit(r, n) && clash.push(t + ' x ' + id)));
  lbs.forEach(([t, r], i) => lbs.slice(i + 1).forEach(([u, q]) => hit(r, q) && clash.push(t + ' x ' + u)));
  nds.forEach(([t, r], i) => nds.slice(i + 1).forEach(([u, q]) => hit(r, q) && clash.push(t + ' x ' + u)));
  const fm = document.querySelector('.fm'), fit = document.querySelector('.fit');
  return { clash, overflow: document.documentElement.scrollWidth > innerWidth, fitShown: getComputedStyle(fit).display !== 'none', fmShown: getComputedStyle(fm).display !== 'none',
    minFont: Math.min(...[...document.querySelectorAll('#fits *')].filter(e => e.offsetParent || e.closest('svg')).map(e => parseFloat(getComputedStyle(e).fontSize))) };
})()`;
const errors = [];
const b = await Browser.launch({ width: 1440, height: 900 });
try {
  for (const [w, h, tag, mobile, reducedMotion] of [[1440, 900, '1440', false, false], [390, 844, '390', true, false], [1440, 900, '1440-reduced', false, true]]) {
    const p = await b.newPage({ width: w, height: h, dsf: 2, mobile, reducedMotion });
    await p.goto(U, { settleMs: 600 });
    await p.eval(`document.querySelector('#fits').scrollIntoView()`);
    await sleep(3000);
    console.log(tag, JSON.stringify(await p.eval(info)));
    await shot(p, `${outDir}/map-${tag}.jpg`, await p.eval(rect('#fits')));
    if (tag === '1440') {
      await shot(p, `${outDir}/page-1440.jpg`, { x: 0, y: 0, width: 1440, height: await p.eval('document.documentElement.scrollHeight') });
      const c = await p.eval(`(() => { const r = document.querySelector('.nd[data-id="${hoverId}"] .ic').getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; })()`);
      await p.send('Input.dispatchMouseEvent', { type: 'mouseMoved', ...c }); await sleep(500);
      console.log('note:', await p.eval(`document.getElementById('fit-note').textContent`));
      await shot(p, `${outDir}/map-hover-${hoverId}-1440.jpg`, await p.eval(rect('#fits')));
    }
    if (tag === '390') await shot(p, `${outDir}/page-390.jpg`, { x: 0, y: 0, width: 390, height: await p.eval('document.documentElement.scrollHeight') });
    errors.push(...p.consoleErrors);
  }
  console.log('errors:', errors);
} finally { await b.close(); }
