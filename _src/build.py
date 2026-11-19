#!/usr/bin/env python3
"""Builds portfolio v4: index.html + projects/*.html from the content below.
Edit text here, then run:  python3 _src/build.py
Shared look lives in assets/style.css; assets/motion.js only drives the Startup Research framework grid and annotated report.

Layout (revision 11, "plates"): every page is a stack of light plates on a warm-gray, faintly grained page.
Each plate opens with a slim header strip (green number tab + small uppercase label). The home page is a hero,
a 3-column grid of project cards (CATALOG), About, Writing and a dark contact plate.
Revision 52: Writing is replaced by the full Research list (research_section, #research); projects/research.html redirects there.
Revision 55: Research rows are one line (date · title · arrow); each group opens with its framework (two-pager, 10 steps).
Revision 32: the cards are gone; the projects plate is a map of how the six projects connect (map_section), each node a link.
Revision 12: cards and the hero carry one line-art icon per project (ICON_ART), no screenshots; screenshots live only on project pages. Project pages are one
~720px column: a title plate, then one plate per real screenshot (SHOTS), a short decisions plate and a next-project card.
Revision 13: the hero disc shows one icon at a time, drawn on and cycled by assets/hero.js (R32 adds assets/map.js on the home page).
Revision 46: the home hero also loads assets/eyes.js (her eye follows, blinks) and assets/pollen.js (a mote now and then on a blink).
Revision 14: projects/lexiai.html has its own plain layout (lexiai_page): one plate, three highlights, each with one cropped screenshot.
Revision 15: same LexiAI layout, five highlights in a new order (definition, sense in a sentence, notebook, Ask LexiAI, review); a highlight may hold two crops.
Revision 17: projects/lexispeak.html uses the same page (callout_page), with five highlights and one numbered callout per crop.
Revision 18: projects/writing-station.html uses it too (no "Try it live" button yet).
Revision 24: the hero disc first tells a short story (hero_story), then starts the icon cycle.
Revision 26: the disc shows only the story, looping (no project icons, no project label); hero_art is gone.
Revision 27: no disc. A girl opens a book and a forest grows out of it (hero_story); leaves fall and become words.
Revision 25: the Builder toolkit project is now just podcast-dig (projects/podcast-dig.html, same callout_page);
projects/builder-toolkit.html is a redirect stub (REDIRECTS) so old links keep working.
Revision 43 (the approved R40 + R41 taste mock): one family, Work Sans; plates open with a plain heading (no number tab,
no tracked capitals); no shadows, grain or corner dots. Project and research pages are 1160px wide like the homepage, and
fade in once on scroll (assets/entrance.js, switched on by ENTRANCE_ON in <head>)."""
import json, re
from pathlib import Path

OUT = Path(__file__).resolve().parent.parent
# self-hosted (assets/fonts): Work Sans (variable) for everything (R43; the italic file loads only where italics are used)
FONTS = lambda root: f'<link rel="preload" href="{root}assets/fonts/work-sans-latin.woff2" as="font" type="font/woff2" crossorigin>'
# R72 (v5 redesign): one serif family, Fraunces (soft), for everything; one saturated colour on near-white. assets/v5.css sits on top of style.css.
V5_FONTS = ('<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>'
            '<link href="https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght,SOFT@0,9..144,300..700,50;1,9..144,300..700,50&display=swap" rel="stylesheet">')
DESK_SVG = (Path(__file__).resolve().parent / "desk.svg").read_text().strip()
# R43: project and research pages fade in on scroll (assets/entrance.js). This runs in <head>, before first paint: motion on
# unless reduced motion / no IntersectionObserver; if entrance.js never arrives, the class comes off after 2.5s so nothing stays hidden.
ENTRANCE_ON = ('<script>(function(h){if(matchMedia("(prefers-reduced-motion: reduce)").matches||!("IntersectionObserver" in window))return;'
               'h.classList.add("m41");setTimeout(function(){if(!window.R41)h.classList.remove("m41")},2500)})(document.documentElement)</script>')

ORDER = ["lexiai", "lexispeak", "writing-station", "podcast-dig", "startup-research", "ai-terms"]  # R12: Muse is no longer its own project (P["muse"] kept for reference)
X = "https://x.com/BuiltByJanet"
GITHUB = "https://github.com/Janetmao991"
EMAIL_ADDR = "qing.mao.2024@marshall.usc.edu"  # Janet: fill in and rebuild; the hero link row and every contact plate then link to mailto:
EMAIL = f'<a href="mailto:{EMAIL_ADDR}">Email</a>' if EMAIL_ADDR else '<a href="#contact">Email</a>'
EMAIL_BIG = f'<a href="mailto:{EMAIL_ADDR}">{EMAIL_ADDR}</a>' if EMAIL_ADDR else '<span class="ph-mail">Email to add</span>'
ICON = {
    "x": '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M18.9 1.15h3.68l-8.04 9.19L24 22.85h-7.4l-5.8-7.58-6.64 7.58H.47l8.6-9.83L0 1.15h7.6l5.24 6.93zM17.6 20.64h2.04L6.48 3.24H4.3z"/></svg>',
    "gh": '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 .3a12 12 0 0 0-3.8 23.38c.6.12.83-.26.83-.57l-.02-2.04c-3.34.73-4.04-1.61-4.04-1.61-.55-1.39-1.34-1.76-1.34-1.76-1.08-.74.09-.73.09-.73 1.2.09 1.84 1.24 1.84 1.24 1.07 1.83 2.8 1.3 3.49 1 .1-.78.42-1.3.76-1.6-2.67-.31-5.47-1.34-5.47-5.93 0-1.31.47-2.38 1.24-3.22-.14-.3-.54-1.52.1-3.18 0 0 1.01-.32 3.3 1.23a11.5 11.5 0 0 1 6 0c2.28-1.55 3.29-1.23 3.29-1.23.64 1.66.24 2.88.12 3.18a4.65 4.65 0 0 1 1.23 3.22c0 4.61-2.8 5.62-5.48 5.92.42.36.81 1.1.81 2.22l-.01 3.29c0 .32.21.69.82.57A12 12 0 0 0 12 .3"/></svg>',
}


def head(title, desc, root):
    return f"""<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>{title}</title>
<meta name="description" content="{desc}">
<meta property="og:type" content="website">
<meta property="og:title" content="{title}">
<meta property="og:description" content="{desc}">
<meta name="twitter:card" content="summary">
<link rel="icon" href="{root}assets/favicon.svg" type="image/svg+xml">
<meta name="theme-color" content="#f7f7f5">
{FONTS(root)}
<link rel="stylesheet" href="{root}assets/style.css">
{V5_FONTS}
<link rel="stylesheet" href="{root}assets/v5.css">{chr(10) + ENTRANCE_ON if root else ""}
</head>"""


def nav(root, current=""):
    """The slim top plate: initial + name, three tabs (R23 added Research)."""
    cur = lambda k: ' aria-current="page"' if k == current else ""
    return f"""<header class="n5">
  <a class="n5-home" href="{root}index.html">Janet Mao</a>
  <nav aria-label="Site"><a href="{root}work.html"{cur('work')}>Things I've built</a><a href="{root}research.html"{cur('research')}>Research</a><a href="{root}about.html"{cur('about')}>About</a></nav>
</header>"""


def ph(num, label, meta="", icon=""):
    """A plate's heading, optional meta beside it. R43: num is no longer shown (the green number tab is gone).
    R60: icon = a SEC_ICON key, drawn left of the heading (homepage sections only)."""
    ic = (f'<svg class="ti" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" '
          f'stroke-linejoin="round" aria-hidden="true">{SEC_ICON[icon]}</svg>') if icon else ""
    if len(meta) <= 14:  # R62: a short count ("2 pages", "4 rules") stays on one line on phones
        meta = meta.replace(" ", "&nbsp;")
    return f'<div class="ph">{ic}<h2>{label}</h2>{f"<span class=\"pm\">{meta}</span>" if meta else ""}</div>'


# R60 (R59 option A): static 24px line icons before the homepage section headings, authored on a 24px grid.
SEC_ICON = {
    "built": '<rect x="3.5" y="8.5" width="12" height="12" rx="2.5"/><rect x="8.5" y="3.5" width="12" height="12" rx="2.5"/>',  # two overlapping blocks
    "research": '<circle cx="10.5" cy="10.5" r="6.5"/><path d="M15.4 15.4L20.5 20.5"/>',  # a magnifier
}
# R60 (R54 option C), R61: a soft highlighter wash under the whole homepage section blurb (every wrapped line), drawn once
# when the heading scrolls in. The page is written in its finished state; this script
# (in <head>, before first paint) arms the start state only when JS runs and reduced motion is off. A heading already on
# screen at load waits for the first scroll or the end of the hero story (6.5s), so it never plays unseen.
HL_JS = """<script>
(() => {
  if (!('IntersectionObserver' in window) || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  document.documentElement.classList.add('hl-arm');
  let ready = false; const held = [];
  const play = h => h.closest('.plate').classList.add('hl-on');
  const release = () => { if (ready) return; ready = true; held.splice(0).forEach(play); };
  addEventListener('scroll', release, { once: true, passive: true }); setTimeout(release, 6500);
  const go = () => {
    const io = new IntersectionObserver(es => es.forEach(e => {
      if (!e.isIntersecting) return;
      io.unobserve(e.target); ready ? play(e.target) : held.push(e.target);
    }), { rootMargin: '0px 0px -25% 0px', threshold: 1 });
    document.querySelectorAll('.hl-sec .ph h2').forEach(h => io.observe(h));
  };
  document.readyState === 'loading' ? addEventListener('DOMContentLoaded', go) : go();
})();
</script>"""


def blurb(cls, text, highlight=True):
    """A section blurb. highlight=True wraps the R61 wash. The Things I've built priorities sentences pass highlight=False so they stay ordinary readable text. Other blurbs, and link/method underlines, are unchanged."""
    inner = f'<span class="hl">{text}</span>' if highlight else text
    return f'<p class="{cls}">{inner}</p>'


def contact():
    return f"""<section class="plate dark" id="contact">
  <h2>Contact me</h2>
  <p class="mail">{EMAIL_BIG}</p>
  <p class="round"><a href="{X}" aria-label="X @BuiltByJanet">{ICON['x']}</a><a href="{GITHUB}" aria-label="GitHub">{ICON['gh']}</a></p>
</section>"""


def foot(root, js=False, extra=""):
    script = f'\n<script src="{root}assets/motion.js"></script>' if js else ""
    script += extra  # R64: page-only scripts (demo.js)
    if root:  # project and research pages: the entrance motion
        script += f'\n<script src="{root}assets/entrance.js"></script>'
        script += f'\n<script src="{root}assets/touches.js"></script>\n<script src="{root}assets/inner.js"></script>'  # R68
    return f"""{contact()}
<footer class="site"><span>Janet Mao · San Francisco · 2026</span><a href="{X}">X @BuiltByJanet</a></footer>
</div>{script}
</body>
</html>
"""


def disp(name):
    """Keep the × light next to the heavy display face."""
    return name.replace(" × ", ' <span class="times">×</span> ')


# ---------------------------------------------------------------- screens (revision 6)
# Real product screenshots, captured by _src/capture/ into assets/screens/<key>.png + .webp (all 4:3).
# key: (app shown in the window bar, feature name, one sentence <= 18 words, alt text, pill or None, mock-up?)
# pill = (label, left %, top %) marks where to look; at most one per shot.
SCREENS = {
    "lexiai-define": ("LexiAI", "Define", "A saved word opens straight from my notebook, each sense with its own examples.",
                      "LexiAI Define view for erode: IPA, In Notebook, first verb sense with synonyms and examples", None, False),
    "lexiai-senses": ("LexiAI", "Both senses", "The everyday senses and the finance sense of erode, in one entry.",
                      "LexiAI entry for erode showing the general verb sense and the verb (Finance) sense", ("Finance sense", 30, 46.5), False),
    "lexiai-context": ("LexiAI", "Meaning in context", "Paste a sentence and LexiAI names the sense the word takes there, with the clues.",
                       "LexiAI Sentence view explaining erode in a Hidden Brain quote, with the usual meaning crossed out", None, False),
    "lexiai-review": ("LexiAI", "Review", "Due cards come back on SM-2's schedule; each button shows when the card returns.",
                      "LexiAI Review card for erode with Forgot, Fuzzy, Got it and Easy buttons", None, False),
    "lexiai-notebook": ("LexiAI", "Notebook", "Real entries, real statuses: appall, the card I forget most, has reached Can Write.",
                        "LexiAI Notebook with stretched thin, bludgeon, go against the grain and mull over, and appall expanded with a Can Write status", None, False),
    "lexispeak-session": ("LexiSpeak", "Interview session", "Morgan asks a role-specific question and follows up on what I actually said.",
                          "LexiSpeak interview session with target words above the chat and an answer that uses erode", None, False),
    "lexispeak-modes": ("LexiSpeak", "Speaking Studio", "Free Talk plus four structured modes, each with its own conversation partner.",
                        "LexiSpeak home screen with Free Talk, Casual Chat and Interview", None, False),
    "lexispeak-report": ("LexiSpeak", "Coaching report", "A score, a plain summary and one thing to focus on next.",
                         "LexiSpeak coaching report with a score of 68 and a focus tip", None, False),
    "lexispeak-words": ("LexiSpeak", "Target words", "Every target word gets a verdict; the ones I use well go back to LexiAI.",
                        "LexiSpeak report listing target words with a note on each", None, False),
    "lexispeak-fixes": ("LexiSpeak", "Everything you said", "Each answer comes back marked: red to fix, yellow to sound more native.",
                        "LexiSpeak annotated transcript and grammar fixes with the reason under each", None, False),
    "writing-station-review": ("Writing Station", "Review", "My real Aug 11 entry, scored, with every phrase marked by the kind of note.",
                               "Writing Station review of the entry Update of Lexi AI, score 62, annotated", None, False),
    "writing-station-journal": ("Writing Station", "Journal", "Entries newest first, each with its date, score and first lines.",
                                "Writing Station sidebar listing journal entries next to an open entry", None, False),
    "writing-station-note": ("Writing Station", "Note", "Tap a marked phrase: what I wrote, what to try instead, and the rule.",
                             "Writing Station note for break down them: try break them down, with the phrasal verb rule", None, False),
    "writing-station-ipad": ("Writing Station", "At iPad width", "The same desk, served from my Mac and opened over home Wi-Fi.",
                             "Writing Station at tablet width with the journal list and an open entry", None, False),
    "writing-station-styles": ("Writing Station", "Annotated view", "Red for errors, amber for correct but stiff, green for notebook words used well.",
                               "Writing Station annotated view with a colour legend: error, more natural, notebook, opportunity", None, False),
    "muse-note": ("Meta Muse", "The 9:14 pm nudge", "Muse comes to me when words are due; I don't open anything.",
                  "Mock-up of a Muse notification: 8 words due tonight", None, True),
    "muse-quiz": ("Meta Muse", "One card at a time", "Muse shows a due word from my notebook and asks how well I knew it.",
                  "Mock-up of a Muse chat card for erode with Again, Hard, Good and Easy", None, True),
    "muse-rated": ("Meta Muse", "Nightly review", "I rate the card, Muse writes it back to LexiAI and moves to the next word.",
                   "Mock-up of a Muse chat where erode is rated Good and saved to LexiAI", None, True),
    "builder-toolkit-reader": ("podcast-dig · Obsidian", "Reader", "Press play and the transcript follows; lines I keep collect in My takeaways.",
                               "podcast-dig reader in Obsidian: highlighted paragraph at 27:43 and a takeaway note", None, False),
    "builder-toolkit-library": ("podcast-dig · Obsidian", "Library", "Episodes the skill pulled in, grouped by company, each with a full transcript.",
                                "podcast-dig library of starred episodes beside an open transcript", None, False),
    "builder-toolkit-transcript": ("podcast-dig · Obsidian", "Highlighted line", "The speaker's exact words with a timestamp; the green line is one I highlighted.",
                                   "Transcript with speaker names, timestamps and a highlighted line", None, False),
    "builder-toolkit-note": ("podcast-dig · Obsidian", "Podcast notes", "Plain Markdown in my vault: each clipped line with its timestamp and source.",
                             "Obsidian note with timestamped podcast lines and links back to the episode", None, False),
}


def screen(key, root, lazy=True):
    """A screen card: minimal window frame + the real screenshot."""
    app, title, line, alt, pill, mock = SCREENS[key]
    src = f"{root}assets/screens/{key}"
    tag = '<span class="mock">Mock-up</span>' if mock else ""
    pl = f'<span class="look" style="left:{pill[1]}%;top:{pill[2]}%">{pill[0]}</span>' if pill else ""
    return (f'<div class="shot"><div class="bar" aria-hidden="true"><i></i><i></i><i></i><span>{app}</span>{tag}</div>'
            f'<div class="frame"><picture><source srcset="{src}.webp" type="image/webp">'
            f'<img src="{src}.png" alt="{alt}{" (mock-up)" if mock else ""}" width="1760" height="1320"{" loading=\"lazy\"" if lazy else ""} decoding="async"></picture>{pl}</div></div>')


# ---------------------------------------------------------------- projects
P = {
"lexiai": dict(
    name="LexiAI",
    h1="Saving a word is not the same as knowing it",
    what="An advanced learner's dictionary and vocabulary workbench, built around one loop: look up, save, remember, use, listen, speak.",
    meta="Designer and builder · React, TypeScript, Vite, Gemini (bring your own key), Supabase, PWA · Open source",
    links=[("GitHub", "https://github.com/Janetmao991/lexiai")],
    hero=("lexi-full", "LexiAI · Define view", "Real entries from my notebook"),
    inspiration="""<p>I read finance writing in my second language. I'd save a word and never use it, and dictionaries missed the room: <em>table stakes</em> means poker in one, the baseline in another.</p>""",
    features=[
        ("Meaning in context", "Paste the sentence I'm reading and LexiAI says which sense the word takes there, and how to tell. Then I hear a real speaker say it, clipped from my podcast corpus.",
         [("lx-break", "LexiAI · Sentence Breakdown"), ("lx-pod", "LexiAI · Heard in podcasts")]),
        ("SM-2 flashcards", "Rate a card and SM-2 sets the next review date. Best streak, level and word count come straight from my notebook.",
         [("lx-card", "LexiAI · Review"), ("lx-stats", "LexiAI · Profile")]),
        ("Can Speak, Can Write", "The other tools write back what I can actually use, so the notebook knows the difference between saved and known.",
         [("lx-status", "LexiAI · Notebook")]),
    ],
    highlight=0,
    highlights=[
        ("Both senses, side by side", "I meet each word in two rooms, so the lookup shows the everyday meaning and the finance meaning at once, with the collocations people use.", "lx-define", "LexiAI · Define"),
        ("Deep links that route themselves", "A short request opens Define; a whole sentence opens Analyze.", "", ""),
        ("Transcribed once, on my Mac", "Local Whisper is slow, but it's free and the audio never leaves my machine.", "", ""),
    ],
),
"lexispeak": dict(
    name="LexiSpeak",
    h1="Knowing a word and saying it are different skills",
    what="Speaking Studio: conversation practice that grades my recorded voice, not a transcript of it.",
    meta="Designer and builder · Vite, React, TypeScript, Tailwind, @google/genai, Supabase (shared with LexiAI) · Runs locally on my Mac",
    links=[],
    hero=("speak-loop", "LexiSpeak · Record, listen, report", "Sample reports"),
    inspiration="""<p>Reading taught me thousands of words, not how to say them. In an interview the word I'd reviewed wouldn't come. I wanted questions, answers out loud, and a clear note on what went wrong.</p>""",
    features=[
        ("Four modes", "Casual, Interview, Business and Group, each with its own conversation partner and its own kind of question.",
         [("sp-modes", "LexiSpeak · New session")]),
        ("A report that explains itself", "Grammar, pronunciation, phrasing and target words, each scored. Then one fix that sounds more natural, with the reason in a line.",
         [("sp-report", "LexiSpeak · Report · Interview"), ("sp-fix", "LexiSpeak · Report · Business")]),
        ("Can Speak, written back", "Words I use well in a session update my LexiAI notebook, so the next session asks for the ones I haven't said yet.",
         [("sp-back", "LexiSpeak to LexiAI")]),
    ],
    highlight=0,
    highlights=[
        ("Grading the voice, not the text", "Gemini hears my recording, not a transcript of it. Sending audio is slower and costs more. That was the point.", "sp-wave", "LexiSpeak · Recording"),
        ("A guard against hallucinated speech", "Very short recordings made the model invent sentences; a short-audio guard stops it.", "", ""),
        ("Retry on 504", "Gemini timeouts retry automatically, with a clearer error if they still fail.", "", ""),
    ],
),
"writing-station": dict(
    name="Writing Station",
    h1="A correction is useless if it doesn't tell me why",
    what="The Writing Desk: a quiet place for one English journal entry a day, reviewed one sentence at a time.",
    meta="Designer and builder · Node (server.mjs), rich-text editor, Claude Sonnet via claude -p (switchable to Gemini Flash) · Runs on my Mac, opens on iPad and iPhone over home Wi-Fi",
    links=[],
    hero=("write-desk", "Writing Station · Review", "My real Aug 12 entry"),
    inspiration="""<p>Grammar checkers make writing correct, not better: you click accept and repeat the mistake tomorrow. I wanted feedback that explains itself, one sentence at a time, in files I own.</p>""",
    features=[
        ("One entry a day", "A plain list of dates, newest first. Nothing else competes for attention on the desk.",
         [("ws-journal", "Writing Station · Journal")]),
        ("Corrections with the reason", "Every error comes with the fix and the rule I broke, written next to the sentence it belongs to.",
         [("ws-fix", "Writing Station · Review · Aug 12")]),
        ("Files I own", "Plain files on my Mac, open on my iPad and iPhone over home Wi-Fi. Nothing syncs to anyone's cloud.",
         [("ws-local", "Writing Station · Storage")]),
    ],
    highlight=0,
    highlights=[
        ("Errors and style, never mixed", "Correct but stiff gets a different mark from wrong, so I know which notes to memorise and which to absorb.", "ws-idiom", "Writing Station · Review · Aug 12"),
        ("The reviewer is a CLI call", "Reviews run through claude -p with Claude Sonnet, switchable to Gemini Flash.", "", ""),
        ("Writing that stays mine", "Nothing syncs to the cloud. I'd rather have that limit than the alternative.", "", ""),
    ],
),
"muse": dict(
    name="Meta Muse × LexiAI",
    h1="Reviews should come to me, not wait for me to open an app",
    what="muse-api: a small API I built so Meta's Muse assistant can quiz me from my LexiAI notebook every night and write the results back.",
    meta="Designer and builder of muse-api · Supabase Edge Function (Deno), Bearer token, LexiAI's SM-2 · Live since Sep 27, 2026",
    links=[],
    hero=("muse-chat", "Meta Muse · Nightly review", "Cards from my notebook"),
    inspiration="""<p>LexiAI made saving easy, and that was the problem: thousands saved, few reviewed. I already talk to Muse, Meta's assistant, on my phone and my Mac, so I gave it a way into my notebook.</p>""",
    features=[
        ("A nightly quiz, pushed to me", "Muse comes to me around 9:14 pm with the words that are due. I don't have to remember to open anything.",
         [("mu-note", "Meta Muse · Notification")]),
        ("One card at a time", "My hardest due words come first: ordered by most lapses, then lowest ease.",
         [("mu-card", "Meta Muse · Quiz")]),
        ("Four ratings", "Again, Hard, Good or Easy, like any flashcard app. The rating sets when I see the word next.",
         [("mu-rate", "Meta Muse · Quiz")]),
    ],
    highlight=1,
    highlights=[
        ("Nothing has to run on my Mac", "It's an Edge Function in LexiAI's Supabase project, scoped to my one account.", "", ""),
        ("One SM-2, two front ends", "muse-api runs a line-for-line port of LexiAI's SM-2, so due dates agree wherever I review. Ratings go back through muse-api into the same words table.", "mu-back", "muse-api · Supabase Edge Function"),
        ("Hardest cards first", "Cards come ordered by most lapses, then lowest ease.", "", ""),
    ],
),
}

# Screens per project page, in plate order: why I built it, the three features (key 4 is no longer shown since R11).
SHOTS = {
    "lexiai": ["lexiai-define", "lexiai-context", "lexiai-review", "lexiai-notebook", "lexiai-senses"],
    "lexispeak": ["lexispeak-session", "lexispeak-modes", "lexispeak-report", "lexispeak-words", "lexispeak-fixes"],
    "writing-station": ["writing-station-review", "writing-station-journal", "writing-station-note", "writing-station-ipad", "writing-station-styles"],
    "muse": ["muse-rated", "muse-note", "muse-quiz", "lexiai-review", "lexiai-notebook"],
}
# Two Muse plates show LexiAI's real screens; the override line is added to their caption: Muse writes its ratings into the same SM-2 schedule.
CAPTION_OVERRIDE = {
    ("muse", 3): ("Same four ratings in LexiAI", "LexiAI's own Review uses the same SM-2 scale that Muse writes back to."),
    ("muse", 4): ("Shared due dates", "Due dates in LexiAI's notebook come from the one SM-2 that Muse and LexiAI share."),
}

def next_card(slug, root):
    """Bottom of every project page: the next project, as one card."""
    n = ORDER[(ORDER.index(slug) + 1) % len(ORDER)]
    _code, _s, line = next(c for c in CATALOG if c[1] == n)
    return (f'<a class="plate next" href="{n}.html">'
            f'<span class="nx-name">Next: {disp(P[n]["name"])}</span><span class="nx-d">{line}</span><span class="go" aria-hidden="true">→</span></a>')


def title_plate(name, what, meta, links="", lead=""):
    """Project/research title plate. Put the single date (if any) in `meta`; do not prefix a year badge."""
    return f"""<section class="plate title">
  <h1>{disp(name)}</h1>
  {f'<p class="lead">{lead}</p>' if lead else ''}<p class="what">{what}</p>
  <p class="meta">{meta}</p>{f'<p class="hero-links">{links}</p>' if links else ''}
</section>"""


def shot_plate(num, label, key, root, text, extra=""):
    return f"""<section class="plate">
  {ph(f"{num:02d}", label)}
  <figure class="fig">{screen(key, root, lazy=num > 1)}<figcaption><span class="fig-n">Fig. {num}</span>{text}{f' {extra}' if extra else ''}</figcaption></figure>
</section>"""


def project_page(slug):
    p = P[slug]
    root = "../"
    links = "".join(f'<a href="{h}">{t} ↗</a>' for t, h in p["links"])
    keys = SHOTS[slug]
    strip = lambda h: h.replace("<p>", "").replace("</p>", "")
    plates = [shot_plate(1, "Why I built it", keys[0], root, strip(p["inspiration"]))]
    for n, (title, line, _cards) in enumerate(p["features"], 1):
        over = CAPTION_OVERRIDE.get((slug, n))
        plates.append(shot_plate(n + 1, title, keys[n], root, line, over[1] if over else ""))
    lead = p["highlights"][p["highlight"]]
    decisions = [lead] + [h for j, h in enumerate(p["highlights"]) if j != p["highlight"]]
    dl = "".join(f"<li><h3>{t}</h3><p>{d}</p></li>" for t, d, *_ in decisions)
    plates.append(f'<section class="plate">\n  {ph("05", "Decisions", "3")}\n  <ul class="dec">{dl}</ul>\n</section>')
    body = "\n".join(plates)
    return f"""{head(f"{p['name']} — Janet Mao", p['what'], root)}
<body class="v5 project" data-root="{root}">
<div class="page narrow">
{nav(root, 'work')}
<main>
{title_plate(p['name'], p['what'], p['meta'], links)}
{body}
{next_card(slug, root)}
</main>
{foot(root)}"""


# ---------------------------------------------------------------- startup research (revision 7)
# Not a tool page: the method (ten questions) and the writing framework (a generic two-pager).
# R23: framework only. Granola, the worked example, moved to projects/research-granola.html (listed by RESEARCH).
# Every excerpt below is verbatim from the Granola files in the Obsidian vault (Startup Deepdive/Granola/);
# only Markdown (bold, links, emoji) is stripped, and cuts are marked with "…".
P["startup-research"] = dict(
    name="Startup Research",
    h1="How I read a company: understand the tech, analyze the business",
    what="How I read a company: understand the tech, analyze the business.",
)
# (file no., dimension, the one question, the method, source label, verbatim excerpt). Cell text <= 14 words.
FRAMEWORK = [
    ("10", "Team", "Did the founders live the pain?", "Founder-market fit, from podcast transcripts.", "10-team.md · Domain expertise",
     "They didn't start with the answer: months of GPT-3 work-tool prototypes with test users, then a ~year in stealth onboarding users one by one and a 6-month beta with 150 users, cutting 50% of features before launch. … Evidence quality: concrete (prior companies, product history), not vibes."),
    ("20", "Product", "Mission-critical or nice-to-have?", "PMF signals; moat claimed vs. judged.", "20-product.md · Value proposition test",
     "VCs, founders, and AE/CS teams running 5+ meetings/day would scream loudly — the tool is a daily habit wired into their calendar … Casual users (1–2 meetings/day) would shrug and fall back to Zoom's built-in summaries. Verdict: mission-critical for the core segment, nice-to-have at the edges …"),
    ("30", "Market", "Why now, and how big, bottom-up?", "Own TAM, not analyst reports.", "30-market.md · Bottom-up TAM",
     "Every line is an assumption unless it carries a link. … Cross-check: our $4.0B independently matches Grand View's $4.3B 2026 top-down and TBRC's $3.91B. Rare case where bottom-up and top-down agree — raises confidence in the number."),
    ("40", "Competition", "What is the moat, really?", "7 Powers, cross-checked with Gokul Rajaram's 8 moats.", "40-competition.md · 7 Powers scorecard",
     "Granola holds exactly one Power today — counter-positioning — which is the correct Power for its stage and is genuinely working."),
    ("50", "Data", "What do the filings say?", "SEC Form D, Companies House; every ARR sourced.", "50-data.md · Tier 1 primary filings",
     "No Form D for Series B ($43M, May 2025) or Series C ($125M, Mar 2026). … it means $168M of the $192M raised has no primary-source confirmation of amount sold, investor count or first-sale date — the B and C figures rest on company statements and press only."),
    ("60", "Expert views", "What do named investors and the founders say?", "Founder claims from podcast transcripts, timestamped.", "60-expert-views.md · Net",
     "Net: the loudest fans and the sharpest critics are literally the same firm's partners (a16z). The debate is not “is the product good” (consensus: yes) but … does Granola win or lose the “context wars” it is now betting the company on."),
    ("65", "Positioning", "How has the story changed over time?", "Podcast transcripts lined up by date.", "65-positioning.md · What the arc says",
     "In May 2025 the plan was to pull in email and Slack and have people draft their work inside Granola. In August 2025 it was “a tool for thought to help you do work”. … The earlier verdict missed this because it compared slogans; the difference only shows when the statements are lined up with what each one says Granola itself will do."),
    ("70", "Sustainability", "Does it survive the next model?", "Stress test against model progress.", "70-sustainability.md · Verdict",
     "Not a Wrapper: value survives a model swap; the wedge is capture + workflow + corpus, which live outside the model. … A company whose survival depends on OpenAI continuing to half-ass a feature is racing, not riding."),
    ("80", "Risks", "What kills it?", "Five risk categories, one kill shot, with odds.", "80-risks.md · The kill shot",
     "An adverse CIPA outcome (ruling or settlement-with-conduct-remedy) that forces default-on, all-participant notification and opt-in training. Runway can't fix it, hiring can't fix it, and the pivot options are ugly … Every other risk on this page degrades the outcome; this one deletes the thesis."),
    ("90", "Tech", "How is it built?", "Six layers: bought or built, and where's the moat.", "Granola — Deep Dive · §7",
     "Pedregal will not answer cross-meeting questions by retrieval, because “a lot of the most interesting queries… would completely fail with that type of method”: the answer to <em>what did I explain badly</em> is not a passage to be found but a judgment formed after reading everything. So Granola loads the full context, which “is very costly” …"),
]
# Gokul Rajaram's 8 moats (20VC, Mar 16 2026). R21: shown as a generic checklist (moat, what it means <= 8 words),
# no company's verdicts. Granola's R8 scores are kept in _src/r20-snapshot/build.py and R8_REPORT.md.
GOKUL_20VC = "https://www.thetwentyminutevc.com/gokul-rajaram"
MOATS = [
    ("Data", "Proprietary data that compounds with use."),
    ("Workflow", "Wired into how people work every day."),
    ("Regulatory", "Licenses or compliance rivals can't easily get."),
    ("Distribution", "A channel to customers others can't buy."),
    ("Ecosystem", "Others build on it, so leaving costs more."),
    ("Network effects", "Each new user makes it better for the rest."),
    ("Physical infrastructure", "Hard assets that take years to copy."),
    ("Scale", "Unit costs fall as it grows."),
]


def moats_branch(uid):
    """R19/R21: the 8 moats as a checklist sub-branch off the Competition node (collapsed by motion.js, open without JS)."""
    rows = "".join(f'<li style="--m:{i}"><span class="tr-box" aria-hidden="true"></span><span><b>{n}</b> <i>· {e}</i></span></li>' for i, (n, e) in enumerate(MOATS))
    return (f'<div class="tr-sub" id="{uid}"><div class="tr-sub-in"><ul class="tr-moats">{rows}</ul>'
            f'<p class="tr-v">Rubric: <a href="{GOKUL_20VC}" target="_blank" rel="noopener">Gokul Rajaram on 20VC, Mar 2026</a></p></div></div>')


RAMP = "https://ramp.com/vendors/granola"
TURCK_3655 = "https://www.youtube.com/watch?v=IcbuTTVUY7M&t=2215"
# R23: the annotation pills on the Granola §0 excerpt (research-granola.html). Unchanged from R7–R22.
GRANOLA_NOTES = [  # (n, pill / rule name, one line <= 15 words)
    (1, "Lead with the bet", "State the beliefs first, so the evidence can be judged against them."),
    (2, "Every belief has a kill condition", "Each belief names the data that would prove it wrong."),
    (3, "Numbers with sources", "Every figure links to where it came from, like Ramp's 64%."),
    (4, "Founders in their own words, with timestamps", "Each quote links to the second it was said."),
]
# The writing framework = the shared spine of the English business-magazine issues
# (Clay 13 pp, Granola 14 pp), taken from the issue.html page roles both share.
# Company-specific pages (Clay waterfall / GTM; Granola positioning / model question) are omitted.
# Moats is named generically: Clay uses Gokul's 8, Granola uses Helmer's 7.
# Competition appears in both issues but not in the same place relative to Origin; it is
# listed here after Origin as a shared role, not as a claim that every issue puts it there.
ISSUE_SPINE = [  # (mark, section name, one line on what goes there)
    ("01", "Cover", "The question the issue asks, in a headline."),
    ("02", "What it is", "The company in plain words, and the problem it is for."),
    ("03", "Product", "How the product works, in concrete terms."),
    ("04", "Customers", "Who uses it, and how that base has grown."),
    ("05", "Origin", "How it started, and the first move that worked."),
    ("06", "Competition", "Where it stands among rivals, and where the pressure is."),
    ("07", "Moats", "Which advantages are real, and which are not."),
    ("08", "Business model", "How it makes money, and what the price is paying for."),
    ("09", "Risks", "What could break the bet."),
    ("10", "Verdict", "The call, and the time window it is for."),
    ("11", "Sources", "What this issue knows, and what it doesn’t."),
]
WRITING_RULES = [  # (n, rule, one line <= 15 words)
    (1, "One issue, a shared spine", "Cover to sources. A company may add pages of its own."),
    (2, "Headings are claims", "Each section title states its conclusion, not its topic."),
    (3, "Lead with the point", "Every paragraph opens with what it means; evidence follows."),
    (4, "Quotes with timestamps", "Each founder quote links to the second it was said, and gets one line on what it implies."),
    (5, "Estimates say so", "Anything undisclosed is a range marked as my estimate."),
    (6, "End on what would change it", "Odds on the biggest risk, a time window, three signals to watch."),
]
# §0 of "Granola — Deep Dive.md" (Oct 4, 2026, rev 4), verbatim with cuts; .an spans carry the annotations.
def an(n, html):
    return f'<span class="an" data-a="{n}">{html}<sup class="an-n">{n}</sup></span>'
BET = (
    f"<p>{an(1, 'The case for Granola at this price rests on four beliefs, and it is worth stating them before the evidence so the evidence can be judged against them.')}</p>"
    "<p>The first is that Granola has genuinely won the first act of its market — standalone AI meeting notes — and won it on demand rather than on packaging. "
    + an(3, f'<a href="{RAMP}">Ramp’s procurement data</a>, updated the day this was written, shows Granola paid for by 64 percent of the businesses buying in its category')
    + ", up 34 points in a year … "
    + an(2, "If the first data covering the period after Google switched its own notes on by default shows that share falling, this belief is wrong.")
    + "</p><p>The third is that the $1.5 billion is a payment for the second act … Pedregal has been unusually candid that this was always the plan: "
    + an(4, f'“the product we have today is a Trojan horse to collect a lot of your context,” he told Matt Turck in August 2025 (<a href="{TURCK_3655}">36:55</a>)')
    + ".</p>"
)
PAGES = [  # (image key, w, h, title, caption, alt)
    ("startup-twopager-p1", 1406, 1988, "Page 1 · Why it wins", "How it started, its one hard edge, and why its market has a ceiling.",
     "Granola two-pager, page 1: the notepad that listens, with key numbers, a funding chart and three sections"),
    ("startup-twopager-p2", 1406, 1988, "Page 2 · What the $1.5B pays for", "Act two, the cost of heavy users, and the lawsuit aimed at its core feature.",
     "Granola two-pager, page 2: act two, margins, the lawsuit and a verdict box"),
    ("startup-positioning", 2070, 1017, "The ambition, by date", "Six founder quotes in date order: wider through 2025, narrower in 2026.",
     "Timeline of how Granola described itself from May 2024 to July 2026, with six founder quotes"),
    # R68: the Clay two-page brief (from the English PDF), used by research-clay.html
    ("clay-twopager-p1", 1406, 1988, "Page 1 · Why it won", "How it started, the self-filling table, and its one hard edge.",
     "Clay two-page brief, page 1: the checkout for data, with key numbers, a revenue chart and three sections"),
    ("clay-twopager-p2", 1406, 1988, "Page 2 · What the $7.1B pays for", "Positioning, the business model, the risk of being bypassed, and a verdict.",
     "Clay two-page brief, page 2: positioning, pricing, a valuation multiples chart, risks and a verdict box"),
]


# ---- Revision 19: the ten questions as one vertical-spine tree (replaces the R7 grid and the separate R8 moats card).
# R21: a generic framework for any startup: each node is icon, number + name, question and method only.
PHASES = [("People & product", ["10", "20"]), ("Market & moat", ["30", "40"]),
          ("Evidence", ["50", "60", "65"]), ("Durability", ["70", "80", "90"])]
# Small line icons in the homepage-card style (ink outline, white fill, one green touch), 40×40.
_G, _T = "#3d5e4a", "#dfe5dd"  # accent, tint (the homepage _A is defined further down)
NODE_ICON = {
    "10": f'<circle cx="15" cy="14" r="5" fill="#fff"/><path d="M6 32c0-6 4-10 9-10s9 4 9 10" fill="none"/>'
          f'<g stroke="{_G}" fill="none"><circle cx="28" cy="15" r="4"/><path d="M27 22.5c5 0 8 4 8 9.5"/></g>',
    "20": f'<path d="M13 7V4M20 7V4M27 7V4" fill="none"/><rect x="9" y="7" width="22" height="27" rx="2" fill="#fff"/>'
          f'<path d="M14 15h12M14 20h12" fill="none"/><path d="M14 26h7" fill="none" stroke="{_G}" stroke-width="2.2"/>',
    "30": f'<circle cx="20" cy="20" r="14" fill="#fff"/><circle cx="20" cy="20" r="8.5" fill="none"/><circle cx="20" cy="20" r="3.4" fill="{_G}" stroke="none"/>',
    "40": f'<path d="M10 29V12h4v4h4v-4h4v4h4v-4h4v17z" fill="#fff"/><path d="M18 29v-6h4v6" fill="none"/>'
          f'<path d="M4 34c3-2 5 2 8 0s5 2 8 0 5 2 8 0 5 2 8 0" fill="none" stroke="{_G}" stroke-width="2"/>',
    "50": f'<path d="M10 5h14l6 6v24H10z" fill="#fff"/><path d="M24 5v6h6M15 17h10M15 22h6" fill="none"/><circle cx="25" cy="28" r="4.2" fill="{_G}" stroke="none"/>',
    "60": f'<path d="M6 7h17a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H14l-5 4v-4H6a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2z" fill="#fff"/>'
          f'<path d="M28 14h5a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-2v5l-5-5h-7a2 2 0 0 1-2-2v-2" fill="none" stroke="{_G}"/>',
    "65": f'<path d="M4 29h32M9 25V14M20 25V8M31 25V17" fill="none"/><circle cx="9" cy="29" r="2.6" fill="#fff"/><circle cx="20" cy="29" r="2.6" fill="#fff"/>'
          f'<circle cx="31" cy="29" r="2.6" fill="{_G}" stroke="{_G}"/>',
    "70": f'<path d="M31 15A12 12 0 0 0 10 11M9 25a12 12 0 0 0 21 4" fill="none"/><path d="M9 5v6h6M31 35v-6h-6" fill="none"/>'
          f'<circle cx="20" cy="20" r="3.4" fill="{_G}" stroke="none"/>',
    "80": f'<path d="M20 5l16 28H4z" fill="#fff"/><path d="M20 14v9" fill="none" stroke="{_G}" stroke-width="2.4"/><circle cx="20" cy="28" r="1.6" fill="{_G}" stroke="none"/>',
    "90": f'<path d="M6 18l14 6 14-6M6 24l14 6 14-6" fill="none"/><path d="M20 6l14 6-14 6-14-6z" fill="{_T}" stroke="{_G}"/>',
}
_KT = 'stroke="#0a0a0a" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"'
# R22: the raw material that feeds the tree, shown as a band of source chips above the root.
# (key, icon, name, one line). The podcast chip is primary; "podcast-dig" links to its own page.
SOURCES = [
    ("pod", f'<rect x="14" y="4" width="12" height="20" rx="6" fill="#fff"/><path d="M9 19a11 11 0 0 0 22 0M20 30v6M14 36h12" fill="none"/>'
            f'<path d="M18 11h4M18 16h4" fill="none" stroke="{_G}" stroke-width="2"/>',
     'Podcast transcripts', 'Via <a href="podcast-dig.html">podcast-dig</a>: founder and investor interviews, exact quotes with timestamps.'),
    ("pub", f'<circle cx="17" cy="17" r="11" fill="#fff"/><path d="M12 14h10M12 19h7" fill="none"/><path d="M25 25l9 9" fill="none" stroke="{_G}" stroke-width="2.4"/>',
     'Public research', 'Product, pricing, funding, press.'),
    ("use", f'<rect x="4" y="6" width="32" height="22" rx="2" fill="#fff"/><path d="M4 12h32" fill="none"/>'
            f'<path d="M19 17l9 4-4 1.5-1.5 4z" fill="{_G}" stroke="{_G}"/>',
     'Hands-on use', 'Trying the product myself.'),
]


def sources(uid):
    chips = "".join(f'<li class="tr-sc{" tr-sc-key" if k == "pod" else ""}"><svg class="tr-ic" viewBox="0 0 40 40" aria-hidden="true">'
                    f'<g filter="url(#{uid}-rf)" {_KT}>{ic}</g></svg><p><b>{name}</b><span>{line}</span></p></li>'
                    for k, ic, name, line in SOURCES)
    # R36: one small line under the band, pointing to the AI Term Explainer page.
    return (f'<div class="tr-src"><p class="tr-src-k">Raw material</p><ul class="tr-srcs">{chips}</ul>'
            f'<p class="tr-also">Also: <a href="ai-terms.html">AI Term Explainer films</a> for the tech</p></div>')


def tree(uid):
    """Root, a centre spine, nodes alternating left/right in four phases, Competition opening the 8-moat checklist."""
    by_n = {row[0]: row for row in FRAMEWORK}
    items, k = [], 0
    for p, (phase, ns) in enumerate(PHASES, 1):
        items.append(f'<li class="tr-ph"><span><b>{p}</b>{phase}</span></li>')
        for j, n in enumerate(ns):
            _n, name, q, m, _src, _x = by_n[n]
            ic = (f'<svg class="tr-ic" viewBox="0 0 40 40" aria-hidden="true"><g filter="url(#{uid}-rf)" {_KT}>{NODE_ICON[n]}</g></svg>')
            key = n == "40"
            more = (f'<button type="button" class="tr-x" aria-expanded="true" aria-controls="{uid}-moats">'
                    f'<b>8 moats</b> checklist<span class="tr-pm" aria-hidden="true"></span></button>{moats_branch(uid + "-moats")}') if key else ""
            cls = f'tr-n tr-{"l" if k % 2 == 0 else "r"}{" tr-key open" if key else ""}{" tr-follow" if j else ""}'
            items.append(f'<li class="{cls}" style="--k:{k}"><span class="tr-dot" aria-hidden="true"></span><span class="tr-arm" aria-hidden="true"></span>'
                         f'<div class="tr-c">{ic}<div class="tr-t"><h3 class="tr-h"><span class="tr-num">{n}</span>{name}</h3>'
                         f'<p class="tr-q">{q}</p><p class="tr-m">{m}</p>{more}</div></div></li>')
            k += 1
    return (f'<div class="tr" data-tree><svg width="0" height="0" aria-hidden="true" style="position:absolute"><filter id="{uid}-rf" x="-5%" y="-5%" width="110%" height="110%">'
            f'<feTurbulence type="fractalNoise" baseFrequency=".09" numOctaves="2" seed="7"/><feDisplacementMap in="SourceGraphic" scale="1"/></filter></svg>'
            f'{sources(uid)}<p class="tr-root"><b>How I take a startup apart</b><span>10 questions · one file each</span></p>'
            f'<ol class="tr-list">{"".join(items)}<li class="tr-end"><a href="#writing">Then: the magazine ↓</a></li></ol></div>')


def bet_doc():
    notes = "".join(f'<li data-a="{n}"><span class="an-n">{n}</span>{t}</li>' for n, t, _ in GRANOLA_NOTES)
    return (f'<div class="doc" data-doc><article class="doc-page"><p class="doc-meta">Granola — Deep Dive · Oct 4, 2026 · Revision 4</p>'
            f'<h4>0. The bet</h4>{BET}</article><ol class="doc-notes" aria-label="The rules each marked line follows">{notes}</ol>'
            f'<svg class="doc-lines" aria-hidden="true"></svg></div>'
            '<p class="fig-c"><span class="fig-n">Fig.</span>The opening of my Granola report, §0, verbatim with cuts. Each pill names the rule that line follows.</p>')


def page_fig(k, root):
    key, w, h, title, line, alt = PAGES[k]
    src, a = f"{root}assets/screens/{key}", ""
    return (f'<figure class="pg{" wide" if w > h else ""}"><a class="pg-link" href="{src}.png" target="_blank" rel="noopener" aria-label="Open {title} full size">'
            f'<picture><source {a}srcset="{src}.webp" type="image/webp"><img {a}src="{src}.png" alt="{alt}" width="{w}" height="{h}" loading="lazy" decoding="async"></picture>'
            f'<span class="pg-open">Open full size ↗</span></a><figcaption><span class="fig-n">{title}</span>{line}</figcaption></figure>')


# R28: glyphs for the unnumbered blocks, so the number column never shows a lone dot.
TP_ICONS = {
    "Headline": '<path d="M3 4h10M8 4v9"/>',
    "Key numbers": '<path d="M3 13V9M6.5 13V5M10 13V7.5M13.5 13V3"/>',
    "Lede": '<path d="M3 4.5h10M3 8h10M3 11.5h6"/>',
    "The verdict, up front": '<path d="M4 14V2.5M4 3h8l-1.8 2.8L12 8.5H4"/>',
    "Verdict": '<circle cx="8" cy="8" r="5.6"/><path d="m5.6 8.1 1.7 1.7 3.2-3.4"/>',
}
TP_KIND = {"Headline": "hl", "Key numbers": "kn", "Lede": "ld", "The verdict, up front": "vu", "Verdict": "vd"}


def magazine_issue():
    """Shared spine of the business-magazine issues, then the writing rules.
    Same card/row treatment as the old two-pager sheets: number, heading, one line, hairline rules.
    One sheet (one issue), not a two-page spread."""
    def block(m, name, line):
        return (f'<li class="tp-b"><span class="tp-n">{m}</span><p><b>{name}</b><span class="tp-d">{line}</span></p></li>')
    sheet = (
        '<article class="tp-sheet"><header class="tp-k"><span>The issue</span><b>A business magazine</b></header><ol class="tp-list">'
        + "".join(block(*r) for r in ISSUE_SPINE)
        + '</ol><footer class="tp-f" aria-hidden="true"><span>Startup Teardown</span><span>Cover to sources</span></footer></article>')
    rules = "".join(f"<li><b>{t}.</b> {d}</li>" for _n, t, d in WRITING_RULES)
    return (f'<div class="tp">{sheet}</div><h3 class="tp-h">Rules</h3><ol class="rules">{rules}</ol>')



# Public essays, talks, and frameworks named in ~/.claude/skills/startup-deepdive
# (SKILL.md, references/expert-frameworks.md, report-template.md, dd-checklists.md,
# sources-playbook.md). One primary public URL per entry, as stated in those files.
# Wall Street Prep's URL was not in the skill; official page found 2026-11-11.
# (group, [(title, author, href, how the skill uses it)])
SKILL_LIBRARY = [
    ("The YC circle", [
        ("What We Look for in Founders", "Paul Graham", "https://paulgraham.com/founders.html",
         "Used to judge early founders when traction is still thin, and whether this is a real startup."),
        ("Startup Playbook", "Sam Altman", "https://playbook.samaltman.com/",
         "Used to read a seed company end to end: the product, the users, and what the team should prove next."),
        ("How to Evaluate Startup Ideas", "Kevin Hale", "https://www.youtube.com/watch?v=DOtCl5PU8F0",
         "The rubric for scoring an idea before there is traction."),
        ("Tarpit ideas", "Dalton Caldwell", "https://www.youtube.com/watch?v=MvZumqI93K4",
         "Used to stress-test ideas that everyone likes, and whether the founders have a right to win."),
        ("Earnestness and misfit founders", "Garry Tan", "https://fs.blog/knowledge-project-podcast/garry-tan/",
         "Used to judge whether a founding team is the real thing, especially unpolished or contrarian founders."),
        ("If your product is Great, it doesn’t need to be Good", "Paul Buchheit",
         "https://paulbuchheit.blogspot.com/2010/02/if-your-product-is-great-it-doesnt-need.html",
         "Used to judge whether a first product is truly focused, and to separate founder quality from the idea."),
    ]),
    ("Big-firm GPs", [
        ("The Only Thing That Matters", "Marc Andreessen / a16z", "https://pmarchive.com/guide_to_startups_part4.html",
         "Used when the open question is demand: is the market pulling the product, or is the team pushing it?"),
        ("Revenue Quality & Marketplace Physics", "Bill Gurley / Benchmark",
         "https://abovethecrowd.com/2011/05/24/all-revenue-is-not-created-equal-the-keys-to-the-10x-revenue-club/",
         "Used to test whether growth deserves the valuation — unit economics and market quality, not the story."),
        ("Zero to One: The Seven Questions", "Peter Thiel / Founders Fund",
         "https://www.youtube.com/watch?v=5_0dVHMpJlo",
         "Used on category-creating bets: what the company believes that others do not, and whether it can become a monopoly."),
        ("Founder-problem fit, pre-mortems, and pre-parades", "Roelof Botha / Sequoia",
         "https://tim.blog/2022/09/01/roelof-botha-transcript/",
         "Used at seed and Series A: is the founder fused to the problem, and does the timing survive a pre-mortem?"),
        ("Gene Pool Engineering", "Vinod Khosla",
         "https://www.khoslaventures.com/posts/gene-pool-engineering-for-entrepreneurs",
         "Used on technically heavy bets: does the team actually cover the risks that could kill the company?"),
        ("Spikes, barrels, and ammunition", "Keith Rabois / Founders Fund",
         "https://www.youtube.com/watch?v=6fQHLK1aIBs",
         "Used to judge early teams: is there a genuine spike, and can the founder ship?"),
    ]),
    ("Angels and the AI era", [
        ("How to Angel Invest", "Naval Ravikant", "https://nav.al/angel-1",
         "Used at the angel stage, when there is almost no data and the decision is a read on the founders."),
        ("AI Market Clarity", "Elad Gil", "https://blog.eladgil.com/p/ai-market-clarity",
         "Used to judge whether an AI market is investable now — timing and structure, not just the team."),
        ("Pattern Breakers", "Mike Maples Jr. / Floodgate",
         "https://patternbreakers.substack.com/p/how-inflections-let-startups-change",
         "Used on ideas that look too early: a real non-consensus bet, or only contrarian and wrong."),
        ("Software 3.0", "Sarah Guo / Conviction", "https://colossus.com/article/sarah-guo-conviction/",
         "Used on AI-native startups: a product in use, or only a capabilities demo."),
        ("The Unicorn Club", "Aileen Lee / Cowboy Ventures",
         "https://techcrunch.com/2013/11/02/welcome-to-the-unicorn-club/",
         "Used to check pattern-match claims about teams against actual base rates."),
        ("The New Business of AI", "Martin Casado / a16z",
         "https://a16z.com/the-new-business-of-ai-and-how-its-different-from-traditional-software/",
         "Used on AI companies to test whether they scale like software or like a services firm."),
    ]),
    ("Moats and how the report is built", [
        ("7 Powers", "Hamilton Helmer", "https://7powers.com/",
         "The competition scorecard: the company and its top two rivals, scored cell by cell."),
        ("The 8 Moats of Enduring Software Companies", "Gokul Rajaram",
         "https://www.thetwentyminutevc.com/gokul-rajaram",
         "The moat lens used in the Clay issue: eight advantages scored so the real ones stand apart from the rest."),
        ("Playbook, Power, Bull/Bear", "Acquired (Ben Gilbert & David Rosenthal)", "https://www.acquired.fm/",
         "Shapes the playbook read and a bull/bear case in which the bear has a real voice."),
        ("海外独角兽", "拾象", "https://foresightnews.pro/column/detail/101",
         "Shapes the opening bet and the market section: thesis first, then why now and the kinds of players."),
        ("Company reports", "Contrary Research", "https://research.contrary.com",
         "The 11-section skeleton, so a company report never misses a part, and the prose style of the write-up."),
        ("Date and source on every number", "Sacra", "https://sacra.com",
         "Every number in the report must carry a date and a source."),
        ("Venture capital due diligence", "Wall Street Prep",
         "https://www.wallstreetprep.com/knowledge/venture-capital-diligence/",
         "The due-diligence checklists the research agents work through: team, product, business model, and risk."),
    ]),
]


def skill_library():
    """Restrained bibliography of public sources the Startup Research skill is built on."""
    groups = []
    for group, rows in SKILL_LIBRARY:
        items = []
        for title, author, href, used in rows:
            name = f'<a href="{href}" target="_blank" rel="noopener">{title}</a>' if href else title
            items.append(f'<li><p><b>{name}</b><span class="sk-a">{author}</span><span class="sk-d">{used}</span></p></li>')
        groups.append(f'<h3 class="tp-h">{group}</h3><ul class="sk-refs">{"".join(items)}</ul>')
    return '<div class="sk-lib">' + "".join(groups) + "</div>"


def startup_page():
    slug, root = "startup-research", "../"
    meta = "2026 · Method and writing · Claude Code agents, podcast-dig transcripts, Obsidian"
    return f"""{head("Startup Research — Janet Mao", P[slug]['what'], root)}
<body class="v5 project startup" data-root="{root}">
<div class="page narrow">
{nav(root, 'work')}
<main>
{title_plate("Startup Research", P[slug]['what'], meta, lead="10 questions, one magazine.")}
<section class="plate" id="framework">
  {ph("01", "The analysis framework", "10 questions")}
  <p class="intro-l">Each question gets its own file and its own method. Open the 8 moats checklist under Competition.</p>
  {tree("tr")}
</section>
<section class="plate" id="writing">
  {ph("02", "The writing framework", "one issue")}
  <p class="intro-l">The research runs long. What I publish is a business-magazine issue, built on this spine.</p>
  {magazine_issue()}
  <p class="see"><a href="../research.html">See it applied → Research</a></p>
  <p class="intro-l">The same research can also be published as a video — one more channel for this work, not a separate method. The Clay analysis is also on <a href="{CLAY_YT}" target="_blank" rel="noopener">YouTube ↗</a>.</p>
</section>
<section class="plate" id="learned">
  {ph("03", "What the skill learned from", "the library")}
  <p class="intro-l">The skill reads a living library of public essays, talks, and frameworks when it researches a company. Titles link to the source. Founder interviews are pulled first through <a href="podcast-dig.html">podcast-dig</a>, before it searches the open web.</p>
  {skill_library()}
</section>
{next_card(slug, root)}
</main>
{foot(root, js=True)}"""


# ---- Revision 23: every startup I've researched, one row each (rameerez-style list), each with its own page.
# (year, month, title, one line, page slug). Add a row + a page function to list another company.
RESEARCH = [
    ("2026", "Nov", "Startup Teardown No.02 · Clay", "A 13-page English business magazine, drawn from the same Startup Research work.", "research-clay"),
    ("2026", "Oct", "Startup Teardown No.01 · Granola", "A 14-page English business magazine, drawn from the same Startup Research work.", "research-granola"),
]


# ---- Revision 38: the finished AI Terms films, one row each.
# Ep 1–3 also have a 5-slide page (slides from _src/capture/r38/export_slides.py → assets/ai-terms/films/<slug>/
# and subtitle lines in _src/aiterm_slides.json). Ep 4 is a published English film on YouTube @JanetMao
# (title: "04 长上下文vsRAG English"); no 5-slide export is in this repo yet, so its page links out and does not invent stills.
# (slug, episode, term, one line from the film's closing "one line to remember", what the film explains, film length)
AITERM_FILMS = [
    ("embedding", 1, "Embedding", "An embedding turns things into meaning coordinates. Once you have them, you can find things by meaning.",
     "A customer asks, “Can I get my money back?” The document says “refund.” Not a single word matches, so keyword search finds nothing. "
     "An embedding is the fix: it turns every sentence into a list of numbers, coordinates on a map of meaning, so sentences that mean similar things land close together.", "10:30"),
    ("vector-database", 2, "Vector database", "A warehouse that stores points, and can quickly find the few closest ones.",
     "Same support bot, bigger company: 500 documents have become 10 million chunks, and every chunk is already a point. "
     "Measuring the distance to every one of them for a single question takes over 10 billion multiplications. "
     "A vector database is the warehouse built to store those points, and find the closest few in a blink.", "11:21"),
    ("rag", 3, "RAG", "RAG means retrieve first, then generate. It lets the AI take an open-book exam.",
     "A customer asks: “I’m a member, I bought a chair 10 days ago. Can I still return it?” Ask an AI model with no documents and it can’t be sure, or it gets it wrong. "
     "RAG is the fix: first find the few relevant passages in your documents, then have the AI answer from them, and cite its sources.", "16:06"),
    # YouTube had no description; the line below is the existing Ep 4 through-line already used on ai-terms.html.
    ("long-context", 4, "Long context vs RAG", "When to skip retrieval and paste the whole thing in.",
     "When to skip retrieval and paste the whole thing in.", "13:18"),
    ("tool-use", 5, "Tool use", "The model writes a note; the harness runs the tool and hands back the receipt.",
     "The model writes a note; the harness runs the tool and hands back the receipt.", "17:43"),
    ("mcp", 6, "MCP", "One universal plug: write a tool once, and every AI can use it.",
     "One universal plug: write a tool once, and every AI can use it.", "5:36"),
]
# Public episodes on https://www.youtube.com/@JanetMao (watch-page upload dates, America/Los_Angeles).
# Ep 4 watch id updated 2026-11-11: dfvh6xTM6Tc and prior 0gTCd6YHGZs were removed by the uploader; current public film is LvJfLiYkWLo (13:18, title “04 Long Context vs RAG”).
YT_CHANNEL = "https://www.youtube.com/@JanetMao"
# Clay two-page brief as a film: "Startup Analysis — Clay", 25:01, uploaded 2026-11-10 10:06 AM PT.
CLAY_YT = "https://www.youtube.com/watch?v=4vnuaykGEIY"
AITERM_YT = {
    "embedding": "https://www.youtube.com/watch?v=0FrafDTlRdI",
    "vector-database": "https://www.youtube.com/watch?v=xqH57sW9Qpg",
    "rag": "https://www.youtube.com/watch?v=yyeAfoS6sKw",
    "long-context": "https://www.youtube.com/watch?v=LvJfLiYkWLo",  # re-upload; dfvh6xTM6Tc and 0gTCd6YHGZs were removed by the uploader
    "tool-use": "https://www.youtube.com/watch?v=av1_Vw-MRwg",
    "mcp": "https://www.youtube.com/watch?v=1bqJFH19aC4",
}
AITERM_DATE = {  # month of the public YouTube upload, America/Los_Angeles
    "embedding": "Oct 2026",
    "vector-database": "Nov 2026",
    "rag": "Nov 2026",
    "long-context": "Nov 2026",
    "tool-use": "Nov 2026",
    "mcp": "Nov 2026",
}
AITERM_SLIDES = json.loads((OUT / "_src" / "aiterm_slides.json").read_text())


# R52: the Research list lives on the homepage (#research), like the other nav tabs. projects/research.html is now a
# redirect (research_redirect) that keeps old #startups / #ai-terms bookmarks pointing at the right group.
# R55: R53 option A rows (date · title · arrow, no row blurbs).
# R58: no framework lists on the homepage. Each group head carries a short grey blurb with an underlined link to the
# method / project page; the frameworks themselves live on startup-research.html and ai-terms.html.
def research_section():
    row = lambda href, date, t: (f'<li><a href="{href}"><span class="rs-dt">{date}</span><span class="rs-t">{t}</span>'
                                 f'<span class="go" aria-hidden="true">→</span></a></li>')
    startups = "".join(row(f"projects/{href}.html", f"{m} {y}", t) for y, m, t, _x, href in RESEARCH)
    # Homepage shows only the latest approved films; the full set lives on the collection page.
    HOME_AITERM_LATEST = 3
    latest = sorted(AITERM_FILMS, key=lambda f: f[1], reverse=True)[:HOME_AITERM_LATEST]
    films = "".join(row(f"projects/research-aiterm.html#ep-{s}", AITERM_DATE[s], f"Ep {n} · {t}") for s, n, t, *_ in latest)
    nc = len(RESEARCH)
    return f"""<section class="plate rs" id="research">
  {ph("", "Research", f'{nc} {"company" if nc == 1 else "companies"} · {len(AITERM_FILMS)} films', icon="research")}
  {blurb("rs-what", "Startups I've researched, and AI terms I've explained on film.", highlight=False)}
  <div class="rs-g" id="research-startups">
    <div class="rs-h"><h3>Startups <span>{nc}</span></h3><p>Written with my <a href="projects/startup-research.html">Startup Research</a> method. The same research can also be published as a video.</p></div>
    <ul class="rs-rows">{startups}</ul>
    <p class="rs-all"><a href="projects/research-startups.html">View all startup teardowns →</a></p>
  </div>
  <div class="rs-g" id="research-ai-terms">
    <div class="rs-h"><h3>AI Term Explainer <span>{len(AITERM_FILMS)}</span></h3><p>One AI word per film, in plain language. Watch on <a href="{YT_CHANNEL}" target="_blank" rel="noopener">YouTube</a>. How they’re made: <a href="projects/ai-terms.html">AI Term Explainer</a>.</p></div>
    <ul class="dl-films">
      <li><a href="projects/research-aiterm.html#ep-mcp"><span class="dl-still"><img src="assets/ai-terms/films/mcp/02.jpg" alt="" loading="lazy"><span class="dl-play" aria-hidden="true">▶</span><span class="dl-ep">Ep 6 · 5:36</span></span><span class="dl-ft">MCP</span><span class="dl-fm">One plug for every AI.</span></a></li>
      <li><a href="projects/research-aiterm.html#ep-tool-use"><span class="dl-still"><img src="assets/ai-terms/films/tool-use/02.jpg" alt="" loading="lazy"><span class="dl-play" aria-hidden="true">▶</span><span class="dl-ep">Ep 5 · 17:43</span></span><span class="dl-ft">Tool use</span><span class="dl-fm">How AI goes from talking to doing.</span></a></li>
      <li><a href="projects/research-aiterm.html#ep-long-context"><span class="dl-still"><img src="assets/ai-terms/films/long-context/02.jpg" alt="" loading="lazy"><span class="dl-play" aria-hidden="true">▶</span><span class="dl-ep">Ep 4 · 13:18</span></span><span class="dl-ft">Long context vs RAG</span><span class="dl-fm">When to skip retrieval and paste the whole thing in.</span></a></li>
      <li><a href="projects/research-aiterm.html#ep-rag"><span class="dl-still"><img src="assets/ai-terms/films/rag/02.webp" alt="" loading="lazy"><span class="dl-play" aria-hidden="true">▶</span><span class="dl-ep">Ep 3 · 16:06</span></span><span class="dl-ft">RAG</span><span class="dl-fm">An open-book exam for the AI.</span></a></li>
      <li><a href="projects/research-aiterm.html#ep-vector-database"><span class="dl-still"><img src="assets/ai-terms/films/vector-database/02.webp" alt="" loading="lazy"><span class="dl-play" aria-hidden="true">▶</span><span class="dl-ep">Ep 2 · 11:21</span></span><span class="dl-ft">Vector database</span><span class="dl-fm">A warehouse that finds the closest points fast.</span></a></li>
      <li><a href="projects/research-aiterm.html#ep-embedding"><span class="dl-still"><img src="assets/ai-terms/films/embedding/02.webp" alt="" loading="lazy"><span class="dl-play" aria-hidden="true">▶</span><span class="dl-ep">Ep 1 · 10:30</span></span><span class="dl-ft">Embedding</span><span class="dl-fm">Meaning turned into coordinates.</span></a></li>
    </ul>
    <p class="rs-all"><a href="projects/research-aiterm.html">View all episodes →</a></p>
  </div>
</section>"""


def research_redirect():
    """R52: projects/research.html → index.html#research. #ai-terms / #startups map to their homepage groups."""
    to = "../research.html"
    return f"""<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Research — Janet Mao</title><link rel="icon" href="../assets/favicon.svg" type="image/svg+xml">
<script>location.replace("{to}" + ({{"#ai-terms": "#research-ai-terms", "#startups": "#research-startups"}}[location.hash] || ""));</script>
<meta http-equiv="refresh" content="0; url={to}"><link rel="canonical" href="{to}"><meta name="robots" content="noindex">
</head><body><p>Research has its own page: <a href="{to}">Janet Mao → Research</a>.</p></body></html>
"""


def slideshow(slug, term, root):
    """R38: a swipeable row of slides (scroll-snap), prev/next + arrow keys + counter, click a slide for full screen (assets/slides.js)."""
    rows = AITERM_SLIDES[slug]
    figs = "".join(
        f'<figure class="ss-s" role="group" aria-roledescription="slide" aria-label="{i} of {len(rows)}: {r["label"]}">'
        f'<button class="ss-img" type="button" aria-label="View slide {i} full screen"><picture><source srcset="{root}assets/ai-terms/films/{slug}/{r["img"]}.webp" type="image/webp">'
        f'<img src="{root}assets/ai-terms/films/{slug}/{r["img"]}.jpg" alt="Slide {i} from the {term} film: {r["label"].lower()}" width="{r["w"]}" height="{r["h"]}"'
        f'{" loading=\"lazy\"" if i > 1 else ""} decoding="async"></picture></button>'
        f'<figcaption><b>{r["label"]}</b>“{r["caption"]}”</figcaption></figure>'
        for i, r in enumerate(rows, 1))
    return (f'<div class="ss" data-ss aria-roledescription="carousel" aria-label="{term}: {len(rows)} key slides">'
            f'<div class="ss-track" tabindex="0">{figs}</div>'
            f'<div class="ss-bar"><button class="ss-btn" type="button" data-ss-prev aria-label="Previous slide">←</button>'
            f'<span class="ss-n" aria-live="polite"><b>1</b> / {len(rows)}</span>'
            f'<button class="ss-btn" type="button" data-ss-next aria-label="Next slide">→</button>'
            f'<button class="ss-fs" type="button" data-ss-full>Full screen</button></div></div>')


def research_aiterm_collection_page():
    """All approved AI Term Explainer films on one page, with their public YouTube links.
    The shared production method stays on ai-terms.html (series-level, not per episode)."""
    root = "../"
    items = []
    for s, n, term, line, _what, length in AITERM_FILMS:
        yt = AITERM_YT[s]
        items.append(
            f'<li id="ep-{s}">'
            f'<div class="ep-top"><span class="rs-dt">{AITERM_DATE[s]}</span>'
            f'<h2 class="ep-t">Ep {n} · {term}</h2>'
            f'<span class="ep-min">{length}</span></div>'
            f'<p class="ep-l">{line}</p>'
            f'<p class="ep-watch"><a href="{yt}" target="_blank" rel="noopener">Watch on YouTube ↗</a></p>'
            f'</li>'
        )
    watch = (
        f'<a href="{YT_CHANNEL}" target="_blank" rel="noopener">YouTube @JanetMao <span class="link-go" aria-hidden="true">↗</span></a>'
        f'<a href="ai-terms.html">How the films are made →</a>'
    )
    what = "One AI word per film, in plain language. Every approved English episode is listed here."
    meta = f'2026 · {len(AITERM_FILMS)} episodes · English films'
    return f"""{head("AI Term Explainer — Janet Mao", what, root)}
<body class="v5 project research" data-root="{root}">
<div class="page narrow">
{nav(root, 'research')}
<main>
<p class="back"><a href="../research.html#research-ai-terms">← All research</a></p>
{title_plate("AI Term Explainer", what, meta, watch, lead="All episodes, in one place.")}
<section class="plate" id="episodes">
  {ph("01", "The films", f"{len(AITERM_FILMS)} episodes")}
  <p class="funnel-n">Each film has its own through-line and a link to the published English version. How the series is made is on the <a href="ai-terms.html">AI Term Explainer</a> page — one method for the whole series.</p>
  <ul class="ep-list">{''.join(items)}</ul>
</section>
<p class="back"><a href="../research.html#research-ai-terms">← All research</a><a href="ai-terms.html">How the films are made →</a></p>
</main>
{foot(root)}"""


def research_startups_collection_page():
    """All Startup Teardown issues in one place, newest first. Method stays on startup-research.html."""
    root = "../"
    # One-liners are the distinctive opening of each issue page's existing `what`.
    issues = [
        ("clay", "Nov 2026", "Startup Teardown No.02 · Clay", "13 pages",
         "A 13-page English business magazine on Clay, the $7.1B sales-data platform that owns no data.",
         "research-clay.html", CLAY_YT),
        ("granola", "Oct 2026", "Startup Teardown No.01 · Granola", "14 pages",
         "A 14-page English business magazine on Granola, the $1.5B AI notetaker.",
         "research-granola.html", None),
    ]
    items = []
    for slug, date, title, pages, line, href, yt in issues:
        watch = f'<a href="{href}">Read the issue →</a>'
        if yt:
            watch += f'<a href="{yt}" target="_blank" rel="noopener">Watch on YouTube ↗</a>'
        items.append(
            f'<li id="{slug}">'
            f'<div class="ep-top"><span class="rs-dt">{date}</span>'
            f'<h2 class="ep-t"><a href="{href}">{title}</a></h2>'
            f'<span class="ep-min">{pages}</span></div>'
            f'<p class="ep-l">{line}</p>'
            f'<p class="ep-watch">{watch}</p>'
            f'</li>'
        )
    watch_bar = '<a href="startup-research.html">The framework →</a>'
    what = "English business-magazine issues, written with my Startup Research method. Every published issue is listed here."
    meta = f'2026 · {len(issues)} issues · English magazines'
    return f"""{head("Startup Teardowns — Janet Mao", what, root)}
<body class="v5 project research" data-root="{root}">
<div class="page narrow">
{nav(root, 'research')}
<main>
<p class="back"><a href="../research.html#research-startups">← All research</a></p>
{title_plate("Startup Teardowns", what, meta, watch_bar, lead="All issues, in one place.")}
<section class="plate" id="issues">
  {ph("01", "The issues", f"{len(issues)} issues")}
  <p class="funnel-n">Each issue is a business magazine, written with the same <a href="startup-research.html">Startup Research</a> method. Open the issue to read it page by page.</p>
  <ul class="ep-list">{''.join(items)}</ul>
</section>
<p class="back"><a href="../research.html#research-startups">← All research</a><a href="startup-research.html">The framework →</a></p>
</main>
{foot(root)}"""


def research_aiterm_episode_redirect(slug):
    """Old per-episode URLs keep working: send them to the collection anchor."""
    s, n, term, *_ = next(f for f in AITERM_FILMS if f[0] == slug)
    to = f"research-aiterm.html#ep-{s}"
    label = f"Ep {n} · {term}"
    return f"""<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>{label} — AI Term Explainer — Janet Mao</title><link rel="icon" href="../assets/favicon.svg" type="image/svg+xml">
<script>location.replace({to!r});</script>
<meta http-equiv="refresh" content="0; url={to}">
<link rel="canonical" href="{to}"><meta name="robots" content="noindex">
</head><body><p>This episode is listed on the AI Term Explainer collection: <a href="{to}">{label}</a>.</p></body></html>
"""


def research_granola_page():
    """Startup Teardown No.01 · Granola: the 14-page English magazine is the main showcase.
    The two-page brief remains in the repo (assets/screens) but is not shown. No Granola film is listed in source, so none is invented."""
    root = "../"
    issue = f"{root}assets/magazines/granola/issue.html?reader"
    title = "Startup Teardown No.01 · Granola"
    what = "A 14-page English business magazine on Granola, the $1.5B AI notetaker. Written with my Startup Research method from the Sep–Oct 2026 research; figures are dated as in the issue, not updated as of November 2026."
    meta = 'October 2026 · Written with my&nbsp;<a href="startup-research.html">Startup Research framework</a>'
    open_issue = f'<a href="{issue}">Open the magazine <span class="link-go" aria-hidden="true">↗</span></a>'
    return f"""{head(title + " — Janet Mao", what, root)}
<body class="v5 project startup granola" data-root="{root}">
<div class="page narrow">
{nav(root, 'research')}
<main>
<p class="back"><a href="research-startups.html">← All startup teardowns</a></p>
{title_plate(title, what, meta, open_issue, lead="A 14-page English business magazine.")}
<section class="plate" id="issue">
  {ph("01", "The issue", "14 pages")}
  <p class="funnel-n">Page by page, with previous/next, keyboard arrows, and zoom. The 8 podcast transcripts behind the research were pulled with <a href="podcast-dig.html">podcast-dig</a>. {open_issue}</p>
  <div class="mag-embed">
    <iframe src="{issue}" title="Startup Teardown No.01 · Granola, 14-page magazine reader" width="1080" height="1440" loading="lazy" referrerpolicy="no-referrer"></iframe>
  </div>
</section>
<p class="back"><a href="research-startups.html">← All startup teardowns</a><a href="startup-research.html">The framework →</a></p>
</main>
{foot(root, js=True)}"""


def research_clay_page():
    """Startup Teardown No.02 · Clay: the 13-page English magazine is the main showcase.
    The existing YouTube film is supplemental. Two-page brief files stay in assets/ but are not shown."""
    root = "../"
    issue = f"{root}assets/magazines/clay/issue.html?reader"
    title = "Startup Teardown No.02 · Clay"
    what = "A 13-page English business magazine on Clay, the $7.1B sales-data platform that owns no data. Written with my Startup Research method; figures are dated as in the issue."
    meta = 'November 2026 · Written with my&nbsp;<a href="startup-research.html">Startup Research framework</a>'
    open_issue = f'<a href="{issue}">Open the magazine <span class="link-go" aria-hidden="true">↗</span></a>'
    watch = f'<a href="{CLAY_YT}" target="_blank" rel="noopener">Watch on YouTube <span class="link-go" aria-hidden="true">↗</span></a>'
    return f"""{head(title + " — Janet Mao", what, root)}
<body class="v5 project startup clay" data-root="{root}">
<div class="page narrow">
{nav(root, 'research')}
<main>
<p class="back"><a href="research-startups.html">← All startup teardowns</a></p>
{title_plate(title, what, meta, open_issue + watch, lead="A 13-page English business magazine.")}
<section class="plate" id="issue">
  {ph("01", "The issue", "13 pages")}
  <p class="funnel-n">Page by page, with previous/next, keyboard arrows, and zoom. The podcast transcripts behind the research were pulled with <a href="podcast-dig.html">podcast-dig</a>. {open_issue}</p>
  <div class="mag-embed">
    <iframe src="{issue}" title="Startup Teardown No.02 · Clay, 13-page magazine reader" width="1080" height="1440" loading="lazy" referrerpolicy="no-referrer"></iframe>
  </div>
</section>
<section class="plate" id="film">
  {ph("02", "On film")}
  <p class="funnel-n">The same research, as a film. {watch}</p>
  <div class="yt-embed">
    <iframe src="https://www.youtube-nocookie.com/embed/4vnuaykGEIY" title="Startup Analysis — Clay" width="560" height="315" loading="lazy" allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen referrerpolicy="strict-origin-when-cross-origin"></iframe>
  </div>
</section>
<p class="back"><a href="research-startups.html">← All startup teardowns</a><a href="startup-research.html">The framework →</a></p>
</main>
{foot(root, js=True)}"""



# ---------------------------------------------------------------- LexiAI (revision 16: one callout per crop, on the R15 page)
# One calm column: title, five highlights (heading, one sentence, one or two tightly cropped real screenshots), a built-with line.
# Crops come from the redesigned LexiAI (Oct 29 2026) via _src/capture/r14/, r15/ and r16/ and live in assets/lexiai/ (.png + .webp).
# R16: each crop carries one callout (thin accent outline + numbered dot over the key region, the rest dimmed slightly) and a
# short label under it. "Which sense" shows the top of the Meaning-in-context card and, as a second crop, its line after saving
# (the only place the app names the sense number). Callout boxes are in PNG pixels, so they track the image at any width.
LEXI_SUMMARY = "A custom English dictionary, tailored to how I study."
LEXI_ACCENT = "#3d5e4a"
# (heading <= 6 words, one sentence, [(image key, alt text, pixel size of the PNG, (callout x, y, w, h in PNG px), label <= 8 words), ...])
LEXI_HIGHLIGHTS = [
    ("Clear definitions, every sense numbered",
     "Each entry gives plain definitions with every sense numbered straight through, each with an example.",
     [("lexiai-notebook", "LexiAI entry for bludgeon with three numbered senses: verb, noun and a finance verb sense, each with an example", (1500, 1338),
       (30, 446, 1440, 852), "Every sense numbered: i, ii, iii")]),
    ("Which sense, in this sentence",
     "Paste a sentence and LexiAI shows which sense the word has there, even a rare one, next to the usual meaning it isn't.",
     [("lexiai-context", "LexiAI Meaning in context for a podcast line about Nest: clip is highlighted and explained as a speed or rate, not the usual video excerpt or fastener", (1488, 1150),
       (786, 788, 608, 330), "In this sentence: a speed, not a video"),
      ("lexiai-context-saved", "The same card after saving: Saved to Notebook, clip, sense iii", (1488, 196),
       (198, 38, 1196, 140), "Saved as sense iii of clip")]),
    ("A notebook that grows into knowledge",
     "Saved words collect their senses, the sentences I found them in and real podcast clips, and sync to LexiSpeak and Writing Station, where I practice saying and writing them until they stick.",
     [("lexiai-kb", "LexiAI Notebook entry for clip: the podcast sentence saved under sense iii, a rate of speed, above the word's other numbered senses", (1500, 1040),
       (36, 340, 1428, 382), "The sentence I saved, filed under sense iii"),
      ("lexiai-podcasts", "LexiAI Podcasts tab with appall open: a Diary of a CEO line where the speaker says appalled, with a play button and the sentences around it", (1500, 790),
       (32, 376, 1384, 376), "A real podcast clip, filed under appall")]),
    ("Ask LexiAI about any word",
     "A chat in the corner of every screen answers quick questions, like how two close words differ.",
     [("lexiai-ask", "Ask Lexi chat panel: asked whether appall is stronger than shock, Lexi explains that appall adds moral judgment, with an example and a quick test", (832, 1356),
       (32, 266, 678, 924), "Lexi's answer: appall adds a moral judgment")]),
    ("A short review every day",
     "Due words come back on a spaced schedule, each answer sets the next date, and showing up daily keeps the streak going.",
     [("lexiai-review", "LexiAI Review card asking for the idiom go against the grain from its definition, with Forgot, Fuzzy, Got it and Easy buttons showing the next review date", (1248, 1062),
       (38, 882, 1172, 142), "Each answer sets the next review date")]),
]
LEXI_LIVE = "https://lexiai-seven.vercel.app/?demo=1"
LEXI_BUILT = "Built with React, TypeScript, Supabase, Claude and Gemini (audio) · Designed and built by me"
# Callout rules live here (not in style.css) so R16 only touches this page.
LEXI_CSS = f"""<style>
.lx-pic {{ position: relative; margin: 0 auto; overflow: hidden; }}
.lx-pic img {{ width: 100%; }}
.lx-ring {{ position: absolute; border: 2px solid {LEXI_ACCENT}; border-radius: 10px; box-shadow: 0 0 0 9999px rgba(20, 20, 18, .06); pointer-events: none; }}
.lx-dot {{ display: inline-flex; align-items: center; justify-content: center; width: 22px; height: 22px; border-radius: 50%; background: {LEXI_ACCENT}; color: #fff; font-size: 12px; font-weight: 650; line-height: 1; flex: none; }}
.lx-ring .lx-dot {{ position: absolute; left: -12px; top: -12px; box-shadow: 0 0 0 2px #fff; }}
.lx-note {{ display: flex; align-items: center; gap: 10px; margin: 12px auto 0; font-size: 14.5px; font-weight: 550; color: {LEXI_ACCENT}; }}
.lx-note + .lx-pic {{ margin-top: 20px; }}
@media (max-width: 600px) {{
  .lx-ring {{ border-radius: 6px; }}
  .lx-ring .lx-dot {{ width: 16px; height: 16px; font-size: 10px; left: -5px; top: -5px; }}
  .lx-note {{ font-size: 13.5px; }}
}}
</style>"""


# ---------------------------------------------------------------- LexiSpeak (revision 17: same layout and callouts as LexiAI)
# Crops come from a key-free copy of ~/lexispeak (commit 983f866) via _src/capture/r17/ and live in assets/lexispeak/.
# No practice history of mine was on this Mac, so the sessions shown were played for the capture (typed, real Claude replies
# and grading) on words from my real LexiAI notebook. See R17_REPORT.md.
SPEAK_SUMMARY = "A speaking studio that turns the words I'm learning into words I actually say."
SPEAK_HIGHLIGHTS = [
    ("Free Talk, with live fixes",
     "An open-ended chat with Alex. Any slip gets corrected right under the message, and the conversation keeps going.",
     [("lexispeak-free", "LexiSpeak Free Talk: a message about a Nest podcast with two corrections shown under it, and Alex's reply", (1472, 656),
       (288, 178, 1142, 236), "Each slip fixed live, under the message")]),
    ("Practice for real situations",
     "Four structured modes, each with its own partner: a casual chat with Alex, a job interview with Morgan, a business debate with Sam and a group discussion with Alex and Jordan.",
     [("lexispeak-modes", "LexiSpeak Structured practice: Casual Chat, Interview, Business Talk and Group Discussion cards, each with its partner", (1792, 1138),
       (22, 84, 1748, 1032), "Four modes, each with its own partner")]),
    ("Built on my LexiAI notebook",
     "Each session targets 4–6 words from my LexiAI notebook. Words I use well are marked Can Speak and synced back to LexiAI.",
     [("lexispeak-targets", "LexiSpeak Business Talk session header with six target words; the ones already used are ticked", (1472, 418),
       (30, 312, 1300, 76), "Six target words, picked from the notebook"),
      ("lexispeak-words", "LexiSpeak Target Words: table stakes, commoditize, erode, stretched thin, flesh out and mull over, each marked Can Speak, synced to LexiAI", (1472, 902),
       (52, 118, 1368, 112), "Used well, so marked Can Speak in LexiAI")]),
    ("A coaching report, line by line",
     "After the session, everything said comes back in three colors: red for what to fix, amber for what a native speaker would say, green for target words used well.",
     # R20: this crop is the demo's sample Interview (~/lexispeak-demo, branch report-green, /?demo=1) via _src/capture/r20/
     [("lexispeak-said", "LexiSpeak Everything You Said: a legend of Error, Correct but more natural, and Target word used well, over four interview answers with phrases marked red, amber and green, such as stretched thin and gauge in green", (1472, 878),
       (375, 431, 217, 58), "Target words used well turn green")]),
    ("Say it like a native, then keep it",
     "The report rewrites stiff phrases the way a native speaker would put them. I can hear each one and save it to my Phrase Notebook.",
     [("lexispeak-native", "LexiSpeak Say It Like a Native: two phrases with their native versions, each with Hear it and Saved buttons", (1472, 778),
       (748, 640, 354, 78), "Hear the native version, then save it"),
      ("lexispeak-phrases", "LexiSpeak Phrase Notebook with saved native phrasings, such as zero in on", (1568, 956),
       (40, 526, 1488, 422), "Saved phrases to reread before the next session")]),
]
SPEAK_BUILT = "Built with React, TypeScript, Supabase (shared with LexiAI), Claude and Gemini (audio) · Designed and built by me"


# ---------------------------------------------------------------- Writing Station (revision 18: same layout and callouts as LexiAI)
# Crops come from a copy of ~/Desktop/Claude-cowork/writing-station (no .env, no auth.json) holding only the approved
# "Update of Lexi AI" entry and its existing review, via _src/capture/r18/ (page clock set to Aug 11 2026, the evening
# it was written). New Claude output for this page: the native rewrite (Compare) and one Editor answer. See R18_REPORT.md.
WS_SUMMARY = "A quiet writing desk with a native-speaker editor for my daily English."
WS_HIGHLIGHTS = [
    ("A calm desk for writing",
     "A sheet of paper on linen, one entry a day, with every entry kept in the journal sidebar and a streak at the bottom.",
     [("writing-station-desk", "The Writing Desk: journal sidebar with the entry Update of Lexi AI, scored 62, next to the open entry on a paper sheet; a 1-day streak at the bottom", (2560, 1600),
       (20, 690, 494, 224), "Each entry kept in the journal, scored")]),
    ("Reviewed like a native editor",
     "Claude reads the finished entry sentence by sentence and colors every note: red for an error, with why; amber for what a native would say; green for a notebook word used well; violet where a saved word fits.",
     [("writing-station-annotated", "Annotated review of Update of Lexi AI: phrases underlined red, amber, green and violet, under a legend of expression, small slip, more natural, notebook and opportunity", (1784, 726),
       (920, 48, 824, 60), "One color for each kind of note"),
      ("writing-station-note", "Note for break down them: try break them down, with the rule that a pronoun object goes between the verb and particle", (780, 786),
       (20, 446, 742, 168), "Each error comes with its rule")]),
    ("Corrected, then rewritten like a native",
     "Corrected fixes only the real mistakes and keeps my wording. Compare puts a native rewrite next to my original, written after the review so it never contradicts it.",
     [("writing-station-compare", "Compare view: the original entry beside the native editor's version, which uses the review's fixes such as break them down and right at your fingertips", (1776, 1052),
       (892, 28, 848, 988), "The rewrite keeps the review's own fixes")]),
    ("Ask the editor",
     "The Editor panel is a chat with the editor who wrote the review: I can ask why something was marked, push back, or ask for other ways to say it.",
     [("writing-station-editor", "Editor chat: asked why keep debriefing the words was marked, the editor explains what debrief means and offers three other ways to say it", (780, 1596),
       (46, 1120, 602, 472), "Three other ways to say it")]),
    ("Uses my LexiAI words",
     'Reviews read my <a href="lexiai.html">LexiAI</a> notebook. A saved word used well counts toward Can Write, and a saved word that would fit gets suggested, the way <a href="lexispeak.html">LexiSpeak</a> does for speaking.',
     [("writing-station-usedwell", "Notebook words you used well, each counting toward Can Write mastery: feature", (1776, 266),
       (40, 40, 1696, 186), "Used well, so it counts toward Can Write"),
      ("writing-station-opportunity", "Violet note: instead of when you need to look up the expressions, try keeping every expression right at your fingertips, a phrase from the notebook", (780, 1070),
       (24, 698, 734, 196), "A saved word that fits right here")]),
]
WS_BUILT = "Built with Node, vanilla JavaScript and Claude (Opus for reviews and the Editor, Haiku for lookups) · Designed and built by me"


# ---------------------------------------------------------------- podcast-dig (revision 25: same layout and callouts as LexiAI)
# Crops are cut from the existing podcast-dig shots (assets/screens/builder-toolkit-*.png, Obsidian, Oct 2026) and LexiAI's
# Podcasts crop by _src/capture/r25/crops.py; they live in assets/podcast-dig/. No new captures.
PD_SUMMARY = "Exact quotes from long podcasts, searchable in my Obsidian vault."
PD_HIGHLIGHTS = [
    ("Pull an episode",
     "/podcast-dig with a company name finds its founder and investor interviews, ranks them, and files each episode in my vault with a full, timestamped transcript.",
     [("pd-library", "podcast-dig Library in Obsidian: starred episodes grouped by company, such as Granola with Chris Pedregal on AI & I, each tagged Transcript", (650, 1300),
       (16, 296, 622, 276), "Filed by company: Granola")]),
    ("The transcript follows playback",
     "Press play and the reader scrolls with the speaker, so the line being said is always on screen.",
     [("pd-follow", "podcast-dig reader: Ben Thompson's paragraph at 27:43 highlighted as it plays, above a player bar with Follow turned on", (1240, 1184),
       (604, 1066, 190, 70), "Follow keeps the playing line in view")]),
    ("Keep a line, with its timestamp",
     "Highlight a line and it goes to My takeaways with its timestamp, the speaker's exact words and my own note.",
     [("pd-takeaway", "My takeaways card: timestamp 03:40, my note, and the exact quote about US dependence on China", (892, 460),
       (34, 80, 846, 374), "The exact words, kept at 03:40")]),
    ("Notes in plain Markdown",
     "Kept lines land in an ordinary Obsidian note: timestamp, exact quote, my note and a link back to the episode.",
     [("pd-notes", "Obsidian note titled 20VC The $100 Billion AI Assistant Race, Town: timestamped quotes from JD Grèze, each with a short note and a link to the episode", (1570, 880),
       (16, 226, 1544, 280), "Timestamp, quote, my note, source link")]),
    ("One cache shared with LexiAI",
     'podcast-dig checks corpus.db, the local Whisper cache it shares with <a href="lexiai.html">LexiAI</a>, before transcribing, so each episode is transcribed once on my Mac. LexiAI\'s podcast clips come from the same cache.',
     [("pd-lexiai", "LexiAI Heard in podcasts for appall: a Diary of a CEO line at 25:35 with the word highlighted and a play button", (1500, 790),
       (32, 376, 1384, 376), "Same cache, as a word clip in LexiAI")]),
]
PD_CODA = 'It also supplies the raw material for <a href="startup-research.html">Startup Research</a>: founder interviews, quoted exactly.'
# page-only CSS: the closing line, and on phones labels under the narrow crops (library, takeaway) may use the full frame width
PD_CSS = """
<style>.lx-coda { margin: 56px 0 0; font-size: 16px; color: var(--ink-soft); max-width: none; }
@media (max-width: 600px) { .lx-note { width: auto !important; justify-content: center; } }</style>"""
PD_BUILT = "Built with Python, local Whisper, RSS and Obsidian, as a Claude Code skill · Designed and built by me"
P["podcast-dig"] = dict(name="podcast-dig", what=PD_SUMMARY)
# Old URLs that now point somewhere else: old slug -> new slug (a meta-refresh stub is written for each).
REDIRECTS = {"builder-toolkit": "podcast-dig"}


# ---- Revision 64: a guided demo near the end of the LexiAI, LexiSpeak and Writing Station pages (assets/demo.js).
# It replays the page's own real crops in order: a soft cursor glides to the button (or passage) in each one, "presses" it,
# and holds ~2s. It starts when 40% of it is in view, pauses off screen, and any click on it hands control to the visitor.
# (step label, caption, crop key, PNG size, target box in PNG px, press?, optional text typed into a composer first, its button)
DEMOS = {
    "lexiai": [
        # R65: the demo opens on a plain word lookup (crops from the local demo app, ~/lexiai-demo), then moves to sentences
        ("Look up a word", "Type a word and LexiAI writes its entry: the word, how it's said, and a Listen button.",
         "lexiai-lookup", (1840, 1020), (170, 560, 820, 300), False, "bludgeon", "Look up"),
        ("Read every sense", "Every sense is numbered straight through, each with synonyms, examples and common collocations.",
         "lexiai-senses", (1680, 1368), (70, 720, 1500, 165), False),  # R66: Chinese gloss lines cut out (was 1680x1480)
        ("Save the word", "One tap puts the word in my Notebook, where reviews and practice pick it up.",
         "lexiai-lookup-saved", (1840, 1020), (1356, 746, 294, 92), True),
        ("Paste a sentence", "Paste the whole line. LexiAI spots the likely unfamiliar word.",
         "lexiai-ctx:clip", (0, 0), (0, 0, 0, 0), False,
         "There are three, four new products coming out at a pretty rapid clip here from Nest.", "Check"),
        ("Tap another", "Not the word you meant? Tap another.",
         "lexiai-ctx:pretty", (0, 0), (0, 0, 0, 0), True),
        ("Save it", "One tap saves the word with its sentence, filed as sense iii of clip.",
         "lexiai-context-saved", (1488, 196), (1024, 64, 344, 88), True),
        ("Hear it in podcasts", "Saved words collect real podcast lines, timestamped. With sound on, this one plays: \u201cI was appalled by my fasting blood glucose\u2026\u201d",
         "lexiai-podcasts", (1500, 790), (48, 390, 96, 96), True),
        ("Review", "A short daily review. Each answer sets the next date: Got it brings this idiom back in 28 days.",
         "lexiai-review", (1248, 1062), (632, 894, 276, 120), True),
    ],
    "writing-station": [
        ("Write, then review", "One entry a day on a sheet of paper. When it's done, I ask for a review.",
         "writing-station-desk", (2560, 1600), (2205, 1434, 311, 82), True),
        ("Read the notes", "Every note has a color: red for an error, amber for more natural, green and violet for notebook words.",
         "writing-station-annotated", (1784, 726), (1116, 292, 282, 52), True),
        ("Get the rule", "Each error comes with its rule: a pronoun object goes between the verb and the particle.",
         "writing-station-note", (780, 786), (20, 446, 742, 168), False),
        ("Open Compare", "Compare puts a native rewrite next to my original.",
         "writing-station-annotated", (1784, 726), (548, 52, 164, 52), True),
        ("Read the rewrite", "The rewrite keeps the review's own fixes, such as break them down.",
         "writing-station-compare", (1776, 1052), (908, 82, 816, 918), False),
        ("Ask the editor", "I can ask why something was marked. The editor explains and offers other ways to say it.",
         "writing-station-editor", (780, 1596), (40, 366, 618, 1200), False,
         'Why was "keep debriefing the words" marked?', "Ask"),
    ],
}
# R64: a short real clip under a crop (key -> file in assets/<slug>/, caption). LexiAI cuts its clips from real episodes;
# this one is the appall line on the Podcasts crop, re-cut at 96 kbps from ~/lexiai/podcast/data/audio/235.opus (see R64_REPORT.md).
AUDIO = {"lexiai-podcasts": ("podcast-clip.mp3", "Listen: the 25-second clip behind this card, from The Diary of a CEO (25:28–25:53).")}
# R65: sound in the guided demo, per crop key: (file in assets/<slug>/, where it comes from). The demo starts muted;
# "Sound on" (or Play / Replay) turns it on and the step holds until its clip ends. Nothing loads until sound is on.
# podcast-demo.mp3 is the appall sentence alone: 235.opus 1535.85s -> 1541.60s (25:35.9-25:41.6), see R65_REPORT.md.
# LexiSpeak has no entry here: since R66 it shows a screen recording instead (DEMO_VIDEO), picture only since R67.
DEMO_AUDIO = {"lexiai": {"lexiai-podcasts": "podcast-demo.mp3"}}


# R66: LexiSpeak's "See it run" is a real screen recording of its demo app instead of the step demo: ~/lexispeak-demo
# (?demo=1), Free Talk with Alex played with voices on, then the coaching report and one Hear it. Made by
# _src/capture/r66/ (record.mjs -> say.py -> assemble.py). The picture is the app running in headless Chrome.
# R67: picture only. The synthesized Samantha voice sounded choppy, so the audio track was dropped (ffmpeg -an, video stream
# copied as is; the R66 file with sound is in _src/r67-snapshot/). See R67_REPORT.md.
# (file stem in assets/<slug>/, width, height, length, one line under it)
# R70: LexiSpeak's silent screen recording is replaced by a narrated walkthrough like LexiAI's (HyperFrames,
# ~/HyperFrames Video/videos/speaking-studio-demo; voice ElevenLabs Robert, captions burned in). see-it-run.mp4 kept on disk.
DEMO_VIDEO = {"lexispeak": ("narrated", 1600, 900, "1:46",
                            "From words I know to words I say: a narrated walkthrough of the real screens.", True),
              # R69: LexiAI gets a narrated walkthrough (HyperFrames, ~/HyperFrames Video/videos/lexiai-demo; voice ElevenLabs
              # Robert, captions burned in). It sits right under the title. R69b: Janet dropped the guided step demo from the page (DEMOS["lexiai"] kept for reference).
              "lexiai": ("narrated", 1600, 900, "1:50",
                         "What a word means in the sentence you read: a narrated walkthrough of the real screens.", True),
              # R71: Writing Station narrated walkthrough (HyperFrames, ~/HyperFrames Video/videos/writing-station-demo;
              # voice ElevenLabs Robert, captions burned in). Replaces the step demo (DEMOS["writing-station"] kept for reference).
              "writing-station": ("narrated", 1600, 900, "1:12",
                                  "Write every day, and make my words stick: a narrated walkthrough of the real screens.", True)}


def video_demo_html(slug, name, root):
    """R66: a recorded run. Muted autoplay at 40% in view (demo.js), Pause / Replay; reduced motion waits for Play.
    R67: the file has no sound, so there is no Sound on button."""
    stem, w, h, length, line, *snd = DEMO_VIDEO[slug]
    src = f"{root}assets/{slug}/{stem}"
    if snd:  # R69: narrated video with sound: muted autoplay, Sound on unmutes
        return f"""
  <section class="dm dm-rec dm-narr" data-demo-video aria-label="Narrated walkthrough of {name}">
    <h2>Watch it in 2 minutes</h2><p>A narrated walkthrough of the real screens, with captions. It starts muted; tap Sound on to hear it.</p>
    <div class="dm-stage dm-vstage"><video src="{src}.mp4" poster="{src}.jpg" width="{w}" height="{h}" muted playsinline controls preload="metadata" aria-label="{name}: {line}"></video><button class="dm-big" type="button" data-act="play" aria-label="Play the video" hidden>▶ Play</button></div>
    <div class="dm-bar"><p class="dm-vcap">{line} <span>{length}</span></p><div class="dm-ctrl" hidden><button class="dm-sound" type="button" data-act="sound" aria-pressed="false">🔊 Sound on</button><button type="button" data-act="play">Play</button><button type="button" data-act="replay">Replay</button></div></div>
  </section>"""
    return f"""
  <section class="dm dm-rec" data-demo-video aria-label="Screen recording of the {name} demo">
    <h2>See it run</h2><p>A screen recording of the demo app, picture only. Pause or replay it anytime.</p>
    <div class="dm-stage dm-vstage"><video src="{src}.mp4" poster="{src}.jpg" width="{w}" height="{h}" muted playsinline controls preload="metadata" aria-label="{name} demo: {line}"></video><button class="dm-big" type="button" data-act="play" aria-label="Play the recording" hidden>▶ Play</button></div>
    <div class="dm-bar"><p class="dm-vcap">{line} <span>{length}</span></p><div class="dm-ctrl" hidden><button type="button" data-act="play">Play</button><button type="button" data-act="replay">Replay</button></div></div>
  </section>"""


# LexiAI "See it run": after the sentence is pasted, an in-demo card shows the real product behaviour.
# LexiAI first picks a likely-unfamiliar word (clip — meaning already shown on this page from the product card).
# The visitor can then tap another supported word. pretty uses the official LexiAI demo sample for “pretty”
# in “pretty rapid” (fixture.ts); it is not a recorded tap on this podcast sentence. Only those two words
# have meanings here; other words are not tappable. English only; no accuracy claims.
LEXI_CTX_SENTENCE = "There are three, four new products coming out at a pretty rapid clip here from Nest."
LEXI_CTX_AUTO = "clip"
LEXI_CTX_WORDS = {
    "clip": {
        "meaning": 'A speed or rate of movement or progress, usually used in phrases like "at a rapid clip" or "at a good clip."',
        "usual": "a short video excerpt, or a small fastener",
    },
    "pretty": {
        "meaning": "Fairly; to quite a high degree (informal adverb before an adjective).",
        "usual": "attractive, nice to look at",
    },
}


def lexiai_ctx_markup():
    """One sentence card shared by the two context steps. Meanings are filled in by demo.js."""
    import html as _html
    bits = []
    for tok in re.findall(r"\w+|[^\w\s]+|\s+", LEXI_CTX_SENTENCE):
        low = tok.lower()
        if low in LEXI_CTX_WORDS:
            bits.append(f'<button type="button" class="dm-ctx-w" data-word="{_html.escape(low)}">{_html.escape(tok)}</button>')
        else:
            bits.append(_html.escape(tok))
    data = _html.escape(json.dumps({"auto": LEXI_CTX_AUTO, "words": LEXI_CTX_WORDS}, ensure_ascii=False), quote=False)
    return (
        f'<div class="dm-ctx" hidden>'
        f'<script type="application/json" data-ctx-data>{data}</script>'
        f'<div class="dm-ctx-card">'
        f'<p class="dm-ctx-label" data-ctx-label></p>'
        f'<p class="dm-ctx-s">{"".join(bits)}</p>'
        f'<p class="dm-ctx-note">In this demo, only <i>clip</i> and <i>pretty</i> can be opened. '
        f'<i>clip</i> uses the meaning already shown on this page; <i>pretty</i> uses the LexiAI demo sample for “pretty rapid,” not a recorded tap on this sentence.</p>'
        f'<p class="dm-ctx-k">Here, <i data-ctx-word></i> means</p>'
        f'<p class="dm-ctx-def" data-ctx-meaning></p>'
        f'<div class="dm-ctx-pair"><div><p class="dm-ctx-h">Not the usual meaning</p><p data-ctx-usual></p></div>'
        f'<div><p class="dm-ctx-h">But in this sentence</p><p data-ctx-here></p></div></div>'
        f'</div></div>'
    )


def demo_html(slug, name, steps, alts, root):
    """The guided demo (R64). Frame 0 shows without JS; demo.js fits the frames, moves the cursor and runs the steps."""
    frames, chips, caps, sounds = "", "", "", DEMO_AUDIO.get(slug, {})
    has_ctx = False
    for i, (label, cap, key, (w, h), (x, y, bw, bh), press, *typing) in enumerate(steps):
        ctx_word = key.split(":", 1)[1] if key.startswith("lexiai-ctx:") else ""
        if ctx_word:
            has_ctx = True
            data = f' data-ctx="{ctx_word}"'
            if typing:
                data += f' data-type="{typing[0].replace(chr(34), "&quot;")}" data-btn="{typing[1]}"'
            frames += f'<div class="dm-frame{" on" if i == 0 else ""}"{" data-press" if press else ""}{data}></div>'
        else:
            src = f"{root}assets/{slug}/{key}"
            data = f' data-type="{typing[0].replace(chr(34), "&quot;")}" data-btn="{typing[1]}"' if typing else ""
            data += f' data-audio="{key}"' if key in sounds else ""
            frames += (f'<div class="dm-frame{" on" if i == 0 else ""}"{" data-press" if press else ""}{data}>'
                       f'<div class="dm-pic" data-w="{w}" data-h="{h}"><picture><source srcset="{src}.webp" type="image/webp">'
                       f'<img src="{src}.png" alt="{alts.get(key, label)}" width="{w}" height="{h}" loading="lazy" decoding="async"></picture>'
                       f'<button class="dm-hit" type="button" tabindex="-1" aria-label="Next step" style="left:{x / w * 100:.2f}%;top:{y / h * 100:.2f}%;'
                       f'width:{bw / w * 100:.2f}%;height:{bh / h * 100:.2f}%"></button></div></div>')
        chips += f'<li><button class="dm-step" type="button"{" aria-current=step" if i == 0 else ""}>{i + 1} · {label}</button></li>'
        caps += f'<p aria-hidden="true">{cap}</p>'
    # R65: one <audio> per clip, preload=none until the visitor turns sound on; the hint sits on the stage, so nothing moves
    audio = "".join(f'<audio data-clip="{k}" preload="none" src="{root}assets/{slug}/{f}"></audio>' for k, f in sounds.items())
    hint = '<button class="dm-hint" type="button" hidden>🔊 Tap for sound</button>' if sounds else ""
    sound = '<button class="dm-sound" type="button" data-act="sound" aria-pressed="false">🔊 Sound on</button>' if sounds else ""
    return f"""
  <section class="dm" data-demo aria-label="Guided demo of {name}">
    <h2>See it run</h2><p>A guided run through the real screens. Pause it, replay it, or tap any step to look around.{" It starts muted; tap Sound on to hear the clips." if sounds else ""}</p>
    <div class="dm-stage">{frames}{lexiai_ctx_markup() if has_ctx else ""}<div class="dm-type" aria-hidden="true"><span class="dm-typed"></span><span class="dm-send"></span></div><span class="dm-cursor" aria-hidden="true"></span>{hint}</div>{audio}
    <div class="dm-caps">{caps}<p class="dm-cap" aria-live="polite">{steps[0][1]}</p></div>
    <div class="dm-bar"><ol class="dm-steps">{chips}</ol><div class="dm-ctrl" hidden>{sound}<button type="button" data-act="play">Play demo</button><button type="button" data-act="replay">Replay</button></div></div>
  </section>"""


def lexiai_page():
    return callout_page("lexiai", "LexiAI", LEXI_SUMMARY, LEXI_HIGHLIGHTS, LEXI_BUILT, base=1500, url=LEXI_LIVE)


def lexispeak_page():
    return callout_page("lexispeak", "LexiSpeak", SPEAK_SUMMARY, SPEAK_HIGHLIGHTS, SPEAK_BUILT, base=1472, url="https://lexispeak-seven.vercel.app/?demo=1")  # 736 CSS px, the app's report column; the wider home and Phrase Notebook crops fill the frame


def writing_station_page():
    # base = the 892 CSS px review column; the wider desk shot fills the frame, the side panels are drawn at the same scale
    return callout_page("writing-station", "Writing Station", WS_SUMMARY, WS_HIGHLIGHTS, WS_BUILT, base=1784, url=None)


def podcast_dig_page():
    # base = the Markdown note crop; the reader and library crops are drawn at the same scale (all are 2x Obsidian shots)
    return callout_page("podcast-dig", "podcast-dig", PD_SUMMARY, PD_HIGHLIGHTS, PD_BUILT, base=1570, url=None, coda=PD_CODA, css=PD_CSS)


def redirect_page(new):
    return f"""<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Moved — Janet Mao</title><link rel="icon" href="../assets/favicon.svg" type="image/svg+xml">
<meta http-equiv="refresh" content="0; url={new}.html"><link rel="canonical" href="{new}.html"><meta name="robots" content="noindex">
</head><body><p>This page moved to <a href="{new}.html">{new}.html</a>.</p></body></html>
"""


def callout_page(slug, name, summary, highlights, built, base, url="", coda="", css="", lead="", js=False, doc_title=None):
    """One plate: title + summary, highlights (heading, sentence, crops with one numbered callout each), built-with line.
    base = the widest crop in PNG px; narrower crops are drawn at the same scale so text sizes match down the page.
    url = the live app for "Try it live"; empty keeps the placeholder link, None leaves the button out.
    coda = an optional closing line after the highlights; css = extra <style> for this page only.
    R29: lead = a block right after the summary; js = load motion.js. A shot may also be ("card", html, label), an HTML card
    that carries its own .lx-ring (the dot number is filled in here), or a crop with a 6th item, its width in % of the frame."""
    root = "../"
    items, n, alts = "", 0, {}
    for i, (h, line, shots) in enumerate(highlights):
        pics = ""
        for shot in shots:
            n += 1
            if shot[0] == "card":
                _, html, label = shot
                pics += (f'<div class="lx-pic lx-card">{html.replace("{n}", str(n))}</div>'
                         f'<div class="lx-note"><span class="lx-dot" aria-hidden="true">{n}</span>{label}</div>')
                continue
            key, alt, (w, hgt), (cx, cy, cw, ch), label, *pct = shot
            src = f"{root}assets/{slug}/{key}"
            lazy = ' loading="lazy"' if i else ""
            width = f"width:{pct[0]}%" if pct else f"width:{w / base * 100:.1f}%" if w < base else ""
            ring = (f'<span class="lx-ring" aria-hidden="true" style="left:{cx / w * 100:.2f}%;top:{cy / hgt * 100:.2f}%;'
                    f'width:{cw / w * 100:.2f}%;height:{ch / hgt * 100:.2f}%"><span class="lx-dot">{n}</span></span>')
            pics += (f'<div class="lx-pic" style="{width}"><picture><source srcset="{src}.webp" type="image/webp">'
                     f'<img src="{src}.png" alt="{alt}" width="{w}" height="{hgt}"{lazy} decoding="async"></picture>{ring}</div>'
                     f'<div class="lx-note" style="{width}"><span class="lx-dot" aria-hidden="true">{n}</span>{label}</div>')
            if key in AUDIO:  # R64: a real clip under its crop; never autoplays, nothing loads until play
                clip, cap = AUDIO[key]
                pics += (f'<div class="lx-audio" style="{width}"><audio controls preload="none" src="{root}assets/{slug}/{clip}"></audio>'
                         f'<p>{cap}</p></div>')
            alts[key] = alt
        items += f'\n  <section class="lx-h"><h2>{h}</h2><p>{line}</p><figure class="lx-shot">{pics}</figure></section>'
    live = f'<a class="try-live" href="{url}" target="_blank" rel="noopener">Try it live →</a>' if url else '' if url is None else '<a class="try-live" href="#">Try it live →</a>'
    doc = doc_title or f"{name} — Janet Mao"
    return f"""{head(doc, summary, root).replace("</head>", LEXI_CSS + css + "\n</head>")}
<body class="v5 project" data-root="{root}">
<div class="page narrow">
{nav(root, 'work')}
<main>
<article class="plate lx">
  <header class="lx-top"><h1>{name}</h1><p>{summary}</p></header>{video_demo_html(slug, name, root) if slug in DEMO_VIDEO and len(DEMO_VIDEO[slug]) > 5 else ""}{f'{chr(10)}  {lead}' if lead else ""}{items}{f'{chr(10)}  {coda}' if coda.startswith("<") else f'{chr(10)}  <p class="lx-coda">{coda}</p>' if coda else ""}{("" if slug in DEMO_VIDEO else demo_html(slug, name, DEMOS[slug], alts, root)) if slug in DEMOS else video_demo_html(slug, name, root) if slug in DEMO_VIDEO and len(DEMO_VIDEO[slug]) <= 5 else ""}  
  <footer class="lx-foot"><p>{built}</p>{live}</footer>
</article>
{next_card(slug, root)}
</main>
{foot(root, js, f'{chr(10)}<script src="{root}assets/demo.js"></script>' if slug in DEMOS or slug in DEMO_VIDEO else "")}"""


# ---------------------------------------------------------------- AI Terms (revision 29: the production loop)
# Same callout page as LexiAI. Facts come from ~/.claude/skills/ai-term-explainer (SKILL.md, references/review.md,
# production.md, shotlist.md) and the real artifacts in ~/AI-Terms. Crops: _src/capture/r29/crops.py -> assets/ai-terms/.
# The two cards are faithful English translations of Chinese files, labeled as translated:
#   ai-long-context-ep4/审片/机检.md (machine check of the final cut, v7) and 审片/审片-2026-10-31.md (review of v5).
AT_SUMMARY = "Short films that explain one AI word in plain language, made by a loop of agents that check each other."
P["ai-terms"] = dict(name="AI Term Explainer", what=AT_SUMMARY)
# View of the canonical AITERM_FILMS list, for the method-page episode coda.
# Add new public episodes only to AITERM_FILMS + AITERM_YT + AITERM_DATE, and only once a YouTube URL is verified and approved.
EPISODES = [(f"Ep {n}", term, line, length, s) for s, n, term, line, _what, length in AITERM_FILMS]

# ---- Revision 34: the 10-step explainer framework, before the loop (what each film says, then how it's made).
# Translated from ~/.claude/skills/ai-term-explainer/SKILL.md ("10 步框架") and references/framework.md.
# Drawn with the Startup Research tree's classes (spine, phase pills, alternating nodes). The grey notes are
# Ep 3's answers, taken from ~/AI-Terms/ai-rag-ep3-en/SCRIPT.md (scenes: scene, what, steps/buy, biz, model, hard, lanes, harvey, risk, recap).
FW_GROUPS = [
    ("Tech: what it is", [
        ("1", "What problem it solves", "A real scene: where does the old way get stuck?", "A member returns a chair, day 10",
         f'<path d="M4 20h17" fill="none"/><path d="M17 15l5 5-5 5" fill="none"/><rect x="25" y="6" width="9" height="28" rx="1" fill="#fff"/>'
         f'<path d="M27.5 16.5l4 4M31.5 16.5l-4 4" fill="none" stroke="{_G}" stroke-width="2"/>'),
        ("2", "What it is", "One analogy, and where does the name come from?", "An open-book exam",
         f'<path d="M20 5a10 10 0 0 0-6 18v4h12v-4a10 10 0 0 0-6-18z" fill="#fff"/><path d="M15 31h10M17 35h6" fill="none"/>'
         f'<path d="M17 21l3-6 3 6" fill="none" stroke="{_G}" stroke-width="2"/>'),
        ("3", "How to use it", "Three steps or fewer. Then: build it, or buy it?", "Four steps, or OpenAI file search",
         f'<path d="M5 33h30V9h-8v8h-8v8h-8v8" fill="#fff"/><path d="M27 9h8v8" fill="none" stroke="{_G}" stroke-width="2.2"/>'),
    ]),
    ("Business: who makes money", [
        ("4", "The chain", "Who sells it, who stores it, who buys it?", "Voyage → vector DB → LangChain → Glean",
         f'<circle cx="8" cy="20" r="4.5" fill="#fff"/><circle cx="20" cy="20" r="4.5" fill="#fff"/><path d="M12.5 20h3M24.5 20h3" fill="none"/>'
         f'<circle cx="32" cy="20" r="4.5" fill="{_G}" stroke="{_G}"/>'),
        ("5", "Business model", "How does each layer charge, and is the margin thick?", "Per use, open source, per seat",
         f'<path d="M5 8h14l16 16-11 11L8 19z" fill="#fff"/><circle cx="12.5" cy="14.5" r="2.6" fill="{_G}" stroke="{_G}"/>'
         f'<path d="M17 24l7 7" fill="none"/>'),
        ("6", "Players", "Which big tech companies, and which startups?", "OpenAI, Cohere, LangChain, Glean, Harvey", NODE_ICON["10"]),
        ("7", "Barriers", "Easy to grasp. What makes it hard to do well?", "Finding the right chunk", NODE_ICON["40"]),
        ("8", "Horizontal or vertical", "Sold to every industry, or built deep for one?", "Glean for all; Harvey for law",
         f'<rect x="5" y="5" width="30" height="30" rx="2" fill="#fff"/><path d="M5 20h30" fill="none"/>'
         f'<path d="M20 5v30" fill="none" stroke="{_G}" stroke-width="2.2"/>'),
        ("9", "Take one company apart", "How does one startup actually do it, in public sources?", "Harvey, the AI for lawyers", SOURCES[1][1]),
    ]),
    ("Risk: will it last", [
        ("10", "Risks and trends", "Eaten by models, commoditized, bundled by platforms, replaced, or hit by compliance?",
         "Long context, agent search, platforms", NODE_ICON["80"]),
    ]),
]
FW_CLOSE = ("One line to remember", "What it is, not what it does.", "Retrieve first, then generate")


def framework_tree(uid="fw"):
    """The 10 steps on one spine: three group pills, nodes alternating left/right, the closing line at the foot."""
    items, k = [], 0
    for g, (group, steps) in enumerate(FW_GROUPS, 1):
        items.append(f'<li class="tr-ph"><span><b>{g}</b>{group}</span></li>')
        for j, (n, name, q, ex, ic) in enumerate(steps):
            svg = f'<svg class="tr-ic" viewBox="0 0 40 40" aria-hidden="true"><g filter="url(#{uid}-rf)" {_KT}>{ic}</g></svg>'
            cls = f'tr-n tr-{"l" if k % 2 == 0 else "r"}{" tr-follow" if j else ""}'
            items.append(f'<li class="{cls}" style="--k:{k}"><span class="tr-dot" aria-hidden="true"></span><span class="tr-arm" aria-hidden="true"></span>'
                         f'<div class="tr-c">{svg}<div class="tr-t"><h3 class="tr-h"><span class="tr-num">{n}</span>{name}</h3>'
                         f'<p class="tr-q">{q}</p></div></div></li>')
            k += 1
    head_, line, ex = FW_CLOSE
    items.append(f'<li class="tr-end fw-end"><p><b>{head_}</b><span>{line}</span></p></li>')
    return (f'<div class="tr fw" data-tree><svg width="0" height="0" aria-hidden="true" style="position:absolute"><filter id="{uid}-rf" x="-5%" y="-5%" width="110%" height="110%">'
            f'<feTurbulence type="fractalNoise" baseFrequency=".09" numOctaves="2" seed="7"/><feDisplacementMap in="SourceGraphic" scale="1"/></filter></svg>'
            f'<ol class="tr-list">{"".join(items)}</ol></div>')


def framework_section():
    return ('<section class="lx-h" id="framework"><h2>What each film says</h2>'
            '<p>Every episode answers the same 10 questions in the same order: where it’s used before what it is, the tech before the money, '
            'and the risks last.</p>'
            f'{framework_tree()}</section>')


# ---- the loop diagram: five "make" stages flow into the check loop, Janet, and back into the skill.
# Drawn twice from the same data: a wide layout (desktop) and a tall one (phones); CSS shows one.
LP_MAKE = [  # (name, icon, three short lines for the wide card; the tall card joins them into two)
    ("Script", f'<path d="M10 5h14l6 6v24H10z" fill="#fff"/><path d="M24 5v6h6M15 16h10M15 21h10M15 26h6" fill="none"/>'
               f'<path d="M15 31h10" fill="none" stroke="{_G}" stroke-width="2.2"/>',
     # Skill 2026-11-11: after writing/revising SCRIPT.md, a non-writing agent plays a
     # non-technical reader, then the script goes to Janet. Fourth line so the wording
     # fits; all five Make cards share the same taller height.
     ["10-step framework,", "every number sourced.", "A non-tech agent", "checks it."]),
    ("Board", f'<rect x="5" y="6" width="30" height="20" rx="2" fill="#fff"/><path d="M12 26l-4 9M28 26l4 9" fill="none"/>'
              f'<path d="M10 19c3-5 6 3 9-2s6 2 10-4" fill="none" stroke="{_G}" stroke-width="2"/>',
     ["5 hand-drawn boards;", "never the same one", "twice in a row."]),
    ("Real data", f'<rect x="4" y="7" width="32" height="25" rx="2" fill="#fff"/><path d="M4 13h32M18 26h8" fill="none"/>'
                  f'<path d="M10 18l4 4-4 4" fill="none" stroke="{_G}" stroke-width="2"/>',
     ["The example really runs", "through the API; real", "screens go on paper."]),
    ("Shot list", f'<rect x="8" y="4" width="24" height="32" rx="2" fill="#fff"/><path d="M19 12h8M19 20h8M19 28h8" fill="none"/>'
                  f'<path d="M12 12l2 2 3-4M12 20l2 2 3-4M12 28l2 2 3-4" fill="none" stroke="{_G}" stroke-width="1.8"/>',
     ["Every shot planned", "first; the lint must", "show no red."]),
    ("Voice", f'<path d="M5 20h2M10 15v10M15 10v20M25 12v16M30 16v8M35 20h0" fill="none"/>'
                      f'<path d="M20 6v28" fill="none" stroke="{_G}" stroke-width="2.4"/>',
     ["Voiceover checked by", "speech recognition,", "then a frame per scene."]),
]
LP_LOOP = [  # (name, one line) clockwise from the top; the reviewer is index 1
    ("Machine check", "stills · blanks · blue · camera"),
    ("Independent reviewer", "7 checks · score 1–10 · top 3"),
    ("Fix + re-render", "every issue fixed or explained"),
    ("Re-check", "check again, a frame per fix"),
]
LP_NOTE = ["Never saw the making.", "Sees only what", "a viewer sees."]
LP_LEARN = ["What worked goes", "back into the skill"]


def _lp_icon(x, y, ic, k):
    return (f'<g class="lp-o" style="--k:{k}" transform="translate({x} {y}) scale(.6)"><g filter="url(#ID-rf)" {_KT}>{ic}</g></g>')


def _lp_text(x, y, lines, cls, anchor="start", dy=14):
    a = f' text-anchor="{anchor}"' if anchor != "start" else ""
    return "".join(f'<text class="{cls}" x="{x}" y="{y + j * dy}"{a}>{t}</text>' for j, t in enumerate(lines))


def _lp_pill(cx, cy, w, h, name, sub, k, key=False, note=None):
    out = (f'<g class="lp-o{" lp-key" if key else ""}" style="--k:{k}"><rect class="lp-pill" x="{cx - w / 2}" y="{cy - h / 2}" width="{w}" height="{h}" rx="{min(h / 2, 21)}"/>'
           f'<text class="lp-pn" x="{cx}" y="{cy - h / 2 + 18}" text-anchor="middle">{name}</text>'
           f'<text class="lp-ps" x="{cx}" y="{cy - h / 2 + 32}" text-anchor="middle">{sub}</text>')
    if note:
        out += _lp_text(cx, cy - h / 2 + 50, note, "lp-note", "middle", 13)
    return out + "</g>"


def _ln(d, k, cls="lp-ln", arrow=True):
    m = ' marker-end="url(#ID-ah)"' if arrow else ""
    return f'<path class="{cls}" style="--k:{k}" d="{d}" pathLength="1"{m}/>'


def _lp_defs():
    return ('<defs><filter id="ID-rf" x="-5%" y="-5%" width="110%" height="110%"><feTurbulence type="fractalNoise" baseFrequency=".09" numOctaves="2" seed="7"/>'
            '<feDisplacementMap in="SourceGraphic" scale="1"/></filter>'
            '<marker id="ID-ah" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="7" markerHeight="7" orient="auto-start-reverse">'
            '<path d="M1 1l6 3-6 3" fill="none" stroke="#55554f" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/></marker>'
            f'<marker id="ID-ahg" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="7" markerHeight="7" orient="auto-start-reverse">'
            f'<path d="M1 1l6 3-6 3" fill="none" stroke="{_G}" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/></marker></defs>')


def _lp_wide():
    import math
    # 96 + one 14px line so Script's fourth line fits; all five Make cards match.
    # Check loop and Janet shift down by the same 14px; viewBox grows to keep the bottom margin.
    card_h = 110
    s = [_lp_defs(), '<text class="lp-k" x="0" y="14">Make</text>']
    for i, (name, ic, lines) in enumerate(LP_MAKE):
        x, y = i * 155, 26
        s.append(f'<g class="lp-o" style="--k:{i}"><rect class="lp-card" x="{x}" y="{y}" width="140" height="{card_h}" rx="8"/>'
                 f'<text class="lp-pn" x="{x + 44}" y="{y + 29}"><tspan class="lp-num">{i + 1}</tspan> {name}</text>'
                 f'{_lp_text(x + 12, y + 56, lines, "lp-s")}</g>{_lp_icon(x + 12, y + 12, ic, i)}')
        if i < 4:
            s.append(_ln(f"M{x + 142} {y + card_h // 2}h11", i))
    s.append(_ln("M690 136v28H380v17", 5))
    s.append('<text class="lp-k lp-o" style="--k:5" x="390" y="176">Check</text>')
    cx, cy, rx, ry = 380, 304, 150, 100
    pt = lambda deg: (cx + rx * math.cos(math.radians(deg)), cy + ry * math.sin(math.radians(deg)))
    centers = [(cx, cy - ry), (cx + rx, cy), (cx, cy + ry), (cx - rx, cy)]
    arcs = [(-52, -15), (15, 52), (128, 165), (195, 232)]
    for j, ((name, sub), (px, py)) in enumerate(zip(LP_LOOP, centers)):
        s.append(_lp_pill(px, py, 170, 42, name, sub, 6 + 2 * j, key=j == 1))
        (x1, y1), (x2, y2) = pt(arcs[j][0]), pt(arcs[j][1])
        s.append(_ln(f"M{x1:.1f} {y1:.1f}A{rx} {ry} 0 0 1 {x2:.1f} {y2:.1f}", 7 + 2 * j))
    s.append('<g class="lp-o" style="--k:13"><text class="lp-c" x="380" y="296" text-anchor="middle">up to 3 rounds</text>'
             + _lp_text(380, 312, ["new reviewer if", "&gt;3 shots changed"], "lp-s", "middle", 13) + "</g>")
    s.append(f'<g class="lp-o" style="--k:8">{_lp_text(626, 291, LP_NOTE, "lp-note", dy=14)}</g>')
    s.append(_ln("M144 304h-29", 14))
    s.append('<g class="lp-o" style="--k:14"><rect class="lp-card lp-j" x="0" y="282" width="112" height="44" rx="8"/>'
             '<text class="lp-pn" x="56" y="300" text-anchor="middle">Janet watches</text>'
             '<text class="lp-ps" x="56" y="314" text-anchor="middle">leftovers listed</text></g>')
    s.append('<path class="lp-learn lp-o" style="--k:15" d="M40 280V140" marker-end="url(#ID-ahg)"/>')
    s.append(f'<g class="lp-o" style="--k:15">{_lp_text(50, 204, LP_LEARN, "lp-note")}</g>')
    return f'<svg class="lp-svg lp-w" viewBox="0 0 760 434" aria-hidden="true">{"".join(s).replace("ID-", "lpw-")}</svg>'


def _lp_list():
    """R63: the phone version is a plain list (same steps, same order) instead of the tall SVG, whose text came out ~8px.
    On desktop the same list stays visually hidden and is what screen readers read; the wide SVG is decoration."""
    ic = lambda c: f'<svg class="lp-li-ic" viewBox="0 0 40 40" aria-hidden="true"><g {_KT}>{c}</g></svg>'
    make = "".join(f'<li>{ic(c)}<p><b><span class="lp-num">{i + 1}</span> {n}</b><span>{" ".join(ls)}</span></p></li>'
                   for i, (n, c, ls) in enumerate(LP_MAKE))
    check = "".join(f'<li{' class="lp-li-key"' if j == 1 else ''}><p><b>{n}</b><span>{d}</span>'
                    + (f'<i>{" ".join(LP_NOTE)}</i>' if j == 1 else "") + '</p></li>' for j, (n, d) in enumerate(LP_LOOP))
    return ('<div class="lp-list"><p class="lp-lk">Make</p><ol class="lp-make">' + make + '</ol>'
            '<p class="lp-lk">Check</p><ol class="lp-check">' + check + '</ol>'
            '<p class="lp-rd">Back to the machine check, up to 3 rounds; a new reviewer if more than 3 shots changed.</p>'
            '<p class="lp-jw"><b>Janet watches</b><span>Any leftovers are listed.</span></p>'
            f'<p class="lp-lrn">{" ".join(LP_LEARN)}.</p></div>')


def loop_diagram():
    """The production loop: the wide SVG on desktop, the list on phones (and for screen readers everywhere)."""
    return (f'<figure class="lp" data-loop>{_lp_list()}{_lp_wide()}'
            f'<figcaption class="lp-cap">How each episode is made: a Claude Code skill, <span style="white-space:nowrap">ai-term-explainer</span>.</figcaption></figure>')


# ---- the two translated cards (from ~/AI-Terms/ai-long-context-ep4/审片/)
_TL = '<span class="tl">Translated from Chinese</span>'
AT_MACHINE = (
    f'<div class="ck-card"><p class="ck-h"><b>Machine check</b><span class="ck-m">long-context-ep4-v7.mp4 (8:47.5)</span>{_TL}</p><ul class="ck-l">'
    '<li class="y"><i>Yellow</i><span>Longest shot without change: 7.0 s. Over 5 s: 6:24.5–6:31.5 (7.0 s), 3:16.0–3:22.8 (6.8 s), '
    '3:30.2–3:37.0 (6.8 s), 0:35.5–0:41.8 (6.2 s), 2:59.5–3:05.8 (6.2 s). Add an action here: a stroke, a highlighter, something happening on the screen.</span></li>'
    '<li class="g"><i>Green</i><span>Blank frames: none.</span></li>'
    '<li class="g"><i>Green</i><span>Blue: none.</span></li>'
    '<li class="g"><i>Green</i><span>Camera push-ins: 44, 5.0 a minute (over 6 yellow, over 12 red).</span></li>'
    '<li class="y"><i>Yellow</i><span>Pushed in without pulling back: longest run is 6 in a row (around 2:37.9). Every push needs a pull: '
    'go back to the wide shot when the section changes.</span></li></ul>'
    '<p class="ck-v"><span class="lx-ring" aria-hidden="true"><span class="lx-dot">{n}</span></span>Verdict: no red lights. '
    'Look at each yellow once and note it in REVIEW.md.</p>'
    '<p class="ck-f">Contact sheets: 14, one frame every 2 seconds.</p></div>')
AT_REVIEW = (
    f'<div class="ck-card rv"><p class="ck-h"><b>Independent review</b><span class="ck-m">Ep 4 “Long context vs RAG”, v5 (8:28) · Oct 31, 2026</span>{_TL}</p>'
    '<p class="rv-who">“The reviewer did not take part in production. Watched only the finished film, the contact sheets, timeline.js, '
    'real-data.js / real.js and the machine check; not the scene code or the script.”</p>'
    '<div class="rv-top"><p class="rv-s"><span class="lx-ring" aria-hidden="true"><span class="lx-dot">{n}</span></span><b>7</b> / 10</p>'
    '<p class="rv-k">The three to fix first (excerpt)</p><ol class="rv-l">'
    '<li><b>2:33</b> “If any of the four questions is a yes, RAG is safer” is backwards. For question 1 (“Does it fit?”) and question 3 '
    '(“Does everyone see the same things?”) a yes points to long context. Turn all four the same way: doesn’t fit? changes often? needs permissions? needs sources?</li>'
    '<li><b>5:21</b> Numbers that clash, and one miscalculation. “Ask twice within an hour and it pays off”: asking twice costs $0.82, against $0.80 '
    'without caching. Make it “three times or more”.</li>'
    '<li><b>3:08</b> Screens that prove something other than the line. The Chroma chart is the repeated-words task while the voice talks about '
    'distractors, and it still has blue, green and orange lines.</li></ol></div>'
    '<p class="rv-row"><b>0:24–0:30</b> Chunk → coordinates → vector database · drawn as three boxes with text. Fails; draw instead: scissors cutting paper, '
    'a coordinate pin, a cabinet with drawers</p></div>')

# Episode-specific review cards (AT_MACHINE, AT_REVIEW) and the Ep 3/Ep 4 before–after and final-frame
# case studies stay in the source above, but are not shown on the overview: that page describes the shared
# method, not how one episode was made. One contact sheet remains, as an illustration of the shared review step.
AT_HIGHLIGHTS = [
    ("What the reviewer sees",
     "Every cut is sampled into contact sheets, one frame every 2 seconds. The reviewer reads only these, the subtitle timeline and the real data.",
     [("at-sheet", "Contact sheet of six film frames, each stamped with its timecode in the top-left corner", (1464, 558),
       (492, 282, 480, 270), "One frame every 2 seconds, timecoded")]),
]
AT_BUILT = "Built with Claude Code (a custom skill and fresh reviewer agents), HyperFrames and GSAP, Kokoro and Qwen3-TTS voices · Designed and built by me"
AT_CSS = """
<style>
/* R29: the production loop */
.lp { margin: 40px 0 0; padding: 26px 16px 18px; background: var(--bg-panel); }
.lp-svg { display: block; width: 100%; height: auto; overflow: visible; font-family: var(--sans); }
.lp-list { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; }
.lp-list ol { list-style: none; margin: 0; padding: 0; }
.lp-list li p { margin: 0; }
.lp-list .lp-lk { font-size: 13px; font-weight: 600; color: var(--ink-soft); margin: 0 0 8px; }
.lp-make li, .lp-check li { display: flex; gap: 12px; align-items: flex-start; padding: 12px 14px; background: #fff; border-radius: 8px; }
.lp-make li + li, .lp-check li + li { margin-top: 6px; }
.lp-li-ic { flex: none; width: 28px; height: 28px; margin-top: 1px; }
.lp-list li b, .lp-list .lp-jw b { display: block; font-size: 15px; font-weight: 600; letter-spacing: -.005em; color: var(--ink); }
.lp-list li p > span, .lp-list .lp-jw span { display: block; margin-top: 2px; font-size: 14px; line-height: 1.45; color: var(--ink-soft); }
.lp-list li i { display: block; margin-top: 4px; font-size: 14px; font-weight: 500; color: var(--accent); }
.lp-list .lp-check { padding-left: 12px; border-left: 1.5px solid var(--accent); }
.lp-li-key { box-shadow: inset 0 0 0 2px var(--accent); }
.lp-list .lp-li-key b { color: var(--accent); }
.lp-list .lp-rd { margin: 10px 0 0; padding-left: 12px; font-size: 14px; line-height: 1.45; color: var(--ink-soft); }
.lp-rd::before { content: "↺ "; color: var(--accent); font-weight: 600; }
.lp-list .lp-jw { margin: 18px 0 0; padding: 12px 14px; background: var(--tint); border-radius: 8px; box-shadow: inset 0 0 0 1px var(--accent); }
.lp-list .lp-lrn { margin: 10px 0 0; font-size: 14px; font-style: italic; font-weight: 500; color: var(--accent); }
.lp-card { fill: #fff; stroke: rgba(10, 10, 10, .22); stroke-width: 1; }
.lp-j { fill: var(--tint); stroke: var(--accent); }
.lp-pill { fill: #fff; stroke: #0a0a0a; stroke-width: 1; }
.lp-key .lp-pill { stroke: var(--accent); stroke-width: 2; }
.lp-key .lp-pn { fill: var(--accent); }
.lp-k { font-size: 10.5px; font-weight: 600; fill: var(--ink-soft); }
.lp-pn { font-size: 12.5px; font-weight: 600; letter-spacing: -.005em; fill: var(--ink); }
.lp-num { fill: var(--accent); }
.lp-ps, .lp-s { font-size: 10.5px; fill: var(--ink-soft); }
.lp-c { font-size: 11.5px; font-weight: 600; fill: var(--ink); }
.lp-note { font-size: 11px; font-style: italic; font-weight: 500; fill: var(--accent); }
.lp-ln { fill: none; stroke: #55554f; stroke-width: 1; stroke-dasharray: 1; }
.lp-learn { fill: none; stroke: var(--accent); stroke-width: 1.2; stroke-dasharray: 4 4; }
.lp-cap { margin: 14px 0 0; font-size: 13px; color: var(--ink-soft); text-align: center; }
.sr { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; }
/* subtle draw-in on scroll (motion.js adds .pre then .on; with reduced motion neither is added) */
.lp.pre:not(.on) .lp-o { opacity: 0; }
.lp.pre:not(.on) .lp-ln { opacity: 0; stroke-dashoffset: 1; }
.lp.pre .lp-o { transition: opacity 360ms var(--ease) calc(var(--k) * 110ms); }
.lp.pre .lp-ln { transition: opacity 120ms linear calc(var(--k) * 110ms), stroke-dashoffset 520ms var(--ease) calc(var(--k) * 110ms); }
/* R34: the 10-step framework (the Startup Research tree, plus a grey Ep 3 note per step) */
.fw { margin-top: 26px; }
.fw .tr-list { padding-top: 4px; }
.fw .tr-list::after { display: none; }
.fw .tr-ph { margin-top: 0; }
.fw-ex { margin: 3px 0 0; font-size: 13px; line-height: 1.4; color: var(--ink-soft); opacity: .85; }
.fw-end { padding-top: 10px; }
.fw-end p { display: inline-block; margin: 12px 0 0; padding: 12px 22px 10px; background: var(--tint); }
.fw-end b { display: block; font-size: 13px; font-weight: 600; color: var(--accent); }
.fw-end p > span:not(.fw-ex) { display: block; margin-top: 3px; font-size: 16px; font-weight: 600; letter-spacing: -.01em; }
.fw-end .fw-ex { display: block; }
#loop .lp { margin-top: 20px; }
/* translated cards */
.lx-card { width: 100%; }
.ck-card { position: relative; padding: 20px 22px 18px; background: #fff; font-size: 14px; line-height: 1.5; color: var(--ink); }
.ck-h { display: flex; flex-wrap: wrap; align-items: baseline; gap: 4px 8px; margin: 0 0 14px; padding: 0; font-size: 13px; color: var(--ink-soft); }
.ck-h b { color: var(--ink); font-weight: 600; }
.ck-m::before { content: "·"; margin-right: 8px; }
.tl { margin-left: auto; font-size: 13px; font-weight: 600; color: var(--accent); }
.ck-l { list-style: none; margin: 0; padding: 0; }
.ck-l li { display: grid; grid-template-columns: 74px 1fr; gap: 10px; padding: 6px 0; }
.ck-l i { display: inline-flex; align-items: center; gap: 7px; font-style: normal; font-size: 13px; font-weight: 600; }
.ck-l i::before { content: ""; width: 9px; height: 9px; border-radius: 50%; flex: none; }
.ck-l .g i::before { background: var(--accent); }
.ck-l .y i::before { background: #d3a62e; }
.ck-l span { font-size: 13.5px; color: var(--ink-soft); }
.ck-v { position: relative; margin: 12px 0 0; padding: 8px 10px; font-weight: 600; }
.ck-v .lx-ring, .rv-s .lx-ring { inset: 0; }
.ck-f { margin: 6px 10px 0; font-size: 13px; color: var(--ink-soft); }
.rv-who { margin: 0 0 14px; font-size: 13.5px; font-style: italic; color: var(--ink-soft); }
.rv-top { display: grid; grid-template-columns: 96px 1fr; gap: 4px 18px; align-items: start; }
.rv-s { position: relative; grid-row: span 2; margin: 0; padding: 10px 0 12px; text-align: center; font-size: 15px; color: var(--ink-soft); }
.rv-s b { display: block; font-family: var(--display); font-size: 44px; font-weight: 500; line-height: 1; letter-spacing: -.03em; color: var(--accent); }
.rv-k { margin: 0; font-size: 13px; font-weight: 600; color: var(--ink-soft); }
.rv-l { margin: 0; padding: 0 0 0 18px; font-size: 13.5px; color: var(--ink-soft); }
.rv-l li { padding: 4px 0; }
.rv-l li::marker { color: var(--accent); font-weight: 600; }
.rv-l b, .rv-row b { color: var(--ink); font-variant-numeric: tabular-nums; }
.rv-row { margin: 12px 0 0; padding: 0; font-size: 13px; color: var(--ink-soft); }
.lx-coda { margin: 56px 0 0; }
.lx-coda h3 { margin: 0 0 6px; font-size: 13px; font-weight: 600; letter-spacing: 0; color: var(--ink-soft); }
@media (max-width: 699px) {
  .lp { padding: 18px 14px 14px; }
  .lp-w { display: none; }
  .lp-list { position: static; width: auto; height: auto; overflow: visible; clip: auto; white-space: normal; }
  .lp-list .lp-make + .lp-lk { margin-top: 18px; }
  .ck-card { padding: 14px 14px 12px; }
  .ck-h { display: block; } .ck-h b, .ck-m, .tl { display: block; } .ck-m::before { content: none; } .tl { margin: 4px 0 0; }
  .ck-l li { grid-template-columns: 1fr; gap: 2px; }
  .rv-top { grid-template-columns: 1fr; }
  .rv-s { grid-row: auto; display: flex; align-items: baseline; justify-content: center; gap: 4px; padding: 8px 0; }
  .rv-s b { display: inline; font-size: 36px; }
}
</style>"""


def ai_terms_page():
    eps = "".join(
        f'<li><span class="ep-n">{n}</span><span class="ep-t"><b><a href="research-aiterm.html#ep-{s}">{t}</a></b><span>{d}</span></span>'
        f'<span class="ep-l">{l} · <a href="{AITERM_YT[s]}" target="_blank" rel="noopener">Watch on YouTube ↗</a></span></li>'
        for n, t, d, l, s in EPISODES)
    coda = (f'<div class="lx-coda"><h3>Episodes</h3><ol class="eps">{eps}</ol>'
            f'<p class="see">The English films are on <a href="{YT_CHANNEL}" target="_blank" rel="noopener">YouTube @JanetMao</a>. '
            f'<a href="research-aiterm.html">See all episodes →</a></p></div>')
    return callout_page("ai-terms", "AI Term Explainer", AT_SUMMARY, AT_HIGHLIGHTS, AT_BUILT, base=1464, url=None,
                        coda=coda, css=AT_CSS, js=True,
                        doc_title="How the films are made — AI Term Explainer — Janet Mao",
                        lead=framework_section() + '\n  <section class="lx-h" id="loop"><h2>How each film is made</h2>'
                             '<p>Five steps to make it, then a check loop before I watch it.</p>' + loop_diagram() + '</section>')


# ---------------------------------------------------------------- icons (revision 12)
# One original line drawing per project, drawn on a 120 grid: bold black outline, white fills, one #3d5e4a accent.
# A faint displacement filter gives every stroke the same slightly hand-drawn wobble.
_K = 'stroke="#0a0a0a" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"'
_A = "#3d5e4a"
ICON_ART = {
"lexiai": f"""<path d="M12 42v52c18-4 36-3 48 4 12-7 30-8 48-4V42" fill="#fff"/>
<path d="M60 40c-12-7-30-8-44-4v52c14-4 32-3 44 4z" fill="#fff"/><path d="M60 40c12-7 30-8 44-4v52c-14-4-32-3-44 4z" fill="#fff"/>
<path d="M23 50c9-2 19-1 29 2M23 60c9-2 19-1 29 2M23 70c9-2 19-1 29 2M23 80c7-1 13-1 19 1M80 52c6-2 12-2 17-1M80 62c6-2 12-2 17-1M80 72c6-2 12-2 17-1" fill="none"/>
<path d="M65 37v67l4.5-5 4.5 5V35.6" fill="{_A}"/>""",
"lexispeak": f"""<path d="M62 20h41c4 0 7 3 7 7v28c0 4-3 7-7 7H82L68 75l2-13h-8c-4 0-7-3-7-7V27c0-4 3-7 7-7z" fill="#fff"/>
<rect x="21" y="32" width="27" height="46" rx="13.5" fill="#fff"/><path d="M28 46h13M28 54h13M28 62h13M14 62c0 25 41 25 41 0M34.5 83v15M23 99h23" fill="none"/>
<g stroke="none" fill="{_A}"><circle cx="71" cy="41" r="4.5"/><circle cx="82.5" cy="41" r="4.5"/><circle cx="94" cy="41" r="4.5"/></g>""",
"writing-station": f"""<rect x="22" y="26" width="70" height="78" rx="4" fill="#fff"/>
<path d="M16 38h12M16 52h12M16 66h12M16 80h12M16 94h12M36 44h46M36 56h46M36 68h30M34 86c5-5 9 4 14-1" fill="none"/>
<g transform="rotate(40 74 58)"><rect x="68" y="12" width="13" height="60" rx="5" fill="#fff"/><path d="M68 30h13M78 16v18" fill="none"/>
<path d="M68.5 72h12l-6 21z" fill="{_A}"/><path d="M74.5 79v7" fill="none" stroke-width="2"/></g>""",
"podcast-dig": f"""<rect x="12" y="28" width="78" height="60" rx="6" fill="#fff"/><path d="M12 41h78" fill="none"/>
<g stroke="none" fill="#0a0a0a"><circle cx="20.5" cy="34.5" r="2"/><circle cx="28" cy="34.5" r="2"/><circle cx="35.5" cy="34.5" r="2"/></g>
<path d="M25 55l10 7-10 7M41 71h13" fill="none" stroke="{_A}" stroke-width="4"/>
<g transform="translate(80 76) rotate(45)"><rect x="-6.5" y="-24" width="13" height="52" rx="6.5" fill="#fff"/>
<path d="M-5 -48.5v10h10v-10A14.5 14.5 0 1 1 -5 -48.5z" fill="#fff"/><circle cx="0" cy="19" r="3" fill="none"/></g>""",
"startup-research": f"""<path d="M16 20v80h92" fill="none"/><path d="M16 80h-4M16 60h-4M16 40h-4" fill="none" stroke-width="2.5"/>
<path d="M24 88l17-14 14 6 19-23 22-21" fill="none" stroke="{_A}" stroke-width="4"/><path d="M86 35h11v11" fill="none" stroke="{_A}" stroke-width="4"/>
<path d="M76 76l18 18" fill="none" stroke-width="9"/><circle cx="62" cy="62" r="19" fill="#fff" fill-opacity=".35"/>
<path d="M51 55c2-5 6-8 11-8.5" fill="none" stroke-width="2.5"/>""",
"ai-terms": f"""<path d="M38 88l-9 17M82 88l9 17M60 88v10" fill="none"/><rect x="14" y="22" width="92" height="64" rx="5" fill="#fff"/>
<path d="M10 88h100" fill="none" stroke-width="4"/><path d="M24 33c4-3 7 3 11 0s7 3 11 0M88 74h8" fill="none" stroke-width="2.5"/>
<path d="M51 40v32l26-16z" fill="{_A}"/>""",
}
ICON_ALT = {
    "lexiai": "Drawing of an open dictionary with a ribbon bookmark",
    "lexispeak": "Drawing of a microphone next to a speech bubble",
    "writing-station": "Drawing of a fountain pen resting on an open notebook",
    "podcast-dig": "Drawing of a wrench crossing a terminal window",
    "startup-research": "Drawing of a magnifying glass over a rising line chart",
    "ai-terms": "Drawing of a small board with a play button",
}


def art(slug, alt=True, uid=""):  # uid keeps filter ids unique when an icon appears twice on a page
    seed = ORDER.index(slug) + 3
    label = f'role="img" aria-label="{ICON_ALT[slug]}"' if alt else 'aria-hidden="true"'
    return (f'<svg class="ic" viewBox="0 0 120 120" {label}><filter id="rf-{slug}{uid}" x="-5%" y="-5%" width="110%" height="110%">'
            f'<feTurbulence type="fractalNoise" baseFrequency=".035" numOctaves="2" seed="{seed}"/><feDisplacementMap in="SourceGraphic" scale="2.4"/></filter>'
            f'<g filter="url(#rf-{slug}{uid})" {_K}>{ICON_ART[slug]}</g></svg>')


# Hero story (revision 27, replacing the R24/R26 disc): a forest grows out of a book. No circle or frame: the drawing
# sits right on the plate. 1 bored, slumped at the desk by a closed grey book, a sigh · 2 she opens it: pages flip,
# light spills out, a sprout pops up · 3 trees draw up out of the pages and bloom (back layer lightest) · 4 she leans
# in, eyes sparkling, while leaves drift off the trees and turn into English words. Then the forest stays alive:
# trees sway, leaves keep falling and turning into new words (assets/hero.js swaps the words, adds a small
# mouse parallax on desktop, and pauses everything off-screen). Timing is CSS (--t start, --u end) under .fx.tell;
# without .tell (no JS, reduced motion) the svg rests on the final frame: forest grown, words showing.
# Classes: x = story-only (hidden at rest), in = fades in at --t and stays, dw = stroke drawn on (f: fill fades in
# after), pop = springs up from 0, pg = a flipping page, sw = idle sway, pl = parallax layer, lf = a leaf that
# becomes a word.
_S = 'stroke="#555" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"'
_PAPER = "#fbfaf6"   # warm off-white page / face
_G, _G2, _G3 = "#3d5e4a", "#9fb3a4", "#dfe5dd"   # accent green and two lighter tints (front -> back)
_SPINE = 156


# R46 (R42 option A): her open eye is pupil + white catchlight inside .lid (assets/eyes.js blinks it), inside .look
# (turned toward the cursor), inside .eye (the fixed socket eyes.js measures from).
_EYE = '<g class="eye" data-cx="6" data-cy="1"><g class="look"><g class="lid">{}</g></g></g>'


def _head(x, y, rot, eyes, mouth, d=0):
    """Girl's head facing right, centred on (x, y): round face, dark bob, one eye."""
    eye = {"shut": '<path class="dw" d="M3 2q3 2 6 0" fill="none"/>',
           "dot": _EYE.format('<circle cx="6" cy="1" r="2" fill="#555" stroke="none"/><circle cx="6.75" cy=".25" r=".5" fill="#fff" stroke="none"/>'),
           "spark": _EYE.format('<circle cx="6" cy="1" r="2.6" fill="#555" stroke="none"/><circle cx="6.95" cy=".05" r=".62" fill="#fff" stroke="none"/>')}[eyes]
    return (f'<g transform="translate({x} {y}) rotate({rot})"><circle class="dw f" style="--d:{d}" cx="0" cy="0" r="14" fill="{_PAPER}"/>'
            f'<path class="dw f" style="--d:{d + 1}" d="M-15 9C-17-6-10-16 1-16C10-16 15-10 15-5C8-8 2-6-2-2L-4 10C-8 11-12 11-15 9Z" fill="#555"/>'
            f'{eye}<path class="dw" style="--d:{d + 2}" d="{mouth}" fill="none"/></g>')


def _body(x, lean=0):
    return (f'<path class="dw f" d="M{x - 16} 150C{x - 16} 132 {x - 10 + lean} 122 {x + lean} 120'
            f'C{x + 10 + lean} 122 {x + 16} 132 {x + 16} 150Z" fill="{_PAPER}"/>')


def _blob(cx, cy, r, n=7, rot=0):
    """A cloud-like tree crown: n lobes around (cx, cy), slightly squashed."""
    import math
    pts = [(cx + r * math.cos(a), cy + r * .86 * math.sin(a)) for a in (rot + 2 * math.pi * i / n for i in range(n + 1))]
    mids = [(cx + r * 1.32 * math.cos(a), cy + r * 1.14 * math.sin(a)) for a in (rot + 2 * math.pi * (i + .5) / n for i in range(n))]
    return f"M{pts[0][0]:.1f} {pts[0][1]:.1f}" + "".join(f"Q{m[0]:.1f} {m[1]:.1f} {p[0]:.1f} {p[1]:.1f}" for m, p in zip(mids, pts[1:])) + "Z"


def _spark(x, y, s, cls=""):
    return (f'<path class="{cls}" style="--z:{x % 3}" d="M{x} {y - s}q{s * .15:.2f} {s * .85:.2f} {s} {s}q{-s * .85:.2f} {s * .15:.2f} {-s} {s}'
            f'q{-s * .15:.2f} {-s * .85:.2f} {-s} {-s}q{s * .85:.2f} {-s * .15:.2f} {s} {-s}Z" fill="{_G}" stroke="none"/>')


# trees, back to front: (layer, trunk + branch paths, crowns (cx, cy, r, lobes), trunk start, crown start, parallax depth)
# Every trunk path starts on the book's pages so it draws upward.
_LAYER = {"b": (_G2, _G3, 1.7), "m": (_G, "#bccabf", 2), "f": (_G, _G2, 2.3)}   # stroke, fill, width
TREES = [
    ("b", ["M144 138C140 122 128 104 116 88"], [(110, 66, 23, 7)], 4.2, 4.75, .7),
    ("b", ["M168 138C174 120 186 104 198 88"], [(203, 66, 23, 7)], 4.3, 4.9, .7),
    ("b", ["M156 136C155 110 157 80 156 52"], [(156, 40, 25, 8)], 4.4, 5.05, .9),
    ("m", ["M150 138C146 124 138 114 130 104"], [(124, 90, 16, 6)], 4.55, 5.15, 1.3),
    ("m", ["M162 138C166 126 174 116 184 106"], [(189, 92, 16, 6)], 4.65, 5.3, 1.3),
    ("f", ["M156 138C153 122 158 106 155 86", "M155 116C162 110 170 106 176 98", "M155 104C148 98 142 94 136 88"],
     [(155, 72, 19, 7)], 4.75, 5.45, 2),
]
# little leaves that pop onto the front tree once it has bloomed: x, y, angle
# (the last six sit in two sprays at the tips of the front tree's branches)
_LEAVES = [(146, 64, -30), (166, 62, 30), (156, 56, 0), (150, 80, -10), (168, 80, 20),
           (180, 95, 20), (177, 90, -50), (183, 101, 70), (132, 85, -20), (135, 80, 40), (129, 91, -80)]
# leaves that fall and turn into words: start x, y, drift dx, dy, words (the first is the one shown at rest).
# Right-hand ones keep short words so they never run off the edge.
LEAF_WORDS = [
    (118, 70, -48, 4, ["agents", "RAG", "tokens", "prompt", "evals"]),
    (140, 50, -82, -6, ["transformer", "embeddings", "fine-tuning", "context window"]),
    (204, 72, 30, 14, ["LLM", "MCP", "RAG", "GPU"]),
    (128, 92, -94, 6, ["inference", "agents", "attention", "vectors"]),
    (190, 52, 42, -12, ["evals", "skills", "tokens", "LoRA"]),
]
LEAF_FIRST, LEAF_GAP, LEAF_PERIOD = 5.5, 1.2, 6.0   # seconds; style.css (.lf animation) uses the same 6s period


def _tree(layer, paths, crowns, t, tc, k, i):
    stroke, fill, w = _LAYER[layer]
    trunks = "".join(f'<path class="dw" style="--t:{t}s;--d:{j * 4}" d="{p}" fill="none"/>' for j, p in enumerate(paths))
    tops = "".join(f'<g class="pop" style="--t:{tc + j * .15:.2f}s"><path d="{_blob(cx, cy, r, n, rot=.3 * (i + j))}" fill="{fill}"/></g>'
                   for j, (cx, cy, r, n) in enumerate(crowns))
    base = paths[0].split("C")[0][1:].replace(" ", "px ") + "px"
    return (f'<g class="pl" style="--k:{k};--o:{base}"><g class="sw" style="--sd:{i * -.7:.1f}s;--o:{base}" stroke="{stroke}" stroke-width="{w}">'
            f'{trunks}{tops}</g></g>')


# R46 hero colour (the approved R45 mock A+B; timing in style.css under "R46"). Back to front, all behind the drawing:
# pastel aurora (mint / lilac / coral, fades in at 7.6s once the pollen is gone, then drifts), a warm apricot glow under
# the canopy (5.6s, then breathes), and 16 pollen motes that rise once out of the open book with the sprout (3.7s), plus
# the .motes layer where assets/pollen.js adds the odd mote when she blinks. Only opacity / transform move.
_AURORA = ["#c4e6d4", "#ddd0f0", "#f6cdbd"]                      # mint, lilac, coral
_POLLEN = ["#f0cf7a", "#f2b49b", "#c4b0e6", "#9fd4b8", "#aec8ec"]  # butter, peach, lilac, mint, sky


def _soft(gid, color, mid=.55):
    """A radial blob that fades to nothing at its edge."""
    return (f'<radialGradient id="{gid}"><stop offset="0" stop-color="{color}"/>'
            f'<stop offset=".5" stop-color="{color}" stop-opacity="{mid}"/>'
            f'<stop offset="1" stop-color="{color}" stop-opacity="0"/></radialGradient>')


def _hero_colour():
    import random
    defs = ("".join(_soft(f"au-{k}", c) for k, c in zip("mlc", _AURORA)) + _soft("wg", "#f5d29a", .6)
            + "".join(_soft(f"pn-{i}", c, .8) for i, c in enumerate(_POLLEN)))
    aurora = ('<g class="pt" style="--k:-1.5"><g class="aur">'
              '<g class="au" style="--a:au-1;--s:23s"><ellipse cx="116" cy="92" rx="76" ry="52" fill="url(#au-m)"/></g>'
              '<g class="au" style="--a:au-2;--s:29s"><ellipse cx="198" cy="70" rx="68" ry="50" fill="url(#au-l)"/></g>'
              '<g class="au" style="--a:au-3;--s:19s"><ellipse cx="156" cy="40" rx="72" ry="40" fill="url(#au-c)"/></g></g></g>')
    glow = '<g class="pt" style="--k:-1"><g class="wglow"><ellipse cx="156" cy="106" rx="74" ry="36" fill="url(#wg)"/></g></g>'
    rnd, motes = random.Random(45), []       # fixed seed: the same fan on every build
    for i in range(16):                      # a quick fan from the book: starts 3.7s .. 4.9s, 2.3-2.7s each
        x, y, t = _SPINE + rnd.uniform(-11, 11), 130 + rnd.uniform(-4, 3), 3.7 + i * .08
        dx, dy, r = rnd.uniform(-22, 22), -rnd.uniform(34, 70), rnd.uniform(2.4, 3.4)
        motes.append(f'<circle class="pn" cx="{x:.1f}" cy="{y:.1f}" r="{r:.1f}" fill="url(#pn-{i % 5})" '
                     f'style="--t:{t:.2f}s;--x:{dx:.1f};--y:{dy:.1f};--s:{rnd.uniform(2.3, 2.7):.2f}s"/>')
    pollen = '<g class="pt" style="--k:1"><g class="pollen">' + "".join(motes) + '</g><g class="motes"></g></g>'
    return defs, aurora + glow + pollen


def _leaf(x, y, a, fill=_G):
    return f'<path transform="translate({x} {y}) rotate({a})" d="M-4.5 0Q0-4 4.5 0Q0 4-4.5 0Z" fill="{fill}" stroke="none"/>'


def hero_story():
    s = _SPINE
    trees = "".join(_tree(*tr, i) for i, tr in enumerate(TREES))
    leaves = "".join(f'<g class="pop" style="--t:{5.9 + i * .1:.1f}s">{_leaf(x, y, a)}</g>' for i, (x, y, a) in enumerate(_LEAVES))
    falling = "".join(
        f'<g class="lf" style="--dx:{dx};--dy:{dy};--t:{LEAF_FIRST + i * LEAF_GAP:.1f}s">'
        f'<g class="lf-l"><g transform="translate({x} {y})">{_leaf(0, 0, 20 * i, _G if i % 2 else _G2)}</g></g>'
        f'<text class="wd" x="{x + dx}" y="{y + dy}" data-w="{"|".join(ws)}">{ws[0]}</text></g>'
        for i, (x, y, dx, dy, ws) in enumerate(LEAF_WORDS))
    rays = "".join(f'<path class="dw" style="--t:3.2s;--d:{i}" d="M{s + dx * .2:.0f} 128L{s + dx} {128 - h}" fill="none"/>'
                   for i, (dx, h) in enumerate([(-44, 40), (-20, 56), (0, 64), (22, 56), (46, 40)]))
    page_r = f"M{s} 150L{s + 34} 147Q{s + 36} 140 {s + 33} 134Q{s + 17} 130 {s} 137Z"
    colour_defs, colour = _hero_colour()
    return f"""<svg class="fx-story" viewBox="0 6 260 184" aria-hidden="true">
<defs><radialGradient id="bf-glow"><stop offset="0" stop-color="{_G3}"/><stop offset=".55" stop-color="{_G3}" stop-opacity=".55"/><stop offset="1" stop-color="{_G3}" stop-opacity="0"/></radialGradient>{colour_defs}</defs>
<g class="pt" style="--k:-2"><g class="in glow" style="--t:3.1s"><ellipse cx="{s}" cy="112" rx="116" ry="86" fill="url(#bf-glow)"/></g></g>
{colour}
<g {_S}>
<g class="x" style="--t:3.1s;--u:4.6s" stroke="{_G2}" stroke-width="1.6">{rays}</g>
{trees}
<g class="pl" style="--k:2;--o:{s}px 138px">{leaves}</g>
<path class="dw" d="M12 150H248M28 150v30M232 150v30" fill="none"/>
<g class="x" style="--t:0s;--u:2.9s"><rect class="dw f" style="--d:3" x="{s - 34}" y="137" width="68" height="13" rx="2" fill="#d6d5d0"/>
<path class="dw" style="--d:5" d="M{s - 28} 141.5h56M{s - 28} 145.5h56" fill="none" stroke-width="1.4"/></g>
<g class="in" style="--t:2.8s"><path d="M{s - 37} 148L{s} 153L{s + 37} 148" fill="none"/>
<path d="M{s} 150L{s - 34} 147Q{s - 36} 140 {s - 33} 134Q{s - 17} 130 {s} 137Z" fill="{_PAPER}"/><path d="{page_r}" fill="{_PAPER}"/>
<path d="M{s - 28} 139q12-3 24 1M{s - 29} 143q12-2 25 2M{s + 4} 140q12-4 24-1M{s + 4} 144q12-3 25-2" fill="none" stroke="{_G2}" stroke-width="1.3"/>
{"".join(f'<path class="pg" style="--t:{2.95 + i * .22:.2f}s" d="{page_r}" fill="{_PAPER}"/>' for i in range(3))}</g>
<g class="x" style="--t:3.6s;--u:4.9s"><g class="pop" style="--t:3.7s"><path d="M{s} 137q-1-7 1-13" fill="none" stroke="{_G}"/>
{_leaf(s - 5, 127, -30, _G)}{_leaf(s + 6, 124, 30, _G2)}</g></g>
<g class="x" style="--t:0s;--u:2.9s">{_body(64, 6)}<path class="dw" style="--d:3" d="M72 128Q84 142 100 146" fill="none"/>
{_head(94, 133, 30, "shut", "M6 8h3", 4)}
<path class="dw sigh" style="--t:1.1s" d="M107 141c5-1 4-6 8-7s4-6 8-7" fill="none" stroke="#999" stroke-width="1.5"/></g>
<g class="x" style="--t:2.8s;--u:5.8s">{_body(62, 2)}{_head(66, 104, -6, "dot", "M6 7q2.5 3 5 0")}<path d="M74 126Q98 134 {s - 32} 142" fill="none"/></g>
<g class="in" style="--t:5.8s"><g class="breathe">{_body(66, 10)}{_head(88, 109, 16, "spark", "M5 7q3 3.5 6 0")}</g>
<path d="M80 128Q102 140 {s - 30} 145M70 132Q94 148 {s - 34} 149" fill="none"/>
<g class="tw">{_spark(102, 98, 3.6)}{_spark(108, 105, 2.2)}</g></g>
</g>
<g class="pt" style="--k:4">{falling}</g>
</svg>""".replace('class="dw', 'pathLength="1" class="dw')


# ---------------------------------------------------------------- landing (revision 11: hero + plates)
# (code, slug, one line). Since R32 the home page has no cards: the lines are the map nodes' descriptions and the
# codes feed the next-project links. Codes are project initials + the year it started (all 2026). Lines are taken from each page's own text.
CATALOG = [
    ("LX-26", "lexiai", "An advanced learner's dictionary for understanding and using words in context."),
    ("LS-26", "lexispeak", "Conversation practice that grades my recorded voice."),
    ("WS-26", "writing-station", "A daily English journal, reviewed one sentence at a time."),
    ("PD-26", "podcast-dig", "Exact quotes from long podcasts, searchable in my Obsidian vault."),
    ("SR-26", "startup-research", "How I read a company: understand the tech, analyze the business."),
    ("AT-26", "ai-terms", "Short videos that explain AI words in plain language."),
]
# hero story captions (revision 27): text, start, end in seconds. The last one has no end: it stays with the living
# forest and is also the caption of the still frame (reduced motion, no JS).
HERO_CAPTIONS = [("Bored…", .3, 2.7), ("…then she opened AI.", 3.0, 5.4), ("Now she can’t stop learning.", 5.8, None)]


# ---------------------------------------------------------------- home: the project map (R32, from the R31 mock)
# "Things I've built" is a map of the six projects and how data moves between them; each node links to its page.
# Every edge is backed by code or skill instructions (evidence table in R31_REPORT.md). Desktop: absolutely placed
# HTML nodes over one SVG of curved edges, drawing units == % positions. Phone (<700px): a vertical list instead.
# assets/map.js does the hover/focus highlight and the draw-on-scroll.
# R33 motion: nodes pop in cluster by cluster (MAP_POP sets the order), then the edges draw from their start; once
# settled, small dots flow along every edge in its arrow direction (map.js builds them into <g class="flows">), the
# bridge pulses, and the nodes float 1-2px. Hover lifts the node and speeds up its own dots.
MAP_W, MAP_H = 1000, 760
MAP_NODES = {  # slug: (x, y, note shown on hover)
    "lexispeak": (118, 120, "Picks target words from my notebook; saying one right marks it “Can Speak” in LexiAI."),
    "lexiai": (345, 380, "The shared word notebook. The other two practise its words and write progress back."),
    "writing-station": (118, 640, "Asks me to use notebook words; a word used well counts toward “Can Write”."),
    "podcast-dig": (655, 380, "One local Whisper transcript pool, shared with LexiAI, so no episode is transcribed twice."),
    "startup-research": (882, 120, "Reads podcast-dig’s highlights first, so founders speak in their own words."),
    "ai-terms": (882, 560, "Explains the tech a startup is built on, before I judge the business."),
}
MAP_CLUSTERS = [  # (label, x0, x1, slugs)
    ("Learning English", 10, 456, ["lexispeak", "writing-station", "lexiai"]),
    ("Understanding AI & startups", 544, 990, ["podcast-dig", "startup-research", "ai-terms"]),
]
# (from, to, label, bend, kind). bend = sideways bulge in drawing units. kind: "" | "br" (the bridge between the
# clusters, arrows both ways) | "hub" (dotted line into the Obsidian vault pill, no label)
MAP_EDGES = [
    ("lexiai", "lexispeak", "saved words", 18, ""),
    ("lexispeak", "lexiai", "unlocks “Can Speak”", 18, ""),
    ("lexiai", "writing-station", "words to use", 18, ""),
    ("writing-station", "lexiai", "words used well", 18, ""),
    ("podcast-dig", "lexiai", "shared transcripts", 0, "br"),
    ("podcast-dig", "startup-research", "raw material", -16, ""),
    ("ai-terms", "startup-research", "tech explained", 12, ""),  # R35: bulges right, clear of the vault line
    ("podcast-dig", "vault", "", 0, "hub"),
    ("startup-research", "vault", "", 0, "hub"),
    ("ai-terms", "vault", "", 0, "hub"),
]
MAP_POP = ["lexiai", "lexispeak", "writing-station", "podcast-dig", "startup-research", "ai-terms", "vault"]
MAP_VAULT = ("Obsidian vault", "where the research lands", 680, 690)  # a pill, not a project
MAP_BOX = (192, 160)  # a node's footprint in drawing units; edges stop at its edge
# a small hand-drawn vault: a closed box with a dial, same stroke language as the project icons
VAULT_IC = ('<svg class="vi" viewBox="0 0 40 40" aria-hidden="true"><g fill="none" stroke="#0a0a0a" stroke-width="2.2" '
            'stroke-linecap="round" stroke-linejoin="round"><rect x="5" y="7" width="30" height="25" rx="3" fill="#fff"/>'
            '<circle cx="20" cy="19.5" r="6"/><path d="M20 15.5v8M16 19.5h8" stroke="#3d5e4a"/><path d="M11 32v3M29 32v3"/></g></svg>')


def _map_pos(k):
    return (MAP_VAULT[2], MAP_VAULT[3]) if k == "vault" else MAP_NODES[k][:2]


def _map_trim(k, ux, uy):
    """Distance from a node's centre to the edge of its box along (ux, uy), plus a small gap."""
    hw, hh = (96, 24) if k == "vault" else (MAP_BOX[0] / 2, MAP_BOX[1] / 2)
    return min(hw / abs(ux) if ux else 1e9, hh / abs(uy) if uy else 1e9) + 6


def _map_edge(a, b, bend, kind):
    (x1, y1), (x2, y2) = _map_pos(a), _map_pos(b)
    dx, dy = x2 - x1, y2 - y1
    L = (dx * dx + dy * dy) ** .5
    ux, uy = dx / L, dy / L
    nx, ny = -uy, ux  # left-hand normal
    # aim the ends a little toward the bulge so a curved pair leaves the box side by side, not on top of each other
    r0 = _map_trim(a, ux, uy) + (5 if kind == "br" else 0)  # the bridge has an arrow at both ends
    r1 = _map_trim(b, ux, uy) + (0 if b == "vault" else 5)
    sx, sy = x1 + ux * r0 + nx * bend * .5, y1 + uy * r0 + ny * bend * .5
    ex, ey = x2 - ux * r1 + nx * bend * .5, y2 - uy * r1 + ny * bend * .5
    cx, cy = (sx + ex) / 2 + nx * bend * 1.4, (sy + ey) / 2 + ny * bend * 1.4
    lx, ly = (sx + 2 * cx + ex) / 4, (sy + 2 * cy + ey) / 4  # the curve's midpoint (t = .5)
    d = f"M{sx:.1f} {sy:.1f}Q{cx:.1f} {cy:.1f} {ex:.1f} {ey:.1f}"
    if bend == 0:  # straight: label above the line, centred
        if ny > 0: nx, ny = -nx, -ny
        return d, lx + nx * 14, ly + ny * 14, "middle"
    sgn = 1 if bend > 0 else -1
    ox, oy = nx * sgn, ny * sgn
    return d, lx + ox * 8, ly + oy * 8, "start" if ox > .3 else "end" if ox < -.3 else "middle"


def _map_pct(x, y):
    return f"left:{x / MAP_W * 100:.2f}%;top:{y / MAP_H * 100:.2f}%"


def _map_motion(k):
    """Per-node motion variables: pop-in order (--p, with a pause between the clusters) and an idle float that is a
    little different for each node (duration --fd, phase --fo), so they never bob in step."""
    i = MAP_POP.index(k)
    return f"--p:{i + (1 if i >= 3 else 0) + (1 if i >= 6 else 0)};--fd:{5.2 + (i * 7 % 5) * .45:.2f}s;--fo:{-i * 1.3:.1f}s"


def _map_desktop(lines):
    clusters = "".join(f'<rect class="cl" x="{x0}" y="22" width="{x1 - x0}" height="{MAP_H - 44}" rx="14"/>'
                       for _, x0, x1, _ in MAP_CLUSTERS)
    wires, labels, glow = [], [], ""
    for i, (a, b, lab, bend, kind) in enumerate(MAP_EDGES):
        d, lx, ly, anc = _map_edge(a, b, bend, kind)
        k = f" {kind}" if kind else ""
        pl = "" if kind == "hub" else ' pathLength="1"'  # hub lines are dotted, so they fade in instead of drawing
        wires.append(f'<path class="w{k}" data-a="{a}" data-b="{b}" style="--i:{i}"{pl} d="{d}"/>')
        if kind == "br":  # a soft accent halo under the bridge that breathes once the map has settled
            glow = f'<g class="bg-glow"><path class="pulse" d="{d}"/></g>'
        if lab:
            labels.append(f'<text class="wl{k}" data-a="{a}" data-b="{b}" style="--i:{i}" '
                          f'x="{lx:.1f}" y="{ly:.1f}" text-anchor="{anc}">{lab}</text>')
    keys = "".join(f'<p class="fit-k" style="{_map_pct(x0, 22)}">{t}</p>' for t, x0, _, _ in MAP_CLUSTERS)
    nodes = "".join(
        f'<a class="nd" data-id="{s}" href="projects/{s}.html" style="{_map_pct(x, y)};{_map_motion(s)}" aria-describedby="fit-note">'
        f'{art(s, alt=False)}<b>{P[s]["name"]}<span class="na" aria-hidden="true">→</span></b><small>{lines[s]}</small></a>'
        for s, (x, y, _) in MAP_NODES.items())
    vault = (f'<p class="vp" data-id="vault" style="{_map_pct(*MAP_VAULT[2:])};{_map_motion('vault')}">{VAULT_IC}'
             f'<span><b>{MAP_VAULT[0]}</b><small>{MAP_VAULT[1]}</small></span></p>')
    arrow = lambda i, c: (f'<marker id="{i}" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">'
                          f'<path d="M1 1.5L8.5 5L1 8.5" fill="none" stroke="{c}" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></marker>')
    return f'''<div class="fit" style="aspect-ratio:{MAP_W}/{MAP_H}">
  <svg class="wires" viewBox="0 0 {MAP_W} {MAP_H}" aria-hidden="true"><defs>{arrow("ah", "#55554f")}{arrow("ah-a", "#3d5e4a")}</defs>
    {clusters}
    {glow}
    {"".join(wires)}
    <g class="flows"></g>
    {"".join(labels)}
  </svg>
  {keys}
  {nodes}
  {vault}
</div>'''


def _map_mobile(lines):
    """Phone: the two clusters stacked; each project a full-width link with all its connections listed under it.
    LexiAI sits last in the first cluster and podcast-dig first in the second, so the bridge joins them."""
    order = [["lexispeak", "writing-station", "lexiai"], ["podcast-dig", "startup-research", "ai-terms"]]
    name = lambda k: MAP_VAULT[0] if k == "vault" else P[k]["name"]

    def links(s):
        out = []
        for a, b, lab, _, kind in MAP_EDGES:
            if s not in (a, b):
                continue
            other = b if a == s else a
            mark = "⇄" if kind == "br" else "→" if a == s else "←"
            lb = f'<span class="lb">{lab}</span>' if lab else ""
            out.append(f'<li{" class=\"br\"" if kind == "br" else ""}><span class="to">{mark} {name(other)}</span>{lb}</li>')
        return f'<ul class="fm-e" aria-label="Connections">{"".join(out)}</ul>'

    out = []
    for ci, slugs in enumerate(order):
        rows = "".join(
            f'<li class="fm-n"><a href="projects/{s}.html">{art(s, alt=False, uid="-fm")}'
            f'<span><b>{P[s]["name"]}<span class="na" aria-hidden="true">→</span></b><small>{lines[s]}</small></span></a>{links(s)}</li>'
            for s in slugs)
        out.append(f'<section class="fm-c"><p class="fm-k">{MAP_CLUSTERS[ci][0]}</p><ol>{rows}</ol></section>')
        if ci == 0:
            a, b, lab, _, _ = next(e for e in MAP_EDGES if e[4] == "br")
            out.append(f'<p class="fm-br" aria-hidden="true"><span>{name(b)} ⇄ {name(a)}<b>{lab}</b></span></p>')
    return f'<div class="fm">{"".join(out)}</div>'


def map_section():
    lines = {s: line for _c, s, line in CATALOG}
    notes = {s: n for s, (_x, _y, n) in MAP_NODES.items()}
    rest = "Hover or tab to a project to see how it connects. Click to open it."
    return f'''<section class="plate fits hl-sec" id="work">
  {ph("01", "Things I've built", f"{len(MAP_NODES)} projects", icon="built")}
  {blurb("fit-in", "My two priorities right now are diving deep into startups and strengthening my English. They’re not separate pursuits—they reinforce each other.", highlight=False)}
  <p class="dl-loop-row"><button type="button" class="dl-btn dl-ghost" id="dl-loop">Follow one word through the loop</button></p>
  {_map_desktop(lines)}
  {_map_mobile(lines)}
  <p class="fit-note" id="fit-note" aria-live="polite" data-rest="{rest}">{rest}</p>
  <script type="application/json" id="fit-notes">{json.dumps(notes, ensure_ascii=False)}</script>
</section>'''


# R72 (v5 redesign): the homepage is one screen — a greeting, a menu of four, and one big drawing of Janet at her desk.
# Hovering a menu item lights the matching part of the drawing (data-o). The old sections moved to work.html,
# research.html and about.html; old #work / #research / #about links are forwarded by OLD_HASH.
INTRO_ON = """<script>(function(h){try{if(matchMedia("(prefers-reduced-motion: reduce)").matches||sessionStorage.getItem("jm-intro"))return;sessionStorage.setItem("jm-intro","1")}catch(e){return}h.classList.add("intro");setTimeout(function(){if(!window.V5)h.classList.remove("intro")},4000)})(document.documentElement)</script>"""
OLD_HASH = """<script>(function(h){var m={"#work":"work.html","#research":"research.html","#research-startups":"research.html#research-startups","#research-ai-terms":"research.html#research-ai-terms","#about":"about.html","#contact":"about.html#contact"};if(m[h])location.replace(m[h])})(location.hash)</script>"""
HOME_MENU = [  # (href, data-o, label, one line, what she says in the drawing)
    ("work.html", "work", "Things I've built", "Six tools that work as one system", "Six tools, one system!"),
    ("research.html", "research", "Research", "Startup teardowns and AI term films", "I take startups apart."),
    ("about.html", "about", "About me", "Why I build what I use every day", "Hi, that’s me!"),
    ("about.html#contact", "contact", "Contact", "Email, X and GitHub", "Say hi, I reply!"),
]
LAPTOP_WORDS = [  # the laptop in the drawing looks these up, one after another (assets/home5.js)
    ("lifelong", "/ˈlaɪf.lɒŋ/ · adjective"), ("woven", "/ˈwəʊ.vən/ · adjective"), ("appall", "/əˈpɔːl/ · verb"),
    ("clip", "/klɪp/ · noun, sense iii"), ("bludgeon", "/ˈblʌdʒ.ən/ · verb"),
]
HERO_STORY = [  # the old hero's words, now the About page
    "I like cool, fancy things.",
    "But I'd rather make something I use every day.",
    "As a former VC and startup core member, I'm always diving into startups.",
    'I build these projects for <span class="dl-w" tabindex="0">lifelong<span class="dl-def" role="tooltip"><b>lifelong</b><i>adjective</i>lasting or continuing through the whole of your life</span></span> learning.',
    "None of them stands alone.",
    'They connect as one system, <span class="dl-w" tabindex="0">woven<span class="dl-def" role="tooltip"><b>woven</b><i>past participle of weave</i>closely joined into something, like threads in cloth</span></span> into how I learn.',
]


def desk(uid="", crop=None, cls="desk"):
    """The drawing. uid keeps ids unique when it appears twice; crop = a viewBox to show one corner of it."""
    svg = DESK_SVG.replace('href="ASSET/', 'href="assets/')
    if uid:
        svg = (svg.replace('id="', f'id="{uid}-').replace('url(#', f'url(#{uid}-').replace('aria-labelledby="', f'aria-labelledby="{uid}-'))
    if crop:
        svg = svg.replace('viewBox="0 0 720 680"', f'viewBox="{crop}"', 1)
    return svg.replace('class="desk"', f'class="{cls}"', 1)


def strip_ph(html):
    """Drop a section's old heading strip; on the v5 pages the page title names it."""
    return re.sub(r'<div class="ph">.*?</div>', "", html, count=1, flags=re.S)


def page5(slug, title, desc, h1, lead, body, crop, scripts=""):
    return f"""{head(f"{title} — Janet Mao", desc, "")}
<body class="v5 sub5 p-{slug}" data-root="">
<div class="page">
{nav("", slug)}
<main>
<header class="p5-head">
  <div class="p5-t"><h1>{h1}</h1><p class="p5-lead">{lead}</p></div>
  <div class="p5-art" aria-hidden="true">{desk(slug, crop, "desk crop")}</div>
</header>
{body}
</main>
{foot("")}""".replace("</body>", f"{scripts}\n<script src=\"assets/v5.js\"></script>\n</body>")


def index_page():
    menu = "".join(f'<li><a href="{h}" data-o="{o}" data-say="{say}"><span class="m5-l">{l}</span><span class="m5-d">{d}</span></a></li>' for h, o, l, d, say in HOME_MENU)
    words = json.dumps(LAPTOP_WORDS, ensure_ascii=False)
    return f"""{head("Janet Mao — AI builder", "Janet Mao is an AI builder in San Francisco. She builds tools for learning English, her second language. She also researches startups and makes AI Term Explainer, plain-language films about AI terms.", "")}
<body class="v5 home5" data-root="">
<main class="h5">
  <div class="h5-t">
    <h1>Hi! I'm Janet</h1>
    <p class="h5-sub">I build tools for learning English with AI, and I dive deep into startups.</p>
    <nav class="h5-menu" aria-label="Sections"><ul>{menu}</ul></nav>
    <p class="h5-links"><a href="{X}">X @BuiltByJanet</a><a href="{GITHUB}">GitHub</a>{EMAIL}</p>
  </div>
  <figure class="h5-art">{desk()}</figure>
</main>
<script type="application/json" id="laptop-words">{words}</script>
<script src="assets/v5.js"></script>
</body>
</html>
""".replace("</head>", OLD_HASH + "\n" + INTRO_ON + "\n</head>")


def work_page():
    body = strip_ph(map_section()).replace('<section class="plate fits hl-sec" id="work">', '<section class="s5 fits" id="work">')
    body = body.replace(blurb("fit-in", "My two priorities right now are diving deep into startups and strengthening my English. They’re not separate pursuits—they reinforce each other.", highlight=False), "")
    return page5("work", "Things I've built", "Six tools Janet Mao built for learning English with AI and for researching startups, and how they connect as one system.",
                 "Things I've built", "My two priorities right now are diving deep into startups and strengthening my English. They’re not separate pursuits—they reinforce each other.",
                 body, "48 82 252 188", '\n<script src="assets/map.js"></script>\n<script src="assets/delight.js"></script>')


def research_page():
    body = strip_ph(research_section()).replace('<section class="plate rs" id="research">', '<section class="s5 rs" id="research">')
    body = body.replace(blurb("rs-what", "Startups I've researched, and AI terms I've explained on film.", highlight=False), "")
    return page5("research", "Research", "Startups Janet Mao has researched, and AI terms she has explained on film.",
                 "Research", "Startups I've researched, and AI terms I've explained on film.", body, "40 330 168 104")


def about_page():
    story = "".join(f"<p>{t}</p>" for t in HERO_STORY)
    body = f"""<section class="s5 ab" id="about">
  <h2>Hi! I'm Janet</h2>
  <div class="ab-t">
    <p class="ab-id">I build tools for learning English with AI, and I dive deep into startups.</p>
    {story}
    <p class="ab-cta"><a class="b5" href="work.html">See what I built <span aria-hidden="true">→</span></a></p>
  </div>
</section>"""
    return page5("about", "About", "Janet Mao is an AI builder in San Francisco and a former VC. She builds tools for learning English with AI, and dives deep into startups.",
                 "About me", "An AI builder in San Francisco, a former VC, and a lifelong learner of English.", body, "160 168 440 440")


if __name__ == "__main__":
    (OUT / "projects").mkdir(exist_ok=True)
    (OUT / "index.html").write_text(index_page())
    for name, page in {"work": work_page, "research": research_page, "about": about_page}.items():
        (OUT / f"{name}.html").write_text(page())
    for s in ORDER:
        page ={"startup-research": startup_page, "ai-terms": ai_terms_page, "lexiai": lexiai_page, "lexispeak": lexispeak_page, "writing-station": writing_station_page, "podcast-dig": podcast_dig_page}.get(s)
        (OUT / "projects" / f"{s}.html").write_text(page() if page else project_page(s))
    extra = {"research": research_redirect, "research-granola": research_granola_page, "research-clay": research_clay_page,
             "research-startups": research_startups_collection_page,
             "research-aiterm": research_aiterm_collection_page,
             **{f"research-aiterm-{s}": (lambda s=s: research_aiterm_episode_redirect(s)) for s, *_ in AITERM_FILMS}}
    for s, page in extra.items():
        (OUT / "projects" / f"{s}.html").write_text(page())
    for old, new in REDIRECTS.items():
        (OUT / "projects" / f"{old}.html").write_text(redirect_page(new))
    print("built index.html +", ", ".join(f"projects/{s}.html" for s in [*ORDER, *extra]), "+ redirects", ", ".join(f"{o} -> {n}" for o, n in REDIRECTS.items()))
