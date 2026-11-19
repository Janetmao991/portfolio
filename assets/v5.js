/* Portfolio v5 (R72). Home: the menu lights the matching part of the drawing; the laptop looks up words.
   Colour trials while Janet chooses: ?c=red or ?c=blue (green is the default). */
(() => {
  const html = document.documentElement;
  const c = new URLSearchParams(location.search).get('c');
  if (c === 'red' || c === 'blue') {
    html.dataset.palette = c;
    document.querySelectorAll('a[href$=".html"], a[href*=".html#"]').forEach(a => {
      const u = new URL(a.href, location.href);
      if (u.origin === location.origin) { u.searchParams.set('c', c); a.href = u.pathname + u.search + u.hash; }
    });
  }

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
