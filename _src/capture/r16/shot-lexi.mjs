// R16: adds the `sense` job (sense number, after saving). R15: captures the new LexiAI highlights from the local key-free build (r15/lexi-local.py on :5199).
// Same seeding as R14 (my real notebook words + local sign-in). Claude calls are rerouted to the server's /anth relay:
// the page only holds a placeholder key, the relay adds the real one server-side.
// Usage: node shot-lexi.mjs <job|all> <outDir>   (writes PNGs at 2x; prints the crop boxes and the AI text shown)
//   context  → lexiai-context.png (Meaning in context on a real podcast line) then lexiai-kb.png (the word saved under its sense)
//   ask      → lexiai-ask.png (Ask Lexi panel with one exchange)
import { Browser, sleep } from '/Users/janetmao/.claude/skills/design-taste-frontend/scripts/lib/cdp.mjs';
import { readFileSync } from 'node:fs';
import { execSync } from 'node:child_process';

const [which = 'all', outDir = '/tmp/r16-raw'] = process.argv.slice(2);
const HERE = new URL('.', import.meta.url).pathname;
const LEXI = 'http://127.0.0.1:5199/';
// Acquired (Nest episode), filler words ("Cause", "you know", "um") trimmed; "clip" here = pace, not a video.
const SENTENCE = 'There are three, four new products coming out at a pretty rapid clip here from Nest.';
const QUESTION = 'Is “appall” stronger than “shock”?';

const real = JSON.parse(readFileSync(HERE + '../seed/lexiai-real-words.json', 'utf8'));
const frozen = JSON.parse(JSON.parse(execSync('node seed-lexi.cjs', { cwd: HERE + '..' })).lexiai_words_v1);
const words = { ...real };
for (const [k, w] of Object.entries(frozen)) if (!words[k]) { const { srs, mastery, ...rest } = w; words[k] = rest; } // no invented review data
const b64 = o => Buffer.from(JSON.stringify(o)).toString('base64url');
const exp = Math.floor(Date.now() / 1000) + 86400;
const user = { id: '00000000-0000-4000-8000-000000000001', aud: 'authenticated', role: 'authenticated', email: 'reader@localhost', app_metadata: { provider: 'email' }, user_metadata: {} };
const session = { access_token: `${b64({ alg: 'HS256', typ: 'JWT' })}.${b64({ sub: user.id, role: 'authenticated', aud: 'authenticated', exp })}.local`, refresh_token: 'local', token_type: 'bearer', expires_in: 86400, expires_at: exp, user };
const stats = readFileSync(HERE + 'stats.json', 'utf8');

const seed = `await new Promise((res, rej) => { const r = indexedDB.open('lexiai', 1); r.onupgradeneeded = () => r.result.createObjectStore('kv');
  r.onsuccess = () => { const tx = r.result.transaction('kv', 'readwrite'); tx.objectStore('kv').put(${JSON.stringify(words)}, 'lexiai_words_v1'); tx.oncomplete = () => { r.result.close(); res(); }; tx.onerror = rej; }; r.onerror = rej; });
  localStorage.setItem('sb-127-auth-token', ${JSON.stringify(JSON.stringify(session))});
  localStorage.setItem('lexiai_stats_v1', ${JSON.stringify(stats)});
  localStorage.setItem('lexiai_claude_key', 'placeholder-key-added-by-local-relay');`;
// Requests the page makes to api.anthropic.com are rerouted (by the browser, via CDP Fetch) to the local relay.
async function useRelay(b, p) {
  await p.send('Fetch.enable', { patterns: [{ urlPattern: 'https://api.anthropic.com/*' }] });
  b.on(p.sessionId, 'Fetch.requestPaused', e => {
    const url = e.request.url.replace('https://api.anthropic.com', LEXI + 'anth');
    p.send('Fetch.continueRequest', { requestId: e.requestId, url }).catch(err => console.error('relay', err.message));
  });
}

const H = `const wait = ms => new Promise(r => setTimeout(r, ms));
  const R = e => e.getBoundingClientRect();
  const byText = (re, sel = '*') => [...document.querySelectorAll(sel)].filter(e => e.children.length < 4 && re.test((e.innerText || '').trim()) && R(e).width > 0);
  const until = async (fn, ms = 120000) => { for (let t = 0; t < ms; t += 500) { const v = fn(); if (v) return v; await wait(500); } throw new Error('timed out: ' + fn); };
  const box = (l, t, r, b, extra = {}) => JSON.stringify({ x: Math.round(l), y: Math.round(t + scrollY), width: Math.round(r - l), height: Math.round(b - t), ...extra });
  const tab = async name => { [...document.querySelectorAll('button, a')].find(b => b.innerText.trim().startsWith(name) && R(b).width > 0).click(); await wait(1500); };
  const typeInto = (el, text) => { Object.getOwnPropertyDescriptor(el.constructor.prototype, 'value').set.call(el, text); el.dispatchEvent(new Event('input', { bubbles: true })); };`;

async function shoot(p, steps, name) {
  // Long timeout: Claude answers (lookup + sense pick) can take a minute or two.
  const r = await p.send('Runtime.evaluate', { expression: `(async () => { ${H} ${steps} })()`, awaitPromise: true, returnByValue: true }, 300000);
  if (r.exceptionDetails) throw new Error(name + ': ' + (r.exceptionDetails.exception?.description || r.exceptionDetails.text));
  const crop = JSON.parse(r.result.value);
  const { text, marks, ...clip } = crop;
  if (marks) console.log('  marks:', JSON.stringify(marks));
  console.log(name, JSON.stringify(clip));
  if (text) console.log('  shown:', JSON.stringify(text));
  await sleep(800);
  await p.screenshot({ path: `${outDir}/${name}.png`, format: 'png', clip });
}

const JOBS = {
  async context(p) {
    await p.goto(LEXI + '?q=' + encodeURIComponent(SENTENCE), { settleMs: 2500 });
    // 1) Meaning in context: the sentence with the word marked, the sense it has here, and the usual sense it is not.
    await shoot(p, `const mark = await until(() => document.querySelector('article .lx-mark'));
      const art = mark.closest('article'); scrollTo(0, 0); await wait(400);
      const tell = byText(/^How you can tell$/i)[0];
      const end = tell ? tell.parentElement : byText(/^Not the usual meaning$/i)[0].closest('section');
      return box(R(art).left, R(art).top, R(art).right, R(end).bottom + 40, { text: art.innerText.slice(0, 900) });`, 'lexiai-context');
    // 2) Save it: the app looks the word up, picks the matching sense and files the sentence under it.
    //    Then the Notebook entry: the sentence sits under its numbered sense, next to the word's other senses.
    await shoot(p, `byText(/^Save .* with this sentence$/i, 'button')[0].click();
      const status = await until(() => byText(/^Saved to Notebook/i)[0]);
      const saved = status.innerText; const word = status.querySelector('.italic').innerText.trim();
      await tab('Notebook');
      byText(new RegExp('^' + word + '$')).pop().click(); await wait(1500);
      const row = byText(new RegExp('^' + word + '$')).pop().closest('[class*="FBF9F4"]');
      const fig = row.querySelector('figure');
      const sec = [...row.querySelectorAll('section')][1];
      const defs = sec ? [...sec.querySelectorAll(':scope > div.grid')] : [];
      const end = defs[0] || fig;
      scrollTo(0, R(row).top + scrollY - 240); await wait(500);  // clear of the sticky top bar
      return box(R(row).left, R(row).top, R(row).right, R(end).bottom + 28, { text: saved + ' || ' + row.innerText.slice(0, 700) });`, 'lexiai-kb');
  },
  async sense(p) {
    // R16: the sense number. The Meaning-in-context card has none until the sentence is saved; then its status line names
    // the sense ("Saved to Notebook — clip, sense iv."). Same run then captures the Notebook entry, so both crops agree.
    // `mark` = the callout region, in CSS px relative to the crop.
    await p.goto(LEXI + '?q=' + encodeURIComponent(SENTENCE), { settleMs: 2500 });
    await shoot(p, `const mark = await until(() => document.querySelector('article .lx-mark'));
      byText(/^Save .* with this sentence$/i, 'button')[0].click();
      const status = await until(() => byText(/^Saved to Notebook/i)[0]);
      const art = mark.closest('article'); scrollTo(0, 0); await wait(400);
      const pill = art.querySelector('[role="status"]');
      const c = { l: R(art).left + 12, t: R(art).top + 12, r: R(art).right - 12, b: R(art).bottom - 12 };  // inside the card edge
      return box(c.l, c.t, c.r, c.b, { text: status.innerText,
        marks: { mark: [R(pill).left - c.l, R(pill).top - c.t, R(pill).width, R(pill).height] } });`, 'lexiai-context');
    await shoot(p, `const word = 'clip';
      await tab('Notebook');
      byText(new RegExp('^' + word + '$')).pop().click(); await wait(1500);
      const row = byText(new RegExp('^' + word + '$')).pop().closest('[class*="FBF9F4"]');
      const fig = row.querySelector('figure');
      const sec = [...row.querySelectorAll('section')][1];
      const defs = sec ? [...sec.querySelectorAll(':scope > div.grid')] : [];
      const end = defs[0] || fig;
      scrollTo(0, R(row).top + scrollY - 240); await wait(500);
      const c = { l: R(row).left, t: R(row).top };
      return box(R(row).left, R(row).top, R(row).right, R(end).bottom + 28, { text: row.innerText.slice(0, 500),
        marks: { mark: [R(fig).left - c.l, R(fig).top - c.t, R(fig).width, R(fig).height] } });`, 'lexiai-kb');
  },
  async ask(p) {
    await p.goto(LEXI, { settleMs: 2500 });
    await shoot(p, `byText(/^Ask Lexi$/, 'button')[0].click(); await wait(800);
      const input = document.querySelector('form input[type="text"], form input:not([type="file"])');
      typeInto(input, ${JSON.stringify(QUESTION)}); await wait(300);
      input.closest('form').requestSubmit();
      await until(() => document.querySelectorAll('.font-serif.bg-stone-100, .bg-stone-100.font-serif').length && !document.querySelector('.animate-spin'));
      await wait(800);
      const panel = byText(/^Ask Lexi$/, 'h3')[0].closest('.fixed');
      const body = panel.querySelector('.overflow-y-auto');
      panel.style.maxHeight = 'none'; await wait(600);  // capture only: let the panel grow so the whole exchange shows without scrolling
      const fits = body.scrollHeight <= body.clientHeight + 1;
      return box(R(panel).left, R(panel).top, R(panel).right, R(panel).bottom, { text: (fits ? '' : '[SCROLLS] ') + body.innerText });`, 'lexiai-ask');
  },
};

const b = await Browser.launch({ width: 1440, height: 1400 });
try {
  for (const [name, job] of Object.entries(JOBS)) {
    if (which !== 'all' && !which.split(',').includes(name)) continue;
    const p = await b.newPage({ width: 800, height: name === 'ask' ? 1000 : 1600, dsf: 2 });
    await useRelay(b, p);
    await p.goto(LEXI, { settleMs: 800 });
    await p.eval(`(async () => { ${seed} })()`);
    await job(p);
    if (p.consoleErrors.length) console.error(name, 'page errors:', p.consoleErrors.slice(0, 3));
    await p.close();
  }
} finally { await b.close(); }
