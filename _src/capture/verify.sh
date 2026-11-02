#!/bin/zsh
# Revision 6 result screenshots -> ~/Desktop/portfolio-v4/shots-r6 (portfolio served on :5197)
cd "${0:A:h}"; O=../../shots-r6; U=http://127.0.0.1:5197
at() { echo "const s=document.querySelectorAll('.story-text .step')[$1]; scrollTo({top: s.offsetTop + s.offsetHeight/2 - innerHeight/2, behavior: 'instant'}); await wait(1400); return document.querySelector('.pane.on .cap h3')?.textContent"; }
SETTLE=2500 node shot.mjs $U/index.html $O/index-fold-1440.jpg "" "" 1 1440,900
SETTLE=2500 node shot.mjs $U/index.html $O/index-journey-writing-1440.jpg "$(at 2)" "" 1 1440,900
SETTLE=2500 node shot.mjs $U/index.html $O/index-journey-podcast-1440.jpg "$(at 4)" "" 1 1440,900
SETTLE=2500 node shot.mjs $U/projects/lexiai.html $O/lexiai-fold-1440.jpg "" "" 1 1440,900
SETTLE=2500 node shot.mjs $U/projects/lexiai.html $O/lexiai-feature-1440.jpg "$(at 1)" "" 1 1440,900
SETTLE=2500 node shot.mjs $U/projects/writing-station.html $O/writing-station-feature-1440.jpg "$(at 2)" "" 1 1440,900
SETTLE=2500 node shot.mjs $U/index.html $O/index-mobile-390.jpg "" "" 2 390,844
SETTLE=2500 node shot.mjs $U/index.html $O/index-mobile-390-journey.jpg "const s=document.querySelectorAll('.story-text .step')[2]; scrollTo({top: s.offsetTop - 20, behavior: 'instant'}); await wait(1500);" "" 2 390,844
