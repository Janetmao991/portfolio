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

## Current homepage (R73, direction D — Janet: "这个感觉我喜欢")
Few words: her name small, one line, four big menu words (Work · Research · About · Contact), X/GitHub/Email.
Her KlingAI cartoon portrait is the picture, on a warm sun disc; the irises were painted out and are drawn live, so her
eyes follow the pointer, look at the word you point at (which a highlighter sweeps), and blink now and then.
Her head is the pointer on every page (assets/head-cursor.js).
R73c: the portrait sits inside the sun disc, smaller; each menu word swaps in a KlingAI expression of hers (Work: sideways
confident look, Research: curious pout with ? and a star, About: big laugh, Contact: wink) with an English bubble
(the generated Chinese bubbles were erased; Research's is a thought cloud). Rejected on the way: full colour field, red, the
hand-drawn room, the KlingAI desk scene (too student-like), product screenshots on the home (odd), a giant name
(too much), a dictionary-entry home (too plain, too many words).

## Janet's corrections (learn-taste)
- 2026-11-18 Colour brighter than the first deep green; then: no big field of colour — near-white ground, colour only in type and the drawing's lines. Chosen: Golden Gate red #c0362c on white (the bridge in her window; she lives in SF).
- 2026-11-18 More creative homepage motion, like zarazhang.com (lamp lights the menu) and gregskril.com (one line draws itself, eyes follow the cursor) → intro types the greeting and pen-draws the room; menu items tie a thread to their thing in the drawing; her eyes follow the pointer and blink.
- 2026-11-18 She made her own cartoon (KlingAI) and prefers it to a hand-drawn one → it sits in the chair; the drawn arms fold over it. The room must be drawn the same way as that cartoon (dark outline, soft flat colour, warm wall) — a thin line room next to a coloured cartoon looks like two pictures pasted together. Text is dark ink; no red as the main colour.
- 2026-11-18 A line drawn across the page from the menu to the drawing looked odd → removed. What works: she speaks a line per menu item in a speech bubble, leans toward the menu; the named thing lifts; clicking flies the camera into that thing and the next page opens on the same thing.
- 2026-11-18 She made the whole scene in KlingAI (her, chin in hands, at the desk) and dropped the David-style scroll story as too complex → the homepage picture is her scene (assets/janet-desk.webp, KlingAI watermark painted out). _src/scene.svg lays live pieces over it: the board's words and the Granola spine re-set in Fraunces (the generator misspelled them), the laptop screen that types words, a spotlight that lights the thing a menu item names (she always stays lit), her speech bubble. Click still flies the camera into the thing.
- 2026-11-18 (superseded) A cute cartoon of herself from her photo: front-facing, turned round in her chair, arms folded on its back; loose bun with flyaway hairs, straight brows, almond eyes, closed smile, small dark studs, white stand-collar zip jacket. Same single-colour line style as the room.

- R73p (avatar depth): Janet asked for a "more 3D" avatar. Decision: keep the flat KlingAI art (a 3D render would clash with the paper/sticker style and break the eye-follow and expressions); add depth instead: ink-outlined sticker disc with offset shadow, head breaking out over the top of the circle, the disc tilting a few degrees toward the pointer with the head moving more than the disc (mouse only).

- R73q (AI Term Explainer covers): Research shows only the latest three films, each with a hand-drawn English cover in the series' own style (drawn from that episode's content, same look as its YouTube thumbnail), framed in the site's card style (ink outline, offset shadow, slight tilt). Older episodes are behind "View all episodes".

- R73r (Work map): the six projects are white cards stuck a little crooked on two sheets of dotted notebook paper (ink outline, offset shadow), group names on yellow/peach washi tape; phones get the same sheets and cards stacked. Also fixed: the journey rows used the class `.js`, which collided with `html.js` set by map.js and squeezed the whole Work page to ~60% width; journey rules are now `li.js`.

- R73s: journey bubbles carry Janet's own words (lightly edited English), no labels above them; her Founding line sits on the Meanwhile note. Menu renamed: Work → Projects, About → My journey (URLs unchanged).

- R73t: the About page is titled "My journey" (tab, h1); its timeline section heading became "The path so far" to avoid saying it twice.

- R73u: less space above the page titles (title level with the face disc); About lead drops "a lifelong learner of English" at Janet's request.

- R73v/w: font Fraunces → Newsreader (Janet found Fraunces wobbly). taste-skill inspect pass on every page: titles = menu words on one line (Projects / Research / My journey), one body size, section gaps roughly halved, My journey intro in two columns, journey chapters closer, project cards scale with the map. Homepage auto-plays: each menu word lights up in turn with its face and line (2.6s, a quiet beat between rounds); any pointer/keyboard/touch takes over, resumes after 5s idle; off under reduced motion. Emil pass: blur on the face crossfade, bubble exits faster than it enters, highlighter 300ms.
