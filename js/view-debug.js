/* CodeLab – esercizi di debugging: l'utente corregge il codice e lo verifica con test reali */
(function () {
  'use strict';
  const CL = globalThis.CL;
  const { esc, act, view, setHTML, code, topicName } = CL.ui;

  let worker = null;
  let saveTimer = null;
  const drafts = {};

  function find(id) { return CL.debug.find((d) => d.id === id); }

  function killWorker() {
    if (worker) { worker.terminate(); worker = null; }
  }

  // Esegue il codice in un Web Worker; se non termina entro 4 s lo interrompe (cicli infiniti)
  function runInWorker(src, tests) {
    killWorker();
    return new Promise((resolve) => {
      let finished = false;
      const w = new Worker('js/runner.js');
      worker = w;
      const done = (out) => {
        if (finished) return;
        finished = true;
        clearTimeout(timer);
        if (worker === w) worker = null;
        w.terminate();
        resolve(out);
      };
      const timer = setTimeout(() => done({
        syntaxError: null, results: [], fatal: 'Il codice non termina entro 4 secondi (ciclo infinito?).',
      }), 4000);
      w.onmessage = (e) => done(e.data);
      w.onerror = (e) => done({ syntaxError: null, results: [], fatal: 'Errore di esecuzione: ' + (e.message || 'sconosciuto') });
      w.postMessage({ code: src, tests });
    });
  }

  function resultHTML(out, item) {
    if (out.fatal) return '<div class="feedback ko">' + esc(out.fatal) + '</div>';
    if (out.syntaxError) return '<div class="feedback ko"><b>Errore di sintassi</b><br>' + esc(out.syntaxError) + '</div>';
    const passed = out.results.filter((r) => r.ok).length;
    const all = passed === out.results.length;
    let h = '<div class="feedback ' + (all ? 'ok' : 'ko') + '"><b>' + (all ? 'Tutti i test superati!' : passed + ' su ' + out.results.length + ' test superati') + '</b></div><ul class="tests">';
    for (const r of out.results) {
      h += '<li class="' + (r.ok ? 'pass' : 'fail') + '"><code>' + esc(r.call) + '</code><br>' +
        (r.ok ? '<small>risultato: ' + esc(r.got) + '</small>'
          : '<small>atteso: ' + esc(r.expected) + '<br>ottenuto: ' + esc(r.got) + '</small>') +
        (r.logs && r.logs.length ? '<br><small class="muted">console: ' + esc(r.logs.join(' | ')) + '</small>' : '') + '</li>';
    }
    h += '</ul>';
    if (all) h += '<div class="card inner"><b>Perché?</b><p>' + esc(item.explain) + '</p></div>';
    return h;
  }

  async function listHTML() {
    const progress = CL.ui.progressMap(await CL.db.allProgress());
    let h = '<section class="card"><h2>Debugging</h2><p class="muted">Ogni esercizio ha una funzione con un bug. Correggila finché tutti i test passano.</p></section><div class="list">';
    for (const d of CL.debug) {
      const p = progress['d:' + d.id];
      const st = p && p.solved ? '<span class="tag ok">risolto</span>' : (p && p.runs ? '<span class="tag">in corso</span>' : '<span class="tag">nuovo</span>');
      h += '<a class="card row-link" href="#/debug/' + d.id + '"><div><b>' + esc(d.title) + '</b><br><small class="muted">' + esc(topicName(d.topic)) + '</small></div>' + st + '</a>';
    }
    return h + '</div>';
  }

  async function editorHTML(item) {
    let text = drafts[item.id];
    if (text === undefined) text = await CL.db.getSetting('draft:' + item.id, item.code);
    drafts[item.id] = text;
    return '<a class="back" href="#/debug">← Tutti gli esercizi</a>' +
      '<section class="card"><h2>' + esc(item.title) + '</h2><p>' + esc(item.desc) + '</p>' +
      '<label class="lbl" for="ed">Codice (modificalo qui)</label>' +
      '<textarea id="ed" class="editor" spellcheck="false" autocapitalize="off" autocorrect="off" autocomplete="off" rows="' + Math.min(18, Math.max(8, item.code.split('\n').length + 2)) + '">' + esc(text) + '</textarea>' +
      '<div class="row"><button class="btn" data-a="dbg.run" data-id="' + item.id + '">Esegui test</button>' +
      '<button class="btn ghost" data-a="dbg.hint" data-id="' + item.id + '">Suggerimento</button></div>' +
      '<div class="row"><button class="btn ghost" data-a="dbg.reset" data-id="' + item.id + '">Ripristina</button>' +
      '<button class="btn ghost" data-a="dbg.sol" data-id="' + item.id + '">Soluzione</button></div>' +
      '<div id="hint"></div><div id="res"></div><div id="sol"></div></section>';
  }

  function saveDraft(id, value) {
    drafts[id] = value;
    clearTimeout(saveTimer);
    saveTimer = setTimeout(() => { CL.db.setSetting('draft:' + id, value).catch(() => {}); }, 400);
  }

  document.addEventListener('input', (e) => {
    if (e.target && e.target.id === 'ed') {
      const id = (location.hash.match(/^#\/debug\/(\w+)/) || [])[1];
      if (id) saveDraft(id, e.target.value);
    }
  });

  act('dbg.run', async (el) => {
    const item = find(el.dataset.id);
    const ed = document.getElementById('ed');
    const res = document.getElementById('res');
    el.disabled = true;
    res.innerHTML = '<p class="muted">Esecuzione…</p>';
    try {
      const out = await runInWorker(ed.value, item.tests);
      const ok = !out.fatal && !out.syntaxError && out.results.length > 0 && out.results.every((r) => r.ok);
      res.innerHTML = resultHTML(out, item);
      await CL.db.recordDebugRun(item, ok);
      if (ok) CL.ui.toast('Esercizio risolto!');
    } finally { el.disabled = false; }
  });

  act('dbg.hint', (el) => {
    const item = find(el.dataset.id);
    document.getElementById('hint').innerHTML = '<div class="feedback hint"><b>Suggerimento:</b> ' + esc(item.hint) + '</div>';
  });

  act('dbg.reset', (el) => {
    const item = find(el.dataset.id);
    if (!confirm('Ripristinare il codice originale? Le tue modifiche andranno perse.')) return;
    document.getElementById('ed').value = item.code;
    saveDraft(item.id, item.code);
    document.getElementById('res').innerHTML = '';
  });

  act('dbg.sol', async (el) => {
    const item = find(el.dataset.id);
    if (!confirm('Vuoi davvero vedere la soluzione? Provare da soli è il modo migliore per imparare.')) return;
    document.getElementById('sol').innerHTML = '<h3 class="sect">Soluzione</h3>' + code(item.solution) + '<p class="muted">' + esc(item.explain) + '</p>';
    await CL.db.markSolutionViewed(item);
  });

  view('debug', {
    title: 'Debug',
    async render(args) {
      killWorker();
      if (args[0]) {
        const item = find(args[0]);
        if (!item) { CL.ui.go('/debug'); return; }
        CL.busy = true;
        setHTML(await editorHTML(item));
        return;
      }
      CL.busy = false;
      setHTML(await listHTML());
    },
    leave() { killWorker(); CL.busy = false; },
  });
})();
