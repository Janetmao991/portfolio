// R23: writing framework, startup-research bottom, research list, research-granola top; 1440 + 390; console errors, nav fit.
import { Browser, sleep } from '/Users/janetmao/.claude/skills/design-taste-frontend/scripts/lib/cdp.mjs';
import { writeFileSync } from 'node:fs';
const [outDir = 'shots-r23', port = '5199'] = process.argv.slice(2);
const U = p => `http://127.0.0.1:${port}/${p}`;
const clipShot = async (pg, path, c, pad = 20) => { const { data } = await pg.send('Page.captureScreenshot', { format: 'jpeg', quality: 90, captureBeyondViewport: true, clip: { scale: 1, x: Math.max(0, c.x - pad), y: Math.max(0, c.y - pad), width: c.width + 2 * pad, height: c.height + 2 * pad } }, 45000); writeFileSync(path, Buffer.from(data, 'base64')); };
const rect = sel => `(() => { const r = document.querySelector('${sel}').getBoundingClientRect(); return { x: r.left + scrollX, y: r.top + scrollY, width: r.width, height: r.height }; })()`;
const span = (a, z) => `(() => { const a = document.querySelector('${a}').getBoundingClientRect(), z = document.querySelector('${z}').getBoundingClientRect(); return { x: Math.min(a.left, z.left) + scrollX, y: a.top + scrollY, width: Math.max(a.right, z.right) - Math.min(a.left, z.left), height: z.bottom - a.top }; })()`;
const settle = `(async () => { for (let y = 0; y < document.body.scrollHeight; y += 500) { scrollTo(0, y); await new Promise(r => setTimeout(r, 120)); } scrollTo(0, 0); })()`;
const navFit = `(() => { const n = document.querySelector('.nav'); return n.scrollWidth <= n.clientWidth && [...n.querySelectorAll('nav a')].every(a => a.getBoundingClientRect().top === n.querySelector('nav a').getBoundingClientRect().top); })()`;
const errors = [];
const b = await Browser.launch({ width: 1440, height: 900 });
try {
  for (const [w, h, tag, mobile] of [[1440, 900, '1440', false], [390, 844, '390', true]]) {
    const p = await b.newPage({ width: w, height: h, dsf: 2, mobile });
    const go = async path => { await p.goto(U(path), { settleMs: 1200 }); await p.eval(settle); await sleep(2500); };
    await go('projects/startup-research.html');
    await clipShot(p, `${outDir}/writing-framework-${tag}.jpg`, await p.eval(rect('#writing')));
    await clipShot(p, `${outDir}/startup-research-bottom-${tag}.jpg`, await p.eval(span('.see', '.next')));
    console.log(tag, 'nav fits:', await p.eval(navFit));
    await go('projects/research.html');
    await clipShot(p, `${outDir}/research-list-${tag}.jpg`, await p.eval(span('.nav', '#list')));
    await go('projects/research-granola.html');
    await clipShot(p, `${outDir}/research-granola-top-${tag}.jpg`, { x: 0, y: 0, width: w, height: Math.min(1400, await p.eval('document.body.scrollHeight')) }, 0);
    await go('index.html');
    console.log(tag, 'home writing links:', await p.eval(`[...document.querySelectorAll('.posts a')].map(a => a.getAttribute('href')).join(' ')`));
    errors.push(...p.consoleErrors);
  }
  console.log('errors:', errors);
} finally { await b.close(); }
