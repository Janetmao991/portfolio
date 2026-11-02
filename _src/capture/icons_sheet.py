"""Writes _src/icons-sheet.html: the six R12 project icons side by side at 220px, for review shots."""
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
import build
cells = "".join(f'<figure>{build.art(s)}<figcaption>{build.P[s]["name"]}</figcaption></figure>' for s in build.ORDER)
html = f"""<!doctype html><meta charset="utf-8"><title>R12 icons</title><style>
body{{margin:0;background:#f3f2ef;font:600 15px Inter,system-ui,sans-serif;color:#55554f}}
main{{display:grid;grid-template-columns:repeat(6,260px);gap:16px;padding:40px}}
figure{{margin:0;background:#fff;border:1px solid rgba(10,10,10,.12);border-radius:8px;padding:28px 20px 16px;text-align:center}}
svg{{width:220px;height:220px;display:block;margin:0 auto 10px}}</style><main>{cells}</main>"""
(Path(__file__).resolve().parent.parent / "icons-sheet.html").write_text(html)
