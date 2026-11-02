/* R42 option B: hold a falling word to read what it means.
   Desktop: hovering a leaf or its word pauses it and shows a one-line definition; it lets go when the pointer leaves
   (the card itself counts as inside). Click pins it; click again or anywhere else to let go.
   Touch: tap a leaf or word to pin it; tap anywhere else to let go.
   Keyboard: Tab reaches each leaf (role=button); focus holds it and shows the line, Escape lets go.
   Targets move, so instead of hit areas this measures what is showing of each leaf (the leaf while it falls, the word
   once it has turned) and pads it to at least 36px (44px for touch). Only one is held at a time. */
(function () {
"use strict";
const DEFS = __DEFS__;
const fx = document.querySelector(".fx"), svg = fx && fx.querySelector(".fx-story"), forest = fx && fx.querySelector(".forest");
const box = fx && fx.closest(".hero-v"), plate = fx && fx.closest(".hero");
const card = box && box.querySelector(".def"), ring = box && box.querySelector(".def-ring");
if (!svg || !card) return;
const leaves = [...svg.querySelectorAll(".lf")];
const word = lf => lf.querySelector("text").textContent;
const hover = matchMedia("(hover: hover) and (pointer: fine)").matches;

// what of this leaf is showing right now: the word once it has turned, else the falling leaf, else nothing
function shape(lf) {
  const t = lf.querySelector("text"), l = lf.querySelector(".lf-l");
  if (+getComputedStyle(t).opacity > .35) return t;
  if (+getComputedStyle(l).opacity > .35) return l;
  return null;
}
function hit(x, y, pad) {
  let best = null, bestD = Infinity;
  for (const lf of leaves) {
    const s = shape(lf); if (!s) continue;
    const r = s.getBoundingClientRect(), cx = r.left + r.width / 2, cy = r.top + r.height / 2;
    const w = Math.max(r.width + 8, pad) / 2, h = Math.max(r.height + 8, pad) / 2;
    if (Math.abs(x - cx) <= w && Math.abs(y - cy) <= h) {
      const d = Math.hypot(x - cx, y - cy);
      if (d < bestD) { best = lf; bestD = d; }
    }
  }
  return best;
}

let held = null, pinned = false, leaveTimer = 0, snoozed = null;

// the card goes above the leaf, or below it if the plate's top edge is too close; it never leaves the plate
function place() {
  if (!held) return;
  const s = shape(held) || held.querySelector("text"), r = s.getBoundingClientRect();
  const b = box.getBoundingClientRect(), p = plate.getBoundingClientRect(), gap = 10, m = 8;
  const cw = card.offsetWidth, ch = card.offsetHeight;
  let left = r.left + r.width / 2 - cw / 2;
  left = Math.max(p.left + m, Math.min(left, p.right - m - cw));
  let top = r.top - gap - ch;
  if (top < p.top + m) top = r.bottom + gap;
  card.style.left = (left - b.left) + "px"; card.style.top = (top - b.top) + "px";
  ring.style.left = (r.left - b.left - 4) + "px"; ring.style.top = (r.top - b.top - 3) + "px";
  ring.style.width = (r.width + 8) + "px"; ring.style.height = (r.height + 6) + "px";
}

function hold(lf, how) {
  clearTimeout(leaveTimer);
  if (held && held !== lf) release();
  if (held !== lf) {
    held = lf;
    // freeze the parallax under this layer so the leaf stays where the card points
    svg.style.setProperty("--mx", getComputedStyle(fx).getPropertyValue("--mx") || 0);
    svg.style.setProperty("--my", getComputedStyle(fx).getPropertyValue("--my") || 0);
    lf.classList.add("hold");
    const w = word(lf);
    card.querySelector(".def-t").textContent = w;
    card.querySelector(".def-d").textContent = DEFS[w] || "";
    lf.setAttribute("aria-describedby", "leaf-def");
    card.classList.add("on");
  }
  pinned = pinned || how === "pin";
  ring.classList.toggle("on", lf.matches(":focus-visible"));
  place();
}
function release() {
  if (!held) return;
  held.classList.remove("hold"); held.removeAttribute("aria-describedby");
  svg.style.removeProperty("--mx"); svg.style.removeProperty("--my");
  card.classList.remove("on"); ring.classList.remove("on");
  held = null; pinned = false;
}

// pointer
forest.addEventListener("pointermove", e => {
  if (e.pointerType !== "mouse") return;
  const lf = hit(e.clientX, e.clientY, 36);
  forest.classList.toggle("hot", !!lf);
  if (lf !== snoozed) snoozed = null;
  if (!hover || pinned) return;
  if (lf && lf !== snoozed) hold(lf, "hover");
  else if (held && !leaveTimer) leaveTimer = setTimeout(() => { leaveTimer = 0; if (!pinned && !card.matches(":hover")) release(); }, 160);
});
forest.addEventListener("pointerleave", () => {
  forest.classList.remove("hot");
  if (held && !pinned) leaveTimer = setTimeout(() => { leaveTimer = 0; if (!pinned && !card.matches(":hover")) release(); }, 160);
});
card.addEventListener("pointerleave", e => { if (e.pointerType === "mouse" && held && !pinned && !forest.matches(":hover")) release(); });
document.addEventListener("click", e => {
  if (card.contains(e.target)) return;
  const lf = forest.contains(e.target) ? hit(e.clientX, e.clientY, e.pointerType === "mouse" ? 36 : 44) : null;
  if (lf && !(lf === held && pinned)) hold(lf, "pin");
  else if (held) { snoozed = lf; release(); }       // a click that closes it shouldn't reopen it by hover
});

// keyboard
leaves.forEach(lf => {
  lf.addEventListener("focus", () => hold(lf, "focus"));
  lf.addEventListener("blur", () => { if (held === lf) release(); });
  lf.addEventListener("keydown", e => {
    if (e.key === "Escape" && held === lf) { release(); e.preventDefault(); }
    else if (e.key === "Enter" || e.key === " ") { held === lf ? release() : hold(lf, "pin"); e.preventDefault(); }
  });
});
document.addEventListener("keydown", e => { if (e.key === "Escape" && held) release(); });

// the word changes each time a leaf falls again (hero.js); keep the button's name in step
fx.addEventListener("animationiteration", e => {
  if (e.animationName === "lf-word") e.target.closest(".lf").setAttribute("aria-label", e.target.textContent);
});
addEventListener("scroll", place, { passive: true });
addEventListener("resize", place, { passive: true });
})();
