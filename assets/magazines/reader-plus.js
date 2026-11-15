// R68 magazine reader extras (only in ?reader mode): pages turn like paper, and a "Pages" strip of thumbnails.
(function () {
  if (!document.body.classList.contains('reader')) return;
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var rv = document.getElementById('rview'), nav = document.getElementById('rnav');
  var pages = [].slice.call(document.querySelectorAll('section.page'));
  if (!rv || !nav || !pages.length) return;
  rv.style.perspective = '2600px';
  var last = pages.findIndex(function (p) { return p.classList.contains('on'); });
  pages.forEach(function (p, i) {
    new MutationObserver(function () {
      if (!p.classList.contains('on') || i === last) return;
      var dir = i > last ? 1 : -1; last = i; mark();
      if (reduce || document.body.classList.contains('zw') || document.body.classList.contains('z1')) return;
      p.animate([{ rotate: 'y ' + (dir * -14) + 'deg', translate: (dir * 60) + 'px 0', opacity: 0, filter: 'brightness(.92)' },
                 { rotate: 'y 0deg', translate: '0 0', opacity: 1, filter: 'brightness(1)' }],
                { duration: 520, easing: 'cubic-bezier(.16,1,.3,1)' });
    }).observe(p, { attributes: true, attributeFilter: ['class'] });
  });
  // thumbnails
  var css = document.createElement('style');
  css.textContent = '#rthumbs{position:fixed;left:0;right:0;bottom:var(--navh,56px);z-index:5;display:flex;gap:10px;overflow-x:auto;padding:12px 14px;background:rgba(30,30,30,.94);transform:translateY(110%);transition:transform .4s cubic-bezier(.16,1,.3,1)}' +
    '#rthumbs.on{transform:none}#rthumbs a{flex:none;width:76px;height:101px;position:relative;overflow:hidden;border-radius:3px;outline:2px solid transparent;outline-offset:2px;transition:outline-color .2s,transform .2s;background:#fff}' +
    '#rthumbs a:hover{transform:translateY(-3px)}#rthumbs a.cur{outline-color:#F6D84A}#rthumbs .tp{position:absolute;left:0;top:0;width:1080px;height:1440px;transform:scale(.0704);transform-origin:0 0;pointer-events:none;display:block!important}' +
    '#rthumbs b{position:absolute;right:3px;bottom:3px;background:rgba(0,0,0,.7);color:#fff;font:600 10px system-ui;padding:1px 4px;border-radius:2px}';
  document.head.appendChild(css);
  var strip = document.createElement('div'); strip.id = 'rthumbs'; strip.setAttribute('aria-label', 'All pages');
  pages.forEach(function (p, i) {
    var a = document.createElement('a'); a.href = '#p' + (i + 1); a.setAttribute('aria-label', 'Page ' + (i + 1));
    var c = p.cloneNode(true); c.removeAttribute('id'); c.classList.remove('on'); c.classList.add('tp'); c.setAttribute('aria-hidden', 'true'); c.style.transform = 'scale(.0704)'; c.style.position = 'absolute'; c.style.left = '0'; c.style.top = '0'; c.style.margin = '0';
    c.querySelectorAll('[id]').forEach(function (e) { if (e.tagName !== 'linearGradient' && e.tagName !== 'radialGradient' && e.tagName !== 'filter' && e.tagName !== 'clipPath') e.removeAttribute('id'); });
    a.appendChild(c); var n = document.createElement('b'); n.textContent = i + 1; a.appendChild(n);
    a.addEventListener('click', function () { strip.classList.remove('on'); btn.setAttribute('aria-expanded', 'false'); });
    strip.appendChild(a);
  });
  document.body.appendChild(strip);
  var btn = document.createElement('button'); btn.type = 'button'; btn.textContent = 'Pages'; btn.setAttribute('aria-expanded', 'false');
  btn.onclick = function () { var on = strip.classList.toggle('on'); btn.setAttribute('aria-expanded', on); if (on) strip.querySelector('.cur') && strip.querySelector('.cur').scrollIntoView({ inline: 'center', block: 'nearest' }); };
  nav.appendChild(btn);
  function mark() { [].forEach.call(strip.children, function (a, i) { a.classList.toggle('cur', i === last); }); }
  mark();
})();
