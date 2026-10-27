/* CodeLab – logica pura: mescolamento e costruzione delle sessioni quiz */
(function () {
  'use strict';
  const CL = (globalThis.CL = globalThis.CL || {});

  function shuffle(arr, rng) {
    rng = rng || Math.random;
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      const t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  }

  // Restituisce le opzioni in ordine casuale e l'indice della risposta corretta
  function shuffleOptions(item, rng) {
    const order = shuffle(item.options.map((_, i) => i), rng);
    return {
      options: order.map((i) => item.options[i]),
      answer: order.indexOf(item.answer),
    };
  }

  /**
   * Costruisce una sessione di domande.
   * mode 'smart': prima le domande da ripassare (scadute), poi le nuove, poi le altre.
   * mode 'due'  : solo le domande da ripassare.
   */
  function buildSession(opts) {
    const quiz = opts.quiz;
    const progress = opts.progress || {};
    const now = opts.now || Date.now();
    const size = opts.size || 10;
    const rng = opts.rng || Math.random;
    const mode = opts.mode || 'smart';
    const pool = quiz.filter((q) => !opts.topic || opts.topic === 'all' || q.topic === opts.topic);

    const due = [];
    const fresh = [];
    const rest = [];
    for (const q of pool) {
      const p = progress['q:' + q.id];
      if (!p) fresh.push(q);
      else if (p.due <= now) due.push(q);
      else rest.push(q);
    }
    due.sort((a, b) => progress['q:' + a.id].due - progress['q:' + b.id].due);
    const freshS = shuffle(fresh, rng);
    // tra le "altre" prima quelle con scatola più bassa
    const restS = shuffle(rest, rng).sort((a, b) => progress['q:' + a.id].box - progress['q:' + b.id].box);

    const ordered = mode === 'due' ? due : due.concat(freshS, restS);
    return ordered.slice(0, size);
  }

  CL.engine = { shuffle, shuffleOptions, buildSession };
  if (typeof module === 'object' && module.exports) module.exports = CL.engine;
})();
