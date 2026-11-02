#!/bin/zsh
# Revision 8 result screenshots -> ~/Desktop/portfolio-v4/shots-r8 (portfolio served on :5197)
cd "${0:A:h}"; O=../../shots-r8; U=http://127.0.0.1:5197
S=$U/projects/startup-research.html
at0="const s=document.querySelectorAll('.story-text .step')[0]; scrollTo({top: s.offsetTop + s.offsetHeight/2 - innerHeight/2, behavior: 'instant'}); await wait(1400);"
SETTLE=2500 node shot.mjs $S $O/startup-framework-1440.jpg "$at0
---
document.querySelectorAll('.stage .fw-cell')[3].dispatchEvent(new MouseEvent('mouseenter')); await wait(600); const st=document.querySelector('.stage').getBoundingClientRect(), f=document.querySelector('.stage .fw').getBoundingClientRect(), e=document.querySelector('.stage .fw-ex'); return 'stage ' + Math.round(st.top) + '-' + Math.round(st.bottom) + ' fw ' + Math.round(f.top) + '-' + Math.round(f.bottom) + ' ex scroll ' + e.scrollHeight + '/' + e.clientHeight;" "" 1 1440,900
SETTLE=2500 node shot.mjs $S $O/startup-mobile-390-competition.jpg "const c=document.querySelectorAll('.step-ui .fw-cell')[3]; c.click(); await wait(500); const e=document.querySelector('.step-ui .fw-ex'); scrollTo({top: e.getBoundingClientRect().top + scrollY - 160, behavior: 'instant'}); await wait(1200);" "" 2 390,844
SETTLE=2500 node shot.mjs $U/index.html $O/index-journey-writing-1440.jpg "const s=document.querySelectorAll('.story-text .step')[2]; scrollTo({top: s.offsetTop + s.offsetHeight/2 - innerHeight/2, behavior: 'instant'}); await wait(1500);" "" 1 1440,900
SETTLE=2500 node shot.mjs $U/projects/writing-station.html $O/writing-station-note-1440.jpg "const s=document.querySelectorAll('.story-text .step')[2]; scrollTo({top: s.offsetTop + s.offsetHeight/2 - innerHeight/2, behavior: 'instant'}); await wait(1500);" "" 1 1440,900
