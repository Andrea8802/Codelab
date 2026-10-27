/* CodeLab – quiz con ripetizione dilazionata (Leitner) */
(function () {
  'use strict';
  const CL = globalThis.CL;
  const { esc, act, view, setHTML, code, topicName, pct, go } = CL.ui;

  const sel = { topic: 'all', mode: 'smart' };
  let state = null;

  function optionsHTML(st) {
    const cur = st.items[st.i];
    return cur.options.map((o, k) => {
      let cls = 'opt';
      if (st.picked !== null) {
        if (k === cur.answer) cls += ' right';
        else if (k === st.picked) cls += ' wrong';
      }
      return '<button class="' + cls + '" data-a="quiz.pick" data-i="' + k + '"' + (st.picked !== null ? ' disabled' : '') + '>' + esc(o) + '</button>';
    }).join('');
  }

  function playHTML() {
    const st = state;
    const cur = st.items[st.i];
    const q = cur.q;
    let h = '<div class="progress" aria-hidden="true"><i style="width:' + Math.round((st.i / st.items.length) * 100) + '%"></i></div>' +
      '<p class="muted small">Domanda ' + (st.i + 1) + ' di ' + st.items.length + ' · ' + esc(topicName(q.topic)) + '</p>' +
      '<section class="card"><h2 class="q">' + esc(q.q) + '</h2>' + (q.code ? code(q.code) : '') +
      '<div class="opts">' + optionsHTML(st) + '</div>';
    if (st.picked !== null) {
      const ok = st.picked === cur.answer;
      h += '<div class="feedback ' + (ok ? 'ok' : 'ko') + '" role="status"><b>' + (ok ? 'Corretto!' : 'Non proprio.') + '</b> ' + esc(q.explain) + '</div>' +
        '<button class="btn" data-a="quiz.next">' + (st.i + 1 < st.items.length ? 'Avanti' : 'Vedi risultato') + '</button>';
    }
    return h + '</section>';
  }

  function summaryHTML() {
    const st = state;
    const n = st.items.length;
    const wrong = st.results.filter((r) => !r.ok);
    let h = '<section class="card center"><h2>Sessione completata</h2><p class="score">' + st.correct + ' / ' + n + '</p>' +
      '<p class="muted">' + pct(st.correct / n) + ' di risposte corrette</p>' +
      '<div class="row"><button class="btn" data-a="quiz.again">Un\'altra sessione</button><button class="btn ghost" data-a="go" data-to="/">Home</button></div></section>';
    if (wrong.length) {
      h += '<h3 class="sect">Da rivedere</h3>';
      for (const r of wrong) {
        h += '<section class="card"><p class="q">' + esc(r.q.q) + '</p>' + (r.q.code ? code(r.q.code) : '') +
          '<p><b>Risposta giusta:</b> ' + esc(r.q.options[r.q.answer]) + '</p><p class="muted">' + esc(r.q.explain) + '</p></section>';
      }
    }
    return h;
  }

  async function setupHTML() {
    const progress = CL.ui.progressMap(await CL.db.allProgress());
    const now = Date.now();
    const info = (tid) => {
      const pool = CL.quiz.filter((q) => tid === 'all' || q.topic === tid);
      let due = 0; let fresh = 0;
      for (const q of pool) {
        const p = progress['q:' + q.id];
        if (!p) fresh++; else if (p.due <= now) due++;
      }
      return { n: pool.length, due, fresh };
    };
    const chips = [{ id: 'all', name: 'Tutti gli argomenti' }].concat(CL.topics).map((t) => {
      const i = info(t.id);
      return '<button class="chip' + (sel.topic === t.id ? ' on' : '') + '" data-a="quiz.topic" data-id="' + t.id + '" aria-pressed="' + (sel.topic === t.id) + '">' +
        esc(t.name) + '<small>' + i.due + ' da ripassare · ' + i.fresh + ' nuove</small></button>';
    }).join('');
    const cur = info(sel.topic);
    return '<section class="card"><h2>Allenamento</h2><p class="muted">Le domande sbagliate tornano presto, quelle giuste sempre più tardi.</p>' +
      '<h3 class="sect">Argomento</h3><div class="chips">' + chips + '</div>' +
      '<h3 class="sect">Modalità</h3><div class="seg">' +
        '<button class="' + (sel.mode === 'smart' ? 'on' : '') + '" data-a="quiz.mode" data-id="smart">Intelligente</button>' +
        '<button class="' + (sel.mode === 'due' ? 'on' : '') + '" data-a="quiz.mode" data-id="due">Solo ripasso</button></div>' +
      '<p class="muted small">' + (sel.mode === 'due'
        ? 'Solo le ' + cur.due + ' domande scadute.' : 'Prima il ripasso, poi le domande nuove: 10 per sessione.') + '</p>' +
      '<button class="btn big" data-a="quiz.go"' + (sel.mode === 'due' && cur.due === 0 ? ' disabled' : '') + '>Inizia</button>' +
      (sel.mode === 'due' && cur.due === 0 ? '<p class="muted small center">Niente da ripassare per ora: prova la modalità Intelligente.</p>' : '') +
      '</section>';
  }

  async function begin() {
    const progress = CL.ui.progressMap(await CL.db.allProgress());
    const list = CL.engine.buildSession({ quiz: CL.quiz, progress, topic: sel.topic, mode: sel.mode, size: 10 });
    if (!list.length) { CL.ui.toast('Nessuna domanda disponibile'); return false; }
    state = {
      items: list.map((q) => Object.assign({ q }, CL.engine.shuffleOptions(q))),
      i: 0, correct: 0, picked: null, results: [], done: false,
    };
    return true;
  }

  act('quiz.topic', (el) => { sel.topic = el.dataset.id; return CL.ui.route(); });
  act('quiz.mode', (el) => { sel.mode = el.dataset.id; return CL.ui.route(); });
  act('quiz.go', async () => { if (await begin()) go('/quiz/play'); });
  act('quiz.start', async (el) => {
    sel.topic = el.dataset.topic || 'all';
    sel.mode = el.dataset.mode || 'smart';
    if (await begin()) go('/quiz/play');
  });
  act('quiz.again', async () => { if (await begin()) go('/quiz/play'); });

  act('quiz.pick', async (el) => {
    if (!state || state.picked !== null) return;
    const k = Number(el.dataset.i);
    const cur = state.items[state.i];
    state.picked = k; // blocca subito i doppi tocchi
    const ok = k === cur.answer;
    if (ok) state.correct++;
    state.results.push({ q: cur.q, ok });
    setHTML(playHTML());
    await CL.db.recordQuizAnswer(cur.q, ok);
    const fb = CL.ui.root().querySelector('.feedback');
    if (fb) fb.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  });

  act('quiz.next', () => {
    if (!state || state.picked === null) return;
    state.i++;
    state.picked = null;
    if (state.i >= state.items.length) { state.done = true; setHTML(summaryHTML()); window.scrollTo(0, 0); return; }
    setHTML(playHTML());
    window.scrollTo(0, 0);
  });

  view('quiz', {
    title: 'Quiz',
    async render(args) {
      if (args[0] === 'play') {
        if (!state) return go('/quiz');
        setHTML(state.done ? summaryHTML() : playHTML());
        return;
      }
      state = null;
      setHTML(await setupHTML());
    },
  });
})();
