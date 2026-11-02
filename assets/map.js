// Home "Things I've built" map (R32): hover/focus a project to light up its links and show its note.
// R33 motion: when the map scrolls into view the nodes pop in cluster by cluster and the edges draw (style.css,
// .drawn); once settled, small dots flow along every edge in its arrow direction (.live) and the nodes float.
// Hovering a node speeds up its own dots. Off screen everything pauses. Without JS or with reduced motion the map is
// simply there, already drawn and still.
(() => {
  const fit = document.querySelector('.fit');
  if (!fit) return;
  const note = document.getElementById('fit-note');
  const notes = JSON.parse(document.getElementById('fit-notes').textContent);
  const rest = note.dataset.rest;
  const parts = [...fit.querySelectorAll('[data-a]')];
  const nodes = [...fit.querySelectorAll('.nd, .vp')];
  const glow = fit.querySelector('.bg-glow');
  const bridge = fit.querySelector('.w.br');
  let flows = [];  // [{ g, a, b, anims }], filled once the map has settled
  const show = n => {
    const id = n.dataset.id, near = new Set([id]);
    fit.classList.add('is-f');
    parts.forEach(p => {
      const on = p.dataset.a === id || p.dataset.b === id;
      p.classList.toggle('on', on);
      if (on) near.add(p.dataset.a).add(p.dataset.b);
    });
    nodes.forEach(m => m.classList.toggle('on', near.has(m.dataset.id)));
    glow?.classList.toggle('on', bridge?.classList.contains('on'));
    flows.forEach(f => {
      const on = f.a === id || f.b === id;
      f.g.classList.toggle('on', on);
      f.anims.forEach(a => a.updatePlaybackRate(on ? 2.6 : 1));
    });
    note.replaceChildren(Object.assign(document.createElement('b'), { textContent: n.querySelector('b').firstChild.textContent }), notes[id]);
  };
  const clear = () => {
    fit.classList.remove('is-f');
    note.textContent = rest;
    flows.forEach(f => f.anims.forEach(a => a.updatePlaybackRate(1)));
  };
  fit.querySelectorAll('.nd').forEach(n => {
    n.addEventListener('mouseenter', () => show(n));
    n.addEventListener('focus', () => show(n));
    n.addEventListener('mouseleave', clear);
    n.addEventListener('blur', clear);
  });
  if (matchMedia('(prefers-reduced-motion: reduce)').matches || !('IntersectionObserver' in window)) return;
  document.documentElement.classList.add('js');

  // Dots: each edge gets a <g class="fl"> with a few circles; each circle moves along the path with a Web Animation
  // of transform keyframes sampled from the path (so the browser only animates transform + opacity). Slow, constant
  // speed; the bridge carries a dot each way, as its arrows do.
  const SPEED = 46, STEPS = 28;  // drawing units per second; keyframes per trip
  const NS = 'http://www.w3.org/2000/svg';
  const trip = (path, reverse) => {
    const L = path.getTotalLength(), fr = [];
    for (let k = 0; k <= STEPS; k++) {
      const t = k / STEPS, pt = path.getPointAtLength((reverse ? 1 - t : t) * L);
      fr.push({ offset: t, transform: `translate(${pt.x.toFixed(1)}px, ${pt.y.toFixed(1)}px)`, opacity: t < .1 ? t / .1 : t > .86 ? (1 - t) / .14 : 1 });
    }
    return { fr, ms: L / SPEED * 1000 };
  };
  const build = () => {
    const layer = fit.querySelector('.flows');
    flows = [...fit.querySelectorAll('.w')].map(path => {
      const kind = path.classList.contains('br') ? 'br' : path.classList.contains('hub') ? 'hub' : '';
      const g = document.createElementNS(NS, 'g');
      g.setAttribute('class', `fl ${kind}`.trim());
      layer.append(g);
      // [reverse?, phase] per dot: two dots along a normal edge, one each way on the bridge, one into the vault
      const dots = kind === 'br' ? [[false, 0], [true, .5]] : kind === 'hub' ? [[false, .3]] : [[false, 0], [false, .5]];
      const anims = dots.map(([rev, phase]) => {
        const c = document.createElementNS(NS, 'circle');
        c.setAttribute('r', kind === 'hub' ? 2 : 2.6);
        c.style.opacity = 0;
        g.append(c);
        const { fr, ms } = trip(path, rev);
        const a = c.animate(fr, { duration: ms, iterations: Infinity, easing: 'linear' });
        a.currentTime = phase * ms;
        return a;
      });
      return { g, a: path.dataset.a, b: path.dataset.b, anims };
    });
    if (fit.classList.contains('paused')) flows.forEach(f => f.anims.forEach(a => a.pause()));
    requestAnimationFrame(() => fit.classList.add('live'));
  };

  let started = false;
  const io = new IntersectionObserver(es => {
    const e = es[es.length - 1], vis = e.isIntersecting;
    fit.classList.toggle('paused', !vis);
    flows.forEach(f => f.anims.forEach(a => vis ? a.play() : a.pause()));
    if (started || e.intersectionRatio < .3) return;
    started = true;
    requestAnimationFrame(() => fit.classList.add('drawn'));
    setTimeout(() => { fit.classList.add('settled'); build(); }, 3000);
  }, { threshold: [0, .3] });
  io.observe(fit);
})();
