/* CodeLab – esecuzione dei test sul codice dell'utente.
   Gira in un Web Worker (isolato dalla pagina; l'app lo termina dopo un timeout contro i cicli infiniti).
   Esportato anche per Node (test automatici). */
(function () {
  'use strict';

  function fmt(v, depth) {
    depth = depth || 0;
    if (v === undefined) return 'undefined';
    if (v === null) return 'null';
    if (typeof v === 'string') return JSON.stringify(v);
    if (typeof v === 'number' || typeof v === 'boolean' || typeof v === 'bigint') return String(v);
    if (typeof v === 'function') return '[funzione ' + (v.name || 'anonima') + ']';
    if (typeof v === 'symbol') return v.toString();
    if (depth > 4) return '…';
    if (Array.isArray(v)) return '[' + v.map((x) => fmt(x, depth + 1)).join(', ') + ']';
    if (v instanceof Error) return v.name + ': ' + v.message;
    if (typeof v.then === 'function') return '[Promise]';
    try {
      const keys = Object.keys(v);
      return '{' + keys.map((k) => k + ': ' + fmt(v[k], depth + 1)).join(', ') + '}';
    } catch (e) {
      return String(v);
    }
  }

  function deepEqual(a, b) {
    if (Object.is(a, b)) return true;
    if (typeof a !== 'object' || typeof b !== 'object' || a === null || b === null) return false;
    if (Array.isArray(a) !== Array.isArray(b)) return false;
    const ka = Object.keys(a);
    const kb = Object.keys(b);
    if (ka.length !== kb.length) return false;
    for (const k of ka) {
      if (!Object.prototype.hasOwnProperty.call(b, k) || !deepEqual(a[k], b[k])) return false;
    }
    return true;
  }

  function makeConsole(logs) {
    const push = (...args) => {
      if (logs.length < 30) {
        logs.push(args.map((x) => (typeof x === 'string' ? x : fmt(x))).join(' ').slice(0, 300));
      }
    };
    return { log: push, info: push, warn: push, error: push, debug: push };
  }

  function withTimeout(p, ms) {
    return new Promise((resolve, reject) => {
      const t = setTimeout(() => reject(new Error('Timeout: la funzione non ha mai restituito un risultato')), ms);
      Promise.resolve(p).then(
        (v) => { clearTimeout(t); resolve(v); },
        (e) => { clearTimeout(t); reject(e); }
      );
    });
  }

  // tests: [{ call: "sum([1,2])", expected: 3 }]
  async function runTests(code, tests) {
    // 1) controllo di sintassi del solo codice dell'utente
    try {
      // eslint-disable-next-line no-new-func
      new Function('console', '"use strict";\n' + code);
    } catch (e) {
      return { syntaxError: e.name + ': ' + e.message, results: [] };
    }
    const results = [];
    for (const t of tests) {
      const logs = [];
      const r = { call: t.call, expected: fmt(t.expected), ok: false, got: '', error: null, logs };
      try {
        // il codice viene ricompilato per ogni test: lo stato non passa da un test all'altro
        // eslint-disable-next-line no-new-func
        const fn = new Function('console', '"use strict";\n' + code + '\n;return (' + t.call + ');');
        const value = await withTimeout(fn(makeConsole(logs)), 1500);
        r.got = fmt(value);
        r.ok = deepEqual(value, t.expected);
      } catch (e) {
        r.error = (e && e.name ? e.name : 'Error') + ': ' + (e && e.message ? e.message : String(e));
        r.got = r.error;
      }
      results.push(r);
    }
    return { syntaxError: null, results };
  }

  // Contesto Worker
  if (typeof WorkerGlobalScope !== 'undefined' && typeof self !== 'undefined' && self instanceof WorkerGlobalScope) {
    self.onmessage = async (e) => {
      const out = await runTests(e.data.code, e.data.tests);
      self.postMessage(out);
    };
  }

  if (typeof module === 'object' && module.exports) module.exports = { runTests, deepEqual, fmt };
})();
