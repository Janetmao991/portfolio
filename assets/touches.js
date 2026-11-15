// R68 site-wide touches: reading-progress line, tab-title note, highlighter selection (CSS). Loaded on every page.
(() => {
  const bar = document.createElement('div'); bar.className = 'dl-progress'; bar.setAttribute('aria-hidden', 'true');
  document.body.appendChild(bar);
  let f = 0;
  const upd = () => { f = 0; const h = document.documentElement.scrollHeight - innerHeight; bar.style.transform = `scaleX(${h > 0 ? Math.min(1, scrollY / h) : 0})`; };
  addEventListener('scroll', () => { if (!f) f = requestAnimationFrame(upd); }, { passive: true });
  upd();
  const title = document.title;
  document.addEventListener('visibilitychange', () => { document.title = document.hidden ? 'Come back, still learning…' : title; });
})();
