// R34: AI Terms page at 1440 and 390: the framework section close-up, the full page, checks
// (overflow, framework node overlap, smallest text, section order, broken images, links, console). Then reduced motion.
import { Browser } from '/Users/janetmao/.claude/skills/design-taste-frontend/scripts/lib/cdp.mjs';
import { writeFileSync } from 'node:fs';
const [outDir = 'shots-r34', port = '5234'] = process.argv.slice(2);
const U = `http://127.0.0.1:${port}/projects/ai-terms.html`;
const rect = sel => `(() => { const r = document.querySelector('${sel}').getBoundingClientRect(); return { x: r.left + scrollX, y: r.top + scrollY, width: r.width, height: r.height }; })()`;
const shot = async (pg, path, c) => { const { data } = await pg.send('Page.captureScreenshot', { format: 'jpeg', quality: 88, captureBeyondViewport: true, clip: { scale: 1, ...c } }, 60000); writeFileSync(path, Buffer.from(data, 'base64')); };
const info = `(async () => {
  for (const i of document.images) { i.loading = 'eager'; } for (let y = 0; y < document.documentElement.scrollHeight; y += 600) { scrollTo(0, y); await new Promise(r => setTimeout(r, 150)); } scrollTo(0, 0); await Promise.all([...document.images].map(i => i.decode().catch(() => 0))); await new Promise(r => setTimeout(r, 3500));
  const boxes = [...document.querySelectorAll('#framework .tr-c, #framework .tr-ph span, #framework .fw-end p')].map(e => e.getBoundingClientRect());
  let overlaps = 0; for (let i = 0; i < boxes.length; i++) for (let j = i + 1; j < boxes.length; j++) { const a = boxes[i], b = boxes[j]; if (a.left < b.right - 1 && b.left < a.right - 1 && a.top < b.bottom - 1 && b.top < a.bottom - 1) overlaps++; }
  const sizes = [...document.querySelectorAll('#framework *')].filter(e => e.childNodes.length && [...e.childNodes].some(n => n.nodeType === 3 && n.textContent.trim()) && e.getClientRects().length && !e.closest('.sr')).map(e => parseFloat(getComputedStyle(e).fontSize));
  const fw = document.querySelector('#framework'), lp = document.querySelector('#loop');
  return { overflow: document.documentElement.scrollWidth > innerWidth, nodes: document.querySelectorAll('#framework .tr-n').length, overlaps,
    minFont: Math.min(...sizes), frameworkBeforeLoop: !!(fw.compareDocumentPosition(lp) & Node.DOCUMENT_POSITION_FOLLOWING),
    introWidth: Math.round(fw.querySelector(':scope > p').getBoundingClientRect().width), sectionWidth: Math.round(fw.getBoundingClientRect().width),
    treeState: document.querySelector('.fw').className, broken: [...document.images].filter(i => !i.naturalWidth).map(i => i.src),
    links: [...new Set([...document.querySelectorAll('a[href]')].map(a => a.getAttribute('href')))] }; })()`;
const errors = [];
const b = await Browser.launch({ width: 1440, height: 900 });
try {
  for (const [w, h, tag, mobile, reduced] of [[1440, 900, '1440', false, false], [390, 844, '390', true, false], [1440, 900, '1440-reduced', false, true]]) {
    const p = await b.newPage({ width: w, height: h, dsf: 2, mobile });
    if (reduced) await p.send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'reduce' }] });
    await p.goto(U, { settleMs: 1500 });
    console.log(tag, JSON.stringify(await p.eval(info)));
    await shot(p, `${outDir}/framework-${tag}.jpg`, await p.eval(rect('#framework')));
    if (!reduced) await shot(p, `${outDir}/page-${tag}.jpg`, { x: 0, y: 0, width: w, height: await p.eval('document.documentElement.scrollHeight') });
    errors.push(...p.consoleErrors);
  }
  console.log('errors:', errors);
} finally { await b.close(); }
