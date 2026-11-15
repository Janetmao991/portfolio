/* Entrance motion for project and research pages (R41, live since R43), plus t242 homepage
   research-row reveals and AI Term collection anchor landing.
   R41: everything in REVEAL starts faded a few px low (style.css, only while <html> has .m41)
   and gets .in once it scrolls into view. Stagger 70ms, top to bottom. Opacity and transform
   only. Runs once per element; with reduced motion .m41 is never set, so content is visible.
   If this file never arrives, ENTRANCE_ON removes .m41 after 2.5s.
   Homepage rows: visible by default; JS pre-hides only off-screen rows. No .m41 on the home page.
   The REVEAL list is repeated in style.css: change both together. */
(function () {
  "use strict";
  window.R41 = true;
  const html = document.documentElement;
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* t242: collection hash landing — colour only, no travel. Under reduced motion the
     highlight appears and clears without a fade (transitions are off). */
  function landEpisode() {
    const id = (location.hash || "").slice(1);
    document.querySelectorAll(".ep-list > li.ep-land").forEach((n) => n.classList.remove("ep-land"));
    if (!id) return;
    const el = document.getElementById(id);
    if (!el || !el.matches(".ep-list > li")) return;
    el.classList.add("ep-land");
    clearTimeout(landEpisode._t);
    landEpisode._t = setTimeout(() => el.classList.remove("ep-land"), 1200);
  }
  if (document.querySelector(".ep-list")) {
    landEpisode();
    addEventListener("hashchange", landEpisode);
  }

  /* t242: homepage #research rows. First-frame and no-JS remain visible. */
  if (!reduced && "IntersectionObserver" in window) {
    const rows = [...document.querySelectorAll("#research .rs-rows li")];
    if (rows.length) {
      const STEP = 70, MAX_STEPS = 4;
      rows.forEach((el) => {
        const r = el.getBoundingClientRect();
        if (r.top < innerHeight && r.bottom > 0) return;
        el.style.transition = "none";
        el.classList.add("rs-pre");
        void el.offsetHeight;
        el.style.transition = "";
      });
      const io = new IntersectionObserver((entries) => {
        const hits = entries.filter((e) => e.isIntersecting && e.target.classList.contains("rs-pre"))
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        hits.forEach((e, i) => {
          e.target.style.setProperty("--d", Math.min(i, MAX_STEPS) * STEP + "ms");
          e.target.classList.remove("rs-pre");
          io.unobserve(e.target);
        });
      }, { rootMargin: "0px 0px -12% 0px", threshold: 0.08 });
      rows.forEach((el) => {
        if (el.classList.contains("rs-pre")) io.observe(el);
      });
    }
  }

  if (!html.classList.contains("m41")) return;
  const REVEAL = ".lx-top > *, .title > *, .lx-h > h2, .lx-h > p, .lx-pic, .lp, .lx-coda, .lx-foot, main > .plate > .ph, .intro-l, .posts li, .doc-page, .pg, .ss, .tp-sheet, .see, main > .next, .ep-list > li, .yt-embed";
  const STEP = 70, MAX_STEPS = 5;

  const io = new IntersectionObserver((entries) => {
    const hits = entries.filter((e) => e.isIntersecting)
      .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top || a.boundingClientRect.left - b.boundingClientRect.left);
    hits.forEach((e, i) => {
      const d = Math.min(i, MAX_STEPS) * STEP + "ms";
      e.target.style.setProperty("--d", d);
      const note = e.target.nextElementSibling;
      if (e.target.matches(".lx-pic") && note && note.matches(".lx-note")) note.style.setProperty("--d", d);
      e.target.classList.add("in");
      io.unobserve(e.target);
    });
  }, { rootMargin: "0px 0px -8% 0px", threshold: 0.08 });

  const els = [...document.querySelectorAll(REVEAL)];
  els.forEach((el) => io.observe(el));

  const tall = () => els.forEach((el) => {
    if (el.classList.contains("in")) return;
    const r = el.getBoundingClientRect();
    if (r.top < innerHeight * 0.75 && r.bottom > 0) { el.classList.add("in"); io.unobserve(el); }
  });
  addEventListener("scroll", tall, { passive: true });
  addEventListener("beforeprint", () => html.classList.remove("m41"));
})();
