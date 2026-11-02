// R43: the live build must look like the approved mock. Loads each page from the mock (_src/mock-taste/) and from the
// live site, and compares every element's box and key computed styles at 1440 and 390 (reduced motion, so nothing is mid-fade).
// Needs a static server on the repo root: node compare.mjs <port>
import { Browser, sleep } from '/Users/janetmao/.claude/skills/design-taste-frontend/scripts/lib/cdp.mjs';
const [port = '5243'] = process.argv.slice(2);
const B = `http://127.0.0.1:${port}/`;
const PAGES = ['index.html', ...['lexiai', 'lexispeak', 'writing-station', 'podcast-dig', 'startup-research', 'ai-terms', 'research',
  'research-granola', 'research-aiterm-embedding', 'research-aiterm-vector-database', 'research-aiterm-rag'].map(n => `projects/${n}.html`)];
const PROPS = ['font-family', 'font-size', 'font-weight', 'font-style', 'letter-spacing', 'text-transform', 'line-height', 'color',
  'background-color', 'background-image', 'border-top', 'border-bottom', 'border-left', 'border-right', 'border-radius', 'box-shadow',
  'padding', 'margin', 'display', 'grid-template-columns', 'opacity', 'transform', 'max-width', 'fill', 'stroke'];
const grab = `(() => { const P = ${JSON.stringify(PROPS)}; return [...document.body.querySelectorAll('*')].filter(e => !['SCRIPT','LINK','STYLE'].includes(e.tagName)).map(e => {
  const c = getComputedStyle(e), r = e.getBoundingClientRect();
  return { k: e.tagName.toLowerCase() + (typeof e.className === 'string' && e.className ? '.' + e.className.trim().split(/\\s+/).join('.') : ''),
    box: [r.x, r.y + scrollY, r.width, r.height].map(v => Math.round(v)).join(','), s: P.map(p => c.getPropertyValue(p)) }; }); })()`;
const b = await Browser.launch({ width: 1440, height: 900 });
let bad = 0;
try {
  for (const [w, h, mobile] of [[1440, 900, false], [390, 844, true]]) for (const pg of PAGES) {
    const get = async (url) => { const p = await b.newPage({ width: w, height: h, dsf: 1, mobile, reducedMotion: true });
      // the mock's lazy full-width crops can collapse to 0 wide at >=1000px; the live build fixes that, so give the mock the same fix
      if (url.includes('mock-taste')) await p.send('Page.addScriptToEvaluateOnNewDocument', { source: `addEventListener('DOMContentLoaded', () => document.head.insertAdjacentHTML('beforeend', '<style>@media (min-width: 1000px) { .lx-shot > .lx-pic:not(.lx-card) { width: 100%; } }</style>'))` });
      await p.goto(url, { settleMs: 1200 }); await p.eval('document.fonts.ready.then(() => 1)'); await sleep(300);
      const d = await p.eval(grab); const err = p.consoleErrors.length; await p.close(); return [d, err]; };
    const [m] = await get(B + '_src/mock-taste/' + pg), [l, err] = await get(B + pg);
    const diffs = [];
    if (m.length !== l.length) diffs.push(`element count ${m.length} vs ${l.length}`);
    for (let i = 0; i < Math.min(m.length, l.length); i++) {
      const a = m[i], z = l[i];
      if (a.k !== z.k) { diffs.push(`#${i} ${a.k} vs ${z.k}`); break; }
      if (a.box !== z.box) diffs.push(`#${i} ${a.k} box ${a.box} -> ${z.box}`);
      PROPS.forEach((p, j) => { if (a.s[j] !== z.s[j]) diffs.push(`#${i} ${a.k} ${p}: ${a.s[j]} -> ${z.s[j]}`); });
    }
    bad += diffs.length;
    console.log(`${w} ${pg}: ${diffs.length ? diffs.length + ' differences' : 'identical'}${err ? ', console errors ' + err : ''}`);
    diffs.slice(0, 12).forEach(d => console.log('   ', d.slice(0, 220)));
  }
} finally { await b.close(); }
console.log(bad ? `TOTAL ${bad} differences` : 'ALL IDENTICAL');
