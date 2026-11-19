/* Portfolio v5 (R72). Home: the menu lights the matching part of the drawing; the laptop looks up words.
   Colour trials while Janet chooses: ?c=lime, ?c=red or ?c=blue (green is the default). */
(() => {
  const html = document.documentElement;
  const q = new URLSearchParams(location.search), c = q.get('c'), hex = q.get('hex');
  if (hex && /^[0-9a-f]{6}$/i.test(hex)) {  // colour trials only: ?hex=c0362c
    html.style.setProperty('--c', '#' + hex);
    html.style.setProperty('--c-wash', `color-mix(in srgb, #${hex} 14%, #f7f7f5)`);
    html.dataset.palette = 'trial';
  }
  if (q.get('bg') === 'wash') html.classList.add('bg-wash');
  if (['red', 'blue', 'lime'].includes(c)) {
    html.dataset.palette = c;
    document.querySelectorAll('a[href$=".html"], a[href*=".html#"]').forEach(a => {
      const u = new URL(a.href, location.href);
      if (u.origin === location.origin) { u.searchParams.set('c', c); a.href = u.pathname + u.search + u.hash; }
    });
  }
  // keep colour trials when clicking through
  if (hex || q.get('bg')) document.querySelectorAll('a[href$=".html"], a[href*=".html#"]').forEach(a => {
    const u = new URL(a.href, location.href);
    if (u.origin !== location.origin) return;
    if (hex) u.searchParams.set('hex', hex); if (q.get('bg')) u.searchParams.set('bg', q.get('bg'));
    a.href = u.pathname + u.search + u.hash;
  });

  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  // home: hover or focus a menu item, the drawing points at it
  const h5 = document.querySelector('.h5');
  if (h5) {
    const set = o => { if (o) h5.dataset.on = o; else delete h5.dataset.on; };
    h5.querySelectorAll('.h5-menu a[data-o]').forEach(a => {
      a.addEventListener('pointerenter', () => set(a.dataset.o));
      a.addEventListener('focus', () => set(a.dataset.o));
      a.addEventListener('pointerleave', () => set(null));
      a.addEventListener('blur', () => set(null));
    });
  }

  window.V5 = true;
  const fine = matchMedia('(hover: hover) and (pointer: fine)');
  const art = document.querySelector('.h5 .desk');

  // R72c intro, once per visit (the switch is set in <head>): the greeting types itself, the room is drawn
  // stroke by stroke, the menu follows. Any click or key skips to the end; nothing waits on it.
  if (html.classList.contains('intro') && art) {
    const h1 = document.querySelector('.h5 h1');
    const text = h1.textContent;
    h1.setAttribute('aria-label', text);
    h1.innerHTML = [...text].map((ch, i) => `<span class="ch" aria-hidden="true" style="--d:${i * 48}ms">${ch === ' ' ? '&nbsp;' : ch}</span>`).join('');
    const ORDER = { 'o-window': 150, 'o-work': 300, 'o-desk': 420, 'o-research': 560, 'o-laptop': 640, 'o-about': 760, 'o-mug': 900, 'o-contact': 960, 'o-plant': 1020 };
    Object.entries(ORDER).forEach(([cls, t0]) => {
      art.querySelectorAll(`g[filter] .${cls} :is(path, rect, ellipse, circle)`).forEach((el, i) => {
        if (el.closest('.st')) return;
        el.setAttribute('pathLength', '1');
        el.classList.add('dw');
        el.style.setProperty('--d', `${t0 + Math.min(i, 8) * 28}ms`);
      });
    });
    const done = () => {
      html.classList.remove('intro');
      h1.textContent = text; h1.removeAttribute('aria-label');
      art.querySelectorAll('.dw').forEach(el => el.classList.remove('dw'));
    };
    const t = setTimeout(done, 2700);
    const skip = () => { clearTimeout(t); done(); };
    addEventListener('pointerdown', skip, { once: true });
    addEventListener('keydown', skip, { once: true });
  }

  // R72c the menu ties a thread to the thing it names in the drawing (a nod to the project map)
  const str = document.querySelector('.h5-str');
  const TO = { work: [56, 178], research: [58, 400], about: [236, 362], contact: [592, 404] };
  if (h5 && str && art) {
    const path = str.querySelector('path'), pin = str.querySelector('circle');
    let shown = null;
    const tie = a => {
      const o = a.dataset.o; if (!TO[o] || !fine.matches || innerWidth < 861) return;
      const box = h5.getBoundingClientRect();
      const r = a.querySelector('.m5-l').getBoundingClientRect();
      const pt = art.createSVGPoint(); [pt.x, pt.y] = TO[o];
      const e = pt.matrixTransform(art.getScreenCTM());
      const sx = r.right + 16 - box.left, sy = r.top + r.height * .58 - box.top;
      const ex = e.x - box.left, ey = e.y - box.top, dx = ex - sx, sag = Math.min(72, 30 + Math.abs(dx) * .08);
      path.setAttribute('d', `M${sx} ${sy}C${sx + dx * .42} ${sy + sag} ${ex - dx * .38} ${ey + sag} ${ex} ${ey}`);
      pin.setAttribute('cx', ex); pin.setAttribute('cy', ey);
      shown = o;
      str.classList.remove('on'); void str.getBoundingClientRect(); str.classList.add('on');
    };
    const untie = () => { shown = null; str.classList.remove('on'); };
    h5.querySelectorAll('.h5-menu a[data-o]').forEach(a => {
      a.addEventListener('pointerenter', () => tie(a));
      a.addEventListener('focus', () => tie(a));
      a.addEventListener('pointerleave', untie);
      a.addEventListener('blur', untie);
    });
    addEventListener('resize', untie);
  }

  // R72c she glances toward the pointer (mouse only, and only a few degrees)
  const head = art && art.querySelector('.o-about .head');
  if (head && !reduce) {
    let raf = 0;
    addEventListener('pointermove', ev => {
      if (ev.pointerType !== 'mouse' || raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        const hb = head.getBoundingClientRect();
        const dx = (ev.clientX - (hb.left + hb.width / 2)) / (innerWidth / 2);
        art.style.setProperty('--look', `${Math.max(-1, Math.min(1, dx)) * 6}deg`);
      });
    }, { passive: true });
  }

  // the laptop: type a word, show its line, wait, erase, next word
  const hw = document.querySelector('.h5 .desk .hw');
  const pr = document.querySelector('.h5 .desk .pr');
  const data = document.getElementById('laptop-words');
  if (hw && pr && data && !reduce) {
    const words = JSON.parse(data.textContent);
    const art = hw.closest('svg');
    let i = 0, alive = true;
    const wait = ms => new Promise(r => setTimeout(r, ms));
    const visible = () => !document.hidden && alive;
    new IntersectionObserver(es => { alive = es[0].isIntersecting; }).observe(art);
    (async () => {
      await wait(2600);
      for (;;) {
        while (!visible()) await wait(400);
        i = (i + 1) % words.length;
        const [w, p] = words[i];
        art.classList.add('typing');
        for (let n = hw.textContent.length; n >= 0; n--) { hw.textContent = hw.textContent.slice(0, n); await wait(45); }
        pr.style.opacity = 0;
        await wait(260);
        for (let n = 1; n <= w.length; n++) { hw.textContent = w.slice(0, n); await wait(90 + Math.random() * 60); }
        pr.textContent = p; pr.style.opacity = '';
        art.classList.remove('typing');
        await wait(4200);
      }
    })();
  }
})();
