/* CodeLab – avvio: database, service worker, prompt di installazione */
(function () {
  'use strict';
  const CL = globalThis.CL;

  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    CL.installPrompt = e;
    if (!location.hash || location.hash === '#/' || location.hash === '#') CL.ui.route();
  });
  window.addEventListener('appinstalled', () => { CL.installPrompt = null; });

  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('sw.js').catch((err) => console.warn('Service worker non registrato', err));
    navigator.serviceWorker.ready.then(() => {
      CL.offlineReady = true;
      if (!location.hash || location.hash === '#/' || location.hash === '#') CL.ui.route();
    });
    // Quando una nuova versione prende il controllo, ricarica solo se non si è nel mezzo di una prova
    let hadController = !!navigator.serviceWorker.controller;
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (!hadController) { hadController = true; return; }
      if (!CL.busy) location.reload();
    });
  }

  CL.ui.updateNet();
  CL.db.init().then(() => {
    CL.db.persist();
    return CL.ui.route();
  });
})();
