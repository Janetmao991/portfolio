"""R42: two hero-interaction options, MOCK ONLY. Writes _src/mock-hero/, never the live site or build.py.

Starts from the R40/R41 taste mock homepage (_src/mock-taste/index.html, the book-forest hero with taste.css) and
makes two standalone pages:
  option-a.html   EYES: the girl's eye follows the cursor (or the last tap), blinks, breathes      (a.css / a.js)
  option-b.html   LEAF DEFINITIONS: hover / click / tap / focus a falling word for a plain-English line  (b.css / b.js)
The leaf definitions live here (DEFS) and are checked against LEAF_WORDS in build.py, so every word has one.
Usage: python3 _src/capture/r42/make_mocks.py   (run _src/capture/r41/make_mock.py first if mock-taste is stale)
"""
import ast, json, pathlib, re, shutil

ROOT = pathlib.Path(__file__).resolve().parents[3]
HERE = pathlib.Path(__file__).resolve().parent
SRC = ROOT / "_src" / "mock-taste"
OUT = ROOT / "_src" / "mock-hero"

# one line each, plain English, no jargon inside the definition
DEFS = {
    "agents": "AI that works toward a goal on its own, choosing tools and taking steps until the job is done.",
    "RAG": "Retrieval-augmented generation: the AI looks things up in your documents first, then answers from them.",
    "tokens": "The small chunks of text, often pieces of words, that a model reads and writes.",
    "prompt": "The instructions and text you give an AI model to respond to.",
    "evals": "Tests that check how well an AI system does its job, so you can tell if a change made it better.",
    "transformer": "The neural-network design behind today's language models, built around attention.",
    "embeddings": "Text turned into lists of numbers that capture meaning, so similar ideas land close together.",
    "fine-tuning": "Training an existing model a little more on your own examples so it gets better at one task.",
    "context window": "How much text a model can take in at once: its short-term working memory.",
    "LLM": "Large language model: an AI trained on huge amounts of text to understand and write language.",
    "MCP": "Model Context Protocol: an open standard for plugging AI apps into tools and data.",
    "GPU": "The chip that does AI's math, running thousands of small calculations at the same time.",
    "inference": "Using a trained model to get an answer, as opposed to training it.",
    "attention": "How a model decides which other words matter most when it reads each word.",
    "vectors": "Ordered lists of numbers; in AI they mark where a meaning sits, like coordinates on a map.",
    "skills": "Folders of instructions and scripts that an agent like Claude loads when a task needs them.",
    "LoRA": "A cheap way to fine-tune: train a small add-on instead of changing the whole model.",
}

# every word that can fall, read straight from build.py (without importing it)
src = (ROOT / "_src" / "build.py").read_text()
node = next(n for n in ast.parse(src).body if isinstance(n, ast.Assign) and getattr(n.targets[0], "id", "") == "LEAF_WORDS")
words = {w for row in ast.literal_eval(node.value) for w in row[4]}
missing, extra = words - DEFS.keys(), DEFS.keys() - words
assert not missing, f"no definition for {missing}"
assert not extra, f"definitions for words that never fall: {extra}"

page = (SRC / "index.html").read_text()
# standalone: own copy of the assets the homepage uses; project links go back to the taste mock
if OUT.exists():
    shutil.rmtree(OUT)
(OUT / "assets").mkdir(parents=True)
for f in ["style.css", "taste.css", "hero.js", "map.js"]:
    shutil.copy(SRC / "assets" / f, OUT / "assets" / f)
shutil.copytree(SRC / "assets" / "fonts", OUT / "assets" / "fonts")
page = page.replace('href="projects/', 'href="../mock-taste/projects/')


def sub1(s, old, new):
    assert s.count(old) == 1, f"expected one match for {old[:60]!r}, found {s.count(old)}"
    return s.replace(old, new)


def layer(s, name, label):
    s = sub1(s, '<link rel="stylesheet" href="assets/taste.css">',
             f'<link rel="stylesheet" href="assets/taste.css">\n<link rel="stylesheet" href="assets/{name}.css">')
    s = sub1(s, '<script src="assets/map.js"></script>', f'<script src="assets/map.js"></script>\n<script src="assets/{name}.js"></script>')
    s = sub1(s, "<title>Janet Mao — AI builder</title>", f"<title>R42 mock {label} — Janet Mao</title>")
    shutil.copy(HERE / f"{name}.css", OUT / "assets" / f"{name}.css")
    return s


# ---------- option A: eyes ----------
a = page
# her eye while she looks up (phase 2) and while she reads (final pose): pupil + white catchlight inside .lid (blinks)
# inside .look (follows), inside .eye (the fixed socket, used to measure from); data-rot = the head's tilt
a = sub1(a, '<circle cx="6" cy="1" r="2" fill="#555" stroke="none"/>',
         '<g class="eye" data-cx="6" data-cy="1"><g class="look"><g class="lid"><circle cx="6" cy="1" r="2" fill="#555" stroke="none"/>'
         '<circle cx="6.75" cy=".25" r=".5" fill="#fff" stroke="none"/></g></g></g>')
a = sub1(a, '<circle cx="6" cy="1" r="2.6" fill="#555" stroke="none"/><circle cx="6.9" cy=".1" r=".9" fill="#fbfaf6" stroke="none"/>',
         '<g class="eye" data-cx="6" data-cy="1"><g class="look"><g class="lid"><circle cx="6" cy="1" r="2.6" fill="#555" stroke="none"/>'
         '<circle cx="6.95" cy=".05" r=".62" fill="#fff" stroke="none"/></g></g></g>')
# breathing: body + head of the final pose; the arms stay on the book
m = re.search(r'(<g class="in" style="--t:5\.8s">)(.*?)(\n<path d="M80 128Q102 140 126 145)', a, re.S)
assert m, "final pose not found"
a = a[:m.start()] + m.group(1) + '<g class="breathe">' + m.group(2) + "</g>" + m.group(3) + a[m.end():]
a = layer(a, "a", "A · eyes")
shutil.copy(HERE / "a.js", OUT / "assets" / "a.js")
(OUT / "option-a.html").write_text(a)

# ---------- option B: leaf definitions ----------
b = page
b = sub1(b, '<div class="forest" aria-hidden="true"><svg class="fx-story" viewBox="0 6 260 184" aria-hidden="true">',
         '<div class="forest"><svg class="fx-story" viewBox="0 6 260 184" role="group" aria-label="Falling AI words. Choose one to read what it means.">')
# the drawing itself stays hidden from screen readers; only the leaves are exposed
b = sub1(b, '<g class="pt" style="--k:-2">', '<g class="pt" style="--k:-2" aria-hidden="true">')
b = sub1(b, '<g stroke="#555" stroke-width="2.2"', '<g aria-hidden="true" stroke="#555" stroke-width="2.2"')
n = 0


def leaf(mm):  # label each leaf with the word it starts as (b.js keeps it in step when the word changes)
    global n
    n += 1
    word = re.search(r'>([^<]+)</text>', b[mm.end():]).group(1)
    return f'<g class="lf" tabindex="0" role="button" aria-label="{word}" style="{mm.group(1)}">'


b = re.sub(r'<g class="lf" style="([^"]+)">', leaf, b)
assert n == 5, n
b = sub1(b, '<p class="vh">A short drawing:',
         '<div class="def" id="leaf-def" role="tooltip"><b class="def-t"></b><span class="def-d"></span></div>'
         '<span class="def-ring" aria-hidden="true"></span><p class="vh">A short drawing:')
b = layer(b, "b", "B · leaf definitions")
(OUT / "assets" / "b.js").write_text((HERE / "b.js").read_text().replace("__DEFS__", json.dumps(DEFS, indent=1, ensure_ascii=False)))
(OUT / "option-b.html").write_text(b)

print("wrote", OUT / "option-a.html", "and", OUT / "option-b.html", "·", len(DEFS), "definitions")
