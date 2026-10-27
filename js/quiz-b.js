/* CodeLab – contenuti: quiz (parte B: array/oggetti, asincronia). */
(function () {
  'use strict';
  const CL = (globalThis.CL = globalThis.CL || {});
  CL.quiz = CL.quiz || [];
  const OUT = 'Cosa stampa questo codice?';

  CL.quiz.push(
    /* ---------------- Array e oggetti ---------------- */
    {
      id: 'ar01', topic: 'arrays', q: OUT, run: true,
      code: "console.log([1, 2, 3].map(n => n * 2).join('-'));",
      options: ['2-4-6', '1-2-3', '6', '2,4,6'], answer: 0,
      explain: 'map restituisce un nuovo array con il risultato della funzione per ogni elemento; join lo unisce con il separatore dato.',
    },
    {
      id: 'ar02', topic: 'arrays', q: OUT, run: true,
      code: "console.log([1, 2, 3, 4, 5].filter(n => n % 2 === 0).join(','));",
      options: ['1,3,5', '2,4', '2,4,5', '4'], answer: 1,
      explain: 'filter tiene solo gli elementi per cui la funzione restituisce un valore truthy.',
    },
    {
      id: 'ar03', topic: 'arrays', q: OUT, run: true,
      code: 'console.log([1, 2, 3, 4].reduce((acc, n) => acc + n, 10));',
      options: ['10', '20', '24', '6'], answer: 1,
      explain: 'reduce parte dal valore iniziale (10) e accumula: 10 + 1 + 2 + 3 + 4 = 20.',
    },
    {
      id: 'ar04', topic: 'arrays', q: OUT, run: true,
      code: 'const a = [1, 2, 3];\nconst b = a;\nb.push(4);\nconsole.log(a.length);',
      options: ['3', '4', '1', 'undefined'], answer: 1,
      explain: 'Gli array sono oggetti: b e a puntano allo stesso array. Per una copia serve [...a] oppure a.slice().',
    },
    {
      id: 'ar05', topic: 'arrays', q: OUT, run: true,
      code: 'console.log([10, 9, 1].sort().join());',
      options: ['1,9,10', '1,10,9', '10,9,1', '9,10,1'], answer: 1,
      explain: 'Senza funzione di confronto sort ordina come stringhe ("1" < "10" < "9"). Per i numeri: sort((a, b) => a - b).',
    },
    {
      id: 'ar06', topic: 'arrays', q: OUT, run: true,
      code: 'console.log([1, 2, 3].indexOf(4), [1, 2, 3].includes(2));',
      options: ['-1 true', 'undefined true', '-1 2', '0 false'], answer: 0,
      explain: 'indexOf restituisce -1 se non trova l\'elemento; includes restituisce un booleano.',
    },
    {
      id: 'ar07', topic: 'arrays', q: OUT, run: true,
      code: 'const a = [1, 2, 3, 4];\nconst r = a.splice(1, 2);\nconsole.log(a.join(), r.join());',
      options: ['1,4 2,3', '2,3 1,4', '1,2,3,4 2,3', '1,4 3,4'], answer: 0,
      explain: 'splice MODIFICA l\'array originale: rimuove 2 elementi dalla posizione 1 e li restituisce. slice invece non modifica nulla.',
    },
    {
      id: 'ar08', topic: 'arrays', q: OUT, run: true,
      code: 'const o = { n: { v: 1 } };\nconst c = { ...o };\nc.n.v = 2;\nconsole.log(o.n.v);',
      options: ['1', '2', 'undefined', 'TypeError'], answer: 1,
      explain: 'Lo spread crea una copia superficiale: l\'oggetto annidato n è condiviso. Per una copia profonda c\'è structuredClone().',
    },
    {
      id: 'ar09', topic: 'arrays', q: OUT, run: true,
      code: 'console.log(Object.keys({ b: 1, a: 2, 1: 3 }).join());',
      options: ['b,a,1', '1,b,a', 'a,b,1', '1,a,b'], answer: 1,
      explain: 'Le chiavi intere vengono elencate per prime in ordine crescente; le altre seguono in ordine di inserimento.',
    },
    {
      id: 'ar10', topic: 'arrays',
      q: 'Quale metodo crea una copia superficiale di (una parte di) un array senza modificare l\'originale?',
      options: ['slice()', 'splice()', 'push()', 'sort()'], answer: 0,
      explain: 'slice restituisce un nuovo array. splice, push e sort modificano l\'array su cui vengono chiamati.',
    },
    {
      id: 'ar11', topic: 'arrays', q: OUT, run: true,
      code: "console.log([...'abc'].reverse().join(''));",
      options: ['abc', 'cba', 'a,b,c', 'c,b,a'], answer: 1,
      explain: 'Lo spread trasforma la stringa in un array di caratteri; reverse lo inverte e join(\'\') lo ricompone.',
    },
    {
      id: 'ar12', topic: 'arrays', q: OUT, run: true,
      code: 'console.log([1, [2, [3]]].flat(Infinity).length);',
      options: ['2', '3', '1', 'Infinity'], answer: 1,
      explain: 'flat(Infinity) appiattisce tutti i livelli: [1, 2, 3], quindi lunghezza 3.',
    },

    /* ---------------- Asincronia ---------------- */
    {
      id: 'as01', topic: 'async', q: OUT, run: true,
      code: "console.log('A');\nsetTimeout(() => console.log('B'), 0);\nconsole.log('C');",
      options: ['A → B → C', 'A → C → B', 'B → A → C', 'C → B → A'], answer: 1,
      explain: 'Il codice sincrono finisce sempre per primo: la callback del timer entra nello stack solo quando è vuoto, anche con ritardo 0.',
    },
    {
      id: 'as02', topic: 'async', q: OUT, run: true,
      code: "setTimeout(() => console.log('timeout'), 0);\nPromise.resolve().then(() => console.log('promise'));\nconsole.log('sync');",
      options: ['sync → timeout → promise', 'sync → promise → timeout', 'promise → sync → timeout', 'timeout → promise → sync'], answer: 1,
      explain: 'Le microtask (promise) vengono svuotate prima del prossimo task (timer) dell\'event loop.',
    },
    {
      id: 'as03', topic: 'async',
      q: 'Cosa restituisce SEMPRE una funzione dichiarata con async?',
      options: ['Una Promise', 'Il valore del return, direttamente', 'undefined', 'Un generatore'], answer: 0,
      explain: 'Il valore restituito viene incapsulato in una Promise; se la funzione lancia un errore, la Promise viene rifiutata.',
    },
    {
      id: 'as04', topic: 'async', q: OUT, run: true,
      code: 'async function f() {\n  console.log(1);\n  await null;\n  console.log(3);\n}\nf();\nconsole.log(2);',
      options: ['1 → 2 → 3', '1 → 3 → 2', '2 → 1 → 3', '1 → 2'], answer: 0,
      explain: 'f gira in modo sincrono fino al primo await; il resto viene messo in coda come microtask e riparte dopo il codice sincrono.',
    },
    {
      id: 'as05', topic: 'async',
      q: 'Cosa succede se una delle promise passate a Promise.all viene rifiutata?',
      options: [
        'La promise restituita viene subito rifiutata con quell\'errore',
        'Promise.all aspetta tutte e restituisce solo quelle riuscite',
        'Viene ignorata e le altre continuano',
        'Il programma si interrompe',
      ], answer: 0,
      explain: 'Promise.all è "tutto o niente". Per ottenere l\'esito di ognuna, comprese le rifiutate, si usa Promise.allSettled.',
    },
    {
      id: 'as06', topic: 'async', q: OUT, run: true,
      code: 'Promise.resolve(1)\n  .then(v => v + 1)\n  .then(v => console.log(v));',
      options: ['1', '2', 'undefined', '[object Promise]'], answer: 1,
      explain: 'Il valore restituito da un then diventa il valore della promise successiva nella catena.',
    },
    {
      id: 'as07', topic: 'async', q: OUT, run: true,
      code: "Promise.reject(new Error('x'))\n  .catch(() => 'ok')\n  .then(v => console.log(v));",
      options: ['ok', 'x', 'undefined', 'Error: x'], answer: 0,
      explain: 'catch gestisce l\'errore e, restituendo un valore, la catena torna in stato "risolto" con quel valore.',
    },
    {
      id: 'as08', topic: 'async', q: OUT, run: true,
      code: "async function f() {\n  try {\n    await Promise.reject(new Error('boom'));\n  } catch (e) {\n    console.log(e.message);\n  }\n}\nf();",
      options: ['boom', 'Error', 'undefined', 'Unhandled rejection'], answer: 0,
      explain: 'Con await, una promise rifiutata lancia l\'errore nel punto dell\'await, quindi try/catch funziona come per il codice sincrono.',
    },
    {
      id: 'as09', topic: 'async', q: OUT, run: true,
      code: "setTimeout(() => console.log('b'), 10);\nsetTimeout(() => console.log('a'), 0);",
      options: ['b → a', 'a → b', 'a', 'b'], answer: 1,
      explain: 'I timer scattano in base al ritardo, non all\'ordine di scrittura: quello da 0 ms parte prima di quello da 10 ms.',
    },
    {
      id: 'as10', topic: 'async',
      q: 'Cosa fa Promise.race([p1, p2])?',
      options: [
        'Si conclude (con esito positivo o negativo) come la prima promise che termina',
        'Aspetta che terminino tutte le promise',
        'Restituisce solo la prima promise risolta con successo',
        'Esegue p1 e p2 in sequenza',
      ], answer: 0,
      explain: 'race "ricalca" la prima promise che si conclude, anche se è un rifiuto. Per la prima riuscita si usa Promise.any.',
    },
    {
      id: 'as11', topic: 'async', q: OUT, run: true,
      code: 'async function g() {\n  return 5;\n}\nconsole.log(g() === 5);',
      options: ['true', 'false', 'TypeError', '5'], answer: 1,
      explain: 'g() restituisce una Promise, non il numero 5: serve await g() oppure g().then(...).',
    },
    {
      id: 'as12', topic: 'async', q: OUT, run: true,
      code: "Promise.resolve().then(() => {\n  console.log('A');\n  Promise.resolve().then(() => console.log('B'));\n});\nsetTimeout(() => console.log('C'), 0);",
      options: ['A → C → B', 'A → B → C', 'C → A → B', 'B → A → C'], answer: 1,
      explain: 'Le microtask create durante una microtask sono eseguite nello stesso ciclo, prima di qualsiasi timer.',
    }
  );

  if (typeof module === 'object' && module.exports) module.exports = CL;
})();
