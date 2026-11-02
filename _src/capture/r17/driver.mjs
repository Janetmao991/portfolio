// R17: keeps one headless Chrome open on the key-free LexiSpeak copy (ls-local.py) and takes commands over HTTP,
// so a session can be played turn by turn (read the partner's question, then answer) and cropped at any point.
//   POST /eval  body = JS (async, run in the page with helpers H) → JSON result
//   POST /shot?name=x  body = JS returning box(...) → writes <outDir>/x.png at 2x, returns the box
//   POST /quit
// Usage: node driver.mjs <appUrl> <outDir> <ctlPort>
import { Browser, sleep } from '/Users/janetmao/.claude/skills/design-taste-frontend/scripts/lib/cdp.mjs';
import { createServer } from 'node:http';
import { mkdirSync } from 'node:fs';

const [APP = 'http://127.0.0.1:5196/', outDir = '/tmp/r17-raw', ctl = '5195'] = process.argv.slice(2);
mkdirSync(outDir, { recursive: true });
const b64 = o => Buffer.from(JSON.stringify(o)).toString('base64url');
const exp = Math.floor(Date.now() / 1000) + 86400;
const user = { id: '00000000-0000-4000-8000-000000000001', aud: 'authenticated', role: 'authenticated', email: 'reader@localhost', app_metadata: { provider: 'email' }, user_metadata: {} };
const session = { access_token: `${b64({ alg: 'HS256', typ: 'JWT' })}.${b64({ sub: user.id, role: 'authenticated', aud: 'authenticated', exp })}.local`, refresh_token: 'local', token_type: 'bearer', expires_in: 86400, expires_at: exp, user };
// Placeholders only: the Claude relay adds the real key server-side; Gemini (voices, transcription) is blocked below.
const seed = `localStorage.setItem('sb-127-auth-token', ${JSON.stringify(JSON.stringify(session))});
  localStorage.setItem('lexiai_claude_key', 'placeholder-key-added-by-local-relay');
  localStorage.setItem('lexiai_api_key', 'placeholder-gemini-blocked');`;

const H = `const wait = ms => new Promise(r => setTimeout(r, ms));
  const R = e => e.getBoundingClientRect();
  const byText = (re, sel = '*') => [...document.querySelectorAll(sel)].filter(e => e.children.length < 4 && re.test((e.innerText || '').trim()) && R(e).width > 0);
  const until = async (fn, ms = 180000) => { for (let t = 0; t < ms; t += 400) { const v = fn(); if (v) return v; await wait(400); } throw new Error('timed out: ' + fn); };
  const box = (l, t, r, b, extra = {}) => JSON.stringify({ x: Math.round(l), y: Math.round(t + scrollY), width: Math.round(r - l), height: Math.round(b - t), ...extra });
  const typeInto = (el, text) => { Object.getOwnPropertyDescriptor(el.constructor.prototype, 'value').set.call(el, text); el.dispatchEvent(new Event('input', { bubbles: true })); };`;

const br = await Browser.launch({ width: 1440, height: 1400 });
const p = await br.newPage({ width: 1000, height: 1300, dsf: 2 });
await p.send('Fetch.enable', { patterns: [{ urlPattern: 'https://api.anthropic.com/*' }, { urlPattern: 'https://generativelanguage.googleapis.com/*' }] });
br.on(p.sessionId, 'Fetch.requestPaused', e => {
  if (e.request.url.startsWith('https://generativelanguage')) return p.send('Fetch.failRequest', { requestId: e.requestId, errorReason: 'BlockedByClient' }).catch(() => {});
  const url = e.request.url.replace('https://api.anthropic.com', APP + 'anth');
  p.send('Fetch.continueRequest', { requestId: e.requestId, url }).catch(err => console.error('relay', err.message));
});
await p.goto(APP, { settleMs: 800 });
await p.eval(`(() => { ${seed} })()`);
await p.goto(APP, { settleMs: 2500 });

const run = async js => {
  const r = await p.send('Runtime.evaluate', { expression: `(async () => { ${H} ${js} })()`, awaitPromise: true, returnByValue: true }, 300000);
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
    if (u.pathname === '/shot') {
      const clip = JSON.parse(await run(body));
      await sleep(600);
      await p.screenshot({ path: `${outDir}/${u.searchParams.get('name')}.png`, format: 'png', clip });
      res.end(JSON.stringify(clip) + '\n'); return;
    }
    res.statusCode = 404; res.end('?\n');
  } catch (e) { res.statusCode = 500; res.end('ERR ' + e.message + '\n'); }
}).listen(+ctl, '127.0.0.1', () => console.log('driver ready on', ctl));
