"""R45: Option A (eyes) + colour A (soft aurora) + colour B (pollen + glow) on one page. MOCK ONLY.
Writes _src/mock-hero/color-ab.html, never the live site. No Option B leaf tooltips, no colour-C story beats.

Starts from the R42 mock _src/mock-hero/option-a.html (eye follows, blinks, breathes; a.css / a.js unchanged; a.js
already sends the "blink" event added in R44). The two colour ideas are staged so they never fight:
  3.7s   sprout appears   16 coloured pollen motes rise once out of the open book (gone by ~7.6s)
  5.6s   tree grown       a warm apricot glow settles under the canopy, then breathes slowly (8s)
  7.6s   pollen gone      the pastel aurora (mint / lilac / coral) fades in behind the tree and drifts slowly;
                          the falling leaves take tinted edges with it
  later  on a blink       now and then (about one every ~40s) a coloured mote lifts off near her face
Layer order, back to front: aurora, glow, (drawing), pollen + motes. Everything sits inside the drawing and moves only
transform / opacity, so nothing on the page can shift. Without .tell (no JS, reduced motion): aurora, glow and leaf
edges shown, still; no pollen, no motes.
Usage: python3 _src/capture/r45/make_mock.py
"""
import pathlib, random, shutil

ROOT = pathlib.Path(__file__).resolve().parents[3]
HERE = pathlib.Path(__file__).resolve().parent
OUT = ROOT / "_src" / "mock-hero"
s = (OUT / "option-a.html").read_text()
assert 'new CustomEvent("blink")' in (OUT / "assets" / "a.js").read_text(), "run _src/capture/r44/make_mocks.py first"


def sub1(s, old, new):
    assert s.count(old) == 1, f"expected one match for {old[:60]!r}, found {s.count(old)}"
    return s.replace(old, new)


def soft(gid, color, mid=.55):                            # a radial blob that fades to nothing at its edge
    return (f'<radialGradient id="{gid}"><stop offset="0" stop-color="{color}"/>'
            f'<stop offset=".5" stop-color="{color}" stop-opacity="{mid}"/>'
            f'<stop offset="1" stop-color="{color}" stop-opacity="0"/></radialGradient>')


DEFS_END = '<stop offset="1" stop-color="#dfe5dd" stop-opacity="0"/></radialGradient></defs>'
BEHIND = '<g stroke="#555" stroke-width="2.2"'          # the drawing itself starts here; colour goes just before it

MINT, LILAC, CORAL = "#c4e6d4", "#ddd0f0", "#f6cdbd"                # aurora (same as R44 A)
POLLEN = ["#f0cf7a", "#f2b49b", "#c4b0e6", "#9fd4b8", "#aec8ec"]  # butter, peach, lilac, mint, sky (same as R44 B)

defs = (soft("au-m", MINT) + soft("au-l", LILAC) + soft("au-c", CORAL) + soft("wg", "#f5d29a", .6)
        + "".join(soft(f"pn-{i}", c, .8) for i, c in enumerate(POLLEN)))

aurora = ('<g class="pt" style="--k:-1.5"><g class="aur">'
          '<g class="au" style="--a:au-1;--s:23s"><ellipse cx="116" cy="92" rx="76" ry="52" fill="url(#au-m)"/></g>'
          '<g class="au" style="--a:au-2;--s:29s"><ellipse cx="198" cy="70" rx="68" ry="50" fill="url(#au-l)"/></g>'
          '<g class="au" style="--a:au-3;--s:19s"><ellipse cx="156" cy="40" rx="72" ry="40" fill="url(#au-c)"/></g>'
          '</g></g>')
glow = '<g class="pt" style="--k:-1"><g class="wglow"><ellipse cx="156" cy="106" rx="74" ry="36" fill="url(#wg)"/></g></g>'

# all 16 motes rise from the open book with the sprout, in a quick fan (3.7s .. 4.9s start, 2.3-2.7s each)
rnd = random.Random(45)
motes = []
for i in range(16):
    x, y, t = 156 + rnd.uniform(-11, 11), 130 + rnd.uniform(-4, 3), 3.7 + i * .08
    dx, dy, r = rnd.uniform(-22, 22), -rnd.uniform(34, 70), rnd.uniform(2.4, 3.4)
    motes.append(f'<circle class="pn" cx="{x:.1f}" cy="{y:.1f}" r="{r:.1f}" fill="url(#pn-{i % 5})" '
                 f'style="--t:{t:.2f}s;--x:{dx:.1f};--y:{dy:.1f};--s:{rnd.uniform(2.3, 2.7):.2f}s"/>')
pollen = '<g class="pt" style="--k:1"><g class="pollen">' + "".join(motes) + '</g><g class="motes"></g></g>'

s = sub1(s, DEFS_END, DEFS_END.replace("</defs>", defs + "</defs>"))
s = sub1(s, BEHIND, aurora + glow + pollen + "\n" + BEHIND)
s = sub1(s, '<link rel="stylesheet" href="assets/a.css">',
         '<link rel="stylesheet" href="assets/a.css">\n<link rel="stylesheet" href="assets/color-ab.css">')
s = sub1(s, '<script src="assets/a.js"></script>', '<script src="assets/a.js"></script>\n<script src="assets/color-ab.js"></script>')
s = sub1(s, "<title>R42 mock A · eyes — Janet Mao</title>", "<title>R45 mock A+B · aurora + pollen — Janet Mao</title>")
for f in ("color-ab.css", "color-ab.js"):
    shutil.copy(HERE / f, OUT / "assets" / f)
(OUT / "color-ab.html").write_text(s)
print("wrote", OUT / "color-ab.html")
