"""R25: crops for projects/podcast-dig.html from the existing podcast-dig shots (assets/screens/builder-toolkit-*.png)
and LexiAI's Podcasts crop. Run from the repo root: python3 _src/capture/r25/crops.py"""
import subprocess
from pathlib import Path
from PIL import Image

R = Path(__file__).resolve().parents[3]
S, OUT = R / "assets/screens", R / "assets/podcast-dig"
CROPS = {  # out name: (source, (left, top, right, bottom) in source px)
    "pd-library": (S / "builder-toolkit-library.png", (0, 0, 650, 1300)),
    "pd-follow": (S / "builder-toolkit-reader.png", (0, 452, 1240, 1636)),
    "pd-takeaway": (S / "builder-toolkit-reader.png", (1332, 140, 2224, 600)),
    "pd-notes": (S / "builder-toolkit-note.png", (70, 20, 1640, 900)),
    "pd-lexiai": (R / "assets/lexiai/lexiai-podcasts.png", None),
}
OUT.mkdir(exist_ok=True)
for name, (src, box) in CROPS.items():
    im = Image.open(src).convert("RGB")
    im = im.crop(box) if box else im
    png = OUT / f"{name}.png"
    im.save(png, optimize=True)
    webp = png.with_suffix(".webp")
    subprocess.run(["cwebp", "-quiet", "-q", "80", "-m", "6", str(png), "-o", str(webp)], check=True)
    print(name, im.size, webp.stat().st_size // 1024, "KB webp")
