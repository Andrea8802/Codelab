/* CodeLab – statistiche e gestione dei dati */
(function () {
  'use strict';
  const CL = globalThis.CL;
  const { esc, act, view, setHTML, pct, fmtTime, fmtDate, topicName, toast } = CL.ui;

  function daysChart(days) {
    const max = Math.max(1, ...days.map((d) => d.n));
    const total = days.reduce((s, d) => s + d.n, 0);
    const bars = days.map((d) =>
      '<div class="col" title="' + d.day + ': ' + d.n + ' risposte"><i style="height:' + Math.round((d.n / max) * 100) + '%"></i><span>' + d.label.charAt(0) + '</span><em>' + (d.n || '') + '</em></div>'
    ).join('');
    return '<div class="chart" role="img" aria-label="Risposte negli ultimi 14 giorni: ' + total + ' in totale">' + bars + '</div>';
  }

  async function storageInfo() {
    let persisted = null;
    let usage = null;
    try {
      if (navigator.storage && navigator.storage.persisted) persisted = await navigator.storage.persisted();
      if (navigator.storage && navigator.storage.estimate) {
        const e = await navigator.storage.estimate();
        usage = e.usage;
      }
    } catch (e) { /* ignora */ }
    const where = CL.db.mode() === 'indexeddb' ? 'IndexedDB sul dispositivo' : 'memoria temporanea (IndexedDB non disponibile: i dati si perdono alla chiusura)';
    return where + (persisted === true ? ' · protetto dalla pulizia automatica' : '') +
      (usage !== null ? ' · ' + (usage / 1024).toFixed(0) + ' KB usati' : '');
  }

  view('stats', {
    title: 'Statistiche',
    async render() {
      const { attempts, progress, s } = await CL.loadStats();
      const sims = attempts.filter((a) => a.kind === 'sim' && a.total);
      const simAvg = sims.length ? sims.reduce((m, a) => m + a.score / a.total, 0) / sims.length : null;
      const simBest = sims.length ? Math.max(...sims.map((a) => a.score / a.total)) : null;

      let h = '<section class="card"><div class="stats2">' +
        '<div><b>' + s.quiz.answered + '</b><span>risposte ai quiz</span></div>' +
        '<div><b>' + pct(s.quiz.accuracy) + '</b><span>precisione</span></div>' +
        '<div><b>' + s.streak.current + '</b><span>serie attuale (record ' + s.streak.best + ')</span></div>' +
        '<div><b>' + s.quiz.mastered + '/' + s.quiz.total + '</b><span>padroneggiate</span></div>' +
        '</div></section>';

      h += '<h3 class="sect">Ultimi 14 giorni</h3><section class="card">' + daysChart(s.days) + '</section>';

      h += '<h3 class="sect">Per argomento</h3><section class="card">';
      for (const t of s.topics) {
        const weak = s.weak.includes(t.id);
        h += '<div class="bar' + (weak ? ' weak' : '') + '"><span>' + esc(t.name) + '</span>' +
          '<div class="track" role="img" aria-label="Precisione ' + pct(t.accuracy) + '"><i style="width:' + (t.accuracy === null ? 0 : Math.round(t.accuracy * 100)) + '%"></i></div>' +
          '<em>' + pct(t.accuracy) + '</em></div>' +
          '<p class="muted small sub">' + t.seen + '/' + t.total + ' viste · ' + t.mastered + ' padroneggiate · ' + t.due + ' da ripassare' + (weak ? ' · <b>da rinforzare</b>' : '') + '</p>';
      }
      h += '</section>';

      h += '<h3 class="sect">Debug e simulazioni</h3><section class="card"><div class="stats2">' +
        '<div><b>' + s.debug.solved + '/' + s.debug.total + '</b><span>esercizi risolti</span></div>' +
        '<div><b>' + s.debug.runs + '</b><span>esecuzioni di test</span></div>' +
        '<div><b>' + sims.length + '</b><span>simulazioni</span></div>' +
        '<div><b>' + (simAvg === null ? '–' : Math.round(simAvg * 100) + '%') + '</b><span>media' + (simBest === null ? '' : ' · migliore ' + Math.round(simBest * 100) + '%') + '</span></div>' +
        '</div></section>';

      const hard = progress.filter((p) => p.kind === 'q' && p.wrong > 0)
        .sort((a, b) => b.wrong - a.wrong || a.correct - b.correct).slice(0, 5)
        .map((p) => ({ q: CL.quiz.find((x) => x.id === p.itemId), p })).filter((x) => x.q);
      if (hard.length) {
        h += '<h3 class="sect">Domande più difficili</h3><div class="list">';
        for (const { q, p } of hard) {
          h += '<div class="card"><p class="q small">' + esc(q.q) + '</p>' + (q.code ? CL.ui.code(q.code) : '') +
            '<small class="muted">' + esc(topicName(q.topic)) + ' · sbagliata ' + p.wrong + ' volte su ' + p.seen + '</small></div>';
        }
        h += '</div>';
      }

      h += '<h3 class="sect">I tuoi dati</h3><section class="card"><p class="muted small">' + esc(await storageInfo()) + '</p>' +
        '<div class="row"><button class="btn ghost" data-a="data.export">Esporta backup</button>' +
        '<button class="btn ghost" data-a="data.import">Importa backup</button></div>' +
        '<input id="file" type="file" accept="application/json,.json" hidden>' +
        '<button class="btn danger full" data-a="data.reset">Azzera tutti i progressi</button></section>';

      setHTML(h);
    },
  });

  act('data.export', async () => {
    const data = await CL.db.exportAll();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'codelab-backup-' + CL.db.localDay(Date.now()) + '.json';
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 4000);
    toast('Backup esportato');
  });

  act('data.import', () => { const f = document.getElementById('file'); if (f) f.click(); });

  document.addEventListener('change', async (e) => {
    if (!e.target || e.target.id !== 'file') return;
    const f = e.target.files && e.target.files[0];
    if (!f) return;
    try {
      const obj = JSON.parse(await f.text());
      if (!confirm('Importare il backup? I progressi attuali verranno sostituiti.')) { e.target.value = ''; return; }
      const r = await CL.db.importAll(obj);
      toast('Importati ' + r.attempts + ' tentativi');
      CL.ui.route();
    } catch (err) {
      toast('Backup non valido: ' + err.message);
      e.target.value = '';
    }
  });

  act('data.reset', async () => {
    if (!confirm('Azzerare TUTTI i progressi, le statistiche e le bozze? L\'operazione non si può annullare.')) return;
    await CL.db.clearAll();
    location.reload(); // riparte da zero anche per lo stato in memoria (es. simulazione attiva)
  });
})();
