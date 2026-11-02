#!/bin/zsh
# Revision 7 result screenshots -> ~/Desktop/portfolio-v4/shots-r7 (portfolio served on :5197)
cd "${0:A:h}"; O=../../shots-r7; U=http://127.0.0.1:5197
at() { echo "const s=document.querySelectorAll('.story-text .step')[$1]; scrollTo({top: s.offsetTop + s.offsetHeight/2 - innerHeight/2, behavior: 'instant'}); await wait(1400); return document.querySelector('.pane.on .cap h3, .pane.on .fw-k')?.textContent"; }
S=$U/projects/startup-research.html
SETTLE=2500 node shot.mjs $S $O/startup-fold-1440.jpg "" "" 1 1440,900
SETTLE=2500 node shot.mjs $S $O/startup-framework-1440.jpg "$(at 0)
---
document.querySelectorAll('.stage .fw-cell')[3].dispatchEvent(new MouseEvent('mouseenter')); await wait(600);" "" 1 1440,900
SETTLE=2500 node shot.mjs $S $O/startup-writing-1440.jpg "$(at 1)" "" 1 1440,900
SETTLE=2500 node shot.mjs $S $O/startup-twopager-1440.jpg "$(at 2)" "" 1 1440,900
SETTLE=2500 node shot.mjs $S $O/startup-twopager-p2-1440.jpg "$(at 3)" "" 1 1440,900
SETTLE=2500 node shot.mjs $S $O/startup-connected-1440.jpg "scrollTo({top: document.querySelector('.conn').offsetTop - 60, behavior: 'instant'}); await wait(1200);" "" 1 1440,900
SETTLE=2500 node shot.mjs $U/index.html $O/index-projects-1440.jpg "scrollTo({top: document.querySelector('.after-journey').offsetTop - 80, behavior: 'instant'}); await wait(1500);" "" 1 1440,1400
SETTLE=2500 node shot.mjs $U/projects/builder-toolkit.html $O/builder-toolkit-connected-1440.jpg "scrollTo({top: document.querySelector('.conn').offsetTop - 60, behavior: 'instant'}); await wait(1200);" "" 1 1440,900
SETTLE=2500 node shot.mjs $S $O/startup-mobile-390.jpg "" "" 2 390,844
SETTLE=2500 node shot.mjs $S $O/startup-mobile-390-writing.jpg "const s=document.querySelectorAll('.story-text .step')[1]; scrollTo({top: s.offsetTop + 300, behavior: 'instant'}); await wait(1500);" "" 2 390,844
