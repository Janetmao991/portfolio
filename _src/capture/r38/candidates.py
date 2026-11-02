#!/usr/bin/env python3
"""R38: one candidate frame at the end of each voice line in the key scenes, laid out as a contact sheet per scene.
Output goes to /tmp/r38-cand/ (not into the site). Used to pick the 5 slides per episode."""
import json, subprocess, sys
from pathlib import Path
from PIL import Image, ImageDraw

HOME = Path.home() / "AI-Terms"
EPS = {
    "embedding": ("ai-embedding-ep1-en", "01-Embedding-English.mp4", ["problem", "map", "steps", "biz", "recap"]),
    "vector-db": ("ai-vector-db-ep2-en", "02-向量数据库-English.mp4", ["problem", "what", "hnsw", "steps", "biz", "recap"]),
    "rag": ("ai-rag-ep3-en", "03-RAG-English.mp4", ["problem", "what", "steps", "biz", "recap"]),
}
OUT = Path("/tmp/r38-cand")


def timeline(folder):
    s = (HOME / folder / "assets/vo/timeline.js").read_text()
    return json.loads(s[s.index("{"):].rstrip().rstrip(";"))


for slug, (folder, mp4, scenes) in EPS.items():
    tl = timeline(folder)
    for sc in scenes:
        ids = tl["scenes"][sc]["lines"]
        thumbs = []
        for lid in ids:
            t = tl["lines"][lid]["end"] - 0.25
            f = OUT / slug / f"{sc}-{lid}.jpg"
            f.parent.mkdir(parents=True, exist_ok=True)
            subprocess.run(["ffmpeg", "-v", "error", "-y", "-ss", f"{t:.2f}", "-i", str(HOME / "成片" / mp4),
                            "-frames:v", "1", "-vf", "scale=480:-1", str(f)], check=True)
            thumbs.append((lid, f))
        cols = 4
        rows = (len(thumbs) + cols - 1) // cols
        sheet = Image.new("RGB", (cols * 480, rows * 290), "white")
        d = ImageDraw.Draw(sheet)
        for i, (lid, f) in enumerate(thumbs):
            x, y = (i % cols) * 480, (i // cols) * 290
            sheet.paste(Image.open(f), (x, y))
            d.rectangle([x, y, x + 60, y + 22], fill="black")
            d.text((x + 4, y + 4), lid, fill="white")
        sheet.save(OUT / f"{slug}-{sc}.jpg", quality=80)
        print(slug, sc, len(thumbs))
