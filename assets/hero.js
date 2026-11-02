/* Home hero (revision 27): a forest grows out of a book. All story timing lives in style.css under .fx.tell; the
   story plays once (~6.5s), then the forest stays alive. This file starts it, gives each falling leaf its next word
   every time it falls again, adds a small mouse parallax on desktop (--mx/--my, -1..1) and pauses everything
   off-screen or in a hidden tab. With prefers-reduced-motion nothing runs: the final frame stays still. */
(function () {
"use strict";
const fx = document.querySelector(".fx");
if (!fx || matchMedia("(prefers-reduced-motion: reduce)").matches) return;

// each leaf becomes a word; when its 6s fall starts over, the word changes (it is invisible at that moment)
fx.addEventListener("animationiteration", e => {
  if (e.animationName !== "lf-word") return;
  const t = e.target, words = t.dataset.w.split("|");
  t.dataset.i = ((+t.dataset.i || 0) + 1) % words.length;
  t.textContent = words[t.dataset.i];
});

let offscreen = false;
const sync = () => fx.classList.toggle("paused", offscreen || document.hidden);
document.addEventListener("visibilitychange", sync);
if ("IntersectionObserver" in window) {
  new IntersectionObserver(([e]) => { offscreen = !e.isIntersecting; sync(); }).observe(fx);
}

// parallax: desktop with a real mouse only; the layers ease toward the pointer in CSS (transition on transform)
if (matchMedia("(hover: hover) and (pointer: fine) and (min-width: 960px)").matches) {
  let frame = 0, x = 0, y = 0;
  addEventListener("pointermove", e => {
    x = e.clientX; y = e.clientY;
    if (frame || offscreen) return;
    frame = requestAnimationFrame(() => {
      frame = 0;
      const r = fx.getBoundingClientRect(), clamp = v => Math.max(-1, Math.min(1, v));
      fx.style.setProperty("--mx", clamp((x - r.left - r.width / 2) / (r.width * .9)).toFixed(3));
      fx.style.setProperty("--my", clamp((y - r.top - r.height / 2) / (r.height * .9)).toFixed(3));
    });
  }, { passive: true });
}

sync();
fx.classList.add("tell");
})();
