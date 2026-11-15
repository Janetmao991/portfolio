// R68 inner pages: the title looks itself up, callout lines draw in, a "connected to" map, a next card that peeks,
// and YouTube films that load only when played. Everything works without it; with reduced motion nothing travels.
(() => {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const slug = (location.pathname.split('/').pop() || '').replace('.html', '');
  const A = '../assets/';
  const P = {
    'lexiai': ['LexiAI', 'lexiai/lexiai-senses.webp'],
    'lexispeak': ['LexiSpeak', 'lexispeak/lexispeak-said.webp'],
    'writing-station': ['Writing Station', 'writing-station/writing-station-editor.webp'],
    'podcast-dig': ['podcast-dig', 'podcast-dig/pd-library.webp'],
    'startup-research': ['Startup Research', 'screens/startup-twopager-p1.webp'],
    'ai-terms': ['AI Term Explainer', 'ai-terms/at-final.webp'],
    'vault': ['Obsidian vault', null],
  };
  const once = (el, fn, th = .25) => {
    if (reduce || !('IntersectionObserver' in window)) { fn(); return; }
    const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { fn(); io.disconnect(); } }), { threshold: th });
    io.observe(el);
  };

  // 1. title types itself, then opens a definition card
  const top = document.querySelector('.lx-top');
  if (top && P[slug]) {
    const h1 = top.querySelector('h1'), p = top.querySelector('p');
    const word = h1.textContent.trim();
    const card = document.createElement('div'); card.className = 'in-def in'; card.setAttribute('aria-hidden', 'true');
    card.innerHTML = `<b>${word}</b><i>noun · a tool I built and use every day</i>${p ? p.textContent : ''}`;
    top.appendChild(card); top.classList.add('in-ready');
    if (reduce) { card.classList.add('on'); }
    else {
      h1.setAttribute('aria-label', word); h1.textContent = ''; const caret = document.createElement('span'); caret.className = 'in-caret'; caret.setAttribute('aria-hidden', 'true');
      const txt = document.createElement('span'); txt.setAttribute('aria-hidden', 'true'); h1.append(txt, caret);
      let i = 0; setTimeout(function tick() { txt.textContent = word.slice(0, ++i); if (i < word.length) setTimeout(tick, 70 + Math.random() * 60); else setTimeout(() => { caret.remove(); card.classList.add('on'); }, 350); }, 300);
    }
  }

  // 2. callouts: a hand-drawn line from each note's number to the same number on the screenshot
  document.querySelectorAll('.lx-shot').forEach(fig => {
    const rings = [...fig.querySelectorAll('.lx-ring .lx-dot')], notes = [...fig.querySelectorAll('.lx-note .lx-dot')];
    if (!rings.length || !notes.length) return;
    fig.style.position = 'relative';
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg'); svg.classList.add('in-lines'); svg.setAttribute('aria-hidden', 'true'); fig.appendChild(svg);
    const pairs = notes.map(n => [n, rings.find(r => r.textContent.trim() === n.textContent.trim())]).filter(x => x[1]);
    const draw = () => {
      const f = fig.getBoundingClientRect(); svg.setAttribute('viewBox', `0 0 ${f.width} ${f.height}`); svg.innerHTML = '';
      pairs.forEach(([n, r], k) => {
        const a = n.getBoundingClientRect(), b = (r.closest('.lx-ring') || r).getBoundingClientRect();
        const x1 = a.left - f.left - 4, y1 = a.top + a.height / 2 - f.top;
        const right = a.left > b.right; // note sits to the right of the screenshot: stop at the box's right edge
        const x2 = (right ? b.right + 3 : b.left + b.width / 2) - f.left;
        const y2 = right ? Math.max(b.top + 12, Math.min(y1, b.bottom - 12)) - f.top : b.top - f.top - 3;
        if (Math.hypot(x2 - x1, y2 - y1) < 14) return;
        const mx = (x1 + x2) / 2;
        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        path.setAttribute('d', right ? `M${x1} ${y1} C${mx} ${y1}, ${mx} ${y2}, ${x2} ${y2}` : `M${x1} ${y1} C${x1} ${(y1 + y2) / 2}, ${x2} ${(y1 + y2) / 2}, ${x2} ${y2}`);
        path.style.setProperty('--k', k); svg.appendChild(path);
        const L = path.getTotalLength(); path.style.strokeDasharray = `${L}`; path.style.strokeDashoffset = fig.classList.contains('in-drawn') ? 0 : L;
      });
    };
    draw(); addEventListener('resize', draw);
    fig.querySelectorAll('img').forEach(i => i.complete || i.addEventListener('load', draw, { once: true }));
    once(fig, () => { fig.classList.add('in-drawn'); svg.querySelectorAll('path').forEach(p => { p.style.strokeDashoffset = 0; }); }, .4);
  });

  const next = document.querySelector('.plate.next');

  // 4. next card: the next project's screen peeks up on hover
  if (next) {
    const ns = (next.getAttribute('href') || '').replace('.html', '');
    if (P[ns] && P[ns][1]) { const im = document.createElement('img'); im.className = 'in-peek'; im.alt = ''; im.loading = 'lazy'; im.src = A + P[ns][1]; next.appendChild(im); next.classList.add('has-peek'); }
  }

  // 5. films: a cover first, the YouTube player only after a click
  document.querySelectorAll('.yt-embed').forEach(box => {
    const f = box.querySelector('iframe'); if (!f) return;
    const id = (f.src.match(/embed\/([\w-]+)/) || [])[1]; if (!id) return;
    const b = document.createElement('button'); b.type = 'button'; b.className = 'in-cover'; b.setAttribute('aria-label', 'Play: ' + (f.title || 'film'));
    b.innerHTML = `<img src="https://i.ytimg.com/vi/${id}/maxresdefault.jpg" alt="" loading="lazy" onerror="this.src='https://i.ytimg.com/vi/${id}/hqdefault.jpg'"><span class="dl-play" aria-hidden="true">▶</span>`;
    const src = f.src; f.remove(); box.appendChild(b);
    b.addEventListener('click', () => { const nf = document.createElement('iframe'); nf.src = src + (src.includes('?') ? '&' : '?') + 'autoplay=1'; nf.title = f.title; nf.allow = f.allow + '; autoplay'; nf.allowFullscreen = true; b.replaceWith(nf); nf.focus(); });
  });
})();
