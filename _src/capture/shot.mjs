// Usage: node shot.mjs <url> <out.png|jpg> [setupJS] [clip "x,y,w,h"] [dsf] [width,height]
// Loads url at 1440x900 (dsf 2 by default), runs optional setup JS (may be async, may return text to print), screenshots.
import { Browser, sleep } from '/Users/janetmao/.claude/skills/design-taste-frontend/scripts/lib/cdp.mjs';
const [url, out, setup = '', clipArg = '', dsfArg = '2', size = '1440,900'] = process.argv.slice(2);
const [w, h] = size.split(',').map(Number);
const b = await Browser.launch({ width: w, height: h, extraArgs: process.env.FAKE_MIC ? ['--use-fake-ui-for-media-stream', '--use-fake-device-for-media-stream'] : [] });
try {
  const p = await b.newPage({ width: w, height: h, dsf: Number(dsfArg) });
  if (process.env.COOKIE) { // "name=value" for a local session (throwaway shadow server only)
    const [name, ...v] = process.env.COOKIE.split('=');
    await p.send('Network.enable');
    await p.send('Network.setCookie', { name, value: v.join('='), url });
  }
  for (const [k, v] of Object.entries(JSON.parse(process.env.LS || '{}'))) { // localStorage seed, set on first load then reload
    await p.goto(url, { settleMs: 300 }); await p.eval(`localStorage.setItem(${JSON.stringify(k)}, ${JSON.stringify(v)})`);
  }
  if (process.env.PRE) { await p.goto(url, { settleMs: 1500 }); await p.eval(`(async () => { ${process.env.PRE} })()`); }
  await p.goto(url, { settleMs: Number(process.env.SETTLE || 2000) });
  if (setup) {
    for (const step of setup.split('\n---\n')) { // steps run one by one, STEPWAIT ms apart (each under the 30s eval cap)
      const r = await p.eval(`(async () => { const wait = ms => new Promise(r => setTimeout(r, ms)); ${step} })()`);
      if (r !== undefined && r !== null) console.log(typeof r === 'string' ? r : JSON.stringify(r));
      await sleep(Number(process.env.STEPWAIT || 0));
    }
    await sleep(Number(process.env.POSTWAIT || 1200));
  }
  const clip = clipArg ? (([x, y, cw, ch]) => ({ x, y, width: cw, height: ch }))(clipArg.split(',').map(Number)) : undefined;
  await p.screenshot({ path: out, format: out.endsWith('.png') ? 'png' : 'jpeg', quality: 70, clip, fullPage: !!process.env.FULL });
  if (p.consoleErrors.length) console.error('page errors:', p.consoleErrors.slice(0, 3));
} finally { await b.close(); }
