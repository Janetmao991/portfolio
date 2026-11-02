// Quick look: screenshot a URL at 1440x900 and dump visible text outline (buttons/links) for navigation.
import { Browser, sleep } from '/Users/janetmao/.claude/skills/design-taste-frontend/scripts/lib/cdp.mjs';
const [url, out] = process.argv.slice(2);
const b = await Browser.launch();
const p = await b.newPage({ width: 1440, height: 900, dsf: 1 });
await p.goto(url, { settleMs: 2500 });
await p.screenshot({ path: out, quality: 60 });
const info = await p.eval(() => [...document.querySelectorAll('button, a, [role=tab], nav *')].slice(0, 80).map(e => (e.tagName + ':' + (e.innerText || e.getAttribute('aria-label') || '').trim().replace(/\s+/g, ' ').slice(0, 40))).filter(s => s.length > 4).join(' | '));
console.log(info);
await b.close();
