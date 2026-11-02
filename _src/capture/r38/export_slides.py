#!/usr/bin/env python3
"""R38: export the 5 key slides of each finished AI Terms episode (English films in ~/AI-Terms/成片).
For each slide: one frame from the final video at the end of a chosen voice line (the scene fully drawn),
cropped above the burned-in caption band, saved as 1600px JPG + WebP into assets/ai-terms/films/<slug>/.
The caption under each slide is the film's own subtitle text (assets/vo/timeline.js), written to _src/aiterm_slides.json.
Run: python3 _src/capture/r38/export_slides.py   (needs ffmpeg + cwebp)"""
import json, subprocess, tempfile
from pathlib import Path
from PIL import Image

HOME = Path.home() / "AI-Terms"
SITE = Path(__file__).resolve().parents[3]
CROP_H = 920  # of 1080: the caption band starts at ~950
W = 1600
# slug: (episode folder, final video, [(label, frame line id, caption line ids)])  — framework order
EPS = {
    "embedding": ("ai-embedding-ep1-en", "01-Embedding-English.mp4", [
        ("The problem", "p4", ["p2", "p3"]),
        ("What it is", "m7", ["m2", "m3"]),
        ("How it's used", "k4", ["k2", "k3", "k4"]),
        ("The business", "b9", ["x2"]),
        ("One line to remember", "x3", ["x1"])]),
    "vector-database": ("ai-vector-db-ep2-en", "02-向量数据库-English.mp4", [
        ("The problem", "p4", ["p3", "p4"]),
        ("What it is", "w4", ["w3", "w4"]),
        ("How it finds fast", "i5", ["i4", "i5"]),
        ("The business", "b7", ["b3"]),
        ("One line to remember", "x2", ["x1"])]),
    "rag": ("ai-rag-ep3-en", "03-RAG-English.mp4", [
        ("The problem", "p5", ["p7"]),
        ("What it is", "w6", ["w1", "w2"]),
        ("How it works", "k12", ["k8"]),
        ("The business", "c5", ["c5"]),
        ("One line to remember", "y2", ["y1"])]),
}

out = {}
for slug, (folder, mp4, slides) in EPS.items():
    s = (HOME / folder / "assets/vo/timeline.js").read_text()
    lines = json.loads(s[s.index("{"):].rstrip().rstrip(";"))["lines"]
    dest = SITE / "assets/ai-terms/films" / slug
    dest.mkdir(parents=True, exist_ok=True)
    rows = []
    for i, (label, fid, caps) in enumerate(slides, 1):
        t = lines[fid]["end"] - 0.25
        with tempfile.TemporaryDirectory() as tmp:
            raw = Path(tmp) / "f.png"
            subprocess.run(["ffmpeg", "-v", "error", "-y", "-ss", f"{t:.2f}", "-i", str(HOME / "成片" / mp4),
                            "-frames:v", "1", str(raw)], check=True)
            im = Image.open(raw).convert("RGB").crop((0, 0, 1920, CROP_H))
            im = im.resize((W, round(CROP_H * W / 1920)), Image.LANCZOS)
            im.save(dest / f"{i:02d}.jpg", quality=80, optimize=True, progressive=True)
            im.save(Path(tmp) / "f.png")
            subprocess.run(["cwebp", "-quiet", "-q", "78", str(Path(tmp) / "f.png"), "-o", str(dest / f"{i:02d}.webp")], check=True)
        cap = " ".join(lines[c]["text"] for c in caps)
        rows.append(dict(label=label, img=f"{i:02d}", w=im.width, h=im.height, caption=cap, at=round(t, 2), lines=caps))
        print(slug, i, label, f"{t:.1f}s", cap)
    out[slug] = rows
(SITE / "_src/aiterm_slides.json").write_text(json.dumps(out, indent=1, ensure_ascii=False))
