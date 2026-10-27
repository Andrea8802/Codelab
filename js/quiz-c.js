/* CodeLab – contenuti: quiz (parte C: ES6+). */
(function () {
  'use strict';
  const CL = (globalThis.CL = globalThis.CL || {});
  CL.quiz = CL.quiz || [];
  const OUT = 'Cosa stampa questo codice?';

  CL.quiz.push(
    {
      id: 'es01', topic: 'es6', q: OUT, run: true,
      code: 'const [a, , b] = [1, 2, 3];\nconsole.log(a, b);',
      options: ['1 2', '1 3', '2 3', '1 undefined'], answer: 1,
      explain: 'La virgola vuota salta il secondo elemento: a prende 1 e b prende 3.',
    },
    {
      id: 'es02', topic: 'es6', q: OUT, run: true,
      code: 'const { x: y = 5 } = {};\nconsole.log(y);',
      options: ['undefined', 'x', '5', 'ReferenceError'], answer: 2,
      explain: 'x: y rinomina la proprietà x nella variabile y; il valore dopo = è il default usato quando la proprietà è undefined.',
    },
    {
      id: 'es03', topic: 'es6', q: OUT, run: true,
      code: 'console.log(Math.max(...[3, 9, 4]));',
      options: ['3', '9', '4', 'NaN'], answer: 1,
      explain: 'Lo spread espande l\'array negli argomenti: è come Math.max(3, 9, 4).',
    },
    {
      id: 'es04', topic: 'es6', q: OUT, run: true,
      code: "console.log(`${1 + 1}${'a'.repeat(2)}`);",
      options: ['2aa', '1 + 1aa', '11aa', '2a2a'], answer: 0,
      explain: 'Nei template literal ${...} valuta qualsiasi espressione e ne inserisce il risultato nella stringa.',
    },
    {
      id: 'es05', topic: 'es6', q: OUT, run: true,
      code: "const u = {};\nconsole.log(u.a?.b, u.a?.b ?? 'n/d');",
      options: ['undefined n/d', 'TypeError', 'null n/d', 'undefined undefined'], answer: 0,
      explain: 'L\'optional chaining ?. interrompe la catena restituendo undefined; ?? fornisce un valore alternativo per null/undefined.',
    },
    {
      id: 'es06', topic: 'es6', q: OUT, run: true,
      code: "console.log(0 || 'x', 0 ?? 'x');",
      options: ['x x', '0 0', 'x 0', '0 x'], answer: 2,
      explain: '|| scatta con qualsiasi valore falsy (anche 0), mentre ?? solo con null e undefined: utile quando 0 o "" sono valori validi.',
    },
    {
      id: 'es07', topic: 'es6', q: OUT, run: true,
      code: 'class A {\n  constructor() {\n    this.n = 1;\n  }\n  get double() {\n    return this.n * 2;\n  }\n}\nconsole.log(new A().double);',
      options: ['1', '2', 'undefined', 'function'], answer: 1,
      explain: 'Un getter si legge come una proprietà (senza parentesi) e viene calcolato a ogni accesso.',
    },
    {
      id: 'es08', topic: 'es6', q: OUT, run: true,
      code: "class A {\n  hi() {\n    return 'A';\n  }\n}\nclass B extends A {\n  hi() {\n    return super.hi() + 'B';\n  }\n}\nconsole.log(new B().hi());",
      options: ['A', 'B', 'AB', 'BA'], answer: 2,
      explain: 'super.hi() richiama il metodo della classe genitore; B lo estende aggiungendo il proprio risultato.',
    },
    {
      id: 'es09', topic: 'es6', q: OUT, run: true,
      code: 'console.log([...new Set([1, 1, 2, 3, 3])].length);',
      options: ['5', '3', '2', '1'], answer: 1,
      explain: 'Un Set contiene solo valori unici: è il modo più rapido per eliminare i duplicati da un array.',
    },
    {
      id: 'es10', topic: 'es6', q: OUT, run: true,
      code: "const m = new Map([['a', 1]]);\nm.set('b', 2);\nconsole.log(m.size, m.get('b'));",
      options: ['1 2', '2 2', '2 undefined', '2 b'], answer: 1,
      explain: 'Map associa chiavi di qualsiasi tipo a valori e ricorda l\'ordine di inserimento; size ne conta le coppie.',
    },
    {
      id: 'es11', topic: 'es6',
      q: 'Cosa fa Object.freeze(obj)?',
      options: [
        'Impedisce di aggiungere, rimuovere o modificare le proprietà di primo livello',
        'Rende immutabili anche tutti gli oggetti annidati',
        'Impedisce solo di aggiungere nuove proprietà',
        'Trasforma l\'oggetto in una costante',
      ], answer: 0,
      explain: 'freeze è superficiale: gli oggetti annidati restano modificabili. In modalità non strict le modifiche vengono ignorate in silenzio.',
    },
    {
      id: 'es12', topic: 'es6', q: OUT, run: true,
      code: "for (const k in ['a', 'b']) {\n  console.log(k);\n}",
      options: ['a → b', '0 → 1', '1 → 2', 'a → b → length'], answer: 1,
      explain: 'for...in scorre le chiavi (gli indici, come stringhe); for...of scorre i valori ("a", "b").',
    }
  );

  if (typeof module === 'object' && module.exports) module.exports = CL;
})();
