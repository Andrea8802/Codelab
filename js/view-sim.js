/* CodeLab – simulazione d'esame a tempo, ripresa anche dopo la chiusura dell'app */
(function () {
  'use strict';
  const CL = globalThis.CL;
  const { esc, act, view, setHTML, code, topicName, pct, fmtTime, fmtDate, go } = CL.ui;

  const SIM = { size: 20, minutes: 20, pass: 0.6 };
  const KEY = 'activeSim';
  let sim = null;       // simulazione attiva in memoria
  let ticker = null;
  let finishing = false;

  const byId = (id) => CL.quiz.find((q) => q.id === id);

  function build() {
    // domande equilibrate tra gli argomenti, poi mescolate
    const per = Math.ceil(SIM.size / CL.topics.length);
    let pick = [];
    for (const t of CL.topics) {
      pick = pick.concat(CL.engine.shuffle(CL.quiz.filter((q) => q.topic === t.id)).slice(0, per));
    }
    pick = CL.engine.shuffle(pick).slice(0, SIM.size);
    const now = Date.now();
    return {
      startAt: now,
      endAt: now + SIM.minutes * 60000,
      cur: 0,
      answers: {},
      items: pick.map((q) => ({ id: q.id, order: CL.engine.shuffle(q.options.map((_, i) => i)) })),
    };
  }

  function save() { return CL.db.setSetting(KEY, sim); }
  function stopTicker() { if (ticker) { clearInterval(ticker); ticker = null; } }

  function tick() {
    if (!sim) return stopTicker();
    const left = sim.endAt - Date.now();
    const el = document.getElementById('timer');
    if (el) {
      el.textContent = fmtTime(left);
      el.classList.toggle('low', left < 120000);
    }
    if (left <= 0) finish(true);
  }

  function playHTML() {
    const it = sim.items[sim.cur];
    const q = byId(it.id);
    const chosen = sim.answers[it.id];
    const answered = Object.keys(sim.answers).length;
    const dots = sim.items.map((x, i) => '<button class="dot' + (i === sim.cur ? ' cur' : '') + (sim.answers[x.id] !== undefined ? ' done' : '') +
      '" data-a="sim.goto" data-i="' + i + '" aria-label="Domanda ' + (i + 1) + '">' + (i + 1) + '</button>').join('');
    const opts = it.order.map((oi, k) => '<button class="opt' + (chosen === k ? ' sel' : '') + '" data-a="sim.pick" data-i="' + k + '">' + esc(q.options[oi]) + '</button>').join('');
    return '<div class="simbar"><span>Domanda ' + (sim.cur + 1) + '/' + sim.items.length + ' · ' + answered + ' risposte</span><b id="timer" class="timer">' + fmtTime(sim.endAt - Date.now()) + '</b></div>' +
      '<div class="dots">' + dots + '</div>' +
      '<section class="card"><h2 class="q">' + esc(q.q) + '</h2>' + (q.code ? code(q.code) : '') + '<div class="opts">' + opts + '</div>' +
      '<div class="row"><button class="btn ghost" data-a="sim.prev"' + (sim.cur === 0 ? ' disabled' : '') + '>Indietro</button>' +
      (sim.cur < sim.items.length - 1 ? '<button class="btn" data-a="sim.next">Avanti</button>' : '<button class="btn" data-a="sim.submit">Consegna</button>') + '</div>' +
      '<button class="btn ghost full" data-a="sim.submit">Consegna adesso</button></section>';
  }

  function startHTML(history) {
    let h = '<section class="card"><h2>Simulazione d\'esame</h2>' +
      '<p>' + SIM.size + ' domande miste, ' + SIM.minutes + ' minuti, nessun feedback fino alla consegna. Si supera con almeno il ' + Math.round(SIM.pass * 100) + '%.</p>' +
      '<p class="muted small">Se chiudi l\'app il tempo continua a scorrere: puoi riprendere finché non scade.</p>' +
      '<button class="btn big" data-a="sim.start">Avvia simulazione</button></section>';
    if (history.length) {
      h += '<h3 class="sect">Ultime simulazioni</h3><div class="list">';
      for (const a of history.slice(0, 6)) {
        const p = a.total ? a.score / a.total : 0;
        h += '<div class="card row-link"><div><b>' + a.score + '/' + a.total + ' · ' + Math.round(p * 100) + '%</b><br><small class="muted">' + fmtDate(a.ts) + ' · ' + fmtTime(a.durationMs) + '</small></div>' +
          '<span class="tag ' + (a.pass ? 'ok' : 'ko') + '">' + (a.pass ? 'superata' : 'non superata') + '</span></div>';
      }
      h += '</div>';
    }
    return h;
  }

  async function finish(timeUp) {
    if (finishing || !sim) return;
    finishing = true;
    stopTicker();
    const s = sim;
    const now = Math.min(Date.now(), s.endAt);
    let score = 0;
    const byTopic = {};
    const wrong = [];
    for (const it of s.items) {
      const q = byId(it.id);
      const chosen = s.answers[it.id];
      const ok = chosen !== undefined && it.order[chosen] === q.answer;
      if (ok) score++; else wrong.push(q.id);
      byTopic[q.topic] = byTopic[q.topic] || { ok: 0, n: 0 };
      byTopic[q.topic].n++;
      if (ok) byTopic[q.topic].ok++;
      await CL.db.recordQuizAnswer(q, ok, Date.now());
    }
    const total = s.items.length;
    await CL.db.addAttempt({
      kind: 'sim', itemId: 'sim-' + s.startAt, topic: 'sim', ok: null,
      score, total, pass: score / total >= SIM.pass, durationMs: now - s.startAt, byTopic, wrong, timeUp: !!timeUp,
    });
    await CL.db.setSetting(KEY, null);
    sim = null;
    CL.busy = false;
    finishing = false;
    go('/sim/result');
  }

  async function resultHTML() {
    const attempts = (await CL.db.allAttempts()).filter((a) => a.kind === 'sim').sort((a, b) => b.ts - a.ts);
    const a = attempts[0];
    if (!a) return '<section class="card"><p>Nessuna simulazione completata.</p><a class="btn" href="#/sim">Avvia</a></section>';
    const p = a.score / a.total;
    let h = '<section class="card center"><h2>' + (a.pass ? 'Simulazione superata' : 'Simulazione non superata') + '</h2>' +
      '<p class="score ' + (a.pass ? 'ok' : 'ko') + '">' + a.score + ' / ' + a.total + '</p>' +
      '<p class="muted">' + Math.round(p * 100) + '% · tempo ' + fmtTime(a.durationMs) + (a.timeUp ? ' (tempo scaduto)' : '') + '</p>' +
      '<div class="row"><button class="btn" data-a="sim.start">Riprova</button><a class="btn ghost" href="#/sim">Indietro</a></div></section>';
    h += '<h3 class="sect">Per argomento</h3><section class="card">';
    for (const t of CL.topics) {
      const r = a.byTopic && a.byTopic[t.id];
      if (!r) continue;
      h += '<div class="bar"><span>' + esc(t.name) + '</span><div class="track"><i style="width:' + Math.round((r.ok / r.n) * 100) + '%"></i></div><em>' + r.ok + '/' + r.n + '</em></div>';
    }
    h += '</section>';
    const wrong = (a.wrong || []).map(byId).filter(Boolean);
    if (wrong.length) {
      h += '<h3 class="sect">Da rivedere (' + wrong.length + ')</h3>';
      for (const q of wrong) {
        h += '<section class="card"><p class="q">' + esc(q.q) + '</p>' + (q.code ? code(q.code) : '') +
          '<p><b>Risposta giusta:</b> ' + esc(q.options[q.answer]) + '</p><p class="muted">' + esc(q.explain) + '</p></section>';
      }
    }
    return h;
  }

  act('sim.start', async () => {
    sim = build();
    CL.busy = true;
    await save();
    go('/sim/play');
  });
  act('sim.pick', async (el) => {
    if (!sim) return;
    const it = sim.items[sim.cur];
    sim.answers[it.id] = Number(el.dataset.i);
    setHTML(playHTML());
    await save();
  });
  function nav(i) {
    sim.cur = Math.max(0, Math.min(sim.items.length - 1, i));
    setHTML(playHTML());
    window.scrollTo(0, 0);
    save();
  }
  act('sim.next', () => sim && nav(sim.cur + 1));
  act('sim.prev', () => sim && nav(sim.cur - 1));
  act('sim.goto', (el) => sim && nav(Number(el.dataset.i)));
  act('sim.resume', () => go('/sim/play'));
  act('sim.submit', async () => {
    if (!sim) return;
    const missing = sim.items.length - Object.keys(sim.answers).length;
    const msg = missing > 0
      ? 'Hai ancora ' + missing + ' domande senza risposta. Consegnare comunque?'
      : 'Consegnare la simulazione?';
    if (!confirm(msg)) return;
    await finish(false);
  });
  act('sim.abort', async () => {
    if (!confirm('Abbandonare la simulazione? Non verrà registrato nessun risultato.')) return;
    stopTicker();
    sim = null;
    CL.busy = false;
    await CL.db.setSetting(KEY, null);
    go('/sim');
  });

  view('sim', {
    title: 'Simulazione',
    async render(args) {
      stopTicker();
      if (!sim) sim = await CL.db.getSetting(KEY, null);
      if (sim && sim.endAt <= Date.now()) { await finish(true); return; }

      if (args[0] === 'play') {
        if (!sim) return go('/sim');
        CL.busy = true;
        setHTML(playHTML());
        ticker = setInterval(tick, 1000);
        return;
      }
      if (args[0] === 'result') { setHTML(await resultHTML()); return; }

      if (sim) {
        setHTML('<section class="card"><h2>Simulazione in corso</h2><p>Tempo rimasto: <b>' + fmtTime(sim.endAt - Date.now()) + '</b> · ' +
          Object.keys(sim.answers).length + ' risposte date.</p>' +
          '<button class="btn big" data-a="sim.resume">Riprendi</button><button class="btn ghost full" data-a="sim.abort">Abbandona</button></section>');
        return;
      }
      const hist = (await CL.db.allAttempts()).filter((a) => a.kind === 'sim').sort((a, b) => b.ts - a.ts);
      setHTML(startHTML(hist));
    },
    leave() { stopTicker(); if (!sim) CL.busy = false; },
  });
})();
