#!/bin/zsh
# Revision 9 result screenshots -> ~/Desktop/portfolio-v4/shots-r9 (portfolio served on :5197)
cd "${0:A:h}"; O=../../shots-r9; U=http://127.0.0.1:5197; mkdir -p $O
at() { echo "const s=document.querySelectorAll('.story-text .step')[$1]; scrollTo({top: s.offsetTop + s.offsetHeight/2 - innerHeight/2, behavior: 'instant'}); await wait(1500);"; }
SETTLE=2500 node shot.mjs $U/projects/lexiai.html $O/lexiai-notebook-1440.jpg "$(at 3)" "" 1 1440,900
SETTLE=2500 node shot.mjs $U/projects/muse.html $O/muse-why-1440.jpg "$(at 0)" "" 1 1440,900
SETTLE=2500 node shot.mjs $U/projects/muse.html $O/muse-shared-due-dates-1440.jpg "$(at 4)" "" 1 1440,900
SETTLE=2500 node shot.mjs $U/projects/writing-station.html $O/writing-station-journal-1440.jpg "$(at 1)" "" 1 1440,900
SETTLE=2500 node shot.mjs $U/projects/writing-station.html $O/writing-station-ipad-1440.jpg "$(at 3)" "" 1 1440,900
SETTLE=2500 node shot.mjs $U/projects/lexiai.html $O/lexiai-mobile-390-notebook.jpg "const c=document.querySelectorAll('.step-ui')[4]; scrollTo({top: c.getBoundingClientRect().top + scrollY - 200, behavior: 'instant'}); await wait(1200);" "" 2 390,844
SETTLE=2500 node shot.mjs $U/index.html $O/index-footer-email-1440.jpg "scrollTo({top: document.body.scrollHeight, behavior: 'instant'}); await wait(1200);" "" 1 1440,900
