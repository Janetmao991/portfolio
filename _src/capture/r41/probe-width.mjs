// R41: every intro / subtitle / caption should fill its container's content width. Lists the ones that don't.
import { Browser, sleep } from '/Users/janetmao/.claude/skills/design-taste-frontend/scripts/lib/cdp.mjs';
const [port = '5241'] = process.argv.slice(2);
const names = ['lexiai', 'lexispeak', 'writing-station', 'podcast-dig', 'ai-terms', 'research', 'research-granola', 'startup-research', 'research-aiterm-rag', 'research-aiterm-embedding', 'research-aiterm-vector-database'];
const b = await Browser.launch({ width: 1440, height: 900 });
try {
  for (const w of [1440, 390]) for (const n of names) {
    const p = await b.newPage({ width: w, height: 900 });
    await p.goto(`http://127.0.0.1:${port}/_src/mock-taste/projects/${n}.html`, { settleMs: 400 });
    const out = await p.eval(`(() => [...document.querySelectorAll('main :is(.lx-top p, .lx-h > p, .title p, .intro-l, figcaption, .fig-c, .ph + p, .plate > p)')].map(e => {
      const par = e.parentElement, cs = getComputedStyle(par);
      const inner = par.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
      return { c: e.className || e.tagName, w: Math.round(e.getBoundingClientRect().width), inner: Math.round(inner), mw: getComputedStyle(e).maxWidth };
    }).filter(r => r.w < r.inner - 2))()`);
    console.log(n, w, out.length ? JSON.stringify(out) : 'all full width');
    const pw = await p.eval(`document.querySelector('.page').getBoundingClientRect().width`);
    if (w === 1440) console.log('   .page width', pw);
    await p.close?.();
  }
} finally { await b.close(); }
