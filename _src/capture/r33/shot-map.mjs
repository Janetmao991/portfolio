// R33 (from R32): the home-page map with motion at 1440 (rest + one node hovered), 390, and 1440 with reduced motion.
import { Browser, sleep } from '/Users/janetmao/.claude/skills/design-taste-frontend/scripts/lib/cdp.mjs';
import { writeFileSync } from 'node:fs';
const [outDir = 'shots-r33', port = '5232', hoverId = 'podcast-dig'] = process.argv.slice(2);
const U = `http://127.0.0.1:${port}/index.html`;
const rect = sel => `(() => { const r = document.querySelector('${sel}').getBoundingClientRect(); return { x: r.left + scrollX, y: r.top + scrollY, width: r.width, height: r.height }; })()`;
const shot = async (pg, path, c, beyond = true) => { const { data } = await pg.send('Page.captureScreenshot', { format: 'jpeg', quality: 90, captureBeyondViewport: beyond, clip: { scale: 1, ...c } }, 45000); writeFileSync(path, Buffer.from(data, 'base64')); };
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
    minFont: Math.min(...[...document.querySelectorAll('#work *')].filter(e => e.offsetParent || e.closest('svg')).map(e => parseFloat(getComputedStyle(e).fontSize))) };
})()`;
// R33: what is moving, and that it is only transform / opacity (CSS transitions that already ended are not listed)
const motion = `(() => {
  const fit = document.querySelector('.fit'), an = document.getAnimations();
  const props = new Set();
  an.forEach(a => { const k = a.effect?.getKeyframes?.() || []; k.forEach(f => Object.keys(f).forEach(x => !['offset', 'easing', 'composite', 'computedOffset'].includes(x) && props.add(x))); if (a.transitionProperty) props.add(a.transitionProperty); });
  const mapAnims = an.filter(a => fit.contains(a.effect?.target));
  return { classes: fit.className, dots: fit.querySelectorAll('.flows circle').length, running: mapAnims.filter(a => a.playState === 'running').length,
    props: [...new Set(mapAnims.flatMap(a => (a.effect.getKeyframes() || []).flatMap(f => Object.keys(f)).filter(x => !['offset', 'easing', 'composite', 'computedOffset'].includes(x))))] };
})()`;
const errors = [];
const b = await Browser.launch({ width: 1440, height: 900 });
try {
  for (const [w, h, tag, mobile, reducedMotion] of [[1440, 900, '1440', false, false], [390, 844, '390', true, false], [1440, 900, '1440-reduced', false, true]]) {
    const p = await b.newPage({ width: w, height: h, dsf: 2, mobile, reducedMotion });
    await p.goto(U, { settleMs: 600 });
    await p.eval(`document.querySelector('#work').scrollIntoView()`);
    await sleep(4600);
    console.log(tag, "motion", JSON.stringify(await p.eval(motion)));
    console.log(tag, JSON.stringify(await p.eval(info)));
    await shot(p, `${outDir}/map-${tag}.jpg`, await p.eval(rect('#work')));
    if (tag === '1440') {
      await shot(p, `${outDir}/page-1440.jpg`, { x: 0, y: 0, width: 1440, height: await p.eval('document.documentElement.scrollHeight') });
      // a window tall enough for the whole section, so the screenshot never resizes the page (that would re-fire the hover)
      await p.setViewport({ width: 1440, height: 1250, dsf: 2 }); await p.eval(`document.querySelector('#work').scrollIntoView()`); await sleep(400);
      const c = await p.eval(`(() => { const r = document.querySelector('.nd[data-id="${hoverId}"] .ic').getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; })()`);
      await p.send('Input.dispatchMouseEvent', { type: 'mouseMoved', ...c }); await sleep(500);
      console.log('hover rates:', await p.eval(`[...document.querySelectorAll('.fl')].map(g => g.classList.contains('on') + ':' + [...g.querySelectorAll('circle')].map(c => c.getAnimations()[0]?.playbackRate).join('/')).join(' ')`));
      console.log('node lift:', await p.eval(`getComputedStyle(document.querySelector('.nd[data-id="${hoverId}"]')).transform`));
      console.log('note:', await p.eval(`document.getElementById('fit-note').textContent`));
      // in-viewport capture: a beyond-viewport capture re-runs the hover label fade, so the shot caught it mid-fade
      await shot(p, `${outDir}/map-hover-${hoverId}-1440.jpg`, await p.eval(rect('#work')), false);
      await p.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: 5, y: 5 }); await sleep(300);
      await p.eval(`document.body.focus()`);
      for (let i = 0; i < 40; i++) {
        for (const type of ['keyDown', 'keyUp']) await p.send('Input.dispatchKeyEvent', { type, key: 'Tab', code: 'Tab', windowsVirtualKeyCode: 9 });
        if (await p.eval(`!!document.activeElement.closest('.fit .nd')`)) break;
      }
      await sleep(400);
      console.log('focused:', await p.eval(`document.activeElement.dataset.id + ' | outline=' + getComputedStyle(document.activeElement).outlineStyle + ' | note=' + document.getElementById('fit-note').textContent`));
      await shot(p, `${outDir}/map-focus-1440.jpg`, await p.eval(rect('#work')));
    }
    if (tag === '1440') {  // scrolled away (600px-tall window at the top, so the map is fully below the fold): everything in the map pauses
      await p.setViewport({ width: 1440, height: 600, dsf: 2 }); await p.eval("document.documentElement.style.scrollBehavior = 'auto'; scrollTo(0, 0)"); await sleep(800);
      console.log('map top after scroll:', await p.eval("document.querySelector('.fit').getBoundingClientRect().top"));
      console.log('offscreen', JSON.stringify(await p.eval(motion)));
    }
    if (tag === '390') await shot(p, `${outDir}/page-390.jpg`, { x: 0, y: 0, width: 390, height: await p.eval('document.documentElement.scrollHeight') });
    errors.push(...p.consoleErrors);
  }
  console.log('errors:', errors);
  // every local link on every page resolves (HEAD via fetch from the page)
  const lp = await b.newPage({ width: 1440, height: 900 });
  const pages = ['index.html', ...['lexiai', 'lexispeak', 'writing-station', 'podcast-dig', 'startup-research', 'ai-terms', 'research', 'research-granola'].map(s => `projects/${s}.html`)];
  const bad = [];
  for (const pg of pages) {
    await lp.goto(`http://127.0.0.1:${port}/${pg}`, { settleMs: 300 });
    bad.push(...await lp.eval(`(async () => { const out = [];
      for (const a of document.querySelectorAll('a[href]')) { const u = new URL(a.getAttribute('href'), location.href);
        if (u.origin !== location.origin) continue;
        const r = await fetch(u.href.split('#')[0]); if (!r.ok) { out.push(location.pathname + ' -> ' + a.getAttribute('href') + ' ' + r.status); continue; }
        if (u.hash && u.pathname === location.pathname && !document.getElementById(u.hash.slice(1))) out.push(location.pathname + ' -> missing ' + u.hash);
        if (u.hash && u.pathname !== location.pathname) { const t = await r.text(); if (!t.includes('id="' + u.hash.slice(1) + '"')) out.push(location.pathname + ' -> missing ' + a.getAttribute('href')); } }
      return out; })()`));
  }
  console.log('links checked on', pages.length, 'pages; broken:', bad);
} finally { await b.close(); }
