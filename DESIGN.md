# Janet's site — design notes (v5, R72, 2026-11-18)

## What Janet asked for
- Keep all current content; change the design only. The project relationship map stays prominent.
- Homepage = one screen: greeting, a menu of four, one big hand-drawn drawing (approach borrowed from zarazhang.com, not its look).
- First impression: personal warmth.
- Drawing: Janet at her desk, seen from behind — headphones, laptop looking up a word, her six projects pinned on a board with string, the Golden Gate out of the window, the Clay / Granola teardowns on the desk.

## The system
- One saturated colour + near-white (#f7f7f5). Golden Gate red #c0362c by default; any other colour can be previewed with `?hex=rrggbb`, a pale wash behind the drawing with `?bg=wash`.
- One serif family: Fraunces (soft). Five sizes: small 15, body 17–19, lead 20–27, head 32–54, display 52–128.
- Home is a field of the colour with the drawing in near-white; inner pages are near-white with the drawing in the colour; every page closes on a field of the colour (contact).
- The drawing lives in `_src/desk.svg`; inner pages show a crop of it (board → work, books → research, Janet → about).
- Motion (Emil Kowalski's rules): one entrance per visit (h1 → sub → menu, shrinking gaps), the menu points at the drawing (rest dims, one small move), slow ambient steam/fog/leaves, laptop types real words from LexiAI. Transform + opacity only; reduced motion keeps everything visible.

## Janet's corrections (learn-taste)
- 2026-11-18 Colour brighter than the first deep green; then: no big field of colour — near-white ground, colour only in type and the drawing's lines. Chosen: Golden Gate red #c0362c on white (the bridge in her window; she lives in SF).
- 2026-11-18 More creative homepage motion, like zarazhang.com (lamp lights the menu) and gregskril.com (one line draws itself, eyes follow the cursor) → intro types the greeting and pen-draws the room; menu items tie a thread to their thing in the drawing; her eyes follow the pointer and blink.
- 2026-11-18 She made her own cartoon (KlingAI) and prefers it to a hand-drawn one → it sits in the chair; the drawn arms fold over it. The room must be drawn the same way as that cartoon (dark outline, soft flat colour, warm wall) — a thin line room next to a coloured cartoon looks like two pictures pasted together. Text is dark ink; no red as the main colour.
- 2026-11-18 A line drawn across the page from the menu to the drawing looked odd → removed. What works: she speaks a line per menu item in a speech bubble, leans toward the menu; the named thing lifts; clicking flies the camera into that thing and the next page opens on the same thing.
- 2026-11-18 She made the whole scene in KlingAI (her, chin in hands, at the desk) and dropped the David-style scroll story as too complex → the homepage picture is her scene (assets/janet-desk.webp, KlingAI watermark painted out). _src/scene.svg lays live pieces over it: the board's words and the Granola spine re-set in Fraunces (the generator misspelled them), the laptop screen that types words, a spotlight that lights the thing a menu item names (she always stays lit), her speech bubble. Click still flies the camera into the thing.
- 2026-11-18 (superseded) A cute cartoon of herself from her photo: front-facing, turned round in her chair, arms folded on its back; loose bun with flyaway hairs, straight brows, almond eyes, closed smile, small dark studs, white stand-collar zip jacket. Same single-colour line style as the room.
