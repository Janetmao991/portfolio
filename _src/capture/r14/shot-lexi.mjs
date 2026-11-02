// R14: captures LexiAI screens from the local key-free build (lexi-local.py on :5199).
// Seeds my real notebook words (seed/lexiai-real-words.json + the frozen entries in assets/data.js, definitions only)
// and a local sign-in, so the signed-in Podcasts tab works against the local stand-in.
// Usage: node shot-lexi.mjs <job|all> <outDir>   (writes <job>.png at 2x; prints the crop box used)
import { Browser, sleep } from '/Users/janetmao/.claude/skills/design-taste-frontend/scripts/lib/cdp.mjs';
import { readFileSync } from 'node:fs';
import { execSync } from 'node:child_process';

const [which = 'all', outDir = '/tmp/r14-raw'] = process.argv.slice(2);
const HERE = new URL('.', import.meta.url).pathname;
const LEXI = 'http://127.0.0.1:5199/';

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
  localStorage.setItem('lexiai_stats_v1', ${JSON.stringify(stats)});`;

const W = 'const wait = ms => new Promise(r => setTimeout(r, ms));';
const tab = name => `[...document.querySelectorAll('button, a')].find(b => b.innerText.trim().startsWith('${name}') && b.getBoundingClientRect().width > 0)?.click(); await wait(1500);`;
const clickText = t => `[...document.querySelectorAll('*')].filter(e => e.children.length < 3 && (e.innerText || '').trim() === '${t}' && e.getBoundingClientRect().width > 0).pop()?.click(); await wait(1500);`;

// Crops are measured from the DOM (CSS px); each job's last step returns {x, y, width, height}.
const R = `const R = e => e.getBoundingClientRect(); const byText = (re, sel = '*') => [...document.querySelectorAll(sel)].filter(e => e.children.length < 3 && re.test((e.innerText || '').trim()) && R(e).width > 0);
  const box = (l, t, r, b) => JSON.stringify({ x: Math.round(l), y: Math.round(t + scrollY), width: Math.round(r - l), height: Math.round(b - t) });
  const openRow = word => byText(new RegExp('^' + word + '$')).pop().closest('[class*="FBF9F4"]');`;
const reveal = `[...document.querySelectorAll('button')].find(b => /Show meaning/i.test(b.innerText))?.click(); await wait(1000);`;

const JOBS = {
  // Podcasts tab, appall open: the row and its first Everyday clip (the second one has a swear word, so it stays out)
  'lexiai-podcasts': { vp: [800, 1400], steps: tab('Podcasts') + `for (let i = 0; i < 20 && !/words heard/.test(document.body.innerText); i++) await wait(500);` + clickText('appall') + `await wait(1500); ${R}
    const row = openRow('appall'), save = byText(/^Save with this sentence$/, 'button')[0];
    return box(R(row).left, R(row).top, R(row).right, R(save).bottom + 14);` },
  // Notebook, bludgeon open: headword through the third numbered sense (stops above "Delete word")
  'lexiai-notebook': { vp: [800, 2400], steps: tab('Notebook') + clickText('bludgeon') + `${R}
    const row = openRow('bludgeon'), last = byText(/^“The activist/).pop();
    return box(R(row).left, R(row).top, R(row).right, R(last).bottom + 32);` },
  // Review: rate the first card, then the next card with its meaning and the four rating buttons
  'lexiai-review': { vp: [800, 1400], steps: tab('Review') + reveal + `[...document.querySelectorAll('button')].find(b => /^Got it/.test(b.innerText.trim()))?.click(); await wait(1200);` + reveal + `${R}
    const easy = [...document.querySelectorAll('button')].find(b => /^Easy/.test(b.innerText.trim()));
    let card = byText(/^Show meaning$|^verb$|^noun$|^adjective|^idiom|^phrasal/i)[0]; while (card && !/rounded/.test(card.className)) card = card.parentElement;
    const word = document.querySelector('h1, h2, h3') && [...document.querySelectorAll('h1, h2, h3')].map(h => h.innerText).join(' | ');
    return box(R(easy.parentElement).left - 24, R(card).top - 24, R(easy.parentElement).right + 24, R(easy).bottom + 24).replace('}', ', "words": ' + JSON.stringify(word) + '}');` },
};

const b = await Browser.launch({ width: 1440, height: 1400 });
try {
  for (const [name, job] of Object.entries(JOBS)) {
    if (which !== 'all' && !which.split(',').includes(name)) continue;
    const [w, h] = job.vp;
    const p = await b.newPage({ width: w, height: h, dsf: 2 });
    await p.goto(LEXI, { settleMs: 800 });
    await p.eval(`(async () => { ${seed} })()`);
    await p.goto(job.url || LEXI, { settleMs: 2500 });
    const crop = JSON.parse(await p.eval(`(async () => { ${W} ${job.steps} })()`));
    console.log(name, JSON.stringify(crop));
    await sleep(800);
    const { words, ...clip } = crop;
    await p.screenshot({ path: `${outDir}/${name}.png`, format: 'png', clip });
    if (p.consoleErrors.length) console.error(name, 'page errors:', p.consoleErrors.slice(0, 3));
    await p.close();
  }
} finally { await b.close(); }
