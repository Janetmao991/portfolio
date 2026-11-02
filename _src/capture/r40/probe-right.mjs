// R40: which text sits past the plate's right padding on the mock homepage at 1440 (the off-centre warning)
import { Browser } from '/Users/janetmao/.claude/skills/design-taste-frontend/scripts/lib/cdp.mjs';
const b = await Browser.launch({ width: 1440, height: 900 });
try {
  const p = await b.newPage({ width: 1440, height: 900 });
  await p.goto('file://' + process.argv[2], { settleMs: 1500 });
  console.log(JSON.stringify(await p.eval(`(() => { const out = [];
    for (const el of document.querySelectorAll('body *')) { if (!el.childNodes.length || ![...el.childNodes].some(n => n.nodeType === 3 && n.textContent.trim())) continue;
      const r = el.getBoundingClientRect(); if (r.width && r.left < 300) out.push(['L', Math.round(r.left), el.className || el.tagName, el.textContent.trim().slice(0, 30)]);
      if (r.width && r.right > 1200) out.push(['R', Math.round(1440 - r.right), el.className || el.tagName, el.textContent.trim().slice(0, 30)]); }
    return out.sort((a, b) => a[1] - b[1]).slice(0, 12); })()`), null, 1));
} finally { await b.close(); }
