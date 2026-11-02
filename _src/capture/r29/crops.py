"""R29: crops for projects/ai-terms.html from the real ~/AI-Terms artifacts (read-only).
usage: python3 crops.py <ep4 project dir> <03-RAG-English.mp4> <out dir>
Frames are pulled with ffmpeg into a temp dir; every crop is saved as PNG + WebP."""
import subprocess, sys, tempfile
from pathlib import Path
from PIL import Image

ep4, rag, out = Path(sys.argv[1]), Path(sys.argv[2]), Path(sys.argv[3])
tmp = Path(tempfile.mkdtemp())


def frame(video, t, name, eof=False):
    p = tmp / f"{name}.png"
    ss = ["-sseof", str(t)] if eof else ["-ss", str(t)]
    subprocess.run(["ffmpeg", "-v", "error", "-y", *ss, "-i", str(video), "-frames:v", "1", str(p)], check=True)
    return Image.open(p).convert("RGB")


def save(im, key):
    im.save(out / f"{key}.png", optimize=True)
    im.save(out / f"{key}.webp", quality=86, method=6)
    print(key, im.size)


# 1. contact sheet the reviewer reads (final cut v7): first 3 columns x 2 rows, 0:00-0:14
save(Image.open(ep4 / "审片/sheets/sheet_01.png").convert("RGB").crop((0, 0, 1464, 558)), "at-sheet")
# 4. a flagged + fixed shot at 0:30. The reviewed cut (v5) was not kept as a render; v4 is identical in this region
#    (checked against the v5 contact sheet), so "before" comes from v4, "after" from the final v7.
CHAIN = (340, 715, 1260, 925)
save(frame(ep4 / "renders/long-context-ep4-v4.mp4", 30.5, "v4").crop(CHAIN), "at-before")
save(frame(ep4 / "renders/long-context-ep4-v7.mp4", 30.5, "v7").crop(CHAIN), "at-after")
# 5. last frame of the English RAG episode
save(frame(rag, -1.5, "rag", eof=True), "at-final")
