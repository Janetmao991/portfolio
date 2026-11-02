import { Browser, sleep } from '/Users/janetmao/.claude/skills/design-taste-frontend/scripts/lib/cdp.mjs';
const b = await Browser.launch({ width: 1440, height: 900 });
const p = await b.newPage({ width: 1440, height: 900 });
await p.goto('http://127.0.0.1:5231/_src/mock-map/map.html', { settleMs: 600 });
const st = `JSON.stringify({cls: document.querySelector('.fit').className, js: document.documentElement.className, top: Math.round(document.querySelector('.fit').getBoundingClientRect().top), off: getComputedStyle(document.querySelector('.fit .w')).strokeDashoffset})`;
console.log('load', await p.eval(st));
await p.eval(`window.scrollTo(0, document.querySelector('#fits').offsetTop - 120)`);
for (const t of [100, 300, 300, 600]) { await sleep(t); console.log(t, await p.eval(st)); }
await b.close();
