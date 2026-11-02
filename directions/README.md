# Taste directions for portfolio v4 (design-taste-frontend, 2026-10-22)

Review only: the site was not edited. Mock sources are in `_mock/`. Inspector screenshots at 1280 are in `../.taste-skill/before-index-1280/` and `../.taste-skill/before-lexiai-1280/`.
Draw: `--sector personal-portfolio --tone editorial --have product-ui --sections work,showcase,how-it-works,about,contact`.
Palette changes: the dealt palettes (tobacco/olive, charcoal/sage) clash with the brief's warm off-white base. I kept each palette's proportions and swapped in stone/bone grounds with Janet's ink blue #1F3A5F as the one accent.

## A. statement.png — "Type only, statement" (type-only-statement · Zodiak 100 / Hanken Grotesk)
References: NOTHIN' https://www.noth.in · CoffeeTech https://coffee-tech.com/ · Artem Shcherbakov https://artemartemartem.com/
- Type: one statement at 7.4vw (now 56px / 4.4vw). Four sizes in total, against 16 today. Mono is gone.
- Whitespace: a composed void fills the top 60%. Three things hang from a 42% axis.
- Cards: none on the first screen. UI fragments show up later, large and few.
- Motion: a masked line reveal on the headline is the one loud move. Sections get staggered entrances.
- Color: flat stone #EEECE8 with one ink and an ink-blue button.
- Risk: the interface doesn't show until you scroll, which goes against "show the interface dynamically".

## B. split-stage.png — "Split stage" (split-stage · Bodoni Moda / Jost) — RECOMMENDED
References: Rafael Derolez https://derolez.dev/ · Le Petit Bleu https://www.lepetitbleucafe.com/ · Glide https://blode.co/glide
- Idea: the right half is a sticky stage that holds the live product UI. As you scroll, the word "erode" moves through LexiAI → Muse → Writing Station → LexiSpeak → podcast-dig, and the stage swaps to the real fragment from each tool. The left column narrates.
- Type: 2-line display at 4.6vw and 18px body. The whole page uses about 4 sizes.
- Whitespace: the left measure is 40ch. One screen per tool.
- Cards: a single large UI fragment (data-ui) replaces today's bento grids.
- Motion: the stage swaps or crossfades per section (pinned story). Small entrances everywhere else.
- Color: paper #F1EEE8 on the left, a full ink-blue field on the right. No lines anywhere.

## C. word-card.png — "Word card" (page-is-the-object · STIX Two Text)
References: ARCHIV https://www.archiv.systems/ · Sarah & Matt https://sarahandmatt.wedding · bleibtgleich https://bleibtgleich.dev
- Idea: the page is a LexiAI vocabulary card. The hero card is "erode" with its trail through the tools. Each later section is another piece of the same stationery (review stub, journal page, transcript slip).
- Type: one face. The word sits at 6.4vw and every detail is set at print size.
- Whitespace: a filled card on a stone ground, with no outlined boxes.
- Cards: filled stationery shapes in place of 1px-bordered snips.
- Motion: the card is sticky and shrinks into a stub while the tools pass by (pinned story).
- Color: three stones plus ink blue on the button and the status dots only.

## Top 5 taste breaks in current v4 (inspector @1280 + lint)
1. Monospace as costume: JetBrains Mono is 28% of the type (labels, chips, meta row, crumbs). On top of that, 13–21 text blocks are under 13px, plus tiny uppercase labels ("THE LOOP").
2. Lines everywhere: 18 hairlines on index and 12 on lexiai (nav rule, marquee rules, label rules, meta row), plus 7–11 1px outlined boxes. The real UI snips aren't marked data-ui, so even they count as boxes.
3. No focal point on the first screen: the 11-word headline wraps to 3 lines at 56px (4.4vw, against a gallery median of 8.4vw). It has an italic accent word, there's no button, and the try card loads empty, which leaves a large blank box.
4. Ornament tells: eyebrow labels above every section, [tag] brackets, 01/02/03 numbering, the ✓ glyph, the "works with" logo marquee, and gradient masks. 16 font sizes, 3 typefaces.
5. Yellow-cream ground #FAF7F0 (the "assistant palette"), muted grey at 3.4:1 contrast, and 0 counted pictures. The UI fragments are the strongest asset but read as small boxes, not as large interface pictures.
