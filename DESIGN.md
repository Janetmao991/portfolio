# Janet's site — design notes (v5, R72, 2026-11-18)

## What Janet asked for
- Keep all current content; change the design only. The project relationship map stays prominent.
- Homepage = one screen: greeting, a menu of four, one big hand-drawn drawing (approach borrowed from zarazhang.com, not its look).
- First impression: personal warmth.
- Drawing: Janet at her desk, seen from behind — headphones, laptop looking up a word, her six projects pinned on a board with string, the Golden Gate out of the window, the Clay / Granola teardowns on the desk.

## The system
- One saturated colour + near-white (#f7f7f5). Trials: green #1e5e3b (default), vermilion #c63d1e, ink blue #1f4387 — `?c=red` / `?c=blue` to preview.
- One serif family: Fraunces (soft). Five sizes: small 15, body 17–19, lead 20–27, head 32–54, display 52–128.
- Home is a field of the colour with the drawing in near-white; inner pages are near-white with the drawing in the colour; every page closes on a field of the colour (contact).
- The drawing lives in `_src/desk.svg`; inner pages show a crop of it (board → work, books → research, Janet → about).
- Motion (Emil Kowalski's rules): one entrance per visit (h1 → sub → menu, shrinking gaps), the menu points at the drawing (rest dims, one small move), slow ambient steam/fog/leaves, laptop types real words from LexiAI. Transform + opacity only; reduced motion keeps everything visible.

## Janet's corrections (learn-taste)
_(none yet — added as she reviews)_
