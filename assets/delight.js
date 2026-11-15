// R68 delight pass: rotating phrase, follow-a-word loop, staggered entrances, magnetic contact icons.
(() => {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  // 1. rotating phrase in the hero
  const rot = document.querySelector('.dl-rot-w');
  if (rot && !reduce) {
    const phrases = ['learning English with AI', 'remembering every word I look up', 'speaking English out loud'];
    let i = 0;
    setInterval(() => {
      rot.animate([{ transform: 'none', opacity: 1 }, { transform: 'translateY(-100%)', opacity: 0 }], { duration: 260, easing: 'ease-in' }).onfinish = () => {
        i = (i + 1) % phrases.length; rot.textContent = phrases[i];
        rot.animate([{ transform: 'translateY(100%)', opacity: 0 }, { transform: 'none', opacity: 1 }], { duration: 380, easing: 'cubic-bezier(.16,1,.3,1)' });
      };
    }, 2800);
  }

  // 2. follow one word through the map
  const btn = document.getElementById('dl-loop');
  const fit = document.querySelector('.fit');
  const note = document.getElementById('fit-note');
  if (btn && fit) {
    const steps = [
      ['lexiai', 'Looked up “leverage” in LexiAI and saved it.'],
      ['lexispeak', 'Said it right in LexiSpeak, so LexiAI marks it “Can Speak”.'],
      ['lexiai', 'Back in the notebook, LexiAI suggests it for today’s journal.'],
      ['writing-station', 'Used it well in Writing Station, so it counts toward “Can Write”.'],
    ];
    let running = false;
    btn.addEventListener('click', async () => {
      if (running) return; running = true; btn.disabled = true;
      const chip = document.createElement('span'); chip.className = 'dl-chip'; chip.textContent = 'leverage';
      fit.appendChild(chip);
      for (const [id, text] of steps) {
        const n = fit.querySelector(`.nd[data-id="${id}"]`); if (!n) continue;
        chip.style.left = n.style.left; chip.style.top = `calc(${n.style.top} - 70px)`;
        n.dispatchEvent(new Event('mouseenter'));
        await new Promise(r => setTimeout(r, reduce ? 50 : 950));
        if (note) note.innerHTML = `<b>leverage</b>${text}`;
        await new Promise(r => setTimeout(r, reduce ? 1200 : 1500));
      }
      chip.style.opacity = '0';
      fit.querySelector('.nd[data-id="lexiai"]')?.dispatchEvent(new Event('mouseleave'));
      if (note) note.innerHTML = '<b>One word, full loop.</b>Looked up, spoken, written. Every step wrote back to the same notebook.';
      setTimeout(() => { chip.remove(); running = false; btn.disabled = false; }, 400);
    });
  }

  // 3. staggered entrances: heading, text, then picture
  if (!reduce && 'IntersectionObserver' in window) {
    const groups = document.querySelectorAll('.dl-films li, #research .rs-h, #contact > *');
    groups.forEach(el => el.classList.add('dl-pre'));
    const io = new IntersectionObserver(es => es.forEach(e => {
      if (!e.isIntersecting) return;
      const sibs = [...e.target.parentElement.children].filter(c => c.classList.contains('dl-pre'));
      const k = Math.max(0, sibs.indexOf(e.target));
      setTimeout(() => { e.target.classList.add('dl-in'); e.target.classList.remove('dl-pre'); }, k * 80);
      io.unobserve(e.target);
    }), { threshold: .15 });
    groups.forEach(el => io.observe(el));
  }

  // 4. magnetic contact icons
  if (!reduce && matchMedia('(hover: hover)').matches) {
    document.querySelectorAll('#contact .round a, .dl-btn').forEach(a => {
      a.addEventListener('mousemove', e => {
        const r = a.getBoundingClientRect();
        a.style.translate = `${(e.clientX - r.left - r.width / 2) * .25}px ${(e.clientY - r.top - r.height / 2) * .3}px`;
      });
      a.addEventListener('mouseleave', () => { a.style.translate = ''; });
    });
  }
})();

// 5. hero words: point at (or tap) a falling word to read what it means
(() => {
  const fx = document.querySelector('.fx'), hero = document.querySelector('.hero');
  if (!fx || !hero) return;
  const D = {
    'agents': ['noun', 'AI that takes steps on its own: it plans, uses tools, and checks its work.'],
    'RAG': ['retrieval-augmented generation', 'Look things up first, then answer. An open-book exam for AI.'],
    'tokens': ['noun', 'The small pieces of text a model reads and writes, often parts of words.'],
    'prompt': ['noun', 'The instructions and question you give a model.'],
    'evals': ['noun', 'Tests that check how well a model or an AI product really works.'],
    'transformer': ['noun', 'The model design behind today’s LLMs. It weighs how every word relates to every other.'],
    'embeddings': ['noun', 'Meaning turned into coordinates, so similar things sit close together.'],
    'fine-tuning': ['noun', 'Extra training that teaches an existing model a narrower job.'],
    'context window': ['noun', 'How much text a model can read in one go. Its exam desk.'],
    'LLM': ['large language model', 'A model trained on huge amounts of text to predict and write language.'],
    'MCP': ['Model Context Protocol', 'A standard plug that lets AI apps connect to tools and data.'],
    'GPU': ['noun', 'The chip that does the heavy maths for training and running models.'],
    'inference': ['noun', 'Running a trained model to get an answer, as opposed to training it.'],
    'attention': ['noun', 'How a transformer decides which words matter most for each word.'],
    'vectors': ['noun', 'Lists of numbers. Embeddings are stored as vectors.'],
    'skills': ['noun', 'Packaged instructions an AI agent can load for a specific task.'],
    'LoRA': ['low-rank adaptation', 'A cheap way to fine-tune: train a small add-on instead of the whole model.'],
  };
  const pop = document.createElement('div'); pop.className = 'dl-pop'; pop.setAttribute('role', 'tooltip'); hero.appendChild(pop);
  let held = null;
  const show = w => {
    const d = D[w.textContent.trim()]; if (!d) return;
    held?.classList.remove('dl-held'); held = w; w.classList.add('dl-held');
    pop.innerHTML = `<b>${w.textContent.trim()}</b><i>${d[0]}</i>${d[1]}`;
    const r = w.getBoundingClientRect(), h = hero.getBoundingClientRect();
    let x = r.left - h.left - 20, y = r.top - h.top - pop.offsetHeight - 12;
    x = Math.max(8, Math.min(x, h.width - 270)); if (y < 8) y = r.bottom - h.top + 12;
    pop.style.left = x + 'px'; pop.style.top = y + 'px'; pop.classList.add('on');
  };
  const hide = () => { pop.classList.remove('on'); held?.classList.remove('dl-held'); held = null; };
  fx.querySelectorAll('.wd').forEach(w => {
    w.setAttribute('tabindex', '0'); w.setAttribute('role', 'button');
    w.addEventListener('mouseenter', () => show(w)); w.addEventListener('focus', () => show(w));
    w.addEventListener('click', e => { e.stopPropagation(); held === w ? hide() : show(w); });
    w.addEventListener('mouseleave', hide); w.addEventListener('blur', hide);
  });
  document.addEventListener('click', hide);
})();

// 6. film cards: hovering flips through frames of that episode, like a flip book
(() => {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const frames = { 'ep-rag': ['rag/01.webp', 'rag/03.webp', 'rag/04.webp'], 'ep-vector-database': ['vector-database/01.webp', 'vector-database/03.webp', 'vector-database/04.webp'],
    'ep-embedding': ['embedding/01.webp', 'embedding/03.webp', 'embedding/04.webp'], 'ep-long-context': ['long-context/01.jpg', 'long-context/03.jpg'] };
  document.querySelectorAll('.dl-films a').forEach(a => {
    const key = a.getAttribute('href').split('#')[1], list = frames[key], box = a.querySelector('.dl-still');
    if (!list || !box) return;
    const imgs = list.map(src => { const i = document.createElement('img'); i.className = 'dl-f'; i.alt = ''; i.loading = 'lazy'; i.src = `assets/ai-terms/films/${src}`; box.insertBefore(i, box.querySelector('.dl-play')); return i; });
    let t = 0, k = -1;
    a.addEventListener('mouseenter', () => { t = setInterval(() => { imgs[k]?.classList.remove('on'); k = (k + 1) % (imgs.length + 1); imgs[k]?.classList.add('on'); }, 750); });
    a.addEventListener('mouseleave', () => { clearInterval(t); imgs.forEach(i => i.classList.remove('on')); k = -1; });
  });
})();
