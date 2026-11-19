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
  if (['line', 'red'].includes(q.get('me'))) html.classList.add('me-' + q.get('me'));  // trials: her drawn line version / one-colour picture
  if (['red', 'blue', 'lime'].includes(c)) {
    html.dataset.palette = c;
    document.querySelectorAll('a[href$=".html"], a[href*=".html#"]').forEach(a => {
      const u = new URL(a.href, location.href);
      if (u.origin === location.origin) { u.searchParams.set('c', c); a.href = u.pathname + u.search + u.hash; }
    });
  }
  // keep colour trials when clicking through
  if (hex || q.get('bg') || q.get('me')) document.querySelectorAll('a[href$=".html"], a[href*=".html#"]').forEach(a => {
    const u = new URL(a.href, location.href);
    if (u.origin !== location.origin) return;
    if (hex) u.searchParams.set('hex', hex); if (q.get('bg')) u.searchParams.set('bg', q.get('bg')); if (q.get('me')) u.searchParams.set('me', q.get('me'));
    a.href = u.pathname + u.search + u.hash;
  });

  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  // home: hover or focus a menu item, the drawing points at it
  const h5 = document.querySelector('.h5');
  if (h5) {
    const hole = h5.querySelector('.spot-hole');
    const SPOT = { work: [130, 120, 545, 400], research: [420, 1020, 330, 200], about: [610, 560, 560, 720], contact: [1620, 1060, 260, 190] };
    const set = o => {
      if (o) h5.dataset.on = o; else delete h5.dataset.on;
      if (hole && SPOT[o]) ['x', 'y', 'width', 'height'].forEach((k, i) => hole.setAttribute(k, SPOT[o][i]));
    };
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
        if (!el.hasAttribute('pathLength')) { el.setAttribute('pathLength', '1'); el.dataset.pl = ''; }
        el.classList.add('dw');
        el.style.setProperty('--d', `${t0 + Math.min(i, 8) * 28}ms`);
      });
    });
    const done = () => {
      html.classList.remove('intro');
      h1.textContent = text; h1.removeAttribute('aria-label');
      art.querySelectorAll('.dw').forEach(el => {
        el.classList.remove('dw'); el.style.removeProperty('--d');
        if ('pl' in el.dataset) { el.removeAttribute('pathLength'); delete el.dataset.pl; }
      });
    };
    const t = setTimeout(done, 2700);
    const skip = () => { clearTimeout(t); done(); };
    addEventListener('pointerdown', skip, { once: true });
    addEventListener('keydown', skip, { once: true });
  }

  // R72c the menu ties a thread to the thing it names in the drawing (a nod to the project map)
  const str = document.querySelector('.h5-str');
  const TO = { work: [50, 123], research: [58, 400], about: [218, 340], contact: [592, 404] };
  if (h5 && str && art) {
    const path = str.querySelector('path'), pin = str.querySelector('circle');
    let shown = null;
    const tie = a => {
      const o = a.dataset.o; if (!TO[o] || (!fine.matches && !q.get('demo')) || innerWidth < 861) return;
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

  // R72g she talks: a menu item makes her say a line in a bubble beside her; she greets the visitor once
  const bubble = art && art.querySelector('.bubble');
  const say = (() => {
    if (!bubble) return () => {};
    const bb = bubble.querySelector('.bb'), bt = bubble.querySelector('.bt');
    let hideT = 0;
    return (text, ms) => {
      clearTimeout(hideT);
      if (!text) { hideT = setTimeout(() => bubble.classList.remove('on'), 140); return; }
      bt.textContent = text;
      const D = bubble.dataset, x1 = +(D.x1 || 212), y0 = +(D.y0 || 262), y1 = +(D.y1 || 296), pad = (y1 - y0) * .45;
      const w = bt.getComputedTextLength(), x0 = x1 - w - pad * 2;
      bt.setAttribute('x', x0 + pad); bt.setAttribute('y', +(D.ty || 284));
      const r = (y1 - y0) * .36, t = (y1 - y0) / 34;
      bb.setAttribute('d', `M${x0 + r} ${y0}H${x1 - r}Q${x1} ${y0} ${x1} ${y0 + r}V${y1 - r}Q${x1} ${y1} ${x1 - r} ${y1}H${x1 - 22 * t}L${x1 + 8 * t} ${y1 + 18 * t}L${x1 - 38 * t} ${y1}H${x0 + r}Q${x0} ${y1} ${x0} ${y1 - r}V${y0 + r}Q${x0} ${y0} ${x0 + r} ${y0}Z`);
      bubble.classList.add('on');
      if (ms) hideT = setTimeout(() => bubble.classList.remove('on'), ms);
    };
  })();
  if (h5 && bubble) {
    h5.querySelectorAll('.h5-menu a[data-say]').forEach(a => {
      const on = () => say(a.dataset.say), off = () => say(null);
      a.addEventListener('pointerenter', on); a.addEventListener('focus', on);
      a.addEventListener('pointerleave', off); a.addEventListener('blur', off);
    });
    const greet = () => { if (!h5.dataset.on) say('Hi there!', 2800); };
    // screenshots only: ?demo=work shows that hover state without a mouse
    const demo = h5.querySelector(`.h5-menu a[data-o="${q.get('demo')}"]`);
    if (demo) setTimeout(() => demo.dispatchEvent(new PointerEvent('pointerenter')), 400);
    if (demo && q.get('fly')) setTimeout(() => demo.click(), 1300);
    setTimeout(greet, html.classList.contains('intro') ? 2300 : 700);
  }

  // R72d she looks at the pointer (eyes follow, head leans a little) and blinks now and then
  const head = art && art.querySelector('.o-about .head');
  const eyes = art && art.querySelector('.o-about .eyes');
  if (head && !reduce) {
    let raf = 0;
    addEventListener('pointermove', ev => {
      if (ev.pointerType !== 'mouse' || raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        const hb = head.getBoundingClientRect();
        const dx = Math.max(-1, Math.min(1, (ev.clientX - (hb.left + hb.width / 2)) / (innerWidth / 2)));
        const dy = Math.max(-1, Math.min(1, (ev.clientY - (hb.top + hb.height / 2)) / (innerHeight / 2)));
        art.style.setProperty('--look', `${dx * 3}deg`);
        art.style.setProperty('--ex', `${dx * 2.4}px`);
        art.style.setProperty('--ey', `${dy * 1.8}px`);
      });
    }, { passive: true });
    const blink = () => {
      if (!document.hidden) { eyes.classList.add('blink'); setTimeout(() => eyes.classList.remove('blink'), 140); }
      setTimeout(blink, 3200 + Math.random() * 3600);
    };
    setTimeout(blink, 2900);
  }

  // R72i click: fly the camera into the thing, then open its page
  if (h5 && !reduce) {
    h5.querySelectorAll('.h5-menu a[data-o]').forEach(a => a.addEventListener('click', ev => {
      if (ev.button !== 0 || ev.metaKey || ev.ctrlKey || ev.shiftKey || ev.altKey) return;
      ev.preventDefault();
      h5.dataset.on = a.dataset.o;
      // bring the thing to the middle of the screen while the camera closes in on it
      const P = (art.classList.contains('scene') ? { work: [400, 325], research: [575, 1130], about: [880, 820], contact: [1740, 1150] } : { work: [135, 123], research: [125, 392], about: [300, 318], contact: [627, 418] })[a.dataset.o];
      if (P) {
        const pt = art.createSVGPoint(); [pt.x, pt.y] = P;
        const e = pt.matrixTransform(art.getScreenCTM());
        const vb = art.viewBox.baseVal; h5.style.setProperty('--fx', `${(P[0] - vb.x) / vb.width * 100}%`); h5.style.setProperty('--fy', `${(P[1] - vb.y) / vb.height * 100}%`);
        h5.style.setProperty('--tx', `${innerWidth / 2 - e.x}px`); h5.style.setProperty('--ty', `${innerHeight / 2 - e.y}px`);
      }
      h5.classList.add('flying');
      if (!q.get('fly')) setTimeout(() => { location.href = a.href; }, 640);  // ?fly=1: screenshots of the move only
    }));
    addEventListener('pageshow', e => { if (e.persisted) { h5.classList.remove('flying'); delete h5.dataset.on; ['--fx', '--fy', '--tx', '--ty'].forEach(v => h5.style.removeProperty(v)); } });
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

/* R73f — the career thread on the About page: pick a stop, the line inks down to it, its story opens beside it
   (on a phone, right under it). A tablist: arrow keys move between stops. */
(() => {
  const list = document.querySelector('.thread');
  if (!list) return;
  const tabs = [...list.querySelectorAll('[role="tab"]')];
  const box = document.querySelector('.jn-panels');
  const narrow = matchMedia('(max-width: 760px)');
  const pick = (i, focus) => {
    tabs.forEach((t, j) => {
      const on = i === j, panel = document.getElementById(t.getAttribute('aria-controls'));
      t.setAttribute('aria-selected', on); t.tabIndex = on ? 0 : -1;
      panel.hidden = !on;
      if (on) {
        panel.classList.remove('in'); void panel.offsetWidth; panel.classList.add('in');
        if (narrow.matches) t.parentElement.appendChild(panel); else if (panel.parentElement !== box) box.appendChild(panel);
      }
    });
    const t = tabs[i], lr = list.getBoundingClientRect(), tr = t.getBoundingClientRect();
    list.style.setProperty('--p', `${tr.top + tr.height / 2 - lr.top - 14}px`);
    if (!narrow.matches) {
      const room = Math.max(0, lr.height - box.offsetHeight);
      box.style.setProperty('--y', `${Math.min(room, Math.max(0, tr.top - lr.top - 24))}px`);
    } else box.style.setProperty('--y', '0px');
    if (focus) t.focus();
  };
  tabs.forEach((t, i) => {
    t.addEventListener('click', () => pick(i));
    t.addEventListener('keydown', e => {
      const k = { ArrowDown: 1, ArrowRight: 1, ArrowUp: -1, ArrowLeft: -1 }[e.key];
      if (k) { e.preventDefault(); pick((i + k + tabs.length) % tabs.length, true); }
      if (e.key === 'Home') { e.preventDefault(); pick(0, true); }
      if (e.key === 'End') { e.preventDefault(); pick(tabs.length - 1, true); }
    });
  });
  const cur = () => tabs.findIndex(t => t.getAttribute('aria-selected') === 'true');
  narrow.addEventListener('change', () => pick(cur()));
  addEventListener('resize', () => pick(cur()));
  pick(0);
  // screenshots only: ?stop=gh opens that stop
  const s = new URLSearchParams(location.search).get('stop');
  if (s) { const i = tabs.findIndex(t => t.id === 'jt-' + s); if (i >= 0) setTimeout(() => pick(i), 300); }
})();
