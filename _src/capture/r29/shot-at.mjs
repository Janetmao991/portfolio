// R29: AI Terms page at 1440 and 390: the loop diagram close-up, the full page, checks (overflow, broken images, links, console).
import { Browser, sleep } from '/Users/janetmao/.claude/skills/design-taste-frontend/scripts/lib/cdp.mjs';
import { writeFileSync } from 'node:fs';
const [outDir = 'shots-r29', port = '5199'] = process.argv.slice(2);
const U = `http://127.0.0.1:${port}/projects/ai-terms.html`;
const rect = sel => `(() => { const r = document.querySelector('${sel}').getBoundingClientRect(); return { x: r.left + scrollX, y: r.top + scrollY, width: r.width, height: r.height }; })()`;
const shot = async (pg, path, c) => { const { data } = await pg.send('Page.captureScreenshot', { format: 'jpeg', quality: 88, captureBeyondViewport: true, clip: { scale: 1, ...c } }, 60000); writeFileSync(path, Buffer.from(data, 'base64')); };
const info = `(async () => {
  for (const i of document.images) { i.loading = 'eager'; } for (let y = 0; y < document.documentElement.scrollHeight; y += 600) { scrollTo(0, y); await new Promise(r => setTimeout(r, 120)); } scrollTo(0, 0); await Promise.all([...document.images].map(i => i.decode().catch(() => 0))); await new Promise(r => setTimeout(r, 800));
  const svg = [...document.querySelectorAll('.lp-svg')].find(s => getComputedStyle(s).display !== 'none');
  const t = [...svg.querySelectorAll('text')].map(e => e.getBBox()), vb = svg.viewBox.baseVal;
  const outside = t.filter(b => b.x < -1 || b.y < -1 || b.x + b.width > vb.width + 1 || b.y + b.height > vb.height + 1).length;
  const lp = document.querySelector('.lp');
  return { overflow: document.documentElement.scrollWidth > innerWidth, svgShown: svg.classList[1], svgW: Math.round(svg.getBoundingClientRect().width),
    textsOutsideViewBox: outside, loopState: lp.className, broken: [...document.images].filter(i => !i.naturalWidth).map(i => i.src),
    links: [...document.querySelectorAll('a[href]')].map(a => a.getAttribute('href')), height: document.documentElement.scrollHeight }; })()`;
const errors = [];
const b = await Browser.launch({ width: 1440, height: 900 });
try {
  for (const [w, h, tag, mobile] of [[1440, 900, '1440', false], [390, 844, '390', true]]) {
    const p = await b.newPage({ width: w, height: h, dsf: 2, mobile });
    await p.goto(U, { settleMs: 2500 });
    console.log(tag, JSON.stringify(await p.eval(info)));
    await shot(p, `${outDir}/loop-${tag}.jpg`, await p.eval(rect('.lp')));
    await shot(p, `${outDir}/page-${tag}.jpg`, { x: 0, y: 0, width: w, height: await p.eval('document.documentElement.scrollHeight') });
    errors.push(...p.consoleErrors);
  }
  console.log('errors:', errors);
} finally { await b.close(); }
