/* Test end-to-end con Chromium (Playwright): node tests/e2e.js */
'use strict';
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert');
const { chromium } = require('playwright');

const root = path.join(__dirname, '..');
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.webmanifest': 'application/manifest+json', '.png': 'image/png', '.svg': 'image/svg+xml' };

const server = http.createServer((req, res) => {
  let p = decodeURIComponent(req.url.split('?')[0]);
  if (p.endsWith('/')) p += 'index.html';
  const f = path.join(root, p);
  if (!f.startsWith(root) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); return res.end('nf'); }
  res.writeHead(200, { 'Content-Type': TYPES[path.extname(f)] || 'application/octet-stream', 'Cache-Control': 'no-cache' });
  fs.createReadStream(f).pipe(res);
});

let step = 0;
function ok(msg) { console.log('  ✓ ' + msg); step++; }

(async () => {
  await new Promise((r) => server.listen(0, '127.0.0.1', r));
  const base = 'http://127.0.0.1:' + server.address().port + '/';
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 390, height: 780 }, hasTouch: true, isMobile: true, acceptDownloads: true });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push('pageerror: ' + e.message));
  page.on('console', (m) => { if (m.type() === 'error') errors.push('console: ' + m.text()); });
  page.on('dialog', (d) => d.accept());

  const noOverflow = async (label) => {
    const w = await page.evaluate(() => [document.documentElement.scrollWidth, window.innerWidth]);
    assert.ok(w[0] <= w[1] + 1, `overflow orizzontale in ${label}: ${w[0]} > ${w[1]}`);
  };
  const text = () => page.locator('#app').innerText();

  console.log('== PWA ==');
  await page.goto(base);
  await page.waitForSelector('.stats3');
  ok('home caricata');
  await page.waitForFunction(() => navigator.serviceWorker.controller || false, null, { timeout: 15000 }).catch(() => {});
  await page.evaluate(() => navigator.serviceWorker.ready);
  const man = await page.evaluate(async () => {
    const m = await (await fetch('manifest.webmanifest')).json();
    const checks = await Promise.all(m.icons.map((i) => fetch(i.src).then((r) => r.ok)));
    return { name: m.name, display: m.display, icons: checks };
  });
  assert.strictEqual(man.display, 'standalone');
  assert.ok(man.icons.every(Boolean), 'icone del manifest mancanti');
  ok('manifest valido e icone raggiungibili');
  const cached = await page.evaluate(async () => (await (await caches.open('codelab-v1')).keys()).length);
  const listed = fs.readFileSync(path.join(root, 'sw.js'), 'utf8').match(/const ASSETS = \[([\s\S]*?)\];/)[1].match(/'[^']+'/g).length;
  assert.strictEqual(cached, listed, 'precache incompleto: ' + cached + ' su ' + listed);
  ok(`service worker attivo, ${cached} file in cache`);

  console.log('== Quiz ==');
  await page.click('[data-a="quiz.start"]');
  await page.waitForSelector('.opt');
  for (let i = 0; i < 10; i++) {
    await page.click('.opt >> nth=0');
    await page.waitForSelector('.feedback');
    await noOverflow('quiz');
    await page.click('[data-a="quiz.next"]');
  }
  assert.match(await text(), /Sessione completata/);
  ok('sessione da 10 domande completata');
  const counts = await page.evaluate(() => CL.db.allAttempts().then((a) => a.filter((x) => x.kind === 'quiz').length));
  assert.strictEqual(counts, 10);
  ok('10 risposte salvate in IndexedDB (' + (await page.evaluate(() => CL.db.mode())) + ')');

  console.log('== Persistenza ==');
  await page.reload();
  await page.waitForSelector('.chips'); // a /quiz/play senza sessione l'app torna alla selezione
  await page.click('#nav a[data-tab="home"]');
  await page.waitForSelector('.stats3');
  assert.match(await page.locator('.stats3').innerText(), /10\s*risposte oggi/);
  ok('dopo il reload i dati ci sono ancora');

  console.log('== Debug ==');
  await page.click('#nav a[data-tab="debug"]');
  await page.waitForSelector('.row-link');
  await page.click('a[href="#/debug/db01"]');
  await page.waitForSelector('#ed');
  await page.click('[data-a="dbg.run"]');
  await page.waitForSelector('.tests');
  assert.match(await page.locator('#res').innerText(), /test superati/);
  assert.doesNotMatch(await page.locator('#res').innerText(), /Tutti i test superati/);
  ok('codice con bug: test falliti, con atteso/ottenuto');
  await page.fill('#ed', 'function sum(arr) {\n  let total = 0;\n  for (let i = 0; i < arr.length; i++) total += arr[i];\n  return total;\n}');
  await page.click('[data-a="dbg.run"]');
  await page.waitForSelector('.feedback.ok');
  assert.match(await page.locator('#res').innerText(), /Tutti i test superati/);
  ok('correzione accettata');
  await page.fill('#ed', 'function sum(arr) { while (true) {} }');
  const t0 = Date.now();
  await page.click('[data-a="dbg.run"]');
  await page.waitForSelector('.feedback.ko', { timeout: 8000 });
  assert.match(await page.locator('#res').innerText(), /non termina/);
  ok('ciclo infinito interrotto dopo ' + Math.round((Date.now() - t0) / 100) / 10 + ' s, la pagina resta reattiva');
  await page.fill('#ed', 'function sum(arr { return 1 }');
  await page.click('[data-a="dbg.run"]');
  await page.waitForSelector('.feedback.ko');
  assert.match(await page.locator('#res').innerText(), /sintassi/);
  ok('errore di sintassi segnalato');
  await page.reload();
  await page.waitForSelector('#ed');
  assert.match(await page.inputValue('#ed'), /while \(true\)|function sum\(arr \{/);
  ok('la bozza del codice sopravvive al reload');
  await page.click('#nav a[data-tab="debug"]');
  await page.waitForSelector('.row-link');
  assert.match(await text(), /risolto/);
  ok('esercizio segnato come risolto');

  console.log('== Simulazione ==');
  await page.click('#nav a[data-tab="sim"]');
  await page.click('[data-a="sim.start"]');
  await page.waitForSelector('#timer');
  for (let i = 0; i < 5; i++) { await page.click('.opt >> nth=1'); await page.click('[data-a="sim.next"]'); }
  await noOverflow('sim');
  await page.waitForTimeout(300);
  await page.reload();
  await page.waitForSelector('#timer');
  assert.match(await text(), /Domanda 6\/20 · 5 risposte/);
  ok('dopo il reload la simulazione riparte dalla domanda 6 con le 5 risposte');
  await page.click('#nav a[data-tab="home"]');
  await page.click('#nav a[data-tab="sim"]');
  await page.waitForSelector('[data-a="sim.resume"]');
  assert.match(await text(), /5 risposte date/);
  ok('uscendo dalla simulazione compare "Riprendi" con il tempo rimasto');
  await page.click('[data-a="sim.resume"]');
  await page.waitForSelector('#timer');
  await page.click('[data-a="sim.submit"] >> nth=0');
  await page.waitForSelector('.score');
  assert.match(await text(), /per argomento/i);
  ok('simulazione consegnata, risultato: ' + (await page.locator('.score').innerText()).trim());
  await noOverflow('risultato sim');
  const simSaved = await page.evaluate(() => CL.db.allAttempts().then((a) => a.filter((x) => x.kind === 'sim').length));
  assert.strictEqual(simSaved, 1);
  ok('risultato salvato');

  console.log('== Statistiche ==');
  await page.click('#nav a[data-tab="stats"]');
  await page.waitForSelector('.chart');
  const st = await text();
  assert.match(st, /risposte ai quiz/);
  assert.match(st, /per argomento/i);
  assert.match(st, /1\s*simulazioni/);
  await noOverflow('statistiche');
  ok('statistiche coerenti con l\'attività svolta');
  const [dl] = await Promise.all([page.waitForEvent('download'), page.click('[data-a="data.export"]')]);
  const exported = JSON.parse(fs.readFileSync(await dl.path(), 'utf8'));
  assert.strictEqual(exported.app, 'codelab');
  assert.ok(exported.attempts.length >= 30);
  ok('export backup: ' + exported.attempts.length + ' tentativi');

  console.log('== Backup: azzera e importa ==');
  const tmp = path.join(require('node:os').tmpdir(), 'codelab-backup-test.json');
  fs.writeFileSync(tmp, JSON.stringify(exported));
  await Promise.all([page.waitForEvent('load'), page.click('[data-a="data.reset"]')]);
  await page.waitForSelector('.chart');
  assert.strictEqual(await page.evaluate(() => CL.db.allAttempts().then((a) => a.length)), 0);
  ok('azzeramento completato');
  await page.waitForSelector('#file', { state: 'attached' });
  await page.setInputFiles('#file', tmp);
  await page.waitForFunction(() => CL.db.allAttempts().then((a) => a.length > 0) && true);
  await page.waitForTimeout(400);
  assert.ok((await page.evaluate(() => CL.db.allAttempts().then((a) => a.length))) >= 30);
  ok('import backup ripristina i dati');

  console.log('== Offline ==');
  await ctx.setOffline(true);
  await page.goto(base);
  await page.waitForSelector('.stats3', { timeout: 8000 });
  ok('app avviata senza rete (dal service worker)');
  assert.ok(await page.locator('#net').isVisible(), 'indicatore offline assente');
  await page.click('#nav a[data-tab="quiz"]');
  await page.click('[data-a="quiz.go"]');
  await page.waitForSelector('.opt');
  await page.click('.opt >> nth=0');
  await page.waitForSelector('.feedback');
  ok('quiz funzionante offline');
  await page.goto(base + '#/debug/db02');
  await page.waitForSelector('#ed');
  await page.click('[data-a="dbg.run"]');
  await page.waitForSelector('.tests');
  ok('debug (Web Worker) funzionante offline');
  await ctx.setOffline(false);

  console.log('== Errori in console ==');
  assert.deepStrictEqual(errors.filter((e) => !/Failed to load resource/.test(e)), []);
  ok('nessun errore JavaScript');

  await browser.close();
  server.close();
  console.log(`\nE2E OK (${step} controlli)`);
})().catch(async (e) => {
  console.error('\nE2E FALLITO:', e.message);
  process.exit(1);
});
