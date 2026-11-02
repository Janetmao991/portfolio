# Portfolio v4 — Design Spec (by Grok Bot for Janet). Build exactly this.
Output: ~/Desktop/portfolio-v4/ (index.html + projects/*.html + shared assets/style.css, assets/motion.js). Don't touch v1-v3.
Base: reuse v3's typography and spacing (Janet likes its simplicity) and v3's headline copy ("Saving a word is not the same as knowing it", etc.). Reuse v1 UI demos from ~/Library/Application Support/Open Design/namespaces/release-stable/data/projects/095e5f4a-1548-4fad-ab9e-bd66fbaa05ea/index.html. Facts only from ~/claude-hq/REGISTRY.md; no invented metrics/users. Exclude startup-deepdive, startup-radar, equity-research.

## Global system
- Palette: bg #FAF7F0, text #1F1D1A, accent ink blue #1F3A5F, muted #8A857C, hairline #E4DED3. No gradients, no shadows.
- Type: serif display (e.g. Newsreader/Source Serif) for headings, Inter for body, JetBrains Mono for labels/code. H1 56/64 desktop, body 17/28. Max content width 1080px, text column 640px.
- Nav (sticky, 56px, hairline bottom): "Janet Mao" left; right: Work · System · About. Each project page shows breadcrumb "Work / LexiAI" + prev/next project.
- UI frames: thin 1px #1F1D1A at 15% opacity, 8px radius, small mono caption under each frame ("LexiAI · Define view").
- Motion: ease-out 300–600ms, fade+8px rise on scroll (IntersectionObserver), looping demos pause off-screen; full prefers-reduced-motion fallback to static.
- Each project has one ink-blue tag color? No — single accent only; use mono tags like [learning] [voice] [writing] [agent] [tooling].

## Page 1 — index.html (Landing)
1. Hero (100vh-ish, left-aligned): mono eyebrow "AI PRODUCT BUILDER · SAN FRANCISCO". H1: "I build a connected system for learning English as an adult." Sub (1 line): "Five tools that share one word list, one memory, one loop: look up → save → remember → write → speak." Right side: live LexiAI typing demo (a word types in, definition lines reveal one by one, loops).
2. "The loop" strip: horizontal 6 steps 查→存→记→用→听→说 (Look up · Save · Remember · Use · Listen · Speak), each step labeled with which project owns it. Steps light up in sequence on scroll.
3. Selected work: 2-column grid of project cards (LexiAI large spanning 2 cols, then LexiSpeak, Writing Station, Meta Muse × LexiAI, Builder toolkit). Card = small looping UI thumbnail + title + one-line problem statement (v3 headlines) + mono tags + "Read case →". Hover: frame stroke turns ink blue, thumbnail plays.
4. System map (the centerpiece, id="system"): SVG node graph. Center node LexiAI words table (Supabase). Edges, each labeled in mono:
   - LexiSpeak ↔ LexiAI: "shares words table · writes back Can Speak"
   - Meta Muse → LexiAI: "muse-api · nightly 9:14pm quiz · SM-2 scores written back"
   - Writing Station → LexiAI: "words I misuse become vocab" (only if true — otherwise label "writing practice, same loop" ; ask Janet-safe: mark as planned)
   - podcast-dig ↔ LexiAI: "shares Whisper transcripts (corpus.db)"
   - Claude HQ registry: dotted outline around everything, "one source of truth"
   Animate: small dots travel along edges; hover a node highlights its edges and shows a 2-line tooltip; click → project page.
5. Principles (3 short columns): "Own your data" (local files, BYOK), "Close the loop" (every tool writes back), "Agents as users" (muse-api built for an AI agent to call).
6. About + contact: 3 lines bio, X @BuiltByJanet, GitHub Janetmao991, email placeholder for Janet to fill.

## Pages 2–6 — projects/<slug>.html (identical template)
Slugs: lexiai, lexispeak, writing-station, muse, builder-toolkit (brain, podcast-dig, follow-builders, sf-ai-events, kami, hq).
Template sections, in order:
A. Header: breadcrumb; H1 = v3 problem headline; one-line what-it-is; meta row in mono (Role: designer + builder · Stack · Status · Link to GitHub if public). 
B. Hero demo: full-width UI frame with the main looping demo.
C. Inspiration (text column, ~120–180 words, first person): the moment/pain that started it. Pull from v3 copy; keep Janet's voice; mark any guessed sentence with <!-- TODO Janet confirm -->.
D. Features: 3–4 rows, alternating left text / right UI frame. Each row: feature name, 2-line explanation, a small dynamic demo (scroll-triggered). E.g. LexiAI: Define with finance-context meanings · Sentence Breakdown with per-word save pill · SM-2 flashcards · AI podcast. LexiSpeak: 4 modes · audio-first transcription · feedback report · Can Speak write-back. Writing Station: paper editor · sentence-by-sentence red corrections with reason · idiomatic suggestions · local files on iPad over Wi-Fi. Muse: nightly quiz push · scores written back via muse-api. Builder toolkit: grid of skill cards with trigger command in mono.
E. Highlights: 3 numbered cards ("01 / 02 / 03"), each a decision or hard problem solved, e.g. LexiSpeak anti-hallucination guard for short audio + 504 auto-retry; LexiAI deep-link routing short word→Define, sentence→Analyze; podcast-dig never transcribes the same episode twice. No fake metrics.
F. What I gave up (keep from v3, short).
G. Connected to: mini system map cropped to this node + its neighbors, plus link cards to each connected project with the edge label ("shares words table").
H. Footer nav: ← prev project · All work · next project →.

## Deliverable
Static HTML/CSS/vanilla JS, works by double-click (relative links). Check all links. Reply with file list + any TODOs Janet must confirm.
