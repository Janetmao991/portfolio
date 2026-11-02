// R43 checks on the live build, every page at 1440 and 390, motion ON: scroll through, then
// no horizontal overflow, no console errors, nothing left hidden by the entrance motion, layout shift (CLS);
// collects every link for link-check. Also writes the shots to shots-r43/. Needs a static server: node check.mjs <port>
import { Browser, sleep } from '/Users/janetmao/.claude/skills/design-taste-frontend/scripts/lib/cdp.mjs';
import { writeFileSync, mkdirSync } from 'node:fs';
const [port = '5243', outDir = 'shots-r43'] = process.argv.slice(2);
const B = `http://127.0.0.1:${port}/`;
const PAGES = ['index.html', ...['lexiai', 'lexispeak', 'writing-station', 'podcast-dig', 'startup-research', 'ai-terms', 'research',
  'research-granola', 'research-aiterm-embedding', 'research-aiterm-vector-database', 'research-aiterm-rag'].map(n => `projects/${n}.html`)];
const SHOTS = { 'index.html': 'home', 'projects/lexiai.html': 'lexiai', 'projects/research.html': 'research', 'projects/ai-terms.html': 'ai-terms' };
const walk = `(async () => { for (let y = 0; y < document.body.scrollHeight; y += innerHeight / 3) { scrollTo(0, y); await new Promise(r => setTimeout(r, 200)); } scrollTo(0, 0); })()`;
mkdirSync(outDir, { recursive: true });
const links = new Set();
let problems = 0;
const b = await Browser.launch({ width: 1440, height: 900 });
try {
  for (const [w, h, mobile] of [[1440, 900, false], [390, 844, true]]) for (const pg of PAGES) {
    const p = await b.newPage({ width: w, height: h, dsf: mobile ? 2 : 1, mobile });
    await p.send('Page.addScriptToEvaluateOnNewDocument', { source: `window.__cls = 0; new PerformanceObserver(l => l.getEntries().forEach(e => { if (!e.hadRecentInput) window.__cls += e.value; })).observe({ type: 'layout-shift', buffered: true });` });
    await p.goto(B + pg, { settleMs: 800 });
    await p.eval(walk); await sleep(1800);
    const r = await p.eval(`(() => {
      const de = document.documentElement, motion = de.classList.contains('m41');
      const wide = [...document.querySelectorAll('body *')].filter(e => { const b = e.getBoundingClientRect(); return b.width && b.right > de.clientWidth + 1 && !e.closest('.ss-track, .fit, [class*="scroll"]'); }).slice(0, 5).map(e => e.tagName.toLowerCase() + '.' + e.className);
      const hidden = motion ? [...document.querySelectorAll(${JSON.stringify(null)} || 'body *')].filter(e => e.closest('.m41') && getComputedStyle(e).opacity === '0' && e.getBoundingClientRect().height > 0 && !e.closest('svg, .ss-track')).length : 0;
      const ls = [...document.querySelectorAll('a[href]')].map(a => a.href);
      return { overflowX: de.scrollWidth > de.clientWidth, wide, motion, hidden, cls: window.__cls, h: de.scrollHeight, ls,
        brokenImg: [...document.images].filter(i => i.complete && i.naturalWidth === 0).map(i => i.src),
        font: getComputedStyle(document.body).fontFamily.split(',')[0], fontsOk: [...document.fonts].filter(f => f.status === 'loaded').map(f => f.family + ' ' + f.style).join('/') };
    })()`);
    r.ls.forEach(l => links.add(l));
    const bad = r.overflowX || r.hidden || p.consoleErrors.length || r.brokenImg.length || r.cls > 0.01;
    if (bad) problems++;
    console.log(`${w} ${pg}: overflow ${r.overflowX}${r.wide.length ? ' ' + r.wide.join(' ') : ''} · errors ${p.consoleErrors.length}${p.consoleErrors.length ? ' ' + JSON.stringify(p.consoleErrors).slice(0, 300) : ''} · motion ${r.motion} hidden ${r.hidden} · CLS ${r.cls.toFixed(4)} · broken img ${r.brokenImg.length} · ${r.font} [${r.fontsOk}]`);
    if (SHOTS[pg]) {
      const { data } = await p.send('Page.captureScreenshot', { format: 'jpeg', quality: 82, captureBeyondViewport: true, clip: { x: 0, y: 0, width: w, height: r.h, scale: 1 } });
      writeFileSync(`${outDir}/${SHOTS[pg]}-${w}.jpg`, Buffer.from(data, 'base64'));
    }
    await p.close();
  }
} finally { await b.close(); }
writeFileSync(`${outDir}/links.json`, JSON.stringify([...links].sort(), null, 1));
console.log(problems ? `${problems} page/width combos with problems` : 'ALL CLEAN', '·', links.size, 'distinct links');
