/* CodeLab – service worker: precache completo, funziona offline.
   Per rilasciare una nuova versione cambia CACHE_VERSION. */
'use strict';
const CACHE_VERSION = 'codelab-v1';
const ASSETS = [
  './',
  'index.html',
  'manifest.webmanifest',
  'css/app.css',
  'js/quiz-a.js', 'js/quiz-b.js', 'js/quiz-c.js', 'js/debug-data.js',
  'js/db.js', 'js/engine.js', 'js/stats.js', 'js/runner.js',
  'js/core.js', 'js/view-home.js', 'js/view-quiz.js', 'js/view-debug.js', 'js/view-sim.js', 'js/view-stats.js', 'js/boot.js',
  'icons/icon.svg', 'icons/icon-180.png', 'icons/icon-192.png', 'icons/icon-512.png', 'icons/maskable-512.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_VERSION)
      // cache: 'reload' evita di precaricare copie vecchie dalla cache HTTP del browser
      .then((cache) => cache.addAll(ASSETS.map((u) => new Request(u, { cache: 'reload' }))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE_VERSION).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  event.respondWith((async () => {
    const cache = await caches.open(CACHE_VERSION);
    // Navigazioni: sempre la pagina principale dalla cache (l'app è una single page)
    if (req.mode === 'navigate') {
      const page = await cache.match('index.html');
      if (page) return page;
    }
    const hit = await cache.match(req, { ignoreSearch: true });
    if (hit) return hit;
    try {
      return await fetch(req);
    } catch (e) {
      return new Response('Offline', { status: 503, statusText: 'Offline' });
    }
  })());
});
