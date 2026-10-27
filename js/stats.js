/* CodeLab – calcolo delle statistiche (funzioni pure, nessun accesso al DOM) */
(function () {
  'use strict';
  const CL = (globalThis.CL = globalThis.CL || {});

  const WEEKDAYS = ['dom', 'lun', 'mar', 'mer', 'gio', 'ven', 'sab'];

  function pad(n) { return String(n).padStart(2, '0'); }
  function fmtDay(d) { return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); }

  // Sposta un giorno "YYYY-MM-DD" di k giorni (usa il mezzogiorno per evitare problemi di ora legale)
  function shiftDay(day, k) {
    const [y, m, d] = day.split('-').map(Number);
    return fmtDay(new Date(y, m - 1, d + k, 12));
  }

  function weekdayOf(day) {
    const [y, m, d] = day.split('-').map(Number);
    return WEEKDAYS[new Date(y, m - 1, d, 12).getDay()];
  }

  function streaks(daySet, today) {
    // serie corrente: giorni consecutivi che terminano oggi (o ieri, se oggi non hai ancora studiato)
    let cur = 0;
    let cursor = daySet.has(today) ? today : shiftDay(today, -1);
    while (daySet.has(cursor)) { cur++; cursor = shiftDay(cursor, -1); }
    // serie migliore
    const days = Array.from(daySet).sort();
    let best = 0;
    let run = 0;
    let prev = null;
    for (const d of days) {
      run = prev && shiftDay(prev, 1) === d ? run + 1 : 1;
      if (run > best) best = run;
      prev = d;
    }
    return { current: cur, best };
  }

  function compute(input) {
    const attempts = input.attempts || [];
    const progressList = input.progress || [];
    const topics = input.topics;
    const quiz = input.quiz;
    const debug = input.debug;
    const now = input.now || Date.now();
    const today = CL.db ? CL.db.localDay(now) : fmtDay(new Date(now));

    const progress = {};
    for (const p of progressList) progress[p.id] = p;

    const qa = attempts.filter((a) => a.kind === 'quiz');
    const da = attempts.filter((a) => a.kind === 'debug');
    const sa = attempts.filter((a) => a.kind === 'sim');

    const quizCorrect = qa.filter((a) => a.ok).length;
    const solved = debug.filter((d) => progress['d:' + d.id] && progress['d:' + d.id].solved).length;

    const studyDays = new Set(attempts.filter((a) => a.kind !== 'sim').map((a) => a.day));
    const st = streaks(studyDays, today);

    // ultimi 14 giorni
    const perDay = {};
    for (const a of attempts) {
      if (a.kind === 'sim') continue;
      perDay[a.day] = (perDay[a.day] || 0) + 1;
    }
    const days = [];
    for (let i = 13; i >= 0; i--) {
      const day = shiftDay(today, -i);
      days.push({ day, label: weekdayOf(day), n: perDay[day] || 0 });
    }

    // per argomento
    const topicStats = topics.map((t) => {
      const items = quiz.filter((q) => q.topic === t.id);
      const ta = qa.filter((a) => a.topic === t.id);
      const tc = ta.filter((a) => a.ok).length;
      let mastered = 0;
      let dueN = 0;
      let seen = 0;
      for (const q of items) {
        const p = progress['q:' + q.id];
        if (p) {
          seen++;
          if (p.box >= 3) mastered++;
          if (p.due <= now) dueN++;
        }
      }
      return {
        id: t.id, name: t.name,
        total: items.length, seen, mastered, due: dueN,
        answered: ta.length, correct: tc,
        accuracy: ta.length ? tc / ta.length : null,
      };
    });

    const totalQuiz = quiz.length;
    const seenAll = topicStats.reduce((s, t) => s + t.seen, 0);
    const dueAll = topicStats.reduce((s, t) => s + t.due, 0);

    const weak = topicStats
      .filter((t) => t.answered >= 3 && t.accuracy !== null && t.accuracy < 0.7)
      .sort((a, b) => a.accuracy - b.accuracy)
      .map((t) => t.id);

    return {
      quiz: {
        answered: qa.length,
        correct: quizCorrect,
        accuracy: qa.length ? quizCorrect / qa.length : null,
        total: totalQuiz,
        seen: seenAll,
        fresh: totalQuiz - seenAll,
        due: dueAll,
        mastered: topicStats.reduce((s, t) => s + t.mastered, 0),
      },
      debug: { runs: da.length, solved, total: debug.length },
      sims: { runs: sa.length },
      streak: Object.assign({ today: studyDays.has(today) }, st),
      days,
      topics: topicStats,
      weak,
    };
  }

  CL.stats = { compute, shiftDay, streaks };
  if (typeof module === 'object' && module.exports) module.exports = CL.stats;
})();
