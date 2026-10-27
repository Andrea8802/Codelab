/* CodeLab – nucleo dell'interfaccia: router a hash, azioni via data-a, utilità */
(function () {
  'use strict';
  const CL = (globalThis.CL = globalThis.CL || {});

  const ESC = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ESC[c]);

  const handlers = {};
  const views = {};
  let current = null;
  let seq = 0;

  function act(name, fn) { handlers[name] = fn; }
  function view(name, v) { views[name] = v; }
  function root() { return document.getElementById('app'); }
  function setHTML(html) { root().innerHTML = html; }

  let toastTimer = null;
  function toast(msg) {
    const t = document.getElementById('toast');
    t.textContent = msg;
    t.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => t.classList.remove('show'), 2600);
  }

  function pct(x) { return x === null || x === undefined ? '–' : Math.round(x * 100) + '%'; }
  function fmtTime(ms) {
    const s = Math.max(0, Math.round(ms / 1000));
    return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0');
  }
  function fmtDate(ts) {
    return new Date(ts).toLocaleDateString('it-IT', { day: 'numeric', month: 'short' });
  }
  function topicName(id) {
    const t = CL.topics.find((x) => x.id === id);
    return t ? t.name : id;
  }
  function code(text) { return '<pre class="code"><code>' + esc(text) + '</code></pre>'; }

  function progressMap(list) {
    const m = {};
    for (const p of list) m[p.id] = p;
    return m;
  }

  function go(path) {
    if (location.hash === '#' + path) return route();
    location.hash = '#' + path;
  }

  function parse() {
    const h = location.hash.replace(/^#\/?/, '');
    const parts = h.split('/').filter(Boolean);
    return { name: parts[0] || 'home', args: parts.slice(1) };
  }

  async function route() {
    const my = ++seq;
    const { name, args } = parse();
    const v = views[name] || views.home;
    if (current && current.leave) { try { current.leave(); } catch (e) { /* ignora */ } }
    current = v;
    const tab = views[name] ? name : 'home';
    document.querySelectorAll('#nav a').forEach((a) => {
      const on = a.dataset.tab === tab;
      a.classList.toggle('on', on);
      if (on) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current');
    });
    document.getElementById('title').textContent = v.title || 'CodeLab';
    try {
      await v.render(args, () => my === seq);
    } catch (e) {
      console.error(e);
      if (my === seq) setHTML('<div class="card"><h2>Qualcosa è andato storto</h2><p class="muted">' + esc(e.message) + '</p><button class="btn" data-a="reload">Ricarica</button></div>');
    }
    if (my === seq) window.scrollTo(0, 0);
  }

  act('reload', () => location.reload());
  act('go', (el) => go(el.dataset.to));

  document.addEventListener('click', (e) => {
    const el = e.target.closest('[data-a]');
    if (!el || el.disabled) return;
    const fn = handlers[el.dataset.a];
    if (!fn) return;
    e.preventDefault();
    Promise.resolve(fn(el, e)).catch((err) => { console.error(err); toast('Errore: ' + err.message); });
  });

  window.addEventListener('hashchange', route);

  function updateNet() {
    const el = document.getElementById('net');
    el.hidden = navigator.onLine;
  }
  window.addEventListener('online', updateNet);
  window.addEventListener('offline', updateNet);

  CL.ui = { esc, act, view, setHTML, toast, pct, fmtTime, fmtDate, topicName, code, progressMap, go, route, updateNet, root };
})();
