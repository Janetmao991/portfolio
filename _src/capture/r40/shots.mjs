// R40: full-page before/after shots at 1440 and 390 for the homepage, LexiAI and Research.
// before = the live site, after = _src/mock-taste. Needs a static server on the repo root (port arg).
import { Browser, sleep } from '/Users/janetmao/.claude/skills/design-taste-frontend/scripts/lib/cdp.mjs';
import { writeFileSync, mkdirSync } from 'node:fs';
const [port = '5240', outDir = 'shots-r40'] = process.argv.slice(2);
mkdirSync(outDir, { recursive: true });
const pages = [['home', 'index.html'], ['lexiai', 'projects/lexiai.html'], ['research', 'projects/research.html']];
const sides = [['before', ''], ['after', '_src/mock-taste/']];
const b = await Browser.launch({ width: 1440, height: 900 });
try {
  for (const [w, h, mobile] of [[1440, 900, false], [390, 844, true]]) {
    for (const [tag, base] of sides) for (const [name, path] of pages) {
      const p = await b.newPage({ width: w, height: h, dsf: mobile ? 2 : 1, mobile });
      await p.goto(`http://127.0.0.1:${port}/${base}${path}`, { settleMs: 800 });
      // walk down the page so scroll-triggered reveals fire, then let the hero story and the map finish
      await p.eval(`(async () => { for (let y = 0; y < document.body.scrollHeight; y += innerHeight / 2) { scrollTo(0, y); await new Promise(r => setTimeout(r, 250)); } scrollTo(0, 0); })()`);
      await sleep(7000);
      const H = await p.eval('document.documentElement.scrollHeight');
      const { data } = await p.send('Page.captureScreenshot', { format: 'jpeg', quality: 85, captureBeyondViewport: true, clip: { x: 0, y: 0, width: w, height: H, scale: 1 } });
      writeFileSync(`${outDir}/${tag}-${name}-${w}.jpg`, Buffer.from(data, 'base64'));
      console.log(tag, name, w, 'height', H, 'console errors', p.consoleErrors.length);
      await p.close?.();
    }
  }
} finally { await b.close(); }
