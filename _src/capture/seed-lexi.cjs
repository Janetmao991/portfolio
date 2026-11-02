// Builds a LexiAI guest notebook (lexiai_words_v1) from the frozen real entries in assets/data.js.
global.window = {}; require('../../assets/data.js'); const D = window.DATA;
const today = new Date(); const iso = d => d.toISOString().slice(0, 10);
const day = n => iso(new Date(today.getTime() + n * 864e5));
const out = {}; let t = Date.now();
const add = (w, i) => { out[w.word] = { ...w, timestamp: t - i * 36e5 * 7, syncStatus: 'synced', lastModified: new Date(t - i * 36e5).toISOString() }; };
D.lexi.forEach((w, i) => add({
  word: w.word, ipa: w.ipa, variants: w.variants || [],
  meanings: w.meanings.map(m => ({ partOfSpeech: m.pos, definitions: m.defs.map(d => ({ definition: d.def, synonyms: d.syn || [], examples: d.ex || [], collocations: d.col || [] })) })),
  srs: { interval: i === 1 ? 0 : 6, ease: 2.5, due: i === 1 ? day(-1) : day(3), reps: i === 1 ? 1 : 3, lapses: i === 1 ? 2 : 0 },
  mastery: i === 0 ? { bestPracticeScore: 88, speakingPassed: true } : i === 2 ? { bestPracticeScore: 80 } : {},
}, i === 1 ? 0 : i + 1));
D.muse.words.forEach((w, i) => add({
  word: w.word, ipa: w.ipa, variants: [],
  meanings: [{ partOfSpeech: w.pos, definitions: [{ definition: w.definition, synonyms: [], examples: [w.ex], collocations: [] }] }],
  srs: { interval: w.interval, ease: w.ease, due: day(i === 1 ? -1 : 3), reps: 2, lapses: 1 },
}, i + 4));
process.stdout.write(JSON.stringify({ lexiai_words_v1: JSON.stringify(out) }));
