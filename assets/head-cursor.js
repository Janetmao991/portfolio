/* Janet's cartoon head as the pointer (her idea, R73). Mouse and trackpad only; touch keeps nothing.
   The centre of the head is the click point. It grows a little over anything clickable, dips on press,
   and text fields keep the normal text cursor. No lag: the head is drawn exactly where the pointer is. */
(() => {
  if (!matchMedia('(hover: hover) and (pointer: fine)').matches) return;
  const root = document.currentScript && document.currentScript.dataset.root || '';
  const html = document.documentElement;
  const el = document.createElement('div');
  el.className = 'hc';
  el.setAttribute('aria-hidden', 'true');
  el.innerHTML = `<img src="${root}assets/janet-head.png" alt="" width="40" height="40">`;
  const css = document.createElement('style');
  css.textContent = `
    html.hc-on, html.hc-on * { cursor: none !important; }
    html.hc-on :is(input, textarea, select, [contenteditable="true"]) { cursor: text !important; }
    .hc { position: fixed; left: 0; top: 0; z-index: 2147483000; pointer-events: none; width: 40px; height: 40px;
          margin: -20px 0 0 -20px; opacity: 0; transition: opacity 120ms ease-out; will-change: transform; }
    .hc img { display: block; width: 100%; height: 100%; transition: transform 160ms cubic-bezier(.23, 1, .32, 1); }
    html.hc-on .hc { opacity: 1; }
    .hc.link img { transform: scale(1.3) rotate(-6deg); }
    .hc.down img { transform: scale(.88); }
    .hc.link.down img { transform: scale(1.12) rotate(-6deg); }
    .hc.text { opacity: 0 !important; }
    @media (prefers-reduced-motion: reduce) { .hc img { transition: none; } }`;
  document.head.appendChild(css);
  const start = () => document.body.appendChild(el);
  document.body ? start() : addEventListener('DOMContentLoaded', start);

  let x = -100, y = -100, raf = 0;
  const draw = () => { raf = 0; el.style.transform = `translate3d(${x}px, ${y}px, 0)`; };
  addEventListener('pointermove', e => {
    if (e.pointerType !== 'mouse') { html.classList.remove('hc-on'); return; }
    x = e.clientX; y = e.clientY;
    html.classList.add('hc-on');
    const t = e.target.closest ? e.target : null;
    el.classList.toggle('link', !!(t && t.closest('a, button, [role="button"], summary, label, .nd')));
    el.classList.toggle('text', !!(t && t.closest('input, textarea, select, [contenteditable="true"]')));
    if (!raf) raf = requestAnimationFrame(draw);
  }, { passive: true });
  addEventListener('pointerdown', e => { if (e.pointerType === 'mouse') el.classList.add('down'); });
  addEventListener('pointerup', () => el.classList.remove('down'));
  document.addEventListener('mouseleave', () => html.classList.remove('hc-on'));
  document.addEventListener('mouseenter', () => html.classList.add('hc-on'));
})();
