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
  // R73p: the disc tilts toward where you are (or the word you point at); -1..1 each way
  const me = face.closest('.me'), fine = matchMedia('(hover: hover) and (pointer: fine)').matches;
  const tilt = (x, y) => {
    if (!fine || reduce) return;
    const r = face.getBoundingClientRect(), cx = r.left + r.width / 2, cy = r.top + r.height / 2;
    const c = v => Math.max(-1, Math.min(1, v));
    me.style.setProperty('--nx', c((x - cx) / (innerWidth * .5)).toFixed(3));
    me.style.setProperty('--ny', c((y - cy) / (innerHeight * .5)).toFixed(3));
  };
  const frame = () => { raf = 0; if (target) { const r = target.getBoundingClientRect(); look(r.right, r.top + r.height / 2); tilt(r.right, r.top + r.height / 2); } else { look(px, py); if (moved) tilt(px, py); } };
  let moved = false;
  const ask = () => { if (!raf) raf = requestAnimationFrame(frame); };
  if (!reduce) {
    addEventListener('pointermove', e => { px = e.clientX; py = e.clientY; moved = true; ask(); }, { passive: true });
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
  // R73w: nobody pointing? she walks through the menu on her own — each word lights up in turn, her face and line
  // change with it. Pointer, keyboard or touch take over at once; it picks up again after a few quiet seconds.
  const words = [...document.querySelectorAll('nav a')];
  let auto = 0, ai = -1, idleT = 0, user = false;
  const STEP = 2600, IDLE = 5000;
  const tick = () => {
    if (user || document.hidden) return;
    words.forEach(w => w.classList.remove('on'));
    ai = (ai + 1) % (words.length + 1);           // one beat with nothing lit, so it breathes between rounds
    if (ai < words.length) { words[ai].classList.add('on'); show(words[ai]); } else show(null);
  };
  const play = () => { if (reduce || auto) return; auto = setInterval(tick, STEP); };
  const hold = () => {
    user = true; clearInterval(auto); auto = 0; clearTimeout(idleT);
    words.forEach(w => { if (w !== document.activeElement) w.classList.remove('on'); });
    idleT = setTimeout(() => { user = false; if (!document.activeElement || !words.includes(document.activeElement)) { show(null); ai = -1; play(); } }, IDLE);
  };
  words.forEach(a => { a.addEventListener('pointerenter', hold); a.addEventListener('focus', hold); });
  addEventListener('pointerdown', hold); addEventListener('keydown', hold);
  if (!new URLSearchParams(location.search).get('look')) setTimeout(play, 1600);
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
