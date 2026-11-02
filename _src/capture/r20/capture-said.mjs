// R20: recapture LexiSpeak's "Everything You Said" (now with green target words) from the ~/lexispeak-demo build in demo mode.
// Plays the Interview sample, opens the report, crops title + legend + lines 1–4 at 2x, and prints the box of the
// green "stretched thin" mark (crop-relative, PNG px) for the callout ring.
// Usage: node capture-said.mjs <appUrl> <outPng>
import { Browser, sleep } from '/Users/janetmao/.claude/skills/design-taste-frontend/scripts/lib/cdp.mjs';
const [APP = 'http://127.0.0.1:5198/', OUT = '/tmp/r20-said.png', WORD = 'stretched thin'] = process.argv.slice(2);
const b = await Browser.launch({ width: 1280, height: 1400 });
try {
  const p = await b.newPage({ width: 1280, height: 1300, dsf: 2 });
  await p.goto(APP + '?demo=1', { settleMs: 2000 });
  const run = js => p.eval(`(async () => {
    const wait = ms => new Promise(r => setTimeout(r, ms));
    const until = async (fn, ms = 60000) => { for (let t = 0; t < ms; t += 250) { const v = fn(); if (v) return v; await wait(250); } throw new Error('timed out: ' + fn); };
    const btn = re => [...document.querySelectorAll('button')].filter(e => re.test(e.innerText.trim()) && e.getBoundingClientRect().width > 0);
    ${js} })()`);
  await run(`const card = [...document.querySelectorAll('div')].filter(d => /Mock interview/i.test(d.innerText) && /Play Sample/.test(d.innerText)).sort((a, b) => a.innerText.length - b.innerText.length)[0];
    [...card.querySelectorAll('button')].find(e => /Play Sample/.test(e.innerText)).click();
    (await until(() => btn(/^Play$/)[0])).click();
    await until(() => /line 13 of 13/.test(document.body.innerText));
    await wait(800);
    btn(/End & Get Coaching Report/)[0].click();
    await until(() => /Everything You Said/i.test(document.body.innerText));`);
  await sleep(1500);
  const box = JSON.parse(await run(`
    const sec = [...document.querySelectorAll('section')].find(s => /Everything You Said/i.test(s.innerText));
    scrollTo(0, sec.getBoundingClientRect().top + scrollY - 300); await wait(600);  // clear of the sticky app header
    const S = sec.getBoundingClientRect();
    const lines = [...sec.querySelectorAll('p, li, div')].filter(e => /^Sure\\. During|^In a pitch/.test(e.innerText.trim()) && e.children.length < 12);
    const line4 = lines.filter(e => /^In a pitch/.test(e.innerText.trim())).sort((a, b) => a.innerText.length - b.innerText.length)[0].getBoundingClientRect();
    const w = [...sec.querySelectorAll('span[tabindex="0"]')].find(e => e.childNodes[0].textContent.toLowerCase() === ${JSON.stringify(WORD)}).getBoundingClientRect();
    const clip = { x: S.left, y: S.top + scrollY, width: S.width, height: line4.bottom + 18 - S.top };
    return JSON.stringify({ clip, word: { x: w.left - S.left, y: w.top - S.top, w: w.width, h: w.height } });`));
  await p.screenshot({ path: OUT, format: 'png', clip: box.clip });
  const k = 2, pad = 6;
  console.log(JSON.stringify({ size: [Math.round(box.clip.width * k), Math.round(box.clip.height * k)],
    ring: [Math.round((box.word.x - pad) * k), Math.round((box.word.y - pad) * k), Math.round((box.word.w + 2 * pad) * k), Math.round((box.word.h + 2 * pad) * k)] }));
  console.log('errors:', p.consoleErrors);
} finally { await b.close(); }
