// R37: the new Startup Research tagline on the home map (desktop nodes + phone list), the SR title plate and
// podcast-dig's next card, at 1440 and 390. Checks node overflow, clashes, sideways overflow and console errors.
import { Browser, sleep } from '/Users/janetmao/.claude/skills/design-taste-frontend/scripts/lib/cdp.mjs';
import { writeFileSync } from 'node:fs';
const [outDir = 'shots-r37', port = '5237'] = process.argv.slice(2);
const T = 'How I read a company: understand the tech, analyze the business.';
const rect = (sel, pad = 0) => `(() => { const r = document.querySelector('${sel}').getBoundingClientRect(); return { x: Math.max(0, r.left + scrollX - ${pad}), y: r.top + scrollY - ${pad}, width: Math.min(innerWidth, r.width + ${2 * pad}), height: r.height + ${2 * pad} }; })()`;
const shot = async (pg, path, c, beyond = true) => { const { data } = await pg.send('Page.captureScreenshot', { format: 'jpeg', quality: 90, captureBeyondViewport: beyond, clip: { scale: 1, ...c } }, 45000); writeFileSync(path, Buffer.from(data, 'base64')); };
const mapInfo = `(() => {
  const box = e => e.getBoundingClientRect(), hit = (a, b) => a.left < b.right && b.left < a.right && a.top < b.bottom && b.top < a.bottom;
  const fit = document.querySelector('.fit'), fm = document.querySelector('.fm'), F = box(fit);
  const nds = [...document.querySelectorAll('.fit .nd, .fit .vp')].map(e => [e.dataset.id, box(e)]);
  const lbs = [...document.querySelectorAll('.fit .wl')].map(e => [e.textContent, box(e)]);
  const clash = [];
  lbs.forEach(([t, r]) => nds.forEach(([id, n]) => hit(r, n) && clash.push(t + ' x ' + id)));
  nds.forEach(([t, r], i) => nds.slice(i + 1).forEach(([u, q]) => hit(r, q) && clash.push(t + ' x ' + u)));
  const sr = document.querySelector('.fit .nd[data-id="startup-research"]'), sm = sr.querySelector('small'), S = box(sr), M = box(sm);
  const fmSm = document.querySelector('.fm a[href$="startup-research.html"] small');
  const nodeOut = nds.filter(([, r]) => r.width && (r.left < F.left - 1 || r.right > F.right + 1 || r.top < F.top - 1 || r.bottom > F.bottom + 1)).map(([id]) => id);
  return { fitShown: getComputedStyle(fit).display !== 'none', fmShown: getComputedStyle(fm).display !== 'none',
    nodeText: sm.textContent === '${T}', fmText: fmSm.textContent === '${T}',
    srNode: [Math.round(S.width), Math.round(S.height)], srSmallLines: Math.round(M.height / parseFloat(getComputedStyle(sm).lineHeight)),
    srSmallClipped: sm.scrollWidth > sm.clientWidth + 1 || M.right > S.right + 1 || M.left < S.left - 1,
    nodeOutsideMap: nodeOut, clash, fmSmallClipped: fmSm.scrollWidth > fmSm.clientWidth + 1,
    nodeHeights: Object.fromEntries(nds.map(([id, r]) => [id, Math.round(r.height)])),
    overflow: document.documentElement.scrollWidth > innerWidth };
})()`;
const b = await Browser.launch({ width: 1440, height: 900 });
try {
  for (const [w, h, m] of [[1440, 900, false], [390, 844, true]]) {
    const p = await b.newPage({ width: w, height: h, dsf: 2, mobile: m });
    // home map
    await p.goto(`http://127.0.0.1:${port}/index.html`, { settleMs: 600 });
    await p.eval(`document.querySelector('#work').scrollIntoView()`); await sleep(4600);
    console.log(w, 'map', JSON.stringify(await p.eval(mapInfo)));
    await shot(p, `${outDir}/map-${w}.jpg`, await p.eval(rect('#work')));
    if (!m) {
      await p.setViewport({ width: 1440, height: 1250, dsf: 2 }); await p.eval(`document.querySelector('#work').scrollIntoView()`); await sleep(400);
      const c = await p.eval(`(() => { const r = document.querySelector('.nd[data-id="startup-research"] .ic').getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; })()`);
      await p.send('Input.dispatchMouseEvent', { type: 'mouseMoved', ...c }); await sleep(600);
      console.log(w, 'hover note:', await p.eval(`document.getElementById('fit-note').textContent`));
      await shot(p, `${outDir}/map-hover-sr-1440.jpg`, await p.eval(rect('#work')), false);
      await p.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: 5, y: 5 });
      await p.setViewport({ width: 1440, height: 900, dsf: 2 });
    } else {
      await shot(p, `${outDir}/map-sr-row-390.jpg`, await p.eval(rect('.fm a[href$="startup-research.html"]', 12)));
    }
    console.log(w, 'home console errors', p.consoleErrors.length, p.consoleErrors);
    // Startup Research title plate
    await p.goto(`http://127.0.0.1:${port}/projects/startup-research.html`, { settleMs: 600 });
    console.log(w, 'sr', JSON.stringify(await p.eval(`(() => {
      const d = document.querySelector('meta[name=description]').content, h1 = document.querySelector('h1');
      const what = [...document.querySelectorAll('p')].find(e => e.textContent.trim() === '${T}');
      const cs = what && getComputedStyle(what), pr = what && what.parentElement.getBoundingClientRect(), wr = what && what.getBoundingClientRect();
      return { meta: d === '${T}', h1: h1.textContent, whatFound: !!what, whatClass: what && what.className, whatMaxWidth: cs && cs.maxWidth,
        whatW: wr && Math.round(wr.width), parentW: pr && Math.round(pr.width), old: /one question at a time|condense it/.test(document.documentElement.outerHTML),
        overflow: document.documentElement.scrollWidth > innerWidth };
    })()`)));
    await shot(p, `${outDir}/sr-top-${w}.jpg`, { x: 0, y: 0, width: w, height: h }, false);
    console.log(w, 'sr console errors', p.consoleErrors.length, p.consoleErrors);
    // podcast-dig next card
    await p.goto(`http://127.0.0.1:${port}/projects/podcast-dig.html`, { settleMs: 600 });
    const sel = await p.eval(`(() => { const a = [...document.querySelectorAll('a[href$="startup-research.html"]')].find(a => a.textContent.includes('${T}')); if (!a) return null; a.id = 'r37-next'; a.scrollIntoView({ block: 'center' }); return '#r37-next'; })()`);
    await sleep(500);
    console.log(w, 'podcast-dig next card found:', !!sel, 'overflow:', await p.eval(`document.documentElement.scrollWidth > innerWidth`));
    if (sel) await shot(p, `${outDir}/pd-next-${w}.jpg`, await p.eval(rect(sel, 12)));
    console.log(w, 'pd console errors', p.consoleErrors.length, p.consoleErrors);
  }
} finally { await b.close(); }
