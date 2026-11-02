"""Crops podcast-dig frames (from ~/podcast-dig-video/footage, Retina 3024x1964) to the reader area only:
no macOS menu bar, dock, vault sidebar or vault name. Small Chinese UI labels are blurred (site is English-only).
Usage: python3 crop-podcast.py <frames dir> <out dir>"""
import sys
from PIL import Image, ImageFilter

src, out = sys.argv[1], sys.argv[2]

def blur(im, box):
    im.paste(im.crop(box).filter(ImageFilter.GaussianBlur(10)), box[:2])

def cover(im, box):  # paint a tiny label out with the colour just left of it
    c = im.getpixel((box[0] - 6, (box[1] + box[3]) // 2))
    im.paste(c, box)

jobs = {
    # transcript follows the audio + "My takeaways" panel
    'builder-toolkit-reader': ('f-reader.png', (766, 160, 2990, 1828), [('cover', (1862, 1688, 2034, 1736))]),
    # Library of starred episodes next to the open transcript
    'builder-toolkit-library': ('f-library.png', (770, 150, 3010, 1830), [('blur', (786, 748, 1100, 794)), ('blur', (2046, 296, 2190, 340))]),
    # a highlighted line inside the transcript (pane only)
    'builder-toolkit-transcript': ('f-library.png', (1512, 356, 2916, 1409), []),
    # clipped lines landing in a timestamped Obsidian note
    'builder-toolkit-note': ('f-note.png', (1015, 356, 2700, 1620), []),
}
for name, (f, crop, fixes) in jobs.items():
    im = Image.open(f'{src}/{f}').convert('RGB')
    for kind, box in fixes:
        (blur if kind == 'blur' else cover)(im, box)
    im.crop(crop).save(f'{out}/{name}.png', optimize=True)
    print('ok', name, im.crop(crop).size)
