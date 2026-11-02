// R25: podcast-dig page (full) + homepage card, 1440 + 390; redirect stub; console errors; nav fit; image load check.
import { Browser, sleep } from '/Users/janetmao/.claude/skills/design-taste-frontend/scripts/lib/cdp.mjs';
import { writeFileSync } from 'node:fs';
const [outDir = 'shots-r25', port = '5199'] = process.argv.slice(2);
const U = p => `http://127.0.0.1:${port}/${p}`;
const clipShot = async (pg, path, c, pad = 20) => { const { data } = await pg.send('Page.captureScreenshot', { format: 'jpeg', quality: 88, captureBeyondViewport: true, clip: { scale: 1, x: Math.max(0, c.x - pad), y: Math.max(0, c.y - pad), width: c.width + 2 * pad, height: c.height + 2 * pad } }, 60000); writeFileSync(path, Buffer.from(data, 'base64')); };
const rect = sel => `(() => { const r = document.querySelector('${sel}').getBoundingClientRect(); return { x: r.left + scrollX, y: r.top + scrollY, width: r.width, height: r.height }; })()`;
const settle = `(async () => { for (let y = 0; y < document.body.scrollHeight; y += 400) { scrollTo(0, y); await new Promise(r => setTimeout(r, 120)); } scrollTo(0, 0); })()`;
const navFit = `(() => { const n = document.querySelector('.nav'); return n.scrollWidth <= n.clientWidth; })()`;
const imgs = `[...document.images].filter(i => !i.complete || !i.naturalWidth).map(i => i.currentSrc || i.src)`;
const errors = [];
const b = await Browser.launch({ width: 1440, height: 900 });
try {
  for (const [w, h, tag, mobile] of [[1440, 900, '1440', false], [390, 844, '390', true]]) {
    const p = await b.newPage({ width: w, height: h, dsf: mobile ? 2 : 1, mobile });
    const go = async path => { await p.goto(U(path), { settleMs: 1200 }); await p.eval(settle); await sleep(2000); };
    await go('projects/podcast-dig.html');
    const H = await p.eval('document.documentElement.scrollHeight');
    await clipShot(p, `${outDir}/podcast-dig-full-${tag}.jpg`, { x: 0, y: 0, width: w, height: H }, 0);
    console.log(tag, 'nav fits:', await p.eval(navFit), '| broken imgs:', await p.eval(imgs), '| overflow-x:', await p.eval('document.documentElement.scrollWidth > innerWidth'));
    await go('index.html');
    await clipShot(p, `${outDir}/home-card-${tag}.jpg`, await p.eval(rect('a.card[href="projects/podcast-dig.html"]')));
    await clipShot(p, `${outDir}/home-cards-${tag}.jpg`, await p.eval(rect('#work')), 0);
    await p.goto(U('projects/builder-toolkit.html'), { settleMs: 1500 });
    console.log(tag, 'redirect lands on:', await p.eval('location.pathname'));
    errors.push(...p.consoleErrors);
  }
  console.log('errors:', errors);
} finally { await b.close(); }
