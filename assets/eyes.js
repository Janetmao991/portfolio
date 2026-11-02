/* Home hero eyes (R46, the approved R42 option A): the girl's eye follows you.
   Mouse: the eye turns toward the cursor anywhere on the page (ease is the .14s transition in style.css, R46). The pull grows
   with distance and levels off, so it never leaves the face; vertical travel is .85 of horizontal.
   Touch / no cursor: she looks at the last tap for 4s, then idles. Idle = reading the book, with a slow glance up at
   whichever word is falling now every 4-8s. Blinks every 3-6s (sometimes twice). All of it stops off screen or in a
   hidden tab; with reduced motion there are no blinks or glances, only the look toward the cursor or tap.
   Each blink sends a "blink" event on .fx (assets/pollen.js listens). Breathing is CSS (style.css, R46). */
(function () {
"use strict";
const fx = document.querySelector(".fx"), svg = fx && fx.querySelector(".fx-story");
if (!svg) return;
const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
const H = 1.8, V = H * .85, NEAR = 60;            // max travel (drawing units) · distance at which the pull is half way
const BOOK = [160, 140];                          // where she reads, in drawing units
const eyes = [...svg.querySelectorAll(".eye")].map(el => ({
  el, look: el.querySelector(".look"), lid: el.querySelector(".lid"), cx: +el.dataset.cx, cy: +el.dataset.cy }));

// the point (client px) to look at; null = rest on the book
let target = null, mode = "idle", tapTimer = 0, glanceTimer = 0, offscreen = false;
const visible = () => !offscreen && !document.hidden;

function toClient(x, y) {                         // drawing units -> client px
  const m = svg.getScreenCTM(), p = new DOMPoint(x, y).matrixTransform(m);
  return [p.x, p.y];
}
function aim(pt) {
  const [x, y] = pt || toClient(...BOOK);
  for (const e of eyes) {
    const m = e.el.getScreenCTM();               // the socket's frame: the head's tilt and scale are in it
    if (!m) continue;
    const p = new DOMPoint(x, y).matrixTransform(m.inverse());
    const dx = p.x - e.cx, dy = p.y - e.cy, d = Math.hypot(dx, dy) || 1, k = d / (d + NEAR);
    e.look.style.transform = `translate(${(dx / d * k * H).toFixed(2)}px, ${(dy / d * k * V).toFixed(2)}px)`;
  }
}

// idle: mostly the book; now and then a look up at a word that is showing
function idle() {
  mode = "idle"; target = null; aim(null);
  clearTimeout(glanceTimer);
  if (reduce) return;
  glanceTimer = setTimeout(function glance() {
    if (mode !== "idle") return;
    const words = [...svg.querySelectorAll(".lf text")].filter(t => +getComputedStyle(t).opacity > .6);
    if (visible() && words.length) {
      const r = words[Math.floor(Math.random() * words.length)].getBoundingClientRect();
      aim([r.left + r.width / 2, r.top + r.height / 2]);
      glanceTimer = setTimeout(() => { if (mode === "idle") { aim(null); glanceTimer = setTimeout(glance, 4000 + Math.random() * 4000); } },
        1400 + Math.random() * 800);
    } else glanceTimer = setTimeout(glance, 4000 + Math.random() * 4000);
  }, 3000 + Math.random() * 3000);
}

let frame = 0;
const follow = () => { if (!frame) frame = requestAnimationFrame(() => { frame = 0; if (mode !== "idle") aim(target); }); };
addEventListener("pointermove", e => {
  if (e.pointerType !== "mouse") return;
  mode = "mouse"; target = [e.clientX, e.clientY]; clearTimeout(glanceTimer); follow();
}, { passive: true });
document.documentElement.addEventListener("pointerleave", e => { if (e.pointerType === "mouse") idle(); });
addEventListener("pointerdown", e => {
  if (e.pointerType === "mouse") return;
  mode = "tap"; target = [e.clientX, e.clientY]; clearTimeout(glanceTimer); aim(target);
  clearTimeout(tapTimer); tapTimer = setTimeout(idle, 4000);
}, { passive: true });
addEventListener("scroll", () => mode === "idle" ? aim(null) : follow(), { passive: true });  // the page moved under a still cursor
addEventListener("resize", () => aim(target), { passive: true });

// blinks: close fast, open a little slower; one in seven is a double blink
function blink() {
  setTimeout(() => {
    if (visible()) {
      const close = n => eyes.forEach(e => e.lid.animate(
        [{ transform: "scaleY(1)" }, { transform: "scaleY(.08)", offset: .4 }, { transform: "scaleY(1)" }],
        { duration: 170, delay: n * 230, easing: "ease-in-out" }));
      close(0); if (Math.random() < 1 / 7) close(1);
      fx.dispatchEvent(new CustomEvent("blink"));
    }
    blink();
  }, 3000 + Math.random() * 3000);
}

const sync = () => { if (!visible()) clearTimeout(glanceTimer); else if (mode === "idle") idle(); };
if ("IntersectionObserver" in window) new IntersectionObserver(([e]) => { offscreen = !e.isIntersecting; sync(); }).observe(fx);
document.addEventListener("visibilitychange", sync);

idle();
if (!reduce) blink();
})();
