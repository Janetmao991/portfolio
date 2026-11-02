#!/bin/zsh
# R18: the seven Writing Station crops, taken through driver.mjs (:5199) from the capture copy (:5198).
# Each shot returns its clip plus `ring` (the callout box, CSS px relative to the clip); the rings are
# collected in /tmp/r18-raw/rings.json and copied (x2 for the 2x PNGs) into build.py.
set -e
D=localhost:5199
F='const U = (...rs) => rs.reduce((a, r) => ({ left: Math.min(a.left, r.left), top: Math.min(a.top, r.top), right: Math.max(a.right, r.right), bottom: Math.max(a.bottom, r.bottom) }));
  const pad = (r, p) => ({ left: r.left - p, top: r.top - p, right: r.right + p, bottom: r.bottom + p });
  const C = (c, g) => box(c.left, c.top, c.right, c.bottom, { ring: [g.left - c.left, g.top - c.top, g.right - g.left, g.bottom - g.top].map(Math.round) });
  const closePanel = async () => { const x = $("#panel-close"); if (x && R(x).width) { x.click(); await wait(500); } };
  const tab = async t => { byText(new RegExp("^" + t + "$"), "button")[0].click(); await wait(800); };'
shot() { echo "$1: $(curl -s -X POST "$D/shot?name=$1" --data "$F $2")" | tee -a /tmp/r18-raw/rings.txt; }
: > /tmp/r18-raw/rings.txt

# 1. The desk: write view at 1280x800, journal folder open; callout on the entry card in the sidebar.
curl -s -X POST "$D/size?w=1280&h=800" >/dev/null
curl -s -X POST $D/eval --data "$F await closePanel(); byText(/Back to writing/, 'button')[0]?.click(); await wait(900); if (!byText(/^Update of Lexi AI\$/).some(e => R(e).left < 200)) byText(/^JOURNAL\$/i)[0].click(); await wait(800); return 1" >/dev/null
shot ws-desk 'const card = byText(/^Update of Lexi AI$/).find(e => R(e).left < 200).closest("[class]:not(h3):not(h4):not(b)"); let c = card; while (R(c).height < 90 && R(c.parentElement).height < 200) c = c.parentElement;
  return C({ left: 0, top: 0, right: innerWidth, bottom: innerHeight }, pad(R(c), 6));'

# Everything else at 1280x2400, so nothing scrolls and every rect is a page rect.
curl -s -X POST "$D/size?w=1280&h=2400" >/dev/null
curl -s -X POST $D/eval --data "$F location.reload(); return 1" >/dev/null; sleep 3

# 2. Annotated view: tabs, legend and the marked text; callout on the legend.
curl -s -X POST $D/eval --data "$F await closePanel(); await tab('Annotated'); return 1" >/dev/null
shot ws-annotated 'const tabs = byText(/^Annotated$/, "button")[0].parentElement, leg = byText(/^opportunity$/)[0].parentElement;
  const marks = $$("mark").filter(m => R(m).width), last = marks[marks.length - 1];
  const sheet = R(tabs.closest("article, .paper, .sheet") || tabs.parentElement.parentElement);
  return C({ left: R(tabs).left - 28, top: R(tabs).top - 24, right: sheet.right - (sheet.right - R(leg).right) + 28, bottom: R(last).bottom + 30 }, pad(R(leg), 8));'

# 3. The note for a red mark; callout on the explanation.
curl -s -X POST $D/eval --data "$F byText(/^break down them\$/)[0].click(); await wait(900); return 1" >/dev/null
shot ws-note 'const pnl = $(".panel.open"), d = pnl.querySelector(".ann-detail"), ex = pnl.querySelector(".expl").parentElement;
  return C({ left: R(pnl).left, top: R(pnl).top, right: R(pnl).right, bottom: R(d).bottom + 28 }, pad(R(ex), 10));'

# 4. Compare: original vs native editor's version; callout on the rewrite.
curl -s -X POST $D/eval --data "$F await closePanel(); await tab('Compare'); await until(() => /NATIVE EDITOR/.test(\$('.compare').innerText)); await wait(800); return 1" >/dev/null
shot ws-compare 'const cmp = $(".compare"), nat = byText(/^NATIVE EDITOR.S VERSION$/i)[0], col = nat.parentElement;
  const c = pad(R(cmp), 26); c.top = R(nat).top - 22; return C(c, pad(U(R(nat), R(col.lastElementChild)), 8));'

# 5. The Editor chat (the one question asked for this page); callout on the three alternatives.
curl -s -X POST $D/eval --data "$F byText(/Editor\$/, 'button')[0].click(); await until(() => \$('.msg.editor')); await wait(800); return 1" >/dev/null
shot ws-editor 'const pnl = $(".panel.open"), body = pnl.querySelector(".panel-body"), q = pnl.querySelector(".msg.user"), a = pnl.querySelector(".msg.editor");
  const rg = document.createRange(), tn = [...a.querySelectorAll("*"), a].flatMap(e => [...e.childNodes]).filter(n => n.nodeType === 3);
  const find = s => { for (const n of tn) { const i = n.textContent.indexOf(s); if (i >= 0) return [n, i]; } };
  const [n1, i1] = find("- \"so you keep"), [n2, i2] = find("rather than the action.");
  rg.setStart(n1, i1); rg.setEnd(n2, i2 + "rather than the action.".length); const opt = rg.getBoundingClientRect();
  const [n3, i3] = find("For a friendly"); rg.setStart(n3, i3); rg.setEnd(n3, i3 + 5); const cut = rg.getBoundingClientRect();
  return C({ left: R(pnl).left, top: R(pnl).top, right: R(pnl).right, bottom: cut.top - 14 }, { left: opt.left - 12, top: opt.top - 10, right: opt.right + 12, bottom: opt.bottom + 10 });'

# 6. A violet note: a notebook word that would fit; callout on "From your notebook".
curl -s -X POST $D/eval --data "$F await closePanel(); await tab('Annotated'); byText(/^when you need to look up the expressions\$/)[0].click(); await wait(900); return 1" >/dev/null
shot ws-opportunity 'const pnl = $(".panel.open"), d = pnl.querySelector(".ann-detail"), nb = pnl.querySelector(".nb-card");
  return C({ left: R(pnl).left, top: R(pnl).top, right: R(pnl).right, bottom: R(d).bottom + 28 }, pad(R(nb), 8));'

# 7. Notebook words used well (green), credited back to LexiAI as Can Write; callout on the box.
curl -s -X POST $D/eval --data "$F await closePanel(); return 1" >/dev/null
shot ws-usedwell 'const h = byText(/^Notebook words you used well/)[0]; let b = h; while (!/rgb\(2[0-9]{2}, 2[0-9]{2}/.test(getComputedStyle(b).backgroundColor) || R(b).height < 60) b = b.parentElement;
  return C(pad(R(b), 26), pad(R(b), 6));'
