/* Entrance motion for project and research pages (R41 mock, live since R43).
   Everything in REVEAL starts faded 6–8px low (style.css, R41 layer, only while <html> has .m41) and gets .in once it
   scrolls into view. Things that arrive together are staggered 70ms, top to bottom. Opacity and transform
   only, so nothing moves the layout. Runs once per element; with reduced motion .m41 is never set. */
(function () {
  "use strict";
  window.R41 = true;
  const html = document.documentElement;
  if (!html.classList.contains("m41")) return;
  const REVEAL = ".lx-top > *, .title > *, .lx-h > h2, .lx-h > p, .lx-pic, .lp, .lx-coda, .lx-foot, main > .plate > .ph, .intro-l, .posts li, .doc-page, .pg, .ss, .tp-sheet, .see, main > .next";
  const STEP = 70, MAX_STEPS = 5;

  const io = new IntersectionObserver((entries) => {
    const hits = entries.filter((e) => e.isIntersecting)
      .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top || a.boundingClientRect.left - b.boundingClientRect.left);
    hits.forEach((e, i) => {
      const d = Math.min(i, MAX_STEPS) * STEP + "ms";
      e.target.style.setProperty("--d", d);
      // the picture's callout note is its next sibling: it times itself off the picture
      const note = e.target.nextElementSibling;
      if (e.target.matches(".lx-pic") && note && note.matches(".lx-note")) note.style.setProperty("--d", d);
      e.target.classList.add("in");
      io.unobserve(e.target);
    });
  }, { rootMargin: "0px 0px -8% 0px", threshold: 0.08 });

  const els = [...document.querySelectorAll(REVEAL)];
  els.forEach((el) => io.observe(el));

  // a very tall figure may never reach 8% visible on a short screen: show it once its top is well inside
  const tall = () => els.forEach((el) => {
    if (el.classList.contains("in")) return;
    const r = el.getBoundingClientRect();
    if (r.top < innerHeight * 0.75 && r.bottom > 0) { el.classList.add("in"); io.unobserve(el); }
  });
  addEventListener("scroll", tall, { passive: true });
  // printing or saving the page: show everything
  addEventListener("beforeprint", () => html.classList.remove("m41"));
})();
