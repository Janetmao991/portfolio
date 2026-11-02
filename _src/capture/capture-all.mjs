// Revision 6: captures the real product screens for the stage into assets/screens/<project>-<view>.png
// Usage: node capture-all.mjs [jobName ...]   (no names = all jobs)
// Needs: LexiAI dist served on :5199, LexiSpeak on :5182, a throwaway Writing Station copy on :5198
// (data minus job applications, own throwaway password; see R6_REPORT.md), cookie in /tmp/ws-cookie.txt.
// Crops are in CSS px at 1440 wide unless a job sets its own viewport; everything is shot at 2x.
import { readFileSync, mkdirSync, existsSync } from 'node:fs';
import { execSync } from 'node:child_process';
import { Browser, sleep } from '/Users/janetmao/.claude/skills/design-taste-frontend/scripts/lib/cdp.mjs';

const OUT = new URL('../../assets/screens/', import.meta.url).pathname;
mkdirSync(OUT, { recursive: true });
const LEXI = 'http://127.0.0.1:5199/';
const SPEAK = 'http://localhost:5182/';
const DESK = 'http://127.0.0.1:5198/';
const lexiWords = JSON.parse(execSync('node seed-lexi.cjs', { cwd: new URL('.', import.meta.url).pathname })).lexiai_words_v1; // my real frozen entries
const lexiSeed = `const words = ${lexiWords}; await new Promise((res, rej) => { const r = indexedDB.open('lexiai', 1); r.onupgradeneeded = () => r.result.createObjectStore('kv'); r.onsuccess = () => { const tx = r.result.transaction('kv', 'readwrite'); tx.objectStore('kv').put(words, 'lexiai_words_v1'); tx.oncomplete = () => { r.result.close(); res(); }; tx.onerror = rej; }; r.onerror = rej; });`;
// R9: the Notebook shot uses real entries pulled read-only from my Supabase notebook (via muse-api), with their real SM-2 and mastery data.
const lexiReal = readFileSync(new URL('seed/lexiai-real-words.json', import.meta.url), 'utf8');
const lexiRealSeed = lexiSeed.replace(/^const words = .*?; await/s, () => `const words = ${JSON.stringify(JSON.parse(lexiReal))}; await`); // same shape as lexiSeed
const speakHist = readFileSync(new URL('seed/lexispeak-history.json', import.meta.url), 'utf8').trim();
const wsCookie = (existsSync('/tmp/ws-cookie.txt') ? readFileSync('/tmp/ws-cookie.txt', 'utf8') : '').split('\n').map(l => l.split('\t')).find(c => c[5] === 'ws_auth')?.[6];
const SENTENCE = 'But what if many of the forces that erode happiness emerge from within, from our own emotional makeup?';

const W = 'const wait = ms => new Promise(r => setTimeout(r, ms));';
const tab = name => `${W} [...document.querySelectorAll('header button, nav button')].find(b => b.innerText.trim().startsWith('${name}')).click(); await wait(1500);`;
const wsOpen = `${W}
  const f = [...document.querySelectorAll('*')].find(e => /^JOURNAL/i.test((e.innerText || '').trim()) && e.children.length < 4); f && f.click(); await wait(500);
  [...document.querySelectorAll('*')].filter(e => e.children.length < 6 && /Update of Lexi AI/.test(e.innerText || '')).pop().click(); await wait(900);`;
// R9: the desk's JOURNAL folder now starts open, so wsOpen's click can collapse it; reopen it so the one entry shows in the list.
const wsList = `${W} if (![...document.querySelectorAll('aside *, nav *')].some(e => e.children.length < 3 && /Update of Lexi AI/.test(e.innerText || '') && e.getBoundingClientRect().left < 400)) { const f = [...document.querySelectorAll('*')].find(e => /^JOURNAL/.test((e.innerText || '').trim()) && e.children.length < 4); f && f.click(); await wait(600); }`;
const wsAnnotated = `[...document.querySelectorAll('button')].find(b => b.innerText.trim() === 'Annotated').click(); await wait(700);`;
const box = (x, y, w, h) => ({ x, y, width: w, height: h });

const JOBS = {
  // ---------------- LexiAI (guest notebook seeded with my real frozen entries)
  'lexiai-define': { url: LEXI + '?q=erode', seed: lexiSeed, clip: box(280, 236, 880, 660) },
  'lexiai-senses': { url: LEXI + '?q=erode', seed: lexiSeed, vp: [1440, 2600], clip: box(280, 925, 880, 660) },
  'lexiai-context': { url: `${LEXI}?q=${encodeURIComponent(SENTENCE)}&w=erode`, seed: lexiSeed, vp: [1440, 1400], settle: 1500,
    steps: [`${W} for (let i = 0; i < 25; i++) { await wait(1000); if (/HOW YOU CAN TELL/i.test(document.body.innerText)) break; } await wait(800);`],
    clip: box(280, 340, 880, 660) },
  'lexiai-review': { url: LEXI, seed: lexiSeed, steps: [tab('Review') + `[...document.querySelectorAll('button')].find(b => /Show meaning/.test(b.innerText)).click(); await wait(900);`],
    clip: box(280, 290, 880, 660) },
  'lexiai-notebook': { url: LEXI, seed: lexiRealSeed, vp: [1440, 1300], steps: [tab('Notebook') + `[...document.querySelectorAll('*')].filter(e => e.children.length < 3 && (e.innerText || '').trim() === 'appall').pop().click(); await wait(900);`],
    clipText: '^stretched thin$', clip: box(280, 0, 880, 660) }, // R9: crop below the banner and the seeded word count

  // ---------------- Writing Station (shadow copy, real entries)
  'writing-station-review': { url: DESK, cookie: true, steps: [wsOpen + wsAnnotated], clip: box(364, 87, 980, 735) },
  'writing-station-journal': { url: DESK, cookie: true, steps: [wsOpen, wsList], clip: box(0, 52, 880, 660) },
  'writing-station-note': { url: DESK, cookie: true, vp: [1024, 768], steps: [wsOpen + `[...document.querySelectorAll('button')].find(b => b.innerText.trim() === '☰').click(); await wait(700);` + wsAnnotated + `
      const m = document.querySelectorAll('.annotated mark.t-error')[1]; m.scrollIntoView({ block: 'center' }); await wait(300); m.click(); await wait(800);
      // R8: scroll back so the entry title sits fully below the toolbar (the note stays open)
      const t = [...document.querySelectorAll('h1, h2, input, textarea, [contenteditable]')].find(e => /Update of Lexi AI/.test(e.value || e.innerText || ''));
      t.scrollIntoView({ block: 'start' }); let sp = t.parentElement; while (sp && !(sp.scrollHeight > sp.clientHeight && /auto|scroll/.test(getComputedStyle(sp).overflowY))) sp = sp.parentElement;
      (sp || window).scrollBy(0, -(document.querySelector('header')?.getBoundingClientRect().bottom || 0) - 28); await wait(500);`],
    clip: box(24, 0, 992, 744) },
  'writing-station-styles': { url: DESK, cookie: true, steps: [wsOpen + wsAnnotated + `window.scrollTo(0, 0); document.querySelector('.review-controls').scrollIntoView({ block: 'start' }); await wait(500);`],
    clip: box(400, 52, 880, 660) },
  'writing-station-ipad': { url: DESK, cookie: true, vp: [1180, 820], steps: [wsOpen, wsList], clip: box(0, 0, 1093, 820) },

  // ---------------- LexiSpeak
  'lexispeak-modes': { url: SPEAK, clip: box(280, 88, 880, 660) },
  'lexispeak-session': { url: SPEAK, fakeMic: true, steps: [
      `${W} [...document.querySelectorAll('button')].filter(b => b.innerText.trim() === 'Start Session')[1].click(); for (let i = 0; i < 25; i++) { await wait(1000); if (document.querySelector('textarea, input[placeholder*="type"]')) break; } await wait(1500);`,
      `${W} const ta = document.querySelector('textarea, input[placeholder*="type"]'); Object.getOwnPropertyDescriptor(ta.__proto__, 'value').set.call(ta, "In my last project I saw how inflation can erode a company's margin very fast, so I want to learn how a deal creates value.");
       ta.dispatchEvent(new Event('input', { bubbles: true })); await wait(300); ta.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true })); await wait(300);
       if (ta.value) [...document.querySelectorAll('button')].filter(b => !b.innerText.trim() && b.querySelector('svg')).pop().click();
       await wait(16000);`, `${W} await wait(4000);`],
    clip: box(340, 96, 760, 570) },
  'lexispeak-report': { url: SPEAK, ls: { lexispeak_history_v1: speakHist }, vp: [1440, 3600],
    steps: [`${W} document.querySelector('button[title="Session history"]').click(); await wait(800); [...document.querySelectorAll('button')].find(b => /Behavioral interview/.test(b.innerText)).click(); await wait(1200);`],
    clip: box(340, 96, 760, 570) },
  'lexispeak-fixes': { url: SPEAK, ls: { lexispeak_history_v1: speakHist }, vp: [1440, 3600],
    steps: [`${W} document.querySelector('button[title="Session history"]').click(); await wait(800); [...document.querySelectorAll('button')].find(b => /Behavioral interview/.test(b.innerText)).click(); await wait(1200);`],
    clipText: 'Everything you said', clip: box(340, 0, 760, 570) },
  'lexispeak-words': { url: SPEAK, ls: { lexispeak_history_v1: speakHist }, vp: [1440, 3600],
    steps: [`${W} document.querySelector('button[title="Session history"]').click(); await wait(800); [...document.querySelectorAll('button')].find(b => /Behavioral interview/.test(b.innerText)).click(); await wait(1200);`],
    clipText: 'Target words', clip: box(340, 0, 760, 570) },

  // ---------------- Meta Muse: not reachable from a browser, so rebuilt mock-ups (labelled "Mock-up" on the site)
  'muse-note': { url: new URL('mocks/muse.html?s=note', import.meta.url).href, vp: [880, 660], clip: box(0, 0, 880, 660) },
  'muse-quiz': { url: new URL('mocks/muse.html?s=quiz', import.meta.url).href, vp: [880, 660], clip: box(0, 0, 880, 660) },
  'muse-rated': { url: new URL('mocks/muse.html?s=rated', import.meta.url).href, vp: [880, 660], clip: box(0, 0, 880, 660) },
};

const only = process.argv.slice(2);
const names = Object.keys(JOBS).filter(n => !only.length || only.includes(n));
const browsers = {};
const browser = async fakeMic => (browsers[fakeMic ? 'mic' : 'plain'] ||= await Browser.launch({
  width: 1440, height: 900, extraArgs: fakeMic ? ['--use-fake-ui-for-media-stream', '--use-fake-device-for-media-stream'] : [] }));

for (const name of names) {
  const j = JOBS[name];
  const [w, h] = j.vp || [1440, 900];
  const p = await (await browser(j.fakeMic)).newPage({ width: w, height: h, dsf: 2 });
  try {
    if (j.cookie) { await p.send('Network.enable'); await p.send('Network.setCookie', { name: 'ws_auth', value: wsCookie, url: j.url }); }
    if (j.seed || j.ls) {
      await p.goto(new URL(j.url).origin + '/', { settleMs: 800 });
      if (j.seed) await p.eval(`(async () => { ${j.seed} })()`);
      for (const [k, v] of Object.entries(j.ls || {})) await p.eval(`localStorage.setItem(${JSON.stringify(k)}, ${JSON.stringify(v)})`);
    }
    await p.goto(j.url, { settleMs: j.settle ?? 2500 });
    for (const s of j.steps || []) await p.eval(`(async () => { ${s} })()`);
    await sleep(600);
    let clip = { ...j.clip };
    if (j.clipText) { // anchor the crop to a section heading so it survives layout shifts
      const top = await p.eval(`(() => { const w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT); let n; while ((n = w.nextNode())) if (new RegExp(${JSON.stringify(j.clipText)}, 'i').test(n.textContent)) return n.parentElement.getBoundingClientRect().top + scrollY; return null; })()`);
      if (top != null) clip.y = Math.max(0, Math.round(top) - 36);
    }
    await p.screenshot({ path: OUT + name + '.png', format: 'png', clip });
    console.log('ok', name, p.consoleErrors.length ? `(page errors: ${p.consoleErrors.length})` : '');
  } catch (e) { console.log('FAIL', name, e.message); }
  await p.close();
}
for (const b of Object.values(browsers)) await b.close();
