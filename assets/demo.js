/* R64: guided demos on the LexiAI, LexiSpeak and Writing Station pages (markup: demo_html in _src/build.py).
   Each step shows one real crop; a soft cursor glides to its button, "presses" it, and the step holds ~2s.
   - Starts once, the first time 40% of the demo is in view. Pauses off screen (below 15%) and resumes when back.
   - Pause/Play and Replay. Tapping a step, or the lit button in the picture, hands control to the visitor.
   - prefers-reduced-motion: no autoplay; "Play demo" runs it with no glides or fades.
   R65: sound. A demo with clips (data-audio frames) still starts muted on scroll, since browsers block autoplay with sound.
   "Sound on" (or Play / Replay, both user gestures) turns it on: the clip plays with its step and the step holds until it
   ends. Muted audio steps show "Tap for sound". The choice lasts for the session; clips don't load until sound is on. */
(() => {
  const RM = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const SOUND_KEY = 'demo-sound';  // sessionStorage: '1' on, '0' turned off by the visitor, unset = never chosen
  const stored = () => { try { return sessionStorage.getItem(SOUND_KEY); } catch { return null; } };
  const store = v => { try { sessionStorage.setItem(SOUND_KEY, v); } catch {} };
  document.querySelectorAll('[data-demo]').forEach(setup);

  function setup(root) {
    const stage = root.querySelector('.dm-stage');
    const frames = [...root.querySelectorAll('.dm-frame')];
    const chips = [...root.querySelectorAll('.dm-step')];
    const caps = [...root.querySelectorAll('.dm-caps p[aria-hidden]')].map(p => p.textContent);
    const cap = root.querySelector('.dm-cap');
    const cursor = root.querySelector('.dm-cursor');
    const typed = root.querySelector('.dm-typed');
    const send = root.querySelector('.dm-send');
    const ctrl = root.querySelector('.dm-ctrl');
    const playBtn = ctrl.querySelector('[data-act=play]');
    const replayBtn = ctrl.querySelector('[data-act=replay]');
    const soundBtn = ctrl.querySelector('[data-act=sound]');
    const hint = root.querySelector('.dm-hint');
    const clips = Object.fromEntries([...root.querySelectorAll('audio[data-clip]')].map(a => [a.dataset.clip, a]));
    const ctx = root.querySelector('.dm-ctx');
    const ctxJson = ctx && ctx.querySelector('[data-ctx-data]');
    const ctxData = ctxJson ? JSON.parse(ctxJson.textContent) : null;
    let ctxWord = '';      // word currently shown on the sentence card
    let ctxByUser = false; // visitor chose the word; auto must not overwrite it mid-step
    let sound = false;     // sound is on for this demo
    let clip = null;       // the clip playing now
    ctrl.hidden = false;

    let run = 0;           // id of the auto run in progress; bumping it cancels that run
    let active = false;    // an auto run is in progress (playing or paused)
    let playing = false;   // the visitor hasn't paused it
    let visible = false, started = false, cur = 0;

    // the demo clock: time only passes while playing and in view (rAF also stops in a background tab)
    const wait = (ms, id) => new Promise(res => {
      let left = RM ? Math.min(ms, 1600) : ms, last = performance.now();
      const tick = now => {
        if (id !== run) return res(false);
        if (playing && visible) left -= now - last;
        last = now;
        left <= 0 ? res(true) : requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    });

    // fit each crop inside the stage, keeping its shape
    function fit() {
      const W = stage.clientWidth * 0.92, H = stage.clientHeight * 0.88;
      for (const pic of root.querySelectorAll('.dm-pic')) {
        const w = +pic.dataset.w, h = +pic.dataset.h, s = Math.min(W / w, H / h);
        pic.style.width = `${w * s}px`;
        pic.style.height = `${h * s}px`;
      }
      if (cursor.classList.contains('on')) point(cursor._at, true);
    }
    new ResizeObserver(fit).observe(stage);
    fit();

    const hit = i => frames[i].querySelector('.dm-hit')
      || (ctx && frames[i].dataset.ctx && ctx.querySelector('.dm-ctx-w[data-word="' + frames[i].dataset.ctx + '"]'));

    const ctxLabel = (word, byUser) => {
      if (byUser || (ctxData && word !== ctxData.auto)) return 'Not the word you meant? Tap another.';
      return 'LexiAI spots the likely unfamiliar word';
    };
    function setCtxWord(word, byUser) {
      if (!ctx || !ctxData || !ctxData.words[word]) return;
      ctxWord = word;
      ctxByUser = byUser;
      ctx.querySelectorAll('.dm-ctx-w').forEach(b => {
        const on = b.dataset.word === word;
        if (on) b.setAttribute('aria-current', 'true'); else b.removeAttribute('aria-current');
      });
      const entry = ctxData.words[word];
      const label = ctx.querySelector('[data-ctx-label]');
      const wEl = ctx.querySelector('[data-ctx-word]');
      const meaning = ctx.querySelector('[data-ctx-meaning]');
      const usual = ctx.querySelector('[data-ctx-usual]');
      const here = ctx.querySelector('[data-ctx-here]');
      if (label) label.textContent = ctxLabel(word, byUser);
      if (wEl) wEl.textContent = word;
      if (meaning) meaning.textContent = entry.meaning;
      if (usual) usual.textContent = entry.usual;
      if (here) here.textContent = entry.meaning;
    }
    function showCtx(word, byUser, force) {
      if (!ctx) return;
      if (!word) { ctx.hidden = true; return; }
      ctx.hidden = false;
      // A visitor pick is kept until they pick again, change step by hand, or the auto run starts a new step after they resume.
      if (ctxByUser && !force && !byUser && ctxWord) return;
      setCtxWord(word, byUser);
    }
    // the cursor fades in low in the middle of the stage, then glides
    function appear() {
      if (cursor.classList.contains('on')) return;
      cursor.style.transition = 'none';
      cursor.style.transform = `translate(${stage.clientWidth / 2}px, ${stage.clientHeight * 0.86}px)`;
      cursor.offsetWidth; cursor.style.transition = '';
      cursor.classList.add('on');
    }
    function point(el, instant) {
      if (!el) return;
      cursor._at = el;
      const s = stage.getBoundingClientRect(), r = el.getBoundingClientRect();
      // a button is pointed at its middle; a passage just past its lower right corner, so the cursor never covers the words
      const corner = el.classList.contains('dm-hit') && !('press' in el.closest('.dm-frame').dataset);
      const x = r.left - s.left + (corner ? r.width - 6 : r.width / 2), y = r.top - s.top + (corner ? r.height + 8 : r.height / 2);
      if (instant) cursor.style.transition = 'none';
      cursor.style.transform = `translate(${x}px, ${y}px)`;
      if (instant) { cursor.offsetWidth; cursor.style.transition = ''; }
    }

    function show(i, lit, opts = {}) {
      cur = i;
      stage.classList.remove('typing');
      frames.forEach((f, k) => {
        f.classList.toggle('on', k === i);
        const b = hit(k);
        if (!b) return;
        b.classList.toggle('lit', k === i && lit && b.classList.contains('dm-hit'));
        b.tabIndex = k === i && i < frames.length - 1 && b.classList.contains('dm-hit') ? 0 : -1;
      });
      chips.forEach((c, k) => k === i ? c.setAttribute('aria-current', 'step') : c.removeAttribute('aria-current'));
      cap.textContent = caps[i];
      const w = frames[i].dataset.ctx || '';
      if (w) {
        // On an auto "press" step the word changes only after the cursor clicks, so the switch is visible.
        const waitForPress = active && playing && !opts.forceCtx && !opts.applyWord && ('press' in frames[i].dataset);
        if (waitForPress) {
          ctx.hidden = false;
          if (!ctxWord && ctxData) setCtxWord(ctxData.auto, false);
        } else {
          showCtx(w, false, !!opts.forceCtx);
        }
      } else {
        showCtx('', false, true);
      }
      if (clip && clip !== clipOf(i)) stopClip();
      syncSound();
    }

    const clipOf = i => clips[frames[i].dataset.audio] || null;
    // the clip follows the demo: it pauses with Pause, off screen and in a background tab, and carries on after
    const go = () => (active ? playing : true) && visible && !document.hidden;
    function follow() {
      const a = clip;
      if (!a) return;
      if (a.ended) { clip = null; return; }
      if (go() && a.paused) a.play().catch(blocked);
      else if (!go() && !a.paused) a.pause();
      requestAnimationFrame(follow);
    }
    // the browser said no (sound remembered from an earlier page, but no tap on this one yet): back to muted, nothing stored
    function blocked() { stopClip(); setSound(false, false); }
    function startClip(i) {
      const a = clipOf(i);
      if (!a || !sound) return;
      stopClip();
      clip = a;
      a.muted = false;
      a.currentTime = 0;
      if (go()) a.play().catch(blocked);  // called inside the tap where there is one, which Safari needs
      requestAnimationFrame(follow);
    }
    function stopClip() { if (clip) { clip.pause(); clip = null; } }
    function setSound(on, remember = true) {
      if (!soundBtn || sound === on) return;
      sound = on;
      if (remember) store(on ? '1' : '0');
      if (!on) stopClip();
      for (const a of Object.values(clips)) {
        if (on && a.preload === 'none') { a.preload = 'auto'; a.load(); }
        // inside a tap, start and stop each clip once, silently: Safari then lets it play later in the run without a tap
        if (on && remember) { a.muted = true; a.play().then(() => { if (clip !== a) a.pause(); a.muted = false; }, () => { a.muted = false; }); }
      }
      syncSound();
    }
    function syncSound() {
      if (!soundBtn) return;
      soundBtn.textContent = sound ? '🔇 Mute' : '🔊 Sound on';
      soundBtn.setAttribute('aria-pressed', String(sound));
      hint.hidden = sound || !clipOf(cur);
    }
    // Play / Replay are taps too, so they turn sound on, unless the visitor switched it off themselves
    const gesture = () => { if (stored() !== '0') setSound(true); };
    document.addEventListener('visibilitychange', () => { if (document.hidden && clip) clip.pause(); });

    // a step's hold: ms on the demo clock, and never before this step's clip has finished (then a short beat after it)
    const hold = (i, ms, id) => new Promise(res => {
      let left = RM ? Math.min(ms, 1600) : ms, last = performance.now(), heard = false;
      const tick = now => {
        if (id !== run) return res(false);
        if (playing && visible) left -= now - last;
        last = now;
        const listening = clip && clip === clipOf(i);
        if (listening) heard = true;
        else if (heard) { heard = false; left = Math.max(left, 900); }
        left <= 0 && !listening ? res(true) : requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    });

    function sync() {
      playBtn.textContent = active ? (playing ? 'Pause' : 'Play') : 'Play demo';
      playBtn.setAttribute('aria-pressed', active && !playing ? 'true' : 'false');
      cap.setAttribute('aria-live', active && playing ? 'off' : 'polite');
    }

    function press(el) {
      cursor.classList.remove('down'); cursor.offsetWidth; cursor.classList.add('down');
      if (el) el.classList.add('lit');
      setTimeout(() => cursor.classList.remove('down'), 600);
    }

    async function typeIn(f, id) {
      typed.textContent = '';
      send.textContent = f.dataset.btn;
      send.classList.remove('down');
      stage.classList.add('typing');
      appear();
      point(send);  // the cursor waits on the button while the text types in
      if (!await wait(700, id)) return false;
      for (const ch of f.dataset.type) {
        typed.textContent += ch;
        if (!await wait(RM ? 0 : 34, id)) return false;
      }
      if (!await wait(700, id)) return false;
      press(); send.classList.add('down');
      return wait(450, id);
    }

    async function auto(from) {
      const id = ++run;
      active = playing = started = true;
      ctxByUser = false;
      ctxWord = '';
      sync();
      for (let i = from; i < frames.length; i++) {
        const f = frames[i];
        if (f.dataset.type && !await typeIn(f, id)) return;
        show(i, false);
        if (!await wait(650, id)) return;
        appear();
        point(hit(i));
        if (!await wait(1000, id)) return;
        if ('press' in f.dataset) {
          press(hit(i));
          if (f.dataset.ctx) setCtxWord(f.dataset.ctx, true); // simulated visitor tap, not a LexiAI pick
          if (!await wait(400, id)) return;
        } else if (hit(i) && hit(i).classList.contains('dm-hit')) {
          hit(i).classList.add('lit');
        }
        startClip(i);
        if (!await hold(i, i === frames.length - 1 ? 2600 : 2000, id)) return;
      }
      active = playing = false;
      cursor.classList.remove('on');
      sync();
    }

    // the visitor takes over: the auto run stops where it is
    function manual(i, picked) {
      run++;
      active = playing = false;
      started = true;
      cursor.classList.remove('on');
      if (picked && ctxData && ctxData.words[picked]) {
        // Keep the current context step (or move to the matching one) and do not let a later auto tick overwrite this pick.
        let at = i;
        const match = frames.findIndex(f => f.dataset.ctx === picked);
        if (match >= 0) at = match;
        else if (!frames[i] || !frames[i].dataset.ctx) {
          const any = frames.findIndex(f => f.dataset.ctx);
          if (any >= 0) at = any;
        }
        ctxByUser = false; // allow show to switch the frame, then we set the pick
        show(at, true, { forceCtx: true });
        setCtxWord(picked, true);
      } else {
        ctxByUser = false;
        show(i, true, { forceCtx: true });
      }
      sync();
      startClip(cur);  // looking around by hand: an audio step still plays its clip when sound is on
    }

    chips.forEach((c, i) => c.addEventListener('click', () => manual(i)));
    frames.forEach((f, i) => {
      const b = hit(i);
      if (b && b.classList.contains('dm-hit')) b.addEventListener('click', () => manual(Math.min(i + 1, frames.length - 1)));
    });
    if (ctx) {
      ctx.querySelectorAll('.dm-ctx-w').forEach(b => {
        b.addEventListener('click', () => {
          if (!ctxData.words[b.dataset.word]) return;
          manual(cur, b.dataset.word);
        });
      });
    }
    replayBtn.addEventListener('click', () => { gesture(); auto(0); });
    playBtn.addEventListener('click', () => {
      if (active) { playing = !playing; if (playing) gesture(); sync(); }
      else { gesture(); auto(cur < frames.length - 1 && started ? cur : 0); }
    });
    // sound on (button or hint) on an audio step plays its clip at once; a running step then holds until it ends
    function soundOn() {
      setSound(true);
      if (active && !playing) { playing = true; sync(); }
      if (clipOf(cur) && !clip) startClip(cur);
    }
    if (soundBtn) {
      soundBtn.addEventListener('click', () => sound ? setSound(false) : soundOn());
      hint.addEventListener('click', soundOn);
      if (stored() === '1') setSound(true, false);  // remembered for the session; if the browser still blocks it, blocked() mutes again
    }

    new IntersectionObserver(([e]) => {
      const r = e.isIntersecting ? e.intersectionRatio : 0;
      visible = r >= 0.4 || (visible && r >= 0.15);
      if (visible && !started && !RM) auto(0);
    }, { threshold: [0, 0.15, 0.4] }).observe(root);
    sync();
  }
})();

/* R66: a recorded run (LexiSpeak; markup: video_demo_html in _src/build.py). R67: picture only, the file has no sound.
   - Plays muted the first time 40% of it is in view, never loops.
     Pauses when it leaves the screen (below 15%) and picks up again when back, unless the visitor paused it.
   - Play/Pause and Replay. No Sound on button, and it never reads or writes the demos' shared sound choice
     (sessionStorage 'demo-sound'), so the LexiAI demo's Sound on keeps working on its own.
   - prefers-reduced-motion: no autoplay; the big Play button waits on the poster. */
(() => {
  const RM = matchMedia('(prefers-reduced-motion: reduce)').matches;
  document.querySelectorAll('[data-demo-video]').forEach(root => {
    const v = root.querySelector('video');
    const ctrl = root.querySelector('.dm-ctrl');
    const big = root.querySelector('.dm-big');
    const playBtn = ctrl.querySelector('[data-act=play]');
    const replayBtn = ctrl.querySelector('[data-act=replay]');
    let started = false, held = false, visible = false;  // held = paused by scrolling away, not by the visitor
    const soundBtn = ctrl.querySelector('[data-act=sound]');  // R69: only the narrated LexiAI video has sound
    if (soundBtn) soundBtn.addEventListener('click', () => {
      v.muted = !v.muted;
      soundBtn.setAttribute('aria-pressed', String(!v.muted));
      soundBtn.textContent = v.muted ? '🔊 Sound on' : '🔇 Sound off';
      if (!v.muted && (v.paused || v.ended)) { if (v.ended) v.currentTime = 0; go(); }
    });
    ctrl.hidden = false;
    v.controls = false;  // native controls are only the no-JS fallback
    v.muted = true;
    big.hidden = !RM;

    const label = () => {
      playBtn.textContent = v.paused ? 'Play' : 'Pause';
      big.textContent = v.ended ? '↻ Replay' : '▶ Play';
      big.hidden = !v.paused || (!RM && !v.ended && !started);
    };
    ['play', 'pause', 'ended'].forEach(e => v.addEventListener(e, label));
    const go = () => { started = true; held = false; return v.play().catch(() => {}); };

    const toggle = () => {
      if (v.paused || v.ended) { if (v.ended) v.currentTime = 0; go(); }
      else { v.pause(); held = false; }
    };
    playBtn.addEventListener('click', toggle);
    big.addEventListener('click', toggle);
    v.addEventListener('click', toggle);
    replayBtn.addEventListener('click', () => { v.currentTime = 0; go(); });

    new IntersectionObserver(([e]) => {
      visible = e.intersectionRatio >= 0.15;
      if (!started && !RM && e.intersectionRatio >= 0.4) go();
      else if (!visible && !v.paused) { v.pause(); held = true; }
      else if (e.intersectionRatio >= 0.4 && held) go();
    }, { threshold: [0, 0.15, 0.4] }).observe(root);
    document.addEventListener('visibilitychange', () => {
      if (document.hidden && !v.paused) { v.pause(); held = true; }
      else if (!document.hidden && held && visible) go();
    });
    label();
  });
})();
