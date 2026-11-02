// R18: keeps one headless Chrome open on the capture copy of Writing Station (/tmp/r18-ws, :5198, only the
// "Update of Lexi AI" entry, no .env) and takes commands over HTTP, like r17/driver.mjs.
//   POST /eval  body = JS (async, run in the page with helpers H) → JSON result
//   POST /shot?name=x  body = JS returning box(...) → writes <outDir>/x.png at 2x, returns the box
//   POST /size?w=1440&h=1000  resize the viewport
//   POST /quit
// Usage: node driver.mjs <appUrl> <outDir> <ctlPort> <cookie "name=value">
import { Browser, sleep } from '/Users/janetmao/.claude/skills/design-taste-frontend/scripts/lib/cdp.mjs';
import { createServer } from 'node:http';
import { mkdirSync } from 'node:fs';

const [APP = 'http://127.0.0.1:5198/', outDir = '/tmp/r18-raw', ctl = '5199', cookie = ''] = process.argv.slice(2);
mkdirSync(outDir, { recursive: true });

const H = `const wait = ms => new Promise(r => setTimeout(r, ms));
  const R = e => e.getBoundingClientRect();
  const $ = s => document.querySelector(s), $$ = s => [...document.querySelectorAll(s)];
  const byText = (re, sel = '*') => [...document.querySelectorAll(sel)].filter(e => e.children.length < 4 && re.test((e.innerText || '').trim()) && R(e).width > 0);
  const until = async (fn, ms = 300000) => { for (let t = 0; t < ms; t += 400) { const v = fn(); if (v) return v; await wait(400); } throw new Error('timed out: ' + fn); };
  const box = (l, t, r, b, extra = {}) => JSON.stringify({ x: Math.round(l), y: Math.round(t + scrollY), width: Math.round(r - l), height: Math.round(b - t), ...extra });`;

const br = await Browser.launch({ width: 1440, height: 1000 });
const p = await br.newPage({ width: 1440, height: 1000, dsf: 2 });
const [name, value] = cookie.split(/=(.*)/s);
if (name) await p.send('Network.setCookie', { name, value, url: APP });
// FAKE_NOW (ISO) shifts the page clock to the evening the entry was written, so the top-bar date and the
// sidebar streak show that day (Aug 11 2026, Pacific) instead of today's "0-day streak".
await p.send('Emulation.setTimezoneOverride', { timezoneId: 'America/Los_Angeles' });
if (process.env.FAKE_NOW) await p.send('Page.addScriptToEvaluateOnNewDocument', { source: `(() => {
  const shift = Date.parse(${JSON.stringify(process.env.FAKE_NOW)}) - Date.now(), D = Date;
  globalThis.Date = class extends D { constructor(...a) { a.length ? super(...a) : super(D.now() + shift); } static now() { return D.now() + shift; } };
})();` });
await p.goto(APP, { settleMs: 2500 });

const run = async js => {
  const r = await p.send('Runtime.evaluate', { expression: `(async () => { ${H} ${js} })()`, awaitPromise: true, returnByValue: true }, 600000);
  if (r.exceptionDetails) throw new Error(r.exceptionDetails.exception?.description || r.exceptionDetails.text);
  return r.result.value;
};

createServer(async (req, res) => {
  let body = '';
  for await (const c of req) body += c;
  const u = new URL(req.url, 'http://x');
  try {
    if (u.pathname === '/quit') { res.end('bye\n'); await br.close(); process.exit(0); }
    if (u.pathname === '/eval') { const v = await run(body); res.end(JSON.stringify(v ?? null, null, 1) + '\n'); return; }
    if (u.pathname === '/size') { await p.setViewport({ width: +u.searchParams.get('w'), height: +u.searchParams.get('h'), dsf: 2 }); res.end('ok\n'); return; }
    if (u.pathname === '/shot') {
      const { ring, ...clip } = JSON.parse(await run(body));  // ring = callout box in CSS px, relative to the clip
      await sleep(600);
      await p.screenshot({ path: `${outDir}/${u.searchParams.get('name')}.png`, format: 'png', clip });
      res.end(JSON.stringify({ ...clip, ring }) + '\n'); return;
    }
    res.statusCode = 404; res.end('?\n');
  } catch (e) { res.statusCode = 500; res.end('ERR ' + e.message + '\n'); }
}).listen(+ctl, '127.0.0.1', () => console.log('driver ready on', ctl));
