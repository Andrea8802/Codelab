/* CodeLab – schermata "Oggi" */
(function () {
  'use strict';
  const CL = globalThis.CL;
  const { esc, setHTML, pct } = CL.ui;

  function isIOS() {
    return /iphone|ipad|ipod/i.test(navigator.userAgent) ||
      (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  }
  function isStandalone() {
    return (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) ||
      navigator.standalone === true;
  }

  async function loadStats() {
    const [attempts, progress] = await Promise.all([CL.db.allAttempts(), CL.db.allProgress()]);
    return {
      attempts,
      progress,
      s: CL.stats.compute({ attempts, progress, topics: CL.topics, quiz: CL.quiz, debug: CL.debug }),
    };
  }
  CL.loadStats = loadStats;

  function installCard() {
    if (isStandalone()) return '';
    if (CL.installPrompt) {
      return '<div class="card"><h2>Installa l\'app</h2><p class="muted">Aggiungila alla schermata Home: si apre a schermo intero e funziona anche senza rete.</p>' +
        '<button class="btn" data-a="install">Installa CodeLab</button></div>';
    }
    if (isIOS()) {
      return '<div class="card"><h2>Installa l\'app</h2><p class="muted">In Safari tocca <b>Condividi</b> e poi <b>Aggiungi alla schermata Home</b>.</p></div>';
    }
    return '';
  }

  CL.ui.act('install', async () => {
    const p = CL.installPrompt;
    if (!p) return;
    p.prompt();
    try { await p.userChoice; } catch (e) { /* ignora */ }
    CL.installPrompt = null;
    CL.ui.route();
  });

  CL.ui.view('home', {
    title: 'CodeLab',
    async render() {
      const { attempts, s } = await loadStats();
      const today = CL.db.localDay(Date.now());
      const todayN = attempts.filter((a) => a.kind !== 'sim' && a.day === today).length;
      const sims = attempts.filter((a) => a.kind === 'sim');
      const best = sims.reduce((m, a) => Math.max(m, a.total ? a.score / a.total : 0), 0);
      const due = s.quiz.due;
      const fresh = s.quiz.fresh;

      let main;
      if (due > 0) {
        main = '<button class="btn big" data-a="quiz.start" data-mode="due" data-topic="all">Ripassa ora · ' + due + ' da ripassare</button>';
      } else if (fresh > 0) {
        main = '<button class="btn big" data-a="quiz.start" data-mode="smart" data-topic="all">Nuovo quiz da 10 domande</button>';
      } else {
        main = '<button class="btn big" data-a="quiz.start" data-mode="smart" data-topic="all">Quiz di allenamento</button>';
      }

      setHTML(
        '<section class="card">' +
          '<div class="stats3">' +
            '<div><b>' + todayN + '</b><span>risposte oggi</span></div>' +
            '<div><b>' + s.streak.current + '</b><span>giorni di fila</span></div>' +
            '<div><b>' + pct(s.quiz.accuracy) + '</b><span>precisione</span></div>' +
          '</div>' +
          main +
        '</section>' +
        '<section class="grid2">' +
          '<a class="card tile" href="#/quiz"><h3>Quiz</h3><p class="muted">' + s.quiz.seen + '/' + s.quiz.total + ' domande viste</p></a>' +
          '<a class="card tile" href="#/debug"><h3>Debug</h3><p class="muted">' + s.debug.solved + '/' + s.debug.total + ' esercizi risolti</p></a>' +
          '<a class="card tile" href="#/sim"><h3>Simulazione</h3><p class="muted">' + (sims.length ? 'miglior risultato ' + Math.round(best * 100) + '%' : 'mai provata') + '</p></a>' +
          '<a class="card tile" href="#/stats"><h3>Statistiche</h3><p class="muted">' + s.quiz.mastered + ' domande padroneggiate</p></a>' +
        '</section>' +
        installCard() +
        '<p class="muted small center">' + (CL.offlineReady ? 'Pronta per l\'uso offline.' : 'Preparazione dell\'uso offline…') +
        ' · Dati salvati sul dispositivo (' + esc(CL.db.mode() === 'indexeddb' ? 'IndexedDB' : 'memoria temporanea') + ').</p>'
      );
    },
  });
})();
