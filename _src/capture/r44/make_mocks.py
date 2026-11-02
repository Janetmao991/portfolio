"""R44: Option A (eyes) + three colour variants, MOCK ONLY. Writes _src/mock-hero/color-*.html, never the live site.

Starts from the R42 mock _src/mock-hero/option-a.html (the book-forest hero with the eye that follows, blinks and
breathes; a.css / a.js stay exactly as they are) and adds one colour layer per page:
  color-a.html   SOFT AURORA      after the forest grows, a pastel wash (mint, lilac, coral) drifts behind the tree;
                                  falling leaves and their words get soft tinted edges            (color-a.css)
  color-b.html   POLLEN + GLOW    coloured pollen rises once with the sprout and the tree, then a warm glow settles
                                  under the canopy; now and then a coloured mote when she blinks   (color-b.css / .js)
  color-c.html   STORY BEATS      amber when the book opens, green when the sprout appears, blue-lilac when the
                                  leaves start to fall as words; each beat < 1.2s, then it settles  (color-c.css)
Every colour layer sits inside the drawing (no layout), behind the tree, and moves only transform / opacity.
Without .tell (no JS, reduced motion) each page shows its settled, still colours.
Usage: python3 _src/capture/r44/make_mocks.py   (run _src/capture/r42/make_mocks.py first if option-a is stale)
"""
import pathlib, random, shutil

ROOT = pathlib.Path(__file__).resolve().parents[3]
HERE = pathlib.Path(__file__).resolve().parent
OUT = ROOT / "_src" / "mock-hero"
base = (OUT / "option-a.html").read_text()


def sub1(s, old, new):
    assert s.count(old) == 1, f"expected one match for {old[:60]!r}, found {s.count(old)}"
    return s.replace(old, new)


DEFS_END = '<stop offset="1" stop-color="#dfe5dd" stop-opacity="0"/></radialGradient></defs>'
BEHIND = '<g stroke="#555" stroke-width="2.2"'          # the drawing itself starts here; colour goes just before it


def soft(gid, color, mid=.55):                            # a radial blob that fades to nothing at its edge
    return (f'<radialGradient id="{gid}"><stop offset="0" stop-color="{color}"/>'
            f'<stop offset=".5" stop-color="{color}" stop-opacity="{mid}"/>'
            f'<stop offset="1" stop-color="{color}" stop-opacity="0"/></radialGradient>')


def page(name, label, defs, behind, extra=lambda s: s, js=False):
    s = sub1(base, DEFS_END, DEFS_END.replace("</defs>", defs + "</defs>"))
    s = sub1(s, BEHIND, behind + "\n" + BEHIND)
    s = extra(s)
    s = sub1(s, '<link rel="stylesheet" href="assets/a.css">',
             f'<link rel="stylesheet" href="assets/a.css">\n<link rel="stylesheet" href="assets/{name}.css">')
    if js:
        s = sub1(s, '<script src="assets/a.js"></script>', f'<script src="assets/a.js"></script>\n<script src="assets/{name}.js"></script>')
        shutil.copy(HERE / f"{name}.js", OUT / "assets" / f"{name}.js")
    s = sub1(s, "<title>R42 mock A · eyes — Janet Mao</title>", f"<title>R44 mock {label} — Janet Mao</title>")
    shutil.copy(HERE / f"{name}.css", OUT / "assets" / f"{name}.css")
    (OUT / f"{name}.html").write_text(s)
    print("wrote", OUT / f"{name}.html")


# a.js tells the page when she blinks (an inert event; the blink itself is unchanged). Only color-b listens.
ajs = (OUT / "assets" / "a.js").read_text()
if 'new CustomEvent("blink")' not in ajs:
    ajs = sub1(ajs, "close(0); if (Math.random() < 1 / 7) close(1);",
               'close(0); if (Math.random() < 1 / 7) close(1);\n      fx.dispatchEvent(new CustomEvent("blink"));')
    (OUT / "assets" / "a.js").write_text(ajs)

# ---------- A: soft aurora ----------
MINT, LILAC, CORAL = "#c4e6d4", "#ddd0f0", "#f6cdbd"
page("color-a", "A · soft aurora",
     soft("au-m", MINT) + soft("au-l", LILAC) + soft("au-c", CORAL),
     '<g class="pt" style="--k:-1.5"><g class="aur">'
     '<g class="au" style="--a:au-1;--s:23s"><ellipse cx="116" cy="92" rx="76" ry="52" fill="url(#au-m)"/></g>'
     '<g class="au" style="--a:au-2;--s:29s"><ellipse cx="198" cy="70" rx="68" ry="50" fill="url(#au-l)"/></g>'
     '<g class="au" style="--a:au-3;--s:19s"><ellipse cx="156" cy="40" rx="72" ry="40" fill="url(#au-c)"/></g>'
     '</g></g>')

# ---------- B: coloured pollen + warm glow ----------
POLLEN = ["#f0cf7a", "#f2b49b", "#c4b0e6", "#9fd4b8", "#aec8ec"]  # butter, peach, lilac, mint, sky
rnd = random.Random(44)
motes = []
for i in range(16):
    if i < 6:   # with the sprout, from the open book
        x, y, t = 156 + rnd.uniform(-9, 9), 130 + rnd.uniform(-4, 3), 3.7 + i * .09
    else:       # as the tree grows, from along the branches
        x, y, t = rnd.uniform(118, 196), rnd.uniform(96, 126), 4.3 + (i - 6) * .11
    dx, dy, r = rnd.uniform(-12, 12), -rnd.uniform(30, 58), rnd.uniform(2.4, 3.4)
    motes.append(f'<circle class="pn" cx="{x:.1f}" cy="{y:.1f}" r="{r:.1f}" fill="url(#pn-{i % 5})" '
                 f'style="--t:{t:.2f}s;--x:{dx:.1f};--y:{dy:.1f};--s:{rnd.uniform(2.4, 3.2):.2f}s"/>')
page("color-b", "B · pollen + glow",
     soft("wg", "#f5d29a", .6) + "".join(soft(f"pn-{i}", c, .8) for i, c in enumerate(POLLEN)),
     '<g class="pt" style="--k:-1"><g class="wglow"><ellipse cx="156" cy="106" rx="74" ry="36" fill="url(#wg)"/></g></g>'
     '<g class="pt" style="--k:1"><g class="pollen">' + "".join(motes) + '</g><g class="motes"></g></g>', js=True)

# ---------- C: story colour beats ----------
page("color-c", "C · story colour beats",
     soft("bt-a", "#f4c47c", .5) + soft("bt-g", "#b3dcb6", .5) + soft("bt-l", "#b7baf0", .55),
     '<g class="pt" style="--k:-1.5">'
     '<g class="bt" style="--t:2.85s"><ellipse cx="156" cy="140" rx="96" ry="52" fill="url(#bt-a)"/></g>'
     '<g class="bt" style="--t:3.7s"><ellipse cx="156" cy="122" rx="62" ry="44" fill="url(#bt-g)"/></g>'
     '<g class="bt" style="--t:5.55s"><ellipse cx="156" cy="72" rx="116" ry="64" fill="url(#bt-l)"/></g>'
     '</g>',
     extra=lambda s: sub1(s, '<span class="fx-cap" style="--t:3.0s;--u:5.4s">',
                          '<span class="fx-cap c-amber" style="--t:3.0s;--u:5.4s">').replace(
                          '<span class="fx-cap last" style="--t:5.8s">', '<span class="fx-cap last c-lilac" style="--t:5.8s">'))
