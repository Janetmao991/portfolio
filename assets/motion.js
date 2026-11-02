/* Portfolio v4 — scroll reveals, looping UI demos, the system map.
   Demos read from window.DATA (assets/data.js). Every looping demo pauses
   off-screen; with prefers-reduced-motion each one draws a single still frame. */
(function () {
"use strict";
document.documentElement.classList.add("js");

const D = window.DATA;
const ROOT = document.body.dataset.root || "";
const REDUCED = matchMedia("(prefers-reduced-motion: reduce)").matches;
const CAN_HOVER = matchMedia("(hover: hover)").matches;
const esc = s => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const sleep = ms => new Promise(r => setTimeout(r, ms));
// authored icons (no unicode glyphs standing in for an icon set)
const ICON = {
  star: `<svg class="star" viewBox="0 0 24 24" role="img" aria-label="key line"><path d="M12 2.5l2.8 6.4 6.9.6-5.2 4.6 1.6 6.8L12 17.3l-6.1 3.6 1.6-6.8-5.2-4.6 6.9-.6z"/></svg>`,
  play: `<svg class="ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M7 4.5v15l12-7.5z"/></svg>`,
  pause: `<svg class="ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M6.5 4.5h4v15h-4zM13.5 4.5h4v15h-4z"/></svg>`,
};
const nextFrame = () => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));

/* ---------- scroll reveals ----------
   Content is visible by default. An element is put into its "before" state (near)
   only while it is still off-screen, then animated (show) once it scrolls in.
   In view at load: animate straight away. If an observer never fires, a timer
   shows it anyway, so nothing can be left hidden. */
const ONCE = fn => { let done = false; return () => { if (!done) { done = true; fn(); } }; };
function onView(el, near, show, threshold = 0.12) {
  if (REDUCED || !("IntersectionObserver" in window)) return;
  show = ONCE(show);
  const r = el.getBoundingClientRect();
  if (r.top < innerHeight && r.bottom > 0) { near(); nextFrame().then(show); return; }
  const shown = new IntersectionObserver(([e]) => { if (e.isIntersecting) { shown.disconnect(); nextFrame().then(show); } }, { threshold });
  const close = new IntersectionObserver(([e]) => {
    if (!e.isIntersecting) return;
    close.disconnect();
    near();
    shown.observe(el);
    setTimeout(() => { shown.disconnect(); show(); }, 4000);
  }, { rootMargin: "40% 0px" });
  close.observe(el);
}

/* ---------- fade + 8px rise on scroll ---------- */
document.querySelectorAll(".fx").forEach(n => onView(n, () => n.classList.add("pre"), () => n.classList.add("in")));

/* ---------- looping demos ----------
   Runs `loop(wait)` forever while `el` is active; `wait` also blocks while it isn't.
   Active = on screen, or for hover thumbnails: hovered/focused (on touch screens, on screen). */
function showcase(el, loop, still, opts = {}) {
  if (!el) return;
  if (REDUCED) { still(); return; }
  const hoverOnly = opts.hover && CAN_HOVER;
  still(); // the finished frame first, so a demo is never caught empty; the loop takes over after a pause
  let visible = false, hovered = false, started = false;
  const waiting = [];
  const active = () => visible && (!hoverOnly || hovered);
  const wait = async ms => { await sleep(ms); while (!active()) await new Promise(r => waiting.push(r)); };
  const kick = () => {
    if (!active()) return;
    waiting.splice(0).forEach(r => r());
    if (!started) {
      started = true;
      (async () => { if (!hoverOnly) await wait(3500); for (;;) await loop(wait); })();
    }
  };
  new IntersectionObserver(([e]) => { visible = e.isIntersecting; kick(); }, { threshold: 0.3 }).observe(el);
  if (hoverOnly) {
    const host = el.closest(opts.hover) || el;
    host.addEventListener("mouseenter", () => { hovered = true; kick(); });
    host.addEventListener("mouseleave", () => { hovered = false; });
    host.addEventListener("focusin", () => { hovered = true; kick(); });
    host.addEventListener("focusout", () => { hovered = false; });
  }
}

// Appends a node that eases in and resolves once it has started.
async function reveal(parent, html, tag = "div", cls = "") {
  const n = document.createElement(tag);
  n.className = ("rv " + cls).trim();
  n.innerHTML = html;
  parent.appendChild(n);
  if (REDUCED) { n.classList.add("in"); return n; }
  await nextFrame();
  n.classList.add("in");
  return n;
}
async function clear(node, wait) {
  node.classList.add("gone");
  await wait(420);
  node.innerHTML = "";
  node.classList.remove("gone");
}
async function type(q, text, wait, ms = 75) {
  q.textContent = "";
  for (const ch of text) { q.textContent += ch; await wait(ms); }
}
const sense = w => {
  const m = w.meanings.find(m => /business/i.test(m.pos)) || w.meanings.find(m => /finance/i.test(m.pos)) || w.meanings[0];
  return { pos: m.pos, d: m.defs[0] };
};

/* LexiAI's SM-2, as in supabase/functions/muse-api/index.ts */
function sm2(s, rating) {
  if (rating === "again") return { interval: 1, ease: Math.max(1.3, s.ease - 0.2), reps: 0 };
  let interval, ease = s.ease;
  if (s.reps === 0) interval = rating === "easy" ? 3 : 1;
  else if (rating === "hard") { interval = Math.max(1, Math.round(s.interval * 1.2)); ease = Math.max(1.3, ease - 0.15); }
  else if (rating === "good") interval = Math.max(1, Math.round(s.interval * ease));
  else { interval = Math.max(1, Math.round(s.interval * ease * 1.3)); ease += 0.15; }
  return { interval, ease, reps: s.reps + 1 };
}

const frameOf = el => el.querySelector(".screen") || el;
const DEMOS = {};

/* ================= LexiAI ================= */
function lookupLines(w, full) {
  if (!full) {
    const { pos, d } = sense(w);
    return [
      `<span class="w">${esc(w.word)}</span><span class="ipa">${esc(w.ipa)}</span>`,
      `<span class="pos">${esc(pos)}</span> — ${esc(d.def)}`,
      d.gloss ? `<span class="g">${esc(d.gloss)}</span>` : "",
      (d.col || []).length ? `<span class="g">Often: ${d.col.slice(0, 3).map(esc).join(" · ")}</span>` : "",
    ].filter(Boolean);
  }
  const l = [`<span class="w">${esc(w.word)}</span><span class="ipa">${esc(w.ipa)}</span>`];
  w.meanings.slice(0, 2).forEach(m => l.push(`<span class="pos">${esc(m.pos)}</span> — ${esc(m.defs[0].def)}${m.defs[0].gloss ? `<br><span class="g">${esc(m.defs[0].gloss)}</span>` : ""}`));
  if (w.variants && w.variants.length) l.push(`<span class="pos">Don't confuse with</span> ${w.variants.map(v => `<em>${esc(v.form)}</em>`).join(", ")}`);
  const h = w.heard && w.heard[0];
  if (h) l.push(`<div class="heard"><span class="play">${ICON.play}</span><span class="pos">${esc(h.show)}, “${esc(h.title)}”</span><br>“${esc(h.text)}”</div>`);
  return l;
}
function lookupDemo(el, full, hover) {
  const scr = frameOf(el);
  scr.classList.add("lk");
  scr.innerHTML = `<div class="search"><span class="q"></span><span class="caret"></span></div><div class="out"></div>`;
  const q = scr.querySelector(".q"), out = scr.querySelector(".out");
  const still = () => {
    q.textContent = D.lexi[0].word; out.innerHTML = "";
    lookupLines(D.lexi[0], full).forEach(l => out.insertAdjacentHTML("beforeend", `<div class="line">${l}</div>`));
  };
  showcase(el, async wait => {
    for (const w of D.lexi) {
      q.textContent = ""; out.innerHTML = "";
      await type(q, w.word, wait);
      await wait(350);
      for (const l of lookupLines(w, full)) { await reveal(out, l, "div", "line"); await wait(full ? 450 : 380); }
      await wait(full ? 4200 : 3400);
      await clear(out, wait);
      await wait(300);
    }
  }, still, hover ? { hover: ".card" } : {});
}
DEMOS["hero-lookup"] = el => lookupDemo(el, false);
DEMOS["lexi-full"] = el => lookupDemo(el, true);

DEMOS["lexi-define"] = el => {
  const scr = frameOf(el);
  scr.innerHTML = `<div class="choices" role="group" aria-label="Pick a word"></div><div class="entry" aria-live="polite"></div>`;
  const box = scr.querySelector(".choices"), out = scr.querySelector(".entry");
  const show = i => {
    const w = D.lexi[i];
    box.querySelectorAll("button").forEach((b, j) => b.setAttribute("aria-pressed", i === j));
    out.innerHTML = `<p style="margin:0;font-size:1.5em">${esc(w.word)} <span class="ipa" style="font-size:.6em">${esc(w.ipa)}</span></p>` +
      w.meanings.slice(0, 2).map(m => `<p class="sense"><span class="pos">${esc(m.pos)}</span> — ${esc(m.defs[0].def)}
        ${m.defs[0].gloss ? `<span class="gl">${esc(m.defs[0].gloss)}</span>` : ""}
        ${m.defs[0].ex && m.defs[0].ex[0] ? `<span class="ex">“${esc(m.defs[0].ex[0])}”</span>` : ""}</p>`).join("");
  };
  box.innerHTML = D.lexi.map(w => `<button type="button">${esc(w.word)}</button>`).join("");
  box.querySelectorAll("button").forEach((b, i) => b.addEventListener("click", () => show(i)));
  show(0);
};

DEMOS["lexi-breakdown"] = el => {
  const scr = frameOf(el);
  const c = D.corpus.find(c => c.word === "commoditize");
  const picks = ["pursuing", "multi-platform strategy", "commoditize", "underlying"];
  let html = esc(c.text);
  picks.forEach((p, i) => { html = html.replace(p, `<span class="s" data-i="${i}">${p}</span>`); });
  scr.innerHTML = `<p style="margin:0 0 12px">${html}</p><div class="pills" style="display:flex;flex-wrap:wrap;gap:6px"></div>
    <p class="caption" style="margin-top:12px">Tap a pill to save that word to the notebook.</p>`;
  const spans = [...scr.querySelectorAll(".s")], pills = scr.querySelector(".pills");
  const pill = i => `<button type="button" class="btn" data-i="${i}" aria-pressed="false">+ ${picks[i]}</button>`;
  pills.addEventListener("click", e => {
    const b = e.target.closest("button"); if (!b) return;
    const on = b.getAttribute("aria-pressed") !== "true";
    b.setAttribute("aria-pressed", on);
    b.classList.toggle("primary", on);
    b.textContent = (on ? "Saved · " : "+ ") + picks[+b.dataset.i];
  });
  const still = () => { spans.forEach(s => s.classList.add("mk")); pills.innerHTML = picks.map((_, i) => pill(i)).join(""); };
  showcase(el, async wait => {
    spans.forEach(s => s.classList.remove("mk", "now")); pills.innerHTML = "";
    await wait(600);
    for (const s of spans) {
      s.classList.add("mk", "now");
      await reveal(pills, pill(+s.dataset.i).replace(/^<button/, "<button"), "span");
      await wait(700);
      s.classList.remove("now");
    }
    await wait(5200);
    await clear(pills, wait);
  }, still);
};

function reviewCard(scr, words, onRate) {
  let i = 0, revealed = false;
  const st = words.map(w => ({ interval: w.interval, ease: w.ease, reps: 1 }));
  const draw = () => {
    const w = words[i];
    scr.querySelector(".card-face").innerHTML = `<p class="who">Card ${i + 1} of ${words.length}</p>
      <p style="margin:0;font-size:1.5em">${esc(w.word)} <span class="ipa" style="font-size:.6em">${esc(w.ipa)}</span></p>
      ${revealed ? `<p class="sense rv in"><span class="pos">${esc(w.pos)}</span> — ${esc(w.definition)}<span class="ex">“${esc(w.ex)}”</span></p>` : `<p class="muted" style="font-style:italic">What does it mean?</p>`}`;
    scr.querySelector(".rate").innerHTML = revealed
      ? ["again", "hard", "good", "easy"].map(r => {
          const n = sm2(st[i], r).interval;
          return `<button type="button" class="btn" data-r="${r}">${r[0].toUpperCase() + r.slice(1)} · ${n}d</button>`;
        }).join("")
      : `<button type="button" class="btn primary" data-r="show">Show answer</button>`;
  };
  scr.querySelector(".rate").addEventListener("click", e => {
    const b = e.target.closest("button"); if (!b) return;
    if (b.dataset.r === "show") { revealed = true; draw(); return; }
    const next = sm2(st[i], b.dataset.r);
    onRate && onRate(words[i], b.dataset.r, next);
    st[i] = next; i = (i + 1) % words.length; revealed = false; draw();
  });
  draw();
}
DEMOS["lexi-review"] = el => {
  const scr = frameOf(el);
  scr.innerHTML = `<div class="card-face"></div><div class="choices rate"></div><p class="caption log"></p>`;
  reviewCard(scr, D.muse.words, (w, r, n) => {
    scr.querySelector(".log").textContent = `${w.word}: ${r} → next review in ${n.interval} day${n.interval === 1 ? "" : "s"}, ease ${n.ease.toFixed(2)}`;
  });
};

DEMOS["lexi-heard"] = el => {
  const scr = frameOf(el);
  scr.innerHTML = `<div class="choices" role="group" aria-label="Pick a word"></div><div aria-live="polite"></div>`;
  const box = scr.querySelector(".choices"), out = box.nextElementSibling;
  const words = D.lexi.filter(w => w.heard && w.heard.length);
  const show = i => {
    const h = words[i].heard[0];
    box.querySelectorAll("button").forEach((b, j) => b.setAttribute("aria-pressed", i === j));
    out.innerHTML = `<p class="who">Heard in a podcast · ${esc(h.show)}, “${esc(h.title)}” (${esc(h.published.slice(0, 4))})</p>
      <p style="margin:4px 0 0;font-style:italic">“${esc(h.text)}”</p><audio controls preload="none" src="${h.clip}"></audio>`;
  };
  box.innerHTML = words.map(w => `<button type="button">${esc(w.word)}</button>`).join("");
  box.querySelectorAll("button").forEach((b, i) => b.addEventListener("click", () => show(i)));
  show(0);
};

/* ================= Meta Muse ================= */
DEMOS["muse-chat"] = (el, hover) => {
  const chat = frameOf(el);
  chat.classList.add("chat");
  const RATES = ["Again", "Hard", "Good", "Easy"];
  const steps = (w, i) => [
    [`<span class="who">Muse · 9:14 pm</span>${i === 0 ? "Time for tonight's LexiAI review. " : ""}Card ${i + 1}: what does <em>${esc(w.word)}</em> mean?`, "p", ""],
    [`<span class="who">Muse</span><em>${esc(w.pos)}</em> — ${esc(w.definition)}`, "p", ""],
    [RATES.map(r => `<b>${r}</b>`).join(""), "div", "rates"],
    [`<span class="who">Muse</span>Next review in ${w.interval} day${w.interval === 1 ? "" : "s"}. Saved to LexiAI.`, "p", ""],
  ];
  showcase(el, async wait => {
    for (const [i, w] of D.muse.words.entries()) {
      chat.innerHTML = "";
      for (const [html, tag, cls] of steps(w, i)) {
        const n = await reveal(chat, html, tag, cls);
        if (cls === "rates") { await wait(700); n.children[2].classList.add("on"); }
        await wait(1100);
      }
      await wait(2400);
      await clear(chat, wait);
    }
  }, () => {
    chat.innerHTML = "";
    steps(D.muse.words[0], 0).forEach(([html, tag, cls]) => chat.insertAdjacentHTML("beforeend", `<${tag} class="${cls}">${html}</${tag}>`));
    chat.querySelector(".rates b:nth-child(3)").classList.add("on");
  }, hover ? { hover: ".card" } : {});
};

DEMOS["muse-quiz"] = el => {
  const scr = frameOf(el);
  scr.innerHTML = `<p class="who">GET /words/due?limit=8 → ${D.muse.words.length} cards</p><div class="card-face"></div><div class="choices rate"></div><div class="apilog" aria-live="polite"><p class="muted">Ratings are sent back as POST /reviews.</p></div>`;
  const log = scr.querySelector(".apilog");
  reviewCard(scr, D.muse.words, (w, r, n) => {
    log.insertAdjacentHTML("afterbegin", `<p class="rv in"><span class="m">POST</span> /reviews {"word":"${esc(w.word)}","rating":"${r}"} <span class="muted">→ interval ${n.interval}d</span></p>`);
    while (log.children.length > 4) log.lastElementChild.remove();
  });
};

DEMOS["muse-writeback"] = el => {
  const scr = frameOf(el);
  scr.innerHTML = `<div class="flow-row"><span class="box">Meta Muse<br>phone · Mac</span><span class="arr">→</span><span class="box">muse-api<br>Edge Function</span><span class="arr">→</span><span class="box">words table<br>Supabase</span></div>
    <div class="flow-row" style="grid-template-columns:1fr auto 1fr"><span></span><span class="arr">↓</span><span class="box">LexiAI<br>newer-wins merge</span></div>
    <div class="term"></div>`;
  const boxes = [...scr.querySelectorAll(".box")], term = scr.querySelector(".term");
  const lines = [
    [0, `POST /reviews · Bearer token`],
    [1, `token checked · SM-2 applied`],
    [2, `words.srs updated · lastModified set`],
    [3, `next open: newer-wins merge → same due dates`],
  ];
  const still = () => { boxes.forEach(b => b.classList.add("on")); term.innerHTML = lines.map(l => `<p>${esc(l[1])}</p>`).join(""); };
  showcase(el, async wait => {
    boxes.forEach(b => b.classList.remove("on")); term.innerHTML = "";
    await wait(500);
    for (const [b, t] of lines) { boxes[b].classList.add("on"); await reveal(term, esc(t), "p"); await wait(1200); }
    await wait(3600);
    await clear(term, wait);
  }, still);
};

DEMOS["muse-api"] = el => {
  const scr = frameOf(el);
  const eps = [
    ["GET", "/", "public description of the API, no token"],
    ["GET", "/stats", "notebook stats and streak"],
    ["GET", "/words/due", "today's due cards, hardest first"],
    ["GET", "/words/{word}", "look up one saved word"],
    ["GET", "/words/random", "random words, optionally by level"],
    ["POST", "/reviews", "{word, rating} or a batch"],
  ];
  scr.innerHTML = `<div class="term">${eps.map(e => `<p class="ep"><span class="m" style="color:var(--accent)">${e[0]}</span> ${esc(e[1])} <span class="muted">· ${esc(e[2])}</span></p>`).join("")}</div>`;
  const ps = [...scr.querySelectorAll(".ep")];
  showcase(el, async wait => {
    for (const p of ps) { ps.forEach(x => x.style.background = ""); p.style.background = "var(--tint)"; await wait(1300); }
    ps.forEach(x => x.style.background = ""); await wait(1500);
  }, () => {});
};

/* ================= LexiSpeak ================= */
const LABELS = ["Grammar", "Pronunciation", "Phrasing", "Target words"];
const head = m => `<p style="margin:0"><em>${esc(m.name)}</em> · ${esc(m.persona)}</p><p class="g" style="margin:0;font-size:14px">${esc(m.prompt)}</p>`;
const report = (m, why) => {
  const overall = Math.round(m.scores.reduce((a, b) => a + b, 0) / m.scores.length);
  return `<p style="margin:12px 0 0">Overall <b style="font-weight:400;color:var(--accent)">${overall}</b> / 100</p>
    <div class="sc">${m.scores.map((v, i) => `<div><b data-v="${v}">${v}</b><span>${LABELS[i]}</span></div>`).join("")}</div>
    ${m.fixes.map(f => `<p class="fixl"><s>${esc(f[0])}</s><span>${esc(f[1])}</span>${why ? `<span class="why">${esc(f[2])}</span>` : ""}</p>`).join("")}`;
};
const mm = s => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
async function recordBars(parent, wait, ticks = 22) {
  const rec = await reveal(parent, `<div class="bars">${"<i></i>".repeat(48)}</div><p class="rec">● Recording <span>0:00</span></p>`);
  const bars = rec.querySelectorAll(".bars i"), t = rec.querySelector(".rec span");
  for (let tick = 0; tick < ticks; tick++) {
    bars.forEach((b, i) => { b.style.height = `${8 + Math.abs(Math.sin(i * 0.5 + tick * 0.9) * Math.cos(i * 0.17 + tick)) * 90}%`; });
    t.textContent = mm(Math.round(tick * 2.1));
    await wait(160);
  }
  bars.forEach(b => { b.style.height = "6%"; });
  return rec;
}
DEMOS["speak-loop"] = el => {
  const scr = frameOf(el);
  showcase(el, async wait => {
    for (const k of ["interview", "business", "casual", "group"]) {
      const m = D.modes[k];
      scr.innerHTML = "";
      await reveal(scr, head(m));
      const rec = await recordBars(scr, wait);
      rec.querySelector(".rec").textContent = `Listening to your recording…`;
      await wait(1100);
      const r = await reveal(scr, report(m));
      for (const b of r.querySelectorAll(".sc b")) {
        const v = +b.dataset.v;
        for (let x = 0; x <= 10; x++) { b.textContent = Math.round(v * x / 10); await wait(40); }
      }
      await wait(4800);
      scr.classList.add("gone"); await wait(420); scr.classList.remove("gone");
    }
  }, () => { scr.innerHTML = head(D.modes.interview) + report(D.modes.interview); });
};
DEMOS["speak-modes"] = el => {
  const scr = frameOf(el);
  scr.innerHTML = `<div class="choices" role="group" aria-label="Pick a mode"></div><div aria-live="polite"></div>`;
  const box = scr.querySelector(".choices"), out = box.nextElementSibling;
  const keys = Object.keys(D.modes);
  const show = k => {
    box.querySelectorAll("button").forEach(b => b.setAttribute("aria-pressed", b.dataset.k === k));
    const m = D.modes[k];
    out.innerHTML = `<p class="who">Persona</p><p style="margin:0 0 10px">${esc(m.persona)}</p><p class="who">Scenario</p><p style="margin:0">${esc(m.prompt)}</p>`;
  };
  box.innerHTML = keys.map(k => `<button type="button" data-k="${k}">${esc(D.modes[k].name)}</button>`).join("");
  box.querySelectorAll("button").forEach(b => b.addEventListener("click", () => show(b.dataset.k)));
  show("interview");
};
DEMOS["speak-audiofirst"] = el => {
  const scr = frameOf(el);
  scr.innerHTML = `<p class="who">Most apps</p>
    <div class="flow-row a"><span class="box">my voice</span><span class="arr">→</span><span class="box">speech-to-text</span><span class="arr">→</span><span class="box">grade the text</span></div>
    <p class="caption a-note" style="margin:-4px 0 14px">&nbsp;</p>
    <p class="who">LexiSpeak</p>
    <div class="flow-row b"><span class="box">my voice</span><span class="arr">→</span><span class="box">Gemini listens to audio</span><span class="arr">→</span><span class="box">grade what I said</span></div>
    <p class="caption b-note" style="margin:-4px 0 0">&nbsp;</p>`;
  const a = [...scr.querySelectorAll(".a .box")], b = [...scr.querySelectorAll(".b .box")];
  const an = scr.querySelector(".a-note"), bn = scr.querySelector(".b-note");
  const still = () => { a.forEach(x => x.classList.add("on")); a[2].classList.add("lost"); b.forEach(x => x.classList.add("on")); an.textContent = "a mispronounced word is quietly “fixed” — the mistake disappears"; bn.textContent = "pronunciation is judged on the recording itself"; };
  showcase(el, async wait => {
    [...a, ...b].forEach(x => x.classList.remove("on", "lost")); an.innerHTML = bn.innerHTML = "&nbsp;";
    for (const x of a) { x.classList.add("on"); await wait(700); }
    a[2].classList.add("lost"); an.textContent = "a mispronounced word is quietly “fixed” — the mistake disappears";
    await wait(1400);
    for (const x of b) { x.classList.add("on"); await wait(700); }
    bn.textContent = "pronunciation is judged on the recording itself";
    await wait(4200);
  }, still);
};
DEMOS["speak-report"] = el => {
  const scr = frameOf(el);
  scr.innerHTML = `<div class="choices" role="group" aria-label="Pick a mode"></div><div aria-live="polite"></div>`;
  const box = scr.querySelector(".choices"), out = box.nextElementSibling;
  const show = k => {
    box.querySelectorAll("button").forEach(b => b.setAttribute("aria-pressed", b.dataset.k === k));
    out.innerHTML = report(D.modes[k], true);
  };
  box.innerHTML = Object.keys(D.modes).map(k => `<button type="button" data-k="${k}">${esc(D.modes[k].name)}</button>`).join("");
  box.querySelectorAll("button").forEach(b => b.addEventListener("click", () => show(b.dataset.k)));
  show("business");
};
DEMOS["speak-canspeak"] = el => {
  const scr = frameOf(el);
  const words = ["outweigh", "table stakes", "commoditize", "erode"];
  scr.innerHTML = `<p class="who">LexiAI notebook · words table</p>` + words.map(w => `<div class="nb-row"><span>${w}</span><span class="pill">not said yet</span></div>`).join("") + `<p class="caption cs-note">&nbsp;</p>`;
  const pills = [...scr.querySelectorAll(".pill")], note = scr.querySelector(".cs-note");
  const still = () => { pills[0].textContent = "Can speak"; pills[0].classList.add("on"); note.textContent = "used well in a LexiSpeak session → written back"; };
  showcase(el, async wait => {
    pills.forEach(p => { p.textContent = "not said yet"; p.classList.remove("on"); }); note.innerHTML = "&nbsp;";
    await wait(900);
    note.textContent = "LexiSpeak pulls these into the next conversation…"; await wait(2000);
    for (const i of [0, 2]) { pills[i].textContent = "Can speak"; pills[i].classList.add("on"); note.textContent = `“${words[i]}” used well → written back to LexiAI`; await wait(2000); }
    await wait(3000);
  }, still);
};

/* ================= Writing Station ================= */
function journalHTML(tag) {
  const { entry, review } = D.journal;
  let html = esc(entry.text);
  Object.keys(review).forEach((k, i) => {
    const cls = review[k].t === "idi" ? "s idi" : "s";
    html = html.replace(esc(k), tag === "button"
      ? `<button type="button" class="${cls} mk" data-i="${i}" aria-pressed="false">${esc(k)}</button>`
      : `<span class="${cls}" data-i="${i}">${esc(k)}</span>`);
  });
  return html;
}
const note = k => {
  const r = D.journal.review[k];
  return `<span class="lab ${r.t === "idi" ? "" : "err"}">${r.t === "idi" ? "More natural" : "Error"}</span><span class="fxl">${esc(r.fix)}</span><span class="why">${esc(r.why)}</span>`;
};
DEMOS["write-desk"] = (el, hover) => {
  const scr = frameOf(el);
  const { entry, review } = D.journal, keys = Object.keys(review);
  scr.innerHTML = hover
    ? `<div class="paper"><p style="margin:0 0 6px;font-size:1.1em">${esc(entry.title)}</p><p style="margin:0">${journalHTML()}</p></div>`
    : `<div class="desk"><div class="side"><p class="cur">${esc(entry.date)}<br>${esc(entry.title)}</p></div>
      <div class="paper"><p style="margin:0 0 8px;font-size:1.2em">${esc(entry.title)}</p><p style="margin:0">${journalHTML()}</p></div>
      <div class="margin"></div></div>`;
  const sents = [...scr.querySelectorAll(".paper .s")], margin = scr.querySelector(".margin");
  showcase(el, async wait => {
    for (const s of sents) {
      sents.forEach(x => x.classList.remove("now"));
      s.classList.add("mk", "now");
      if (margin) { margin.innerHTML = ""; await reveal(margin, note(keys[+s.dataset.i])); }
      await wait(hover ? 1200 : 3400);
    }
    sents.forEach(x => x.classList.remove("now"));
    if (margin) margin.innerHTML = `<span class="lab">${esc(entry.date)}</span><span class="fxl">${sents.length} notes · scored ${entry.score}</span>`;
    await wait(3000);
    sents.forEach(x => x.classList.remove("mk"));
    if (margin) margin.innerHTML = "";
    await wait(900);
  }, () => {
    sents.forEach(x => x.classList.add("mk"));
    if (margin && sents[1]) { sents[1].classList.add("now"); margin.innerHTML = note(keys[+sents[1].dataset.i]); }
  }, hover ? { hover: ".card" } : {});
};
DEMOS["write-type"] = el => {
  const scr = frameOf(el);
  const { entry } = D.journal;
  const first = entry.text.split(". ").slice(0, 2).join(". ") + ".";
  scr.innerHTML = `<div class="desk" style="grid-template-columns:7em 1fr"><div class="side" style="display:block"><p class="cur">${esc(entry.date)}<br>${esc(entry.title)}</p><p>Older entries</p></div>
    <div><p style="margin:0 0 8px;font-size:1.2em">${esc(entry.title)}</p><p style="margin:0"><span class="t"></span><span class="caret"></span></p></div></div>`;
  const t = scr.querySelector(".t");
  showcase(el, async wait => { await type(t, first, wait, 38); await wait(3800); t.textContent = ""; await wait(500); },
    () => { t.textContent = first; });
};
DEMOS["write-errors"] = el => {
  const scr = frameOf(el);
  const keys = Object.keys(D.journal.review);
  scr.innerHTML = `<p class="caption" style="margin:0 0 10px">Tap an underlined sentence. Red wavy = error, dotted = could sound more natural.</p>
    <p style="margin:0">${journalHTML("button")}</p><div class="margin" aria-live="polite" style="margin-top:14px;min-height:7em"></div>`;
  const panel = scr.querySelector(".margin");
  scr.querySelectorAll("button.s").forEach(b => b.addEventListener("click", () => {
    scr.querySelectorAll("button.s").forEach(x => x.setAttribute("aria-pressed", x === b));
    panel.innerHTML = note(keys[+b.dataset.i]);
  }));
  scr.querySelectorAll("button.s")[1].click();
};
DEMOS["write-idiom"] = el => {
  const scr = frameOf(el);
  const k = Object.keys(D.journal.review).find(k => D.journal.review[k].t === "idi");
  const r = D.journal.review[k];
  scr.innerHTML = `<p style="margin:0 0 12px"><span class="s idi">${esc(k)}</span></p><div class="margin" style="min-height:8em"></div>`;
  const s = scr.querySelector(".s"), m = scr.querySelector(".margin");
  showcase(el, async wait => {
    s.classList.remove("mk", "now"); m.innerHTML = "";
    await wait(900); s.classList.add("mk", "now");
    await reveal(m, note(k)); await wait(6000);
    await clear(m, wait);
  }, () => { s.classList.add("mk"); m.innerHTML = note(k); });
};
DEMOS["write-wifi"] = el => {
  const scr = frameOf(el);
  scr.innerHTML = `<div class="flow-row" style="grid-template-columns:1fr auto 1fr"><span class="box">Mac<br>server.mjs · :5180</span><span class="arr">⇄</span><span class="box">iPad · iPhone<br>same home Wi-Fi</span></div>
    <div class="flow-row" style="grid-template-columns:1fr auto 1fr"><span class="box">entries saved as<br>plain local files</span><span class="arr"></span><span class="box">no cloud sync</span></div>
    <p class="caption">launchd starts the server at login, so the desk is always one tab away.</p>`;
  const bx = [...scr.querySelectorAll(".box")];
  showcase(el, async wait => {
    bx.forEach(b => b.classList.remove("on"));
    for (const b of bx) { b.classList.add("on"); await wait(900); }
    await wait(3000);
  }, () => bx.forEach(b => b.classList.add("on")));
};

/* ================= podcast-dig ================= */
const hms = s => `${Math.floor(s / 3600)}:${String(Math.floor(s / 60) % 60).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
const pattern = w => new RegExp(w.split(" ").map(t => (t.length > 4 ? t.slice(0, -1) : t) + "\\w*").join("\\s+"), "i");
const corpusLine = c => `<span class="src">${hms(c.at)} · ${esc(c.show)}, “${esc(c.title)}” ${ICON.star}</span>${esc(c.text).replace(pattern(c.word), m => `<mark>${m}</mark>`)}`;
DEMOS["pod-feed"] = el => {
  const scr = frameOf(el);
  scr.innerHTML = `<p class="vault">vault / podcasts · corpus shared with LexiAI</p><div class="feed"></div>`;
  const feed = scr.querySelector(".feed");
  showcase(el, async wait => {
    for (const [n, c] of D.corpus.entries()) {
      const p = await reveal(feed, corpusLine(c), "p");
      while (feed.children.length > 8) feed.firstElementChild.remove();
      await wait(500);
      const m = p.querySelector("mark"); if (m) m.classList.add("on");
      if (n % 3 === 1) { await wait(300); p.querySelector(".star").classList.add("on"); }
      await wait(1900);
    }
    await clear(feed, wait);
  }, () => {
    D.corpus.slice(0, 5).forEach(c => feed.insertAdjacentHTML("beforeend", `<p>${corpusLine(c)}</p>`));
    feed.querySelectorAll("mark").forEach(m => m.classList.add("on"));
    feed.querySelectorAll("p:nth-child(3n+2) .star").forEach(s => s.classList.add("on"));
  });
};
const TOOL_CMDS = [
  ["/podcast-dig <sector>", "ranked episodes → timestamped transcripts → Obsidian"],
];
DEMOS["tools-cache"] = el => {
  const scr = frameOf(el);
  scr.innerHTML = `<div class="flow-row" style="grid-template-columns:1fr auto 1fr"><span class="box">new episode<br>(RSS audio)</span><span class="arr">→</span><span class="box">in corpus.db?</span></div>
    <div class="flow-row" style="grid-template-columns:1fr auto 1fr"><span class="box">yes → reuse</span><span class="arr">·</span><span class="box">no → Whisper once,<br>on my Mac</span></div>
    <div class="flow-row" style="grid-template-columns:1fr auto 1fr"><span class="box">podcast-dig<br>highlights → Obsidian</span><span class="arr">+</span><span class="box">LexiAI<br>“Heard in podcasts”</span></div>`;
  const bx = [...scr.querySelectorAll(".box")];
  showcase(el, async wait => {
    bx.forEach(b => b.classList.remove("on"));
    for (const i of [0, 1, 3, 2, 4, 5]) { bx[i].classList.add("on"); await wait(800); }
    await wait(3200);
  }, () => bx.forEach(b => b.classList.add("on")));
};

/* ================= card thumbnails: one thing each, big and centred ================= */
DEMOS["thumb-lexi"] = el => {
  const scr = frameOf(el);
  scr.innerHTML = `<div class="thumb-word"><span class="q"></span><span class="caret"></span></div><div class="thumb-sub"></div>`;
  const q = scr.querySelector(".q"), sub = scr.querySelector(".thumb-sub");
  showcase(el, async wait => {
    for (const w of D.lexi) {
      sub.innerHTML = "";
      await type(q, w.word, wait, 90);
      await wait(300);
      await reveal(sub, esc(sense(w).pos), "span");
      await wait(2600);
      await clear(sub, wait);
    }
  }, () => { q.textContent = D.lexi[0].word; sub.textContent = sense(D.lexi[0]).pos; }, { hover: ".card" });
};
DEMOS["thumb-speak"] = el => {
  const scr = frameOf(el);
  scr.innerHTML = `<div class="bars thumb-bars">${"<i></i>".repeat(40)}</div>`;
  const bars = [...scr.querySelectorAll("i")];
  const draw = tick => bars.forEach((b, i) => { b.style.height = `${8 + Math.abs(Math.sin(i * 0.5 + tick * 0.9) * Math.cos(i * 0.17 + tick)) * 90}%`; });
  let tick = 0;
  showcase(el, async wait => { draw(++tick); await wait(180); }, () => draw(3), { hover: ".card" });
};
DEMOS["thumb-write"] = el => {
  const scr = frameOf(el);
  const key = Object.keys(D.journal.review).find(k => /searching/.test(k));
  const fix = key ? D.journal.review[key].fix : "The search results will prioritize the words in your notebook.";
  const wrong = (key || "The searching results will prioritize the words in your notebook.").replace("searching", `<span class="s">searching</span>`);
  scr.innerHTML = `<p class="thumb-line">${wrong}</p><p class="thumb-line fixed"></p>`;
  const s = scr.querySelector(".s"), out = scr.querySelector(".fixed");
  showcase(el, async wait => {
    s.classList.remove("mk"); out.innerHTML = "";
    await wait(700);
    s.classList.add("mk");
    await wait(600);
    await reveal(out, esc(fix).replace("search", "<b>search</b>"), "span");
    await wait(3000);
    await clear(out, wait);
  }, () => { s.classList.add("mk"); out.innerHTML = esc(fix).replace("search", "<b>search</b>"); }, { hover: ".card" });
};
DEMOS["thumb-muse"] = el => {
  const scr = frameOf(el);
  const w = D.muse.words.find(w => w.word === "flesh out") || D.muse.words[0];
  scr.innerHTML = `<span class="who">Muse · 9:14 pm</span><div class="thumb-word">${esc(w.word)}?</div><div class="rates thumb-rates"><b>Again</b><b>Hard</b><b>Good</b><b>Easy</b></div>`;
  const good = scr.querySelectorAll(".rates b")[2];
  showcase(el, async wait => {
    good.classList.remove("on");
    await wait(1400);
    good.classList.add("on");
    await wait(2200);
  }, () => good.classList.add("on"), { hover: ".card" });
};
DEMOS["thumb-tools"] = el => {
  const scr = frameOf(el);
  scr.innerHTML = `<p class="thumb-cmd"><span class="q"></span><span class="caret"></span></p>`;
  const q = scr.querySelector(".q");
  showcase(el, async wait => {
    for (const [c] of TOOL_CMDS) {
      await type(q, c, wait, 60);
      await wait(1800);
    }
  }, () => { q.textContent = TOOL_CMDS[0][0]; }, { hover: ".card" });
};

document.querySelectorAll("[data-demo]").forEach(el => {
  const f = DEMOS[el.dataset.demo];
  if (f && D) f(el);
});

const SVGNS = "http://www.w3.org/2000/svg";

/* ================= one word's journey (index #system) =================
   A dot travels the ring; each stop fills, the centre caption updates and a
   one-line snippet appears beside the node. */
const STOPS = [
  { label: "LexiAI", href: "projects/lexiai.html", role: "Look up · save: dictionary and notebook.", state: "saved",
    snip: w => `+ ${w} · saved to notebook` },
  { label: "Meta Muse", href: "projects/muse.html", role: "Remember: a nightly quiz on my hardest words.", state: "reviewed 9:14pm",
    snip: () => "9:14 pm · rated Good" },
  { label: "Writing Station", href: "projects/writing-station.html", role: "Use: a daily journal, reviewed sentence by sentence.", state: "used in writing",
    snip: () => "used correctly · Can write" },
  { label: "LexiSpeak", href: "projects/lexispeak.html", role: "Speak: conversation practice graded on my voice.", state: "said out loud",
    snip: () => "Can speak" },
  { label: "podcast-dig", href: "projects/podcast-dig.html", role: "Listen: real podcast sentences for each word.", state: "heard in a podcast",
    snip: w => { const c = (D.corpus || []).find(c => c.word === w); return c ? `${c.show.slice(0, 18)} · ${hms(c.at)}` : "heard in a podcast"; } },
];
/* project pages: the same ring, cropped to this project's stop and its two neighbours.
   A dot carries the word in from the previous stop and on to the next. */
const RING_KEY = { lexiai: 0, muse: 1, writing: 2, lexispeak: 3, podcast: 4, startup: 4 };
/* Revision 7: Startup Research hangs off podcast-dig, outside the word's ring (it isn't a stop on the journey). */
const SPUR = { label: "Startup Research", href: "projects/startup-research.html", role: "Research: founders' own words, from podcast-dig transcripts." };
function buildRingCrop(host) {
  const f = RING_KEY[host.dataset.focus], atSpur = host.dataset.focus === "startup";
  if (f === undefined) return;
  const C = 300, R = 190, N = STOPS.length;
  const ang = i => (-90 + i * 72) * Math.PI / 180;
  const at = (a, r = R) => [C + r * Math.cos(a), C + r * Math.sin(a)];
  const show = [f - 1, f, f + 1]; // unwrapped indices, so the arc runs clockwise through the focus
  const idx = i => (i + N) % N;
  let h = `<circle class="ring" cx="${C}" cy="${C}" r="${R}"/>`;
  const a0 = ang(show[0]), a1 = ang(show[2]), [sx, sy] = at(a0), [ex, ey] = at(a1);
  h += `<path id="${host.id}-arc" class="arc" d="M${sx.toFixed(1)} ${sy.toFixed(1)} A${R} ${R} 0 0 1 ${ex.toFixed(1)} ${ey.toFixed(1)}"/>`;
  const box = [Infinity, Infinity, -Infinity, -Infinity];
  const grow = (x, y) => { box[0] = Math.min(box[0], x); box[1] = Math.min(box[1], y); box[2] = Math.max(box[2], x); box[3] = Math.max(box[3], y); };
  for (let t = 0; t <= 1; t += 0.05) grow(...at(a0 + (a1 - a0) * t));
  show.forEach(u => {
    const i = idx(u), s = STOPS[i], a = ang(u), [x, y] = at(a), ux = Math.cos(a), uy = Math.sin(a), [lx, ly] = at(a, R + 30);
    const anchor = ux > 0.3 ? "start" : ux < -0.3 ? "end" : "middle";
    const ty = ly + (uy < -0.5 ? -4 : uy > 0.5 ? 14 : 6), w = s.label.length * 9.5;
    const l = anchor === "start" ? lx : anchor === "end" ? lx - w : lx - w / 2;
    grow(l, ty - 18); grow(l + w, ty + 6);
    h += `<a class="node${i === f && !atSpur ? " on here" : ""}" data-i="${i}" href="${ROOT + s.href}" aria-label="${esc(s.label)}: ${esc(s.role)}">
      <circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="8"/><circle class="hit" cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="34"/>
      <text x="${lx.toFixed(1)}" y="${ty.toFixed(1)}" text-anchor="${anchor}">${esc(s.label)}</text></a>`;
  });
  if (f === 4) { // the spur: a dashed branch from podcast-dig to Startup Research
    const [px, py] = at(ang(4)), sx2 = px - 44, sy2 = py + 112;
    h += `<path class="spur" d="M${px.toFixed(1)} ${py.toFixed(1)} L${sx2.toFixed(1)} ${sy2.toFixed(1)}"/>`;
    h += `<a class="node${atSpur ? " on here" : ""}" data-i="s" href="${ROOT + SPUR.href}" aria-label="${esc(SPUR.label)}: ${esc(SPUR.role)}">
      <circle cx="${sx2.toFixed(1)}" cy="${sy2.toFixed(1)}" r="8"/><circle class="hit" cx="${sx2.toFixed(1)}" cy="${sy2.toFixed(1)}" r="34"/>
      <text x="${(sx2 - 18).toFixed(1)}" y="${(sy2 + 6).toFixed(1)}" text-anchor="end">${esc(SPUR.label)}</text></a>`;
    const w = SPUR.label.length * 9.5;
    grow(sx2 - 18 - w, sy2 - 18); grow(sx2 + 10, sy2 + 12);
  }
  if (!REDUCED) h += `<circle class="dot" r="5"><animateMotion dur="3.6s" repeatCount="indefinite" calcMode="spline" keyPoints="0;0.5;0.5;1" keyTimes="0;0.4;0.6;1" keySplines="0.3 0.2 0.4 1;0 0 1 1;0.3 0.2 0.4 1"><mpath href="#${host.id}-arc"/></animateMotion></circle>`;
  const pad = 24, vb = [box[0] - pad, box[1] - pad, box[2] - box[0] + pad * 2, box[3] - box[1] + pad * 2];
  const svg = document.createElementNS(SVGNS, "svg");
  svg.setAttribute("viewBox", vb.map(v => v.toFixed(1)).join(" "));
  svg.setAttribute("role", "group");
  svg.setAttribute("aria-label", `Where ${atSpur ? SPUR.label : STOPS[f].label} sits in one word's journey`);
  svg.innerHTML = h;
  host.appendChild(svg);
  const tip = document.createElement("div");
  tip.className = "tip"; tip.setAttribute("aria-hidden", "true");
  host.appendChild(tip);
  svg.querySelectorAll(".node").forEach(a => {
    const s = a.dataset.i === "s" ? SPUR : STOPS[+a.dataset.i];
    const on = () => {
      tip.innerHTML = `<b>${esc(s.label)}</b>${esc(s.role)}`;
      const r = a.querySelector("circle").getBoundingClientRect(), hr = host.getBoundingClientRect();
      tip.style.left = Math.min(Math.max(r.left - hr.left - 125, 0), host.clientWidth - 250) + "px";
      tip.style.top = (r.top - hr.top + 24) + "px";
      tip.classList.add("on");
    };
    const off = () => tip.classList.remove("on");
    a.addEventListener("mouseenter", on); a.addEventListener("focus", on);
    a.addEventListener("mouseleave", off); a.addEventListener("blur", off);
  });
}
document.querySelectorAll("[data-ring-crop]").forEach(buildRingCrop);

/* ================= Revision 2: Kiwi-style snippets =================
   White .snip cards that animate once when scrolled in; static with reduced motion. */
const short = (s, n = 90) => s.length > n ? s.slice(0, s.lastIndexOf(" ", n - 1)) + "…" : s;
const chip = (t, off) => `<span class="chip${off ? " off" : ""}"><i></i>${t}</span>`;
const hl = (text, w) => esc(text).replace(pattern(w), m => `<mark>${m}</mark>`);
function excerpt(text, w, before = 30, after = 45) {
  const m = text.match(pattern(w));
  if (!m) return short(text, 80);
  let a = Math.max(0, m.index - before), b = Math.min(text.length, m.index + m[0].length + after);
  if (a) a = text.indexOf(" ", a) + 1;
  if (b < text.length) b = text.lastIndexOf(" ", b);
  return (a ? "…" : "") + text.slice(a, b) + (b < text.length ? "…" : "");
}
function countUp(node, to, ms = 600) {
  return new Promise(done => {
    const t0 = performance.now();
    const step = now => {
      const t = Math.min((now - t0) / ms, 1);
      node.textContent = Math.round(to * (1 - Math.pow(1 - t, 3))).toLocaleString("en-US");
      t < 1 ? requestAnimationFrame(step) : done();
    };
    requestAnimationFrame(step);
  });
}
async function typeIn(node, text, ms = 70) { node.textContent = ""; for (const ch of text) { node.textContent += ch; await sleep(ms); } }
const lexiWord = k => D.lexi.find(w => w.word === k);
const museWord = k => D.muse.words.find(w => w.word === k) || D.muse.words[0];
const corpusFor = k => D.corpus.filter(c => c.word === k).sort((a, b) => a.text.length - b.text.length)[0];
const PROFILE = { best: 29, current: 8, level: 7, title: "Wordsmith", words: 3989 }; // my real notebook, read from Supabase on Oct 26, 2026 (R9)
const showAll = b => b.querySelectorAll(".rv").forEach(n => n.classList.add("in"));
const steps = async (b, ms = 280) => { for (const n of b.querySelectorAll(".rv")) { await sleep(ms); n.classList.add("in"); } };
const flip = (c, html) => { c.classList.remove("off"); c.classList.add("ok"); c.innerHTML = "<i></i>" + html; };

const SNIP = {};
/* LexiAI */
SNIP["lx-define"] = b => {
  const w = lexiWord("erode"), { pos, d } = sense(w);
  b.innerHTML = `<p class="sn-w"><span class="w"></span> <span class="ipa">${esc(w.ipa)}</span></p>
    <p class="sn-l rv"><span class="pos">${esc(pos)}</span> — ${esc(short(d.def))}</p>
    ${(d.col || []).length ? `<p class="sn-l g rv">Often: ${d.col.slice(0, 3).map(esc).join(" · ")}</p>` : ""}`;
  const wn = b.querySelector(".w");
  return { still: () => { wn.textContent = w.word; showAll(b); }, play: async () => { await typeIn(wn, w.word, 90); await steps(b); } };
};
SNIP["lx-break"] = b => {
  const c = corpusFor("commoditize");
  b.innerHTML = `<p class="sn-q">“${hl(excerpt(c.text, c.word), c.word)}”</p>${chip("+ save commoditize", true)}`;
  const m = b.querySelector("mark"), c2 = b.querySelector(".chip");
  const done = () => flip(c2, "Saved to notebook");
  return { still: () => { m.classList.add("on"); done(); }, play: async () => { await sleep(300); m.classList.add("on"); await sleep(700); done(); } };
};
SNIP["lx-card"] = b => {
  const w = museWord("omit"), next = sm2({ interval: w.interval, ease: w.ease, reps: 1 }, "good");
  b.innerHTML = `<p class="sn-w"><span class="w">${esc(w.word)}</span> <span class="ipa">${esc(w.ipa)}</span></p>
    <p class="sn-l rv"><span class="pos">${esc(w.pos)}</span> — ${esc(short(w.definition, 70))}</p>
    <div class="rates sn-rates"><b>Again</b><b>Hard</b><b>Good</b><b>Easy</b></div>
    <p class="sn-mono rv">Good → next review in ${next.interval} days</p>`;
  const [def, note] = b.querySelectorAll(".rv"), good = b.querySelectorAll(".rates b")[2];
  return { still: () => { showAll(b); good.classList.add("on"); },
    play: async () => { await sleep(400); def.classList.add("in"); await sleep(700); good.classList.add("on"); await sleep(400); note.classList.add("in"); } };
};
SNIP["lx-stats"] = b => {
  b.innerHTML = `<div class="sn-chips">${chip(`best streak <b>${PROFILE.best}</b> days`)}${chip(`level ${PROFILE.level} · ${PROFILE.title}`)}${chip(`<b>${PROFILE.words.toLocaleString("en-US")}</b> words saved`)}</div>`;
  const [streak, words] = b.querySelectorAll("b");
  return { still: () => {}, play: async () => { await Promise.all([countUp(streak, PROFILE.best), countUp(words, PROFILE.words)]); } };
};
SNIP["lx-pod"] = b => {
  const c = corpusFor("table stakes");
  b.innerHTML = `<p class="sn-mono"><span class="play">${ICON.play}</span>${hms(c.at)} · ${esc(c.show)}, “${esc(c.title)}”</p>
    <div class="sn-prog"><i></i></div><p class="sn-q">“${hl(excerpt(c.text, c.word), c.word)}”</p>`;
  const prog = b.querySelector(".sn-prog"), m = b.querySelector("mark");
  return { still: () => { prog.classList.add("in"); m.classList.add("on"); }, play: async () => { await sleep(200); prog.classList.add("in"); await sleep(600); m.classList.add("on"); } };
};
SNIP["lx-status"] = b => {
  const rows = [["appall", "Can Write"], ["go against the grain", "Reviewing"], ["stretched thin", "Reviewing"]]; // real statuses (R9)
  b.innerHTML = rows.map(([w, st]) => `<div class="sn-status"><span>${esc(w)}</span><span>${chip(st, true)}</span></div>`).join("");
  const chips = [...b.querySelectorAll(".chip")];
  const on = c => flip(c, c.textContent);
  return { still: () => chips.slice(0, 3).forEach(on), play: async () => { for (const c of chips.slice(0, 3)) { await sleep(450); on(c); } } };
};
/* LexiSpeak */
SNIP["sp-modes"] = b => {
  const keys = ["casual", "interview", "business", "group"];
  b.innerHTML = `<div class="sn-chips">${keys.map(k => chip(esc(D.modes[k].name), true)).join("")}</div>
    <p class="sn-l rv" style="margin-top:12px">${esc(D.modes.interview.persona)}</p>`;
  const chips = [...b.querySelectorAll(".chip")];
  const pick = i => chips.forEach((c, j) => c.classList.toggle("off", i !== j));
  return { still: () => { pick(1); showAll(b); }, play: async () => { for (const i of [0, 1, 2, 3, 1]) { pick(i); await sleep(300); } await steps(b, 100); } };
};
SNIP["sp-wave"] = b => {
  b.innerHTML = `<div class="bars sn-bars">${"<i></i>".repeat(36)}</div><p class="rec">● Recording <span>0:00</span></p>`;
  const bars = [...b.querySelectorAll(".bars i")], t = b.querySelector(".rec span");
  const draw = k => bars.forEach((x, i) => { x.style.height = `${8 + Math.abs(Math.sin(i * 0.5 + k * 0.9) * Math.cos(i * 0.17 + k)) * 90}%`; });
  return { still: () => { draw(3); t.textContent = "0:42"; },
    play: async () => { for (let k = 0; k <= 20; k++) { draw(k); t.textContent = mm(Math.round(k * 2.1)); await sleep(130); } } };
};
SNIP["sp-report"] = b => {
  const m = D.modes.interview;
  b.innerHTML = `<div class="sc" style="margin:0">${m.scores.map((v, i) => `<div><b>${v}</b><span>${LABELS[i]}</span></div>`).join("")}</div>`;
  const bs = [...b.querySelectorAll("b")];
  return { still: () => {}, play: async () => { await Promise.all(bs.map((x, i) => countUp(x, m.scores[i]))); } };
};
SNIP["sp-fix"] = b => {
  const f = D.modes.business.fixes[0];
  b.innerHTML = `<p class="fixl" style="margin:0"><s>${esc(f[0])}</s><span class="rv">more natural: ${esc(f[1])}</span><span class="why rv">${esc(short(f[2], 80))}</span></p>`;
  return { still: () => showAll(b), play: async () => { await sleep(300); await steps(b, 350); } };
};
SNIP["sp-back"] = b => {
  // R9: no word in my real notebook has passed a speaking check yet, so this shows a real word without a status.
  b.innerHTML = `<p class="sn-l">mull over</p>`;
  return { still: () => {}, play: async () => {} };
};
/* Writing Station */
SNIP["ws-fix"] = b => {
  const r = D.journal.review[Object.keys(D.journal.review).find(k => /break down them/.test(k))];
  b.innerHTML = `<div class="sn-two"><p class="sn-txt">…identify the sentences within and break <span class="s">down them</span>.</p>
    <p class="sn-margin rv"><span class="lab err">Error</span><span class="fxl">break them down</span><span class="why">${esc(r.why)}</span></p></div>`;
  const s = b.querySelector(".s");
  return { still: () => { s.classList.add("mk"); showAll(b); }, play: async () => { await sleep(400); s.classList.add("mk"); await steps(b, 450); } };
};
SNIP["ws-idiom"] = b => {
  const r = D.journal.review[Object.keys(D.journal.review).find(k => D.journal.review[k].t === "idi")];
  const why = (r.why.match(/[^.]*Debriefing[^.]*\./) || [short(r.why, 90)])[0].trim();
  b.innerHTML = `<div class="sn-two"><p class="sn-txt">…words in my notebook, keep <span class="s idi">debriefing the words</span>.</p>
    <p class="sn-margin rv"><span class="lab">More natural</span><span class="fxl">continuously reinforcing those words</span><span class="why">${esc(why)}</span></p></div>`;
  const s = b.querySelector(".s");
  return { still: () => { s.classList.add("mk"); showAll(b); }, play: async () => { await sleep(400); s.classList.add("mk"); await steps(b, 450); } };
};
SNIP["ws-journal"] = b => {
  const e = D.journal.entry;
  b.innerHTML = `<ul class="sn-list">${["Sep 1", "Aug 28", e.date].map(d => `<li class="rv${d === e.date ? " cur-row" : ""}"><span>${esc(d)}</span><span class="muted">${d === e.date ? esc(e.title) : ""}</span></li>`).join("")}</ul>`;
  const cur = b.querySelector(".cur-row");
  return { still: () => { showAll(b); cur.classList.add("cur"); }, play: async () => { await steps(b, 220); await sleep(300); cur.classList.add("cur"); } };
};
SNIP["ws-local"] = b => {
  b.innerHTML = `<p class="sn-mono">Mac · iPad · iPhone · home Wi-Fi</p>${chip("saving…", true)}`;
  const c = b.querySelector(".chip"), done = () => flip(c, "saved locally · yours");
  return { still: done, play: async () => { await sleep(800); done(); } };
};
/* Meta Muse */
SNIP["mu-note"] = b => {
  b.innerHTML = `<div class="sn-note rv"><p class="sn-mono" style="margin:0 0 2px">Muse · 9:14 pm</p><p class="sn-l" style="margin:0">8 words due tonight. Ready for your LexiAI review?</p></div>`;
  return { still: () => showAll(b), play: async () => { await sleep(200); showAll(b); } };
};
SNIP["mu-card"] = b => {
  const w = museWord("flesh out");
  b.innerHTML = `<p class="sn-big">${esc(w.word)}?</p><p class="sn-l rv"><span class="pos">${esc(w.pos)}</span> — ${esc(short(w.definition, 80))}</p>`;
  return { still: () => showAll(b), play: async () => { await sleep(900); showAll(b); } };
};
SNIP["mu-rate"] = b => {
  const w = museWord("flesh out"), next = sm2({ interval: w.interval, ease: w.ease, reps: 1 }, "good");
  b.innerHTML = `<div class="rates sn-rates" style="margin-top:0"><b>Again</b><b>Hard</b><b>Good</b><b>Easy</b></div><p class="sn-mono rv">${esc(w.word)} · Good → next in ${next.interval} days</p>`;
  const good = b.querySelectorAll(".rates b")[2];
  return { still: () => { good.classList.add("on"); showAll(b); }, play: async () => { await sleep(600); good.classList.add("on"); await steps(b, 400); } };
};
SNIP["mu-back"] = b => {
  b.innerHTML = `<div class="term"><p class="rv"><code>POST /reviews · flesh out · good</code></p><p class="rv ok"><code>SM-2 applied · words table updated</code></p></div>${chip("waiting", true)}`;
  const c = b.querySelector(".chip"), done = () => flip(c, "SM-2 written back via muse-api");
  return { still: () => { showAll(b); done(); }, play: async () => { await steps(b, 450); await sleep(300); done(); } };
};
/* podcast-dig */
SNIP["bt-term"] = b => {
  b.innerHTML = `<p class="sn-term"><code class="q"></code><span class="caret"></span></p><p class="sn-mono rv">→ ranked episodes · timestamped transcripts · Obsidian</p>`;
  const q = b.querySelector(".q"), cmd = "/podcast-dig <topic>";
  return { still: () => { q.textContent = cmd; showAll(b); }, play: async () => { await typeIn(q, cmd, 60); await steps(b, 350); } };
};
SNIP["bt-line"] = b => {
  const c = corpusFor("outweigh");
  b.innerHTML = `<p class="sn-mono">${hms(c.at)} · ${esc(c.show)} ${ICON.star}</p><p class="sn-q" style="margin:0">“${hl(excerpt(c.text, c.word), c.word)}”</p>`;
  const m = b.querySelector("mark"), star = b.querySelector(".star");
  return { still: () => { m.classList.add("on"); star.classList.add("on"); }, play: async () => { await sleep(400); m.classList.add("on"); await sleep(500); star.classList.add("on"); } };
};
SNIP["bt-cache"] = b => {
  b.innerHTML = `<p class="sn-mono">new episode → already in corpus.db?</p>${chip("checking…", true)}`;
  const c = b.querySelector(".chip"), done = () => flip(c, "transcribed once, shared with LexiAI");
  return { still: done, play: async () => { await sleep(900); done(); } };
};

/* scroll cue under the hero: gone after the first scroll */
addEventListener("scroll", function cue() { if (scrollY > 40) { document.body.classList.add("scrolled"); removeEventListener("scroll", cue); } }, { passive: true });

/* ================= Revision 4: the journey stage (index) =================
   One word, "erode", through each tool. Fragments are built from the same frozen data. */
const ERODE = () => {
  const w = lexiWord("erode"), every = w.meanings[0].defs[1], fin = w.meanings[1].defs[0];
  return { w, every: every.def.split(";")[0] + ".", fin: fin.def.replace(/^\([^)]*\)\s*to\s*/i, "To ").split(", often")[0] + ".", ex: fin.ex[0], ipa: w.ipa };
};
SNIP["st-lexi"] = b => {
  const e = ERODE();
  b.innerHTML = `<p class="sn-w"><span class="w">erode</span> <span class="ipa">${esc(e.ipa)}</span></p>
    <p class="sn-l"><span class="pos">verb</span> — ${esc(e.every)}</p>
    <p class="sn-l"><span class="pos">verb (Finance)</span> — ${esc(e.fin)}</p>
    <p class="sn-ex">“${esc(e.ex)}”</p>${chip("Saved to notebook")}`;
  b.querySelector(".chip").classList.add("ok");
  return { still: () => {}, play: async () => {} };
};
SNIP["st-muse"] = b => {
  const e = ERODE();
  b.innerHTML = `<div class="sn-note"><p class="sn-mono">Muse · 9:14 pm</p><p class="sn-l" style="margin:0">8 words due tonight. Ready for your LexiAI review?</p></div>
    <p class="sn-big" style="margin-top:22px">erode?</p>
    <p class="sn-l rv"><span class="pos">verb</span> — ${esc(e.every)}</p>
    <div class="rates sn-rates"><b>Again</b><b>Hard</b><b>Good</b><b>Easy</b></div>
    <p class="sn-mono rv">Good · rating written back to LexiAI</p>`;
  const [def, note] = b.querySelectorAll(".rv"), good = b.querySelectorAll(".rates b")[2];
  return { still: () => { showAll(b); good.classList.add("on"); },
    play: async () => { await sleep(500); def.classList.add("in"); await sleep(700); good.classList.add("on"); await sleep(400); note.classList.add("in"); } };
};
SNIP["st-write"] = b => SNIP["ws-fix"](b);
SNIP["st-speak"] = b => {
  const m = D.modes.interview;
  b.innerHTML = `<p class="sn-l"><em>${esc(m.name)}</em> · ${esc(m.persona)}</p>
    <div class="bars sn-bars">${"<i></i>".repeat(40)}</div><p class="rec">● Recording <span>0:00</span></p>
    <div class="sn-chips" style="margin-top:14px"><span class="chip"><i></i>erode</span>${chip("Can Speak: not yet", true)}</div>`;
  const bars = [...b.querySelectorAll(".bars i")], t = b.querySelector(".rec span"), c = b.querySelectorAll(".chip")[1];
  const draw = k => bars.forEach((x, i) => { x.style.height = `${8 + Math.abs(Math.sin(i * 0.5 + k * 0.9) * Math.cos(i * 0.17 + k)) * 90}%`; });
  const done = () => flip(c, "Can Speak, written back to LexiAI");
  return { still: () => { draw(3); t.textContent = "0:42"; done(); },
    play: async () => { for (let k = 0; k <= 20; k++) { draw(k); t.textContent = mm(Math.round(k * 2.1)); await sleep(130); } done(); } };
};
SNIP["st-pod"] = b => {
  const h = (lexiWord("erode").heard || [])[0] || corpusFor("erode");
  b.innerHTML = `<p class="sn-mono">${hms(h.at)} · ${esc(h.show)}, “${esc(h.title)}” ${ICON.star}</p>
    ${h.clip ? `<button type="button" class="sn-play" aria-pressed="false">${ICON.play}${ICON.pause}<span class="lbl">Play the clip</span></button>` : ""}
    <p class="sn-q" style="font-size:1.25em;line-height:1.45">“${hl(h.text, "erode")}”</p>${chip("Highlighted · saved to Obsidian", true)}`;
  const m = b.querySelector("mark"), star = b.querySelector(".star"), c = b.querySelector(".chip"), btn = b.querySelector(".sn-play");
  if (btn) {
    let audio;
    btn.addEventListener("click", () => {
      audio = audio || new Audio(h.clip);
      audio.onended = () => { btn.setAttribute("aria-pressed", "false"); btn.querySelector(".lbl").textContent = "Play the clip"; };
      const on = audio.paused;
      on ? audio.play() : audio.pause();
      btn.setAttribute("aria-pressed", on);
      btn.querySelector(".lbl").textContent = on ? "Pause" : "Play the clip";
    });
  }
  const done = () => flip(c, "Highlighted · saved to Obsidian");
  return { still: () => { m.classList.add("on"); star.classList.add("on"); done(); },
    play: async () => { await sleep(400); m.classList.add("on"); await sleep(500); star.classList.add("on"); await sleep(300); done(); } };
};

/* Snippets outside the stage: render the finished card first; rebuild it into its
   start state just before it scrolls in, then play once. Stage panes play when shown. */
const players = new Map();
document.querySelectorAll("[data-snip]").forEach(el => {
  const f = SNIP[el.dataset.snip];
  if (!f || !D) return;
  const body = el.querySelector(".snip-body");
  f(body).still();
  if (el.closest("[data-stage]")) {
    players.set(el, () => { if (REDUCED) return; const { play } = f(body); Promise.resolve().then(play).catch(() => {}).finally(() => showAll(body)); });
    return;
  }
  let play;
  onView(el, () => { ({ play } = f(body)); }, () => Promise.resolve().then(play).catch(() => {}).finally(() => showAll(body)), 0.4);
});

/* ================= Revision 19: startup research tree =================
   The spine draws down once the tree scrolls in, nodes fade in one by one (skipped with reduced motion).
   Competition's 8-moats branch starts closed; its button (or a click anywhere on that node) opens it. */
document.querySelectorAll("[data-tree]").forEach(tree => {
  onView(tree, () => tree.classList.add("pre"), () => { tree.classList.add("on"); setTimeout(() => tree.classList.add("done"), 3000); }, 0.05);
  const key = tree.querySelector(".tr-key"), btn = key && key.querySelector(".tr-x");
  if (!btn) return;
  const set = open => { key.classList.toggle("open", open); btn.setAttribute("aria-expanded", String(open)); };
  set(false);
  btn.addEventListener("click", e => { e.stopPropagation(); set(!key.classList.contains("open")); });
  key.querySelector(".tr-c").addEventListener("click", e => {
    if (e.target.closest("a, .tr-sub") || getSelection().toString()) return;
    set(!key.classList.contains("open"));
  });
  key.querySelector(".tr-c").style.cursor = "pointer";
});
/* ================= Revision 29: AI Terms production loop =================
   Lines draw and nodes fade in once, in loop order (CSS delays by --k); static with reduced motion. */
document.querySelectorAll("[data-loop]").forEach(lp => onView(lp, () => lp.classList.add("pre"), () => lp.classList.add("on"), 0.2));
/* Annotated report: each pill sits level with the line it names (pushed down if pills would overlap),
   with a thin leader to the page edge. Hidden on phones, where the pills become a numbered list. */
function drawDoc(doc) {
  const svg = doc.querySelector(".doc-lines"), page = doc.querySelector(".doc-page");
  if (getComputedStyle(svg).display === "none" || !doc.offsetWidth) return;
  const d = doc.getBoundingClientRect(), edge = page.getBoundingClientRect().right - d.left;
  const rows = [...doc.querySelectorAll(".doc-notes li")].map(n => {
    const r = page.querySelector(`.an[data-a="${n.dataset.a}"]`).getClientRects()[0];
    return { n, y: r.top + r.height / 2 - d.top };
  }).sort((a, b) => a.y - b.y);
  let floor = 0, h = "";
  rows.forEach(({ n, y }) => {
    const top = Math.max(y - n.offsetHeight / 2, floor);
    n.style.top = top + "px";
    floor = top + n.offsetHeight + 10;
    const nx = n.offsetLeft, ny = top + n.offsetHeight / 2, ex = edge + 6;
    h += `<path d="M${ex} ${y.toFixed(1)} C${ex + 16} ${y.toFixed(1)} ${nx - 16} ${ny.toFixed(1)} ${nx} ${ny.toFixed(1)}"/><circle cx="${ex}" cy="${y.toFixed(1)}" r="2.5"/>`;
  });
  svg.innerHTML = h;
}
const docs = [...document.querySelectorAll("[data-doc]")];
if (docs.length) {
  const all = () => docs.forEach(drawDoc);
  all();
  (document.fonts ? document.fonts.ready : Promise.resolve()).then(all);
  addEventListener("resize", all, { passive: true });
}

/* Two-pager panes: pan the page from its top to its bottom while its step crosses the screen. */
const pans = [...document.querySelectorAll("[data-stage] .pg-pane")].map(p => ({
  img: p.querySelector("img"), win: p.querySelector(".pg-link"),
  step: [...document.querySelectorAll(".story-text [data-step]")].filter(s => s.dataset.step === p.dataset.pane).pop(),
})).filter(o => o.step && !o.win.closest(".wide"));
if (pans.length && !REDUCED) {
  let raf = 0;
  const pan = () => {
    raf = 0;
    pans.forEach(({ img, win, step }) => {
      const r = step.getBoundingClientRect(), span = r.height - innerHeight * 0.4;
      const t = Math.min(1, Math.max(0, (innerHeight * 0.7 - r.top) / Math.max(span, 1)));
      img.style.transform = `translateY(${(-t * Math.max(0, img.offsetHeight - win.clientHeight)).toFixed(1)}px)`;
    });
  };
  addEventListener("scroll", () => { if (!raf) raf = requestAnimationFrame(pan); }, { passive: true });
  addEventListener("resize", pan, { passive: true });
  pan();
}

/* The stage: whichever step crosses the middle of the screen owns it.
   Panes crossfade (CSS, 300ms, 8px rise; instant with reduced motion); the rail dots jump to a step. */
document.querySelectorAll("[data-stage]").forEach(stage => {
  const panes = [...stage.querySelectorAll(".pane")], dots = [...stage.querySelectorAll(".dot")];
  const steps = [...document.querySelectorAll("[data-step]")];
  const played = new Set([0]);
  let cur = 0;
  /* Revision 6: panes hold real screenshots. Panes 0–1 load with the page; the rest swap
     data-src/data-srcset in when the step before them is shown, so the next screen is always ready. */
  const load = j => panes[j] && panes[j].querySelectorAll("[data-src], [data-srcset]").forEach(el => {
    if (el.dataset.srcset) { el.srcset = el.dataset.srcset; delete el.dataset.srcset; }
    if (el.dataset.src) { el.src = el.dataset.src; delete el.dataset.src; }
  });
  const show = i => {
    if (i === cur || !panes[i]) return;
    load(i); load(i + 1);
    cur = i;
    panes.forEach((p, j) => { p.classList.toggle("on", j === i); p.toggleAttribute("aria-hidden", j !== i); });
    dots.forEach((d, j) => { d.classList.toggle("on", j === i); d.toggleAttribute("aria-current", j === i); });
    if (!played.has(i)) { played.add(i); panes[i].querySelectorAll("[data-snip]").forEach(el => (players.get(el) || (() => {}))()); }
  };
  if (getComputedStyle(stage).display !== "none") load(1);
  if ("IntersectionObserver" in window) {
    const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) show(+e.target.dataset.step); }), { rootMargin: "-50% 0px -49% 0px" });
    steps.forEach(s => io.observe(s));
  }
  dots.forEach((d, i) => d.addEventListener("click", () => {
    const t = steps.filter(s => +s.dataset.step === i).pop();
    if (t) t.scrollIntoView({ behavior: REDUCED ? "auto" : "smooth", block: "center" });
  }));
});
})();
