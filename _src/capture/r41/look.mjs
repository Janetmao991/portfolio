// R41: full-page look at every mock page (working shots, not deliverables). Needs a static server on the repo root.
import { Browser, sleep } from '/Users/janetmao/.claude/skills/design-taste-frontend/scripts/lib/cdp.mjs';
import { writeFileSync, mkdirSync } from 'node:fs';
const [port = '5241', outDir = '/tmp/r41look', only = ''] = process.argv.slice(2);
mkdirSync(outDir, { recursive: true });
const names = ['lexiai', 'lexispeak', 'writing-station', 'podcast-dig', 'ai-terms', 'research', 'research-granola', 'startup-research', 'research-aiterm-rag'].filter(n => !only || only.split(',').includes(n));
const b = await Browser.launch({ width: 1440, height: 900 });
try {
  for (const [w, h, mobile] of [[1440, 900, false], [390, 844, true]]) for (const n of names) {
    const p = await b.newPage({ width: w, height: h, dsf: mobile ? 2 : 1, mobile });
    await p.goto(`http://127.0.0.1:${port}/_src/mock-taste/projects/${n}.html`, { settleMs: 600 });
    await p.eval(`(async () => { for (let y = 0; y < document.body.scrollHeight; y += innerHeight / 3) { scrollTo(0, y); await new Promise(r => setTimeout(r, 200)); } scrollTo(0, 0); })()`);
    await sleep(2500);
    const info = await p.eval(`(() => { const hidden = [...document.querySelectorAll('*')].filter(e => getComputedStyle(e).opacity === '0' && e.getBoundingClientRect().height > 0 && !e.closest('svg') && !e.closest('.ss-s[inert]')).map(e => e.className).slice(0, 8); return { H: document.documentElement.scrollHeight, sw: document.documentElement.scrollWidth, hidden }; })()`);
    const { data } = await p.send('Page.captureScreenshot', { format: 'jpeg', quality: 70, captureBeyondViewport: true, clip: { x: 0, y: 0, width: w, height: info.H, scale: mobile ? 0.5 : 0.5 } });
    writeFileSync(`${outDir}/${n}-${w}.jpg`, Buffer.from(data, 'base64'));
    console.log(n, w, JSON.stringify(info), 'errors', p.consoleErrors.length);
    await p.close?.();
  }
} finally { await b.close(); }
