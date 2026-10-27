/* CodeLab – contenuti: argomenti e quiz (parte A: tipi, funzioni).
   Le domande con `run: true` hanno `code` eseguibile: la risposta corretta è l'output reale
   (righe di console.log unite da " → "). I test automatici lo verificano eseguendo il codice. */
(function () {
  'use strict';
  const CL = (globalThis.CL = globalThis.CL || {});

  CL.topics = [
    { id: 'types', name: 'Tipi e variabili' },
    { id: 'funcs', name: 'Funzioni e scope' },
    { id: 'arrays', name: 'Array e oggetti' },
    { id: 'async', name: 'Asincronia' },
    { id: 'es6', name: 'ES6+ moderno' },
  ];

  CL.quiz = CL.quiz || [];
  const OUT = 'Cosa stampa questo codice?';

  CL.quiz.push(
    /* ---------------- Tipi e variabili ---------------- */
    {
      id: 'ty01', topic: 'types', q: OUT, run: true,
      code: 'console.log(typeof null);',
      options: ['object', 'null', 'undefined', 'number'], answer: 0,
      explain: 'È un bug storico del linguaggio: typeof null restituisce "object". Per controllare null si usa value === null.',
    },
    {
      id: 'ty02', topic: 'types', q: OUT, run: true,
      code: 'console.log(0.1 + 0.2 === 0.3);',
      options: ['true', 'false', 'undefined', 'NaN'], answer: 1,
      explain: 'I numeri sono in virgola mobile binaria: 0.1 + 0.2 vale 0.30000000000000004. Per confrontare si usa una tolleranza.',
    },
    {
      id: 'ty03', topic: 'types', q: OUT, run: true,
      code: "console.log('5' + 3, '5' - 3);",
      options: ['53 2', '8 2', '53 53', '8 8'], answer: 0,
      explain: 'Il + con una stringa concatena ("53"), mentre il - converte in numero (5 - 3 = 2).',
    },
    {
      id: 'ty04', topic: 'types', q: OUT, run: true,
      code: 'console.log(typeof NaN);',
      options: ['NaN', 'undefined', 'number', 'object'], answer: 2,
      explain: 'NaN ("Not a Number") è comunque un valore di tipo number. Si controlla con Number.isNaN().',
    },
    {
      id: 'ty05', topic: 'types',
      q: 'Qual è la differenza principale tra let e var?',
      options: [
        'let ha scope di blocco, var ha scope di funzione',
        'let è più veloce di var',
        'var non si può riassegnare, let sì',
        'let è disponibile solo nei moduli',
      ], answer: 0,
      explain: 'let (e const) hanno scope di blocco e non si possono usare prima della dichiarazione; var vale per tutta la funzione ed è "hoistata".',
    },
    {
      id: 'ty06', topic: 'types', q: OUT, run: true,
      code: "const a = 1;\ntry {\n  a = 2;\n} catch (e) {\n  console.log(e.name);\n}",
      options: ['SyntaxError', 'TypeError', 'ReferenceError', '2'], answer: 1,
      explain: 'Riassegnare una const lancia un TypeError ("Assignment to constant variable").',
    },
    {
      id: 'ty07', topic: 'types', q: OUT, run: true,
      code: 'console.log(null == undefined, null === undefined);',
      options: ['true false', 'false false', 'true true', 'false true'], answer: 0,
      explain: 'L\'uguaglianza lasca == considera null e undefined uguali, quella stretta === no perché i tipi sono diversi.',
    },
    {
      id: 'ty08', topic: 'types', q: OUT, run: true,
      code: "console.log(Boolean('0'), Boolean(''), Boolean(0));",
      options: ['false false false', 'true false false', 'true true false', 'true false true'], answer: 1,
      explain: 'Una stringa non vuota è truthy, anche se contiene "0". Sono falsy: false, 0, "", null, undefined, NaN (e 0n).',
    },
    {
      id: 'ty09', topic: 'types', q: OUT, run: true,
      code: "console.log(Number('12px'), parseInt('12px'));",
      options: ['12 12', 'NaN NaN', 'NaN 12', '12 NaN'], answer: 2,
      explain: 'Number() richiede che l\'intera stringa sia numerica; parseInt() legge le cifre iniziali e ignora il resto.',
    },
    {
      id: 'ty10', topic: 'types', q: OUT, run: true,
      code: 'console.log(a);\nvar a = 5;',
      options: ['5', 'undefined', 'ReferenceError', 'null'], answer: 1,
      explain: 'Hoisting: la dichiarazione var viene "sollevata" e inizializzata a undefined; l\'assegnazione resta dov\'è. Con let darebbe ReferenceError.',
    },
    {
      id: 'ty11', topic: 'types',
      q: 'Quale di questi NON è un tipo primitivo in JavaScript?',
      options: ['string', 'symbol', 'object', 'bigint'], answer: 2,
      explain: 'I primitivi sono string, number, bigint, boolean, undefined, null e symbol. Gli oggetti (array e funzioni inclusi) sono valori per riferimento.',
    },
    {
      id: 'ty12', topic: 'types', q: OUT, run: true,
      code: 'const o = { a: 1 };\no.a = 2;\nconsole.log(o.a);',
      options: ['1', '2', 'TypeError', 'undefined'], answer: 1,
      explain: 'const impedisce di riassegnare la variabile, non di modificare l\'oggetto a cui punta.',
    },

    /* ---------------- Funzioni e scope ---------------- */
    {
      id: 'fu01', topic: 'funcs', q: OUT, run: true,
      code: 'function make() {\n  let c = 0;\n  return () => ++c;\n}\nconst f = make();\nf();\nf();\nconsole.log(f());',
      options: ['1', '2', '3', '0'], answer: 2,
      explain: 'Closure: la funzione restituita "ricorda" la variabile c del suo ambiente, che persiste tra le chiamate.',
    },
    {
      id: 'fu02', topic: 'funcs', q: OUT, run: true,
      code: 'for (var i = 0; i < 3; i++) {\n  setTimeout(() => console.log(i), 0);\n}',
      options: ['0 → 1 → 2', '3 → 3 → 3', '2 → 2 → 2', '0 → 0 → 0'], answer: 1,
      explain: 'var ha scope di funzione: esiste un solo i, che vale 3 quando i timer scattano.',
    },
    {
      id: 'fu03', topic: 'funcs', q: OUT, run: true,
      code: 'for (let i = 0; i < 3; i++) {\n  setTimeout(() => console.log(i), 0);\n}',
      options: ['0 → 1 → 2', '3 → 3 → 3', '2 → 1 → 0', 'undefined → undefined → undefined'], answer: 0,
      explain: 'let crea una nuova variabile i per ogni iterazione del ciclo, quindi ogni callback vede il proprio valore.',
    },
    {
      id: 'fu04', topic: 'funcs',
      q: 'Quale affermazione sulle arrow function è corretta?',
      options: [
        'Non hanno un proprio this: lo ereditano dallo scope in cui sono definite',
        'Hanno sempre this uguale a window',
        'Si possono usare come costruttori con new',
        'Hanno accesso all\'oggetto arguments',
      ], answer: 0,
      explain: 'Le arrow function non hanno this, arguments né prototype propri e non si possono usare con new.',
    },
    {
      id: 'fu05', topic: 'funcs', q: OUT, run: true,
      code: 'console.log(sum(2, 3));\nfunction sum(a, b) {\n  return a + b;\n}',
      options: ['5', 'undefined', 'ReferenceError', 'TypeError'], answer: 0,
      explain: 'Le function declaration vengono sollevate (hoisting) insieme al loro corpo, quindi si possono chiamare prima della riga in cui sono scritte.',
    },
    {
      id: 'fu06', topic: 'funcs', q: OUT, run: true,
      code: 'try {\n  console.log(f());\n} catch (e) {\n  console.log(e.name);\n}\nvar f = function () {\n  return 1;\n};',
      options: ['1', 'undefined', 'ReferenceError', 'TypeError'], answer: 3,
      explain: 'Con var viene sollevata solo la variabile (valore undefined), non la funzione: chiamare undefined() lancia TypeError.',
    },
    {
      id: 'fu07', topic: 'funcs', q: OUT, run: true,
      code: 'function g(a, b = a * 2) {\n  return a + b;\n}\nconsole.log(g(2), g(2, 1));',
      options: ['4 3', '6 3', '6 4', 'NaN 3'], answer: 1,
      explain: 'Il valore di default si applica solo se l\'argomento è undefined, e può usare i parametri precedenti: g(2) = 2 + 4, g(2, 1) = 2 + 1.',
    },
    {
      id: 'fu08', topic: 'funcs', q: OUT, run: true,
      code: 'function h(...args) {\n  return args.length;\n}\nconsole.log(h(1, 2, 3), h());',
      options: ['3 0', '3 undefined', '1 0', '3 1'], answer: 0,
      explain: 'Il parametro rest raccoglie tutti gli argomenti in un array vero (vuoto se non ce ne sono).',
    },
    {
      id: 'fu09', topic: 'funcs', q: OUT, run: true,
      code: 'const f = () => { a: 1 };\nconsole.log(f());',
      options: ['{ a: 1 }', '1', 'undefined', 'SyntaxError'], answer: 2,
      explain: 'Le graffe dopo => sono un blocco, non un oggetto: "a: 1" è un\'etichetta. Per restituire un oggetto servono le parentesi: () => ({ a: 1 }).',
    },
    {
      id: 'fu10', topic: 'funcs', q: OUT, run: true,
      code: "console.log(['1', '2', '3'].map(parseInt).join());",
      options: ['1,2,3', '1,NaN,NaN', '1,2,NaN', 'NaN,NaN,NaN'], answer: 1,
      explain: 'map passa (valore, indice, array): parseInt riceve l\'indice come base. parseInt("2", 1) e parseInt("3", 2) danno NaN.',
    },
    {
      id: 'fu11', topic: 'funcs', q: OUT, run: true,
      code: "let x = 'globale';\nfunction f() {\n  let x = 'locale';\n  return x;\n}\nf();\nconsole.log(x);",
      options: ['locale', 'globale', 'undefined', 'ReferenceError'], answer: 1,
      explain: 'La x dentro f è una variabile diversa che "oscura" (shadowing) quella esterna, che resta invariata.',
    },
    {
      id: 'fu12', topic: 'funcs',
      q: 'A cosa serve il metodo bind() delle funzioni?',
      options: [
        'Crea una nuova funzione con this (ed eventuali argomenti) fissati',
        'Esegue subito la funzione con un this diverso',
        'Collega due funzioni in sequenza',
        'Rende la funzione asincrona',
      ], answer: 0,
      explain: 'bind restituisce una nuova funzione con this predefinito. call e apply, invece, eseguono subito la funzione.',
    }
  );

  if (typeof module === 'object' && module.exports) module.exports = CL;
})();
