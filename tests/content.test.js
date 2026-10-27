/* Verifica dei contenuti: esegue il codice di ogni domanda e di ogni esercizio. */
'use strict';
const vm = require('node:vm');
const path = require('node:path');
const assert = require('node:assert');

const root = path.join(__dirname, '..');
globalThis.CL = {};
['quiz-a', 'quiz-b', 'quiz-c', 'debug-data'].forEach((f) => require(path.join(root, 'js', f + '.js')));
const { runTests } = require(path.join(root, 'js', 'runner.js'));
const CL = globalThis.CL;

let failures = 0;
function fail(msg) { failures++; console.log('  ✗ ' + msg); }

function fmtLogArg(a) {
  return typeof a === 'string' ? a : String(a);
}

// Esegue lo snippet in un contesto isolato e restituisce l'output come lo mostra l'app
async function runSnippet(code) {
  const lines = [];
  const sandbox = {
    console: { log: (...a) => lines.push(a.map(fmtLogArg).join(' ')) },
    setTimeout, Promise, Error, Math, Number, Boolean, parseInt, Object, Array, Set, Map,
  };
  vm.createContext(sandbox);
  vm.runInContext(code, sandbox, { timeout: 1000 });
  await new Promise((r) => setTimeout(r, 80));
  return lines.join(' → ');
}

(async () => {
  console.log('== Quiz ==');
  const ids = new Set();
  for (const q of CL.quiz) {
    if (ids.has(q.id)) fail(q.id + ': id duplicato');
    ids.add(q.id);
    if (!CL.topics.some((t) => t.id === q.topic)) fail(q.id + ': argomento sconosciuto ' + q.topic);
    if (!Array.isArray(q.options) || q.options.length < 2) fail(q.id + ': opzioni mancanti');
    if (new Set(q.options).size !== q.options.length) fail(q.id + ': opzioni duplicate');
    if (!(q.answer >= 0 && q.answer < q.options.length)) fail(q.id + ': answer fuori intervallo');
    if (!q.explain) fail(q.id + ': spiegazione mancante');
    if (q.run) {
      let out;
      try { out = await runSnippet(q.code); } catch (e) { out = 'ERRORE ' + e.message; }
      if (out !== q.options[q.answer]) {
        fail(`${q.id}: risposta indicata "${q.options[q.answer]}" ma l'output reale è "${out}"`);
      }
    }
  }
  console.log(`  ${CL.quiz.length} domande, ${CL.quiz.filter((q) => q.run).length} con codice eseguito`);
  for (const t of CL.topics) {
    const n = CL.quiz.filter((q) => q.topic === t.id).length;
    if (n < 10) fail('argomento ' + t.id + ' con solo ' + n + ' domande');
    console.log(`  - ${t.name}: ${n}`);
  }
  // distribuzione delle risposte corrette (evita che sia sempre la stessa posizione)
  const dist = [0, 0, 0, 0];
  CL.quiz.forEach((q) => { dist[q.answer]++; });
  console.log('  posizione risposta corretta nei dati (poi mescolata in app):', dist.join('/'));

  console.log('== Debug ==');
  const dids = new Set();
  for (const d of CL.debug) {
    if (dids.has(d.id)) fail(d.id + ': id duplicato');
    dids.add(d.id);
    if (!CL.topics.some((t) => t.id === d.topic)) fail(d.id + ': argomento sconosciuto');
    for (const k of ['title', 'desc', 'code', 'hint', 'solution', 'explain']) if (!d[k]) fail(d.id + ': manca ' + k);
    const bad = await runTests(d.code, d.tests);
    if (bad.syntaxError) fail(d.id + ': il codice originale ha errori di sintassi (' + bad.syntaxError + ')');
    else if (bad.results.every((r) => r.ok)) fail(d.id + ': il codice con bug supera già tutti i test');
    const good = await runTests(d.solution, d.tests);
    if (good.syntaxError) fail(d.id + ': la soluzione ha errori di sintassi');
    else good.results.forEach((r) => { if (!r.ok) fail(`${d.id}: la soluzione fallisce ${r.call} (atteso ${r.expected}, ottenuto ${r.got})`); });
    console.log(`  ${d.id} ${d.title}: bug → ${bad.results.filter((r) => !r.ok).length}/${d.tests.length} test falliti; soluzione → ${good.results.filter((r) => r.ok).length}/${d.tests.length} ok`);
  }

  // runner: casi limite
  console.log('== Runner ==');
  const syn = await runTests('function (', [{ call: 'f()', expected: 1 }]);
  assert.ok(syn.syntaxError, 'errore di sintassi non rilevato');
  const thr = await runTests('function f(){ throw new TypeError("no"); }', [{ call: 'f()', expected: 1 }]);
  assert.ok(thr.results[0].error && thr.results[0].error.startsWith('TypeError'), 'eccezione non catturata');
  const lg = await runTests('function f(){ console.log("ciao", 1); return 2; }', [{ call: 'f()', expected: 2 }]);
  assert.ok(lg.results[0].ok && lg.results[0].logs[0] === 'ciao 1', 'console.log non catturato');
  const nofn = await runTests('const x = 1;', [{ call: 'inesistente()', expected: 1 }]);
  assert.ok(nofn.results[0].error && nofn.results[0].error.startsWith('ReferenceError'), 'ReferenceError atteso');
  console.log('  ok (sintassi, eccezioni, console.log, riferimenti mancanti)');

  console.log(failures ? `\nFALLITO: ${failures} problemi` : '\nTUTTO OK');
  process.exit(failures ? 1 : 0);
})();
