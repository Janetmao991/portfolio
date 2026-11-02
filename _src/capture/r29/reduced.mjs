// R29: with prefers-reduced-motion the loop must be static (no .pre/.on, every node visible).
import { Browser } from '/Users/janetmao/.claude/skills/design-taste-frontend/scripts/lib/cdp.mjs';
const b = await Browser.launch({ width: 1440, height: 900 });
try {
  const p = await b.newPage({ width: 1440, height: 900, dsf: 1 });
  await p.send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'reduce' }] });
  await p.goto(`http://127.0.0.1:${process.argv[2] || 5199}/projects/ai-terms.html`, { settleMs: 800 });
  console.log(JSON.stringify(await p.eval(`({ cls: document.querySelector('.lp').className,
    hidden: [...document.querySelectorAll('.lp-w .lp-o, .lp-w .lp-ln')].filter(e => getComputedStyle(e).opacity !== '1').length })`)));
} finally { await b.close(); }
