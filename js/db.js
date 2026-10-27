/* CodeLab – persistenza su IndexedDB (con fallback in memoria se non disponibile) */
(function () {
  'use strict';
  const CL = (globalThis.CL = globalThis.CL || {});

  const DB_NAME = 'codelab';
  const DB_VERSION = 1;
  const DAY = 86400000;
  // Giorni di attesa per ogni "scatola" Leitner (0 = da rifare subito)
  const INTERVALS = [0, 1, 3, 7, 14, 30];

  function localDay(ts) {
    const d = new Date(ts);
    return (
      d.getFullYear() + '-' +
      String(d.getMonth() + 1).padStart(2, '0') + '-' +
      String(d.getDate()).padStart(2, '0')
    );
  }

  function clone(v) {
    return v === undefined ? undefined : JSON.parse(JSON.stringify(v));
  }

  /* ---------- backend in memoria (fallback) ---------- */
  function memoryBackend() {
    const data = { progress: new Map(), attempts: new Map(), settings: new Map() };
    const keyOf = { progress: 'id', attempts: 'id', settings: 'key' };
    let seq = 0;
    return {
      kind: 'memory',
      get: async (s, k) => clone(data[s].get(k)),
      getAll: async (s) => Array.from(data[s].values()).map(clone),
      put: async (s, v) => { data[s].set(v[keyOf[s]], clone(v)); },
      add: async (s, v) => {
        const c = clone(v);
        c.id = ++seq;
        data[s].set(c.id, c);
        return c.id;
      },
      clear: async (s) => { data[s].clear(); },
    };
  }

  /* ---------- backend IndexedDB ---------- */
  function idbBackend() {
    let dbp = null;

    function open() {
      if (!dbp) {
        dbp = new Promise((resolve, reject) => {
          const r = indexedDB.open(DB_NAME, DB_VERSION);
          r.onupgradeneeded = () => {
            const db = r.result;
            if (!db.objectStoreNames.contains('progress')) {
              db.createObjectStore('progress', { keyPath: 'id' });
            }
            if (!db.objectStoreNames.contains('attempts')) {
              const s = db.createObjectStore('attempts', { keyPath: 'id', autoIncrement: true });
              s.createIndex('ts', 'ts');
            }
            if (!db.objectStoreNames.contains('settings')) {
              db.createObjectStore('settings', { keyPath: 'key' });
            }
          };
          r.onsuccess = () => {
            const db = r.result;
            db.onversionchange = () => db.close();
            resolve(db);
          };
          r.onerror = () => reject(r.error);
          r.onblocked = () => reject(new Error('IndexedDB bloccato'));
        });
      }
      return dbp;
    }

    // Ogni operazione usa una transazione con una sola richiesta: semplice e robusta.
    function op(store, mode, fn) {
      return open().then((db) => new Promise((resolve, reject) => {
        const t = db.transaction(store, mode);
        const r = fn(t.objectStore(store));
        t.oncomplete = () => resolve(r ? r.result : undefined);
        t.onerror = () => reject(t.error || (r && r.error));
        t.onabort = () => reject(t.error || (r && r.error) || new Error('Transazione annullata'));
      }));
    }

    return {
      kind: 'indexeddb',
      open,
      get: (s, k) => op(s, 'readonly', (st) => st.get(k)),
      getAll: (s) => op(s, 'readonly', (st) => st.getAll()),
      put: (s, v) => op(s, 'readwrite', (st) => st.put(v)),
      add: (s, v) => op(s, 'readwrite', (st) => st.add(v)),
      clear: (s) => op(s, 'readwrite', (st) => st.clear()),
    };
  }

  /* ---------- inizializzazione ---------- */
  let be = null;
  let initPromise = null;

  function init() {
    if (!initPromise) {
      initPromise = (async () => {
        try {
          if (typeof indexedDB === 'undefined' || !indexedDB) throw new Error('IndexedDB assente');
          const b = idbBackend();
          await b.open();
          be = b;
        } catch (e) {
          be = memoryBackend();
        }
        return be.kind;
      })();
    }
    return initPromise;
  }

  async function B() {
    await init();
    return be;
  }

  /* ---------- API ---------- */
  async function getProgress(id) { return (await B()).get('progress', id); }
  async function allProgress() { return (await B()).getAll('progress'); }
  async function putProgress(p) { await (await B()).put('progress', p); return p; }
  async function allAttempts() { return (await B()).getAll('attempts'); }

  async function addAttempt(a) {
    const rec = Object.assign({ ts: Date.now() }, a);
    rec.day = localDay(rec.ts);
    await (await B()).add('attempts', rec);
    return rec;
  }

  async function getSetting(key, def) {
    const r = await (await B()).get('settings', key);
    return r === undefined ? def : r.value;
  }
  async function setSetting(key, value) {
    await (await B()).put('settings', { key, value });
    return value;
  }

  // Avanzamento Leitner (funzione pura, testabile)
  function nextQuizProgress(prev, ok, now) {
    const p = Object.assign({ box: 0, seen: 0, correct: 0, wrong: 0 }, prev || {});
    p.seen += 1;
    if (ok) {
      p.correct += 1;
      p.box = Math.min(p.box + 1, INTERVALS.length - 1);
      p.due = now + INTERVALS[p.box] * DAY;
    } else {
      p.wrong += 1;
      p.box = 0;
      p.due = now;
    }
    p.last = now;
    return p;
  }

  async function recordQuizAnswer(item, ok, now) {
    now = now || Date.now();
    const id = 'q:' + item.id;
    const prev = await getProgress(id);
    const base = prev || { id, kind: 'q', itemId: item.id, topic: item.topic };
    const p = nextQuizProgress(base, !!ok, now);
    await putProgress(p);
    await addAttempt({ ts: now, kind: 'quiz', itemId: item.id, topic: item.topic, ok: !!ok });
    return p;
  }

  async function recordDebugRun(item, ok, now) {
    now = now || Date.now();
    const id = 'd:' + item.id;
    const prev = await getProgress(id);
    const p = Object.assign(
      { id, kind: 'd', itemId: item.id, topic: item.topic, runs: 0, solved: false, viewedSolution: false },
      prev || {}
    );
    p.runs += 1;
    p.last = now;
    if (ok && !p.solved) { p.solved = true; p.solvedAt = now; }
    await putProgress(p);
    await addAttempt({ ts: now, kind: 'debug', itemId: item.id, topic: item.topic, ok: !!ok });
    return p;
  }

  async function markSolutionViewed(item, now) {
    now = now || Date.now();
    const id = 'd:' + item.id;
    const prev = await getProgress(id);
    const p = Object.assign(
      { id, kind: 'd', itemId: item.id, topic: item.topic, runs: 0, solved: false, viewedSolution: false },
      prev || {}
    );
    p.viewedSolution = true;
    p.last = now;
    await putProgress(p);
    return p;
  }

  async function recordSim(simId, now) {
    return addAttempt({ ts: now || Date.now(), kind: 'sim', itemId: simId, topic: 'sim', ok: null });
  }

  async function exportAll() {
    const b = await B();
    const [progress, attempts, settings] = await Promise.all([
      b.getAll('progress'), b.getAll('attempts'), b.getAll('settings'),
    ]);
    return {
      app: 'codelab',
      version: 1,
      exportedAt: new Date().toISOString(),
      progress,
      attempts: attempts.map((a) => { const c = Object.assign({}, a); delete c.id; return c; }),
      settings,
    };
  }

  async function clearAll() {
    const b = await B();
    await Promise.all(['progress', 'attempts', 'settings'].map((s) => b.clear(s)));
  }

  async function importAll(obj) {
    if (!obj || obj.app !== 'codelab' || !Array.isArray(obj.progress) || !Array.isArray(obj.attempts)) {
      throw new Error('File di backup non valido');
    }
    const okProgress = obj.progress.filter((p) => p && typeof p.id === 'string');
    const okAttempts = obj.attempts.filter((a) => a && typeof a.ts === 'number' && typeof a.kind === 'string');
    const okSettings = Array.isArray(obj.settings)
      ? obj.settings.filter((s) => s && typeof s.key === 'string') : [];
    await clearAll();
    const b = await B();
    for (const p of okProgress) await b.put('progress', p);
    for (const a of okAttempts) {
      const c = Object.assign({}, a);
      delete c.id;
      if (!c.day) c.day = localDay(c.ts);
      await b.add('attempts', c);
    }
    for (const s of okSettings) await b.put('settings', s);
    return { progress: okProgress.length, attempts: okAttempts.length };
  }

  async function persist() {
    try {
      if (typeof navigator !== 'undefined' && navigator.storage && navigator.storage.persist) {
        return await navigator.storage.persist();
      }
    } catch (e) { /* ignora */ }
    return false;
  }

  CL.db = {
    DAY, INTERVALS, localDay, nextQuizProgress,
    init, mode: () => (be ? be.kind : null),
    getProgress, allProgress, putProgress, allAttempts, addAttempt,
    getSetting, setSetting,
    recordQuizAnswer, recordDebugRun, markSolutionViewed, recordSim,
    exportAll, importAll, clearAll, persist,
  };

  if (typeof module === 'object' && module.exports) module.exports = CL.db;
})();
