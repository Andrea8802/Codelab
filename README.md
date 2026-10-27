# CodeLab – impara JavaScript (PWA)

App mobile installabile, in italiano, che funziona offline.

- **Quiz**: 60 domande su 5 argomenti con ripetizione dilazionata (le sbagliate tornano presto).
- **Debug**: 12 esercizi; correggi il codice e lo verifichi con test eseguiti davvero (in un Web Worker, con stop dei cicli infiniti).
- **Simulazione**: 20 domande miste, 20 minuti, si può riprendere dopo la chiusura dell'app.
- **Statistiche**: precisione, serie di giorni, argomenti deboli, grafico a 14 giorni, backup/ripristino JSON.
- **Dati** salvati sul dispositivo con IndexedDB. Nessun server, nessun account, nessun tracciamento.

## Pubblicare gratis (GitHub Pages)

1. Crea un account su github.com e un nuovo repository **pubblico** (es. `codelab`).
2. Nel repository: **Add file → Upload files**. Trascina **il contenuto** della cartella `codelab` (non lo zip): `index.html`, `sw.js`, `manifest.webmanifest` e le cartelle `css`, `js`, `icons`. Poi **Commit changes**.
3. **Settings → Pages → Build and deployment**: Source = *Deploy from a branch*, Branch = `main`, cartella `/ (root)` → **Save**.
4. Dopo 1–2 minuti l'app è su `https://TUO-NOME.github.io/codelab/`.

Alternativa senza Git: trascina la cartella su https://app.netlify.com/drop (gratuito).

## Installarla sul telefono

- **Android (Chrome)**: apri l'indirizzo → pulsante *Installa CodeLab* nella schermata Oggi, oppure menu ⋮ → *Installa app*.
- **iPhone (Safari)**: *Condividi* → *Aggiungi alla schermata Home*.

Dopo la prima apertura online, l'app funziona anche senza rete.

## Aggiornare

Modifica i file, ricaricali, e in `sw.js` cambia `CACHE_VERSION` (es. `codelab-v2`): i telefoni scaricano la nuova versione al prossimo avvio con rete. I progressi non vanno persi.

## Struttura

```
index.html  sw.js  manifest.webmanifest
css/app.css
icons/            icone PWA (192, 512, maskable, iOS, svg)
js/quiz-*.js      domande        js/debug-data.js  esercizi
js/db.js          IndexedDB      js/engine.js      selezione domande
js/stats.js       statistiche    js/runner.js      esecuzione test (Web Worker)
js/core.js, view-*.js, boot.js   interfaccia
tests/            content.test.js (contenuti), e2e.js (browser)
```

## Test (facoltativi)

```
node tests/content.test.js                       # esegue il codice di ogni domanda/esercizio
npm i playwright && node tests/e2e.js            # prova completa in Chromium (viewport mobile)
```

## Note

- I dati stanno nel browser del singolo dispositivo: se cancelli i dati del sito o disinstalli l'app vanno persi. Usa **Statistiche → Esporta backup** per salvarli.
- Il codice degli esercizi gira in un Web Worker nel tuo browser; non viene inviato da nessuna parte.
- Per aggiungere domande: copia il formato in `js/quiz-c.js`; `node tests/content.test.js` verifica che la risposta indicata coincida con l'output reale.
