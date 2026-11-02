/* Home hero (R46, the approved R45 colour A+B): now and then, when she blinks, one coloured mote lifts off near her face and fades (1.8s).
   assets/eyes.js sends a "blink" event on .fx. Not before 12s (story, pollen and aurora have all settled), then never closer
   than 30s apart, and only half the blinks after that qualify: with a blink every ~5s that is about one mote per ~40s.
   eyes.js never blinks with reduced motion, so neither does this; it also only blinks while the hero is on screen. */
(function () {
"use strict";
const fx = document.querySelector(".fx"), layer = fx && fx.querySelector(".motes");
if (!layer || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
const NS = "http://www.w3.org/2000/svg", t0 = performance.now();
let last = t0 - 18000, n = 0;                       // first mote allowed from 12s
fx.addEventListener("blink", () => {
  const now = performance.now();
  if (now - last < 30000 || Math.random() > .5) return;
  last = now;
  const c = document.createElementNS(NS, "circle");
  c.setAttribute("cx", (99 + Math.random() * 6).toFixed(1));        // just above and in front of her face
  c.setAttribute("cy", (95 + Math.random() * 5).toFixed(1));
  c.setAttribute("r", "2.6");
  c.setAttribute("fill", `url(#pn-${n++ % 5})`);
  layer.append(c);
  c.animate([{ opacity: 0, transform: "none" }, { opacity: .95, offset: .25 },
             { opacity: 0, transform: `translate(${(2 + Math.random() * 4).toFixed(1)}px, -11px)` }],
            { duration: 1800, easing: "cubic-bezier(.2, .6, .35, 1)", fill: "forwards" }).onfinish = () => c.remove();
});
})();
