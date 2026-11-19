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
  // pointing at a word: she looks at it
  document.querySelectorAll('nav a').forEach(a => {
    a.addEventListener('pointerenter', () => { target = a; ask(); });
    a.addEventListener('pointerleave', () => { target = null; ask(); });
    a.addEventListener('focus', () => { target = a; a.classList.add('on'); ask(); });
    a.addEventListener('blur', () => { target = null; a.classList.remove('on'); ask(); });
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
  if (q) setTimeout(() => { const a = [...document.querySelectorAll('nav a')].find(a => a.textContent.toLowerCase() === q); if (a) { target = a; a.classList.add('on'); ask(); } }, 1200);
})();
