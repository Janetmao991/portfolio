/* R73 homepage: her eyes follow the pointer, look at the word you point at, blink now and then. */
(() => {
  const face = document.getElementById('face'), eyes = document.getElementById('eyes');
  const pupils = [...face.querySelectorAll('.pupil')];
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let target = null, raf = 0, px = innerWidth * .2, py = innerHeight * .5;
  const look = (x, y) => {
    const m = face.getScreenCTM(); if (!m) return;
    pupils.forEach(p => {
      const ex = m.a * +p.dataset.cx + m.e, ey = m.d * +p.dataset.cy + m.f;
      const dx = x - ex, dy = y - ey, d = Math.hypot(dx, dy) || 1, k = Math.min(1, d / 260);
      p.style.transform = `translate(${dx / d * 8 * k}px, ${dy / d * 5.5 * k}px)`;
    });
  };
  const frame = () => { raf = 0; if (target) { const r = target.getBoundingClientRect(); look(r.right, r.top + r.height / 2); } else look(px, py); };
  const ask = () => { if (!raf) raf = requestAnimationFrame(frame); };
  if (!reduce) {
    addEventListener('pointermove', e => { px = e.clientX; py = e.clientY; ask(); }, { passive: true });
    addEventListener('resize', ask);
  }
  // pointing at a word: she pulls that page's face and says a line (R73c); a short delay out keeps it from flickering between words
  const main = document.querySelector('.d6'), bubble = document.querySelector('.say'), line = bubble && bubble.firstElementChild;
  let outT = 0;
  const show = a => {
    clearTimeout(outT); target = a; ask();
    if (!a) { outT = setTimeout(() => { delete main.dataset.x; bubble && bubble.classList.remove('on'); }, 90); return; }
    main.dataset.x = a.dataset.x;
    if (bubble) { line.textContent = a.dataset.say; bubble.classList.toggle('think', a.dataset.x === 'research'); bubble.classList.add('on'); }
  };
  document.querySelectorAll('nav a').forEach(a => {
    a.addEventListener('pointerenter', () => show(a));
    a.addEventListener('pointerleave', () => show(null));
    a.addEventListener('focus', () => { a.classList.add('on'); show(a); });
    a.addEventListener('blur', () => { a.classList.remove('on'); show(null); });
  });
  // she blinks now and then (and when you click)
  const blink = () => { eyes.classList.remove('blink'); void eyes.getBoundingClientRect(); eyes.classList.add('blink'); };
  if (!reduce) {
    const loop = () => { if (!document.hidden) blink(); setTimeout(loop, 2600 + Math.random() * 3400); };
    setTimeout(loop, 1400);
    addEventListener('pointerdown', blink);
  }
  ask();
  // screenshots: ?look=research points her at that word
  const q = new URLSearchParams(location.search).get('look');
  if (q) setTimeout(() => { const a = [...document.querySelectorAll('nav a')].find(a => a.textContent.toLowerCase() === q); if (a) { a.classList.add('on'); show(a); } }, 1200);
})();
