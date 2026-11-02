/* R44 colour B: now and then, when she blinks, one coloured mote lifts off near her head and fades (1.8s).
   a.js sends a "blink" event on .fx; here roughly two blinks in five make a mote, never closer than 7s apart, and only
   after the story is over (she is in her final, reading pose). a.js never blinks with reduced motion, so neither does
   this; it also only blinks while the hero is on screen. */
(function () {
"use strict";
const fx = document.querySelector(".fx"), layer = fx && fx.querySelector(".motes");
if (!layer || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
const COLORS = ["#f0cf7a", "#f2b49b", "#c4b0e6", "#9fd4b8", "#aec8ec"], NS = "http://www.w3.org/2000/svg";
const t0 = performance.now();
let last = -1e9, n = 0;
fx.addEventListener("blink", () => {
  const now = performance.now();
  if (now - t0 < 7000 || now - last < 7000 || Math.random() > .4) return;
  last = now;
  const c = document.createElementNS(NS, "circle");
  c.setAttribute("cx", (99 + Math.random() * 6).toFixed(1));        // just above and in front of her face
  c.setAttribute("cy", (95 + Math.random() * 5).toFixed(1));
  c.setAttribute("r", "2.6");
  c.setAttribute("fill", `url(#pn-${n++ % COLORS.length})`);
  layer.append(c);
  c.animate([{ opacity: 0, transform: "none" }, { opacity: .95, offset: .25 },
             { opacity: 0, transform: `translate(${(2 + Math.random() * 4).toFixed(1)}px, -11px)` }],
            { duration: 1800, easing: "cubic-bezier(.2, .6, .35, 1)", fill: "forwards" }).onfinish = () => c.remove();
});
})();
