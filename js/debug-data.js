/* CodeLab – esercizi di debugging.
   Ogni esercizio ha codice con un bug, test (espressioni valutate dopo il codice dell'utente),
   suggerimento e soluzione. I test automatici verificano che il codice originale FALLISCA
   almeno un test e che la soluzione li superi tutti. */
(function () {
  'use strict';
  const CL = (globalThis.CL = globalThis.CL || {});

  CL.debug = [
    {
      id: 'db01', topic: 'arrays', title: 'Somma di un array',
      desc: 'sum(arr) deve restituire la somma di tutti gli elementi dell\'array. Qualcosa non torna: trova e correggi il bug.',
      code: 'function sum(arr) {\n  let total = 0;\n  for (let i = 1; i < arr.length; i++) {\n    total += arr[i];\n  }\n  return total;\n}',
      tests: [
        { call: 'sum([1, 2, 3])', expected: 6 },
        { call: 'sum([5])', expected: 5 },
        { call: 'sum([])', expected: 0 },
      ],
      hint: 'Da quale indice parte il ciclo? Gli array in JavaScript partono da 0.',
      solution: 'function sum(arr) {\n  let total = 0;\n  for (let i = 0; i < arr.length; i++) {\n    total += arr[i];\n  }\n  return total;\n}',
      explain: 'Errore "off-by-one": il ciclo partiva da i = 1 e saltava il primo elemento. Spesso si evita con for...of o con reduce.',
    },
    {
      id: 'db02', topic: 'types', title: 'Numeri dispari',
      desc: 'isOdd(n) deve restituire true per ogni numero dispari, anche negativo.',
      code: 'function isOdd(n) {\n  return n % 2 === 1;\n}',
      tests: [
        { call: 'isOdd(3)', expected: true },
        { call: 'isOdd(4)', expected: false },
        { call: 'isOdd(-3)', expected: true },
      ],
      hint: 'Prova a calcolare a mano -3 % 2 in JavaScript: il segno del resto segue il dividendo.',
      solution: 'function isOdd(n) {\n  return n % 2 !== 0;\n}',
      explain: 'In JavaScript -3 % 2 vale -1, non 1. Controllare "diverso da zero" funziona con numeri positivi e negativi.',
    },
    {
      id: 'db03', topic: 'funcs', title: 'Intervallo inclusivo',
      desc: 'range(start, end) deve restituire tutti i numeri da start a end, estremi inclusi.',
      code: 'function range(start, end) {\n  const out = [];\n  for (let i = start; i < end; i++) {\n    out.push(i);\n  }\n  return out;\n}',
      tests: [
        { call: 'range(1, 4)', expected: [1, 2, 3, 4] },
        { call: 'range(3, 3)', expected: [3] },
        { call: 'range(5, 4)', expected: [] },
      ],
      hint: 'Con quale operatore di confronto l\'estremo finale viene incluso?',
      solution: 'function range(start, end) {\n  const out = [];\n  for (let i = start; i <= end; i++) {\n    out.push(i);\n  }\n  return out;\n}',
      explain: 'Un altro classico off-by-one: con < l\'ultimo valore resta fuori, serve <=.',
    },
    {
      id: 'db04', topic: 'funcs', title: 'Contatori indipendenti',
      desc: 'Ogni chiamata a makeCounter() deve creare un contatore con il proprio conteggio, indipendente dagli altri.',
      code: 'let count = 0;\n\nfunction makeCounter() {\n  return function () {\n    count++;\n    return count;\n  };\n}',
      tests: [
        { call: '(() => { const a = makeCounter(); a(); a(); return a(); })()', expected: 3 },
        { call: '(() => { const a = makeCounter(); const b = makeCounter(); a(); a(); return b(); })()', expected: 1 },
      ],
      hint: 'Dove vive la variabile count? Tutti i contatori la condividono. Spostala dove ogni contatore ne ottiene una sua.',
      solution: 'function makeCounter() {\n  let count = 0;\n  return function () {\n    count++;\n    return count;\n  };\n}',
      explain: 'La variabile era globale e quindi condivisa. Dichiarandola dentro makeCounter, ogni closure ne ha una copia privata.',
    },
    {
      id: 'db05', topic: 'funcs', title: 'Sommatori in un ciclo',
      desc: 'makeAdders() deve restituire 3 funzioni: la prima aggiunge 0, la seconda 1, la terza 2 al numero ricevuto.',
      code: 'function makeAdders() {\n  var adders = [];\n  for (var i = 0; i < 3; i++) {\n    adders.push(function (x) {\n      return x + i;\n    });\n  }\n  return adders;\n}',
      tests: [
        { call: 'makeAdders().map((f) => f(10))', expected: [10, 11, 12] },
        { call: 'makeAdders()[0](5)', expected: 5 },
      ],
      hint: 'Quante variabili i esistono con var? E quanto vale quando le funzioni vengono chiamate?',
      solution: 'function makeAdders() {\n  const adders = [];\n  for (let i = 0; i < 3; i++) {\n    adders.push(function (x) {\n      return x + i;\n    });\n  }\n  return adders;\n}',
      explain: 'Con var esiste un solo i, che vale 3 a fine ciclo. Con let ogni iterazione ha il proprio i catturato dalla closure.',
    },
    {
      id: 'db06', topic: 'arrays', title: 'Aggiungere senza modificare',
      desc: 'addItem(list, item) deve restituire un NUOVO array con l\'elemento in più, senza modificare l\'array originale.',
      code: 'function addItem(list, item) {\n  list.push(item);\n  return list;\n}',
      tests: [
        { call: '(() => { const a = [1]; const b = addItem(a, 2); return [a, b]; })()', expected: [[1], [1, 2]] },
        { call: 'addItem([], 7)', expected: [7] },
      ],
      hint: 'push modifica l\'array originale. Come puoi creare un nuovo array con tutti gli elementi più uno?',
      solution: 'function addItem(list, item) {\n  return [...list, item];\n}',
      explain: 'Gli array sono passati per riferimento: push modificava quello del chiamante. Lo spread crea un nuovo array (stile immutabile).',
    },
    {
      id: 'db07', topic: 'arrays', title: 'Ordinare numeri',
      desc: 'sortNumbers(arr) deve restituire i numeri in ordine crescente, senza modificare l\'array originale.',
      code: 'function sortNumbers(arr) {\n  return arr.sort();\n}',
      tests: [
        { call: 'sortNumbers([10, 9, 1])', expected: [1, 9, 10] },
        { call: 'sortNumbers([3, -1, 2])', expected: [-1, 2, 3] },
        { call: '(() => { const a = [2, 1]; sortNumbers(a); return a; })()', expected: [2, 1] },
      ],
      hint: 'sort() senza argomenti confronta come stringhe. E ricorda che sort modifica l\'array su cui lavora: lavora su una copia.',
      solution: 'function sortNumbers(arr) {\n  return [...arr].sort((a, b) => a - b);\n}',
      explain: 'Serve una funzione di confronto numerica (a, b) => a - b, e una copia dell\'array per non alterare l\'originale.',
    },
    {
      id: 'db08', topic: 'async', title: 'Await dimenticato',
      desc: 'getTotal(fetchPrice) riceve una funzione che restituisce una Promise con un prezzo, e deve restituire il doppio del prezzo.',
      code: 'async function getTotal(fetchPrice) {\n  const price = fetchPrice();\n  return price * 2;\n}',
      tests: [
        { call: 'getTotal(() => Promise.resolve(21))', expected: 42 },
        { call: 'getTotal(() => Promise.resolve(5))', expected: 10 },
      ],
      hint: 'Che cos\'è price in questo momento: un numero o una Promise?',
      solution: 'async function getTotal(fetchPrice) {\n  const price = await fetchPrice();\n  return price * 2;\n}',
      explain: 'Senza await, price è una Promise e Promise * 2 vale NaN. Con await si ottiene il valore risolto.',
    },
    {
      id: 'db09', topic: 'async', title: 'Errore non catturato',
      desc: 'load(fetcher) deve restituire "errore" quando la Promise di fetcher() viene rifiutata. Ora invece l\'errore sfugge al try/catch.',
      code: 'async function load(fetcher) {\n  try {\n    return fetcher();\n  } catch (e) {\n    return \'errore\';\n  }\n}',
      tests: [
        { call: 'load(() => Promise.reject(new Error(\'x\')))', expected: 'errore' },
        { call: 'load(() => Promise.resolve(\'ok\'))', expected: 'ok' },
      ],
      hint: 'Il return di una Promise dentro try esce dal blocco prima che la Promise sia conclusa. Cosa serve per "aspettarla" lì dentro?',
      solution: 'async function load(fetcher) {\n  try {\n    return await fetcher();\n  } catch (e) {\n    return \'errore\';\n  }\n}',
      explain: 'Con return fetcher() la Promise viene restituita senza essere attesa, quindi il rifiuto avviene fuori dal try. return await la attende dentro il try.',
    },
    {
      id: 'db10', topic: 'types', title: 'Stringa vuota',
      desc: 'isEmpty(value) deve restituire true SOLO per la stringa vuota "".',
      code: 'function isEmpty(value) {\n  return value == \'\';\n}',
      tests: [
        { call: 'isEmpty(\'\')', expected: true },
        { call: 'isEmpty(\'a\')', expected: false },
        { call: 'isEmpty(0)', expected: false },
        { call: 'isEmpty([])', expected: false },
      ],
      hint: 'L\'operatore == converte i tipi prima di confrontare: 0 == "" e [] == "" sono veri. Quale operatore non converte?',
      solution: 'function isEmpty(value) {\n  return value === \'\';\n}',
      explain: 'L\'uguaglianza lasca == applica conversioni implicite sorprendenti. Preferisci sempre === a meno di casi particolari.',
    },
    {
      id: 'db11', topic: 'arrays', title: 'Media di un array',
      desc: 'average(nums) deve restituire la media dei numeri, e 0 se l\'array è vuoto.',
      code: 'function average(nums) {\n  return nums.reduce((acc, n) => acc + n) / nums.length;\n}',
      tests: [
        { call: 'average([2, 4])', expected: 3 },
        { call: 'average([10])', expected: 10 },
        { call: 'average([])', expected: 0 },
      ],
      hint: 'Cosa succede con reduce su un array vuoto quando non gli dai un valore iniziale? E 0 / 0?',
      solution: 'function average(nums) {\n  if (nums.length === 0) return 0;\n  return nums.reduce((acc, n) => acc + n, 0) / nums.length;\n}',
      explain: 'reduce su array vuoto senza valore iniziale lancia un TypeError; inoltre serve gestire a parte il caso vuoto per evitare 0 / 0 = NaN.',
    },
    {
      id: 'db12', topic: 'funcs', title: 'This perso',
      desc: 'getGreeter() deve restituire una funzione che, chiamata da sola, restituisce "Ciao Ada".',
      code: 'const user = {\n  name: \'Ada\',\n  greet() {\n    return \'Ciao \' + this.name;\n  }\n};\n\nfunction getGreeter() {\n  return user.greet;\n}',
      tests: [
        { call: 'getGreeter()()', expected: 'Ciao Ada' },
      ],
      hint: 'Quando estrai un metodo da un oggetto e lo chiami da solo, this non è più user. Come puoi "fissarlo"?',
      solution: 'const user = {\n  name: \'Ada\',\n  greet() {\n    return \'Ciao \' + this.name;\n  }\n};\n\nfunction getGreeter() {\n  return user.greet.bind(user);\n}',
      explain: 'Un metodo staccato dal suo oggetto perde this. bind(user) crea una nuova funzione con this fissato (in alternativa: () => user.greet()).',
    },
  ];

  if (typeof module === 'object' && module.exports) module.exports = CL;
})();
