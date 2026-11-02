/* R38: the AI Terms slide rows. The track is a native scroll-snap row (so swiping just works on phones);
   this adds prev/next buttons, arrow keys, the "n / N" counter and full screen (click a slide, or the button; Esc leaves). */
document.querySelectorAll("[data-ss]").forEach((ss) => {
  const track = ss.querySelector(".ss-track");
  const slides = [...ss.querySelectorAll(".ss-s")];
  const prev = ss.querySelector("[data-ss-prev]"), next = ss.querySelector("[data-ss-next]");
  const num = ss.querySelector(".ss-n b"), fsBtn = ss.querySelector("[data-ss-full]");
  let cur = 0, fadeT;
  const REDUCED = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const at = () => Math.round(track.scrollLeft / track.clientWidth);
  const show = (i, smooth = true) => {
    cur = Math.max(0, Math.min(slides.length - 1, i));
    const jump = () => track.scrollTo({ left: cur * track.clientWidth, behavior: "instant" });
    // R41: fade out, jump, fade in (≈180ms + 320ms). Reduced motion or no change: just jump.
    if (!smooth || REDUCED || at() === cur) { jump(); sync(cur); return; }
    clearTimeout(fadeT);
    track.classList.add("ss-out");
    sync(cur);
    fadeT = setTimeout(() => { jump(); track.classList.remove("ss-out"); }, 180);
  };
  const sync = (i) => {
    num.textContent = i + 1;
    prev.disabled = i === 0;
    next.disabled = i === slides.length - 1;
    slides.forEach((s, k) => { s.inert = k !== i; });
  };
  // while the size changes (entering/leaving full screen, rotating) the old scroll offset means nothing: hold the slide
  let t, hold = 0;
  const holdFor = (ms) => { hold = Date.now() + ms; };
  track.addEventListener("scroll", () => { clearTimeout(t); t = setTimeout(() => { if (Date.now() < hold) return; cur = Math.min(slides.length - 1, at()); sync(cur); }, 60); }, { passive: true });
  prev.addEventListener("click", () => show(cur - 1));
  next.addEventListener("click", () => show(cur + 1));
  document.addEventListener("keydown", (e) => {
    if (e.target.closest("input, textarea, select") || e.altKey || e.metaKey || e.ctrlKey) return;
    if (e.key === "ArrowRight") { e.preventDefault(); show(cur + 1); }
    else if (e.key === "ArrowLeft") { e.preventDefault(); show(cur - 1); }
    else if (e.key === "Escape" && ss.classList.contains("is-full")) full(false);
  });
  const full = (on) => {
    const keep = cur;
    holdFor(600);
    ss.classList.toggle("is-full", on);
    fsBtn.textContent = on ? "Exit full screen" : "Full screen";
    if (on && ss.requestFullscreen && !document.fullscreenElement && matchMedia("(hover: hover)").matches) ss.requestFullscreen().catch(() => {});
    if (!on && document.fullscreenElement) document.exitFullscreen().catch(() => {});
    requestAnimationFrame(() => show(keep, false));
    setTimeout(() => show(keep, false), 350);
  };
  document.addEventListener("fullscreenchange", () => { if (!document.fullscreenElement && ss.classList.contains("is-full")) full(false); });
  window.addEventListener("resize", () => { holdFor(400); show(cur, false); });
  ss.querySelectorAll(".ss-img").forEach((b) => b.addEventListener("click", () => full(!ss.classList.contains("is-full"))));
  fsBtn.addEventListener("click", () => full(!ss.classList.contains("is-full")));
  sync(0);
});
