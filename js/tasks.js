'use strict';
/* Úlohy pre 2. ročník: počty do 20 a geometria. Každý typ má 3 úrovne,
   úroveň sa mení podľa toho, ako sa dieťaťu darí. */
const TYPES = [
  { id: 'add', name: 'Sčítanie do 20', group: 'Počty', w: 1 },
  { id: 'sub', name: 'Odčítanie do 20', group: 'Počty', w: 1 },
  { id: 'three', name: 'Príklady s tromi číslami', group: 'Počty', w: 1.3 },
  { id: 'missing', name: 'Chýbajúce číslo', group: 'Počty', w: 0.8 },
  { id: 'compare', name: 'Porovnávanie <, =, >', group: 'Počty', w: 0.7 },
  { id: 'word', name: 'Slovné úlohy', group: 'Počty', w: 0.8 },
  { id: 'shapes', name: 'Rovinné útvary', group: 'Geometria', w: 0.6 },
  { id: 'solids', name: 'Telesá', group: 'Geometria', w: 0.6 },
  { id: 'lines', name: 'Čiary', group: 'Geometria', w: 0.5 },
  { id: 'measure', name: 'Meranie úsečky', group: 'Geometria', w: 0.7 },
  { id: 'draw', name: 'Rysovanie úsečky', group: 'Geometria', w: 0.6 },
  { id: 'count', name: 'Útvary na obrázku', group: 'Geometria', w: 0.7 },
];

const Tasks = (() => {
  const M = '−';
  const { pl, cap } = U;
  const opS = o => (o === '-' ? M : '+');
  const ev = (a, o, b) => (o === '+' ? a + b : a - b);
  const crosses = (x, o, y) => (o === '+' ? x < 10 && x + y > 10 : x > 10 && x - y < 10);
  const word = o => (o === '+' ? 'plus' : 'mínus');
  const N = n => `<span class="n">${n}</span>`;
  const OP = o => `<span class="op">${o === '-' ? M : o}</span>`;
  const SLOT = '<span class="slot">?</span>';
  const expr = parts => `<div class="expr">${parts.join('')}</div>`;
  const steps = (...lines) => lines.map(l => `<p class="ex-steps">${l}</p>`).join('');
  const note = t => `<p class="ex-note">${t}</p>`;

  /* ---------- sčítanie a odčítanie ---------- */
  function explainArith(a, o, b) {
    const r = ev(a, o, b);
    if (o === '+') {
      if (b >= 10 && a < 10) return note('Je to jednoduchšie odzadu: k väčšiemu číslu pripočítame menšie.') + steps(`${a} + ${b} = ${b} + ${a} = ${r}`) + Geo.numberLine(b, [a]);
      if (a < 10 && r > 10) {
        const need = 10 - a, rest = b - need;
        return note('Najprv doplníme do 10, potom pripočítame zvyšok.') + steps(`${a} + ${b} = ${a} + ${need} + ${rest} = 10 + ${rest} = ${r}`) + Geo.numberLine(a, [need, rest]);
      }
      if (a > 10 && r < 20) return steps(`${a} + ${b} = 10 + ${a - 10} + ${b} = 10 + ${a - 10 + b} = ${r}`) + Geo.numberLine(a, [b]);
      return steps(`${a} + ${b} = ${r}`) + Geo.numberLine(a, [b]);
    }
    const u = a % 10;
    if (b > 10 && b < 20) {
      return note('Najprv odčítame desiatku, potom jednotky.') + steps(`${a} ${M} ${b} = ${a} ${M} 10 ${M} ${b - 10} = ${a - 10} ${M} ${b - 10} = ${r}`) + Geo.numberLine(a, [-10, -(b - 10)]);
    }
    if (a > 10 && u > 0 && b > u && b < 10) {
      const rest = b - u;
      return note('Najprv odčítame k desiatke, potom zvyšok.') + steps(`${a} ${M} ${b} = ${a} ${M} ${u} ${M} ${rest} = 10 ${M} ${rest} = ${r}`) + Geo.numberLine(a, [-u, -rest]);
    }
    return steps(`${a} ${M} ${b} = ${r}`) + Geo.numberLine(a, [-b]);
  }

  function arith(type, a, o, b) {
    const r = ev(a, o, b);
    const cross = crosses(a, o, b);
    return {
      title: 'Vypočítaj:',
      body: expr([N(a), OP(o), N(b), OP('='), SLOT]),
      speak: `Koľko je ${a} ${word(o)} ${b}?`,
      input: 'keypad', answer: r,
      hint: cross ? 'Pomôž si desiatkou.' : '',
      explain: explainArith(a, o, b),
    };
  }

  function genAdd(l) {
    let a, b;
    const mode = l === 1 ? U.pick(['small', 'teen']) : l === 2 ? 'cross' : U.pick(['cross', 'cross', 'to20', 'any']);
    if (mode === 'small') { a = U.rnd(1, 8); b = U.rnd(1, 10 - a); }
    else if (mode === 'teen') { a = U.rnd(11, 17); b = U.rnd(1, 19 - a); }
    else if (mode === 'cross') { a = U.rnd(2, 9); b = U.rnd(11 - a, 9); if (Math.random() < 0.5) [a, b] = [b, a]; }
    else if (mode === 'to20') { a = U.rnd(11, 18); b = 20 - a; }
    else { a = U.rnd(1, 15); b = U.rnd(1, 20 - a); }
    return arith('add', a, '+', b);
  }

  function genSub(l) {
    let a, b;
    const mode = l === 1 ? U.pick(['small', 'teen']) : l === 2 ? 'cross' : U.pick(['cross', 'cross', 'from20', 'big']);
    if (mode === 'small') { a = U.rnd(3, 10); b = U.rnd(1, a - 1); }
    else if (mode === 'teen') { a = U.rnd(11, 19); b = U.rnd(1, a - 10); }
    else if (mode === 'cross') { a = U.rnd(11, 18); b = U.rnd(a - 9, 9); }
    else if (mode === 'from20') { a = 20; b = U.rnd(3, 9); }
    else { a = U.rnd(14, 20); b = U.rnd(11, a - 1); }
    return arith('sub', a, '-', b);
  }

  /* ---------- tri čísla (aj so zátvorkou) ---------- */
  function genThree(l) {
    const max = l === 1 ? 10 : 20;
    for (let t = 0; t < 600; t++) {
      const paren = l === 3 && Math.random() < 0.3;
      const o1 = U.pick(['+', '-']), o2 = U.pick(['+', '-']);
      const a = U.rnd(l === 1 ? 2 : 4, max);
      const b = U.rnd(1, l === 1 ? 5 : 9), c = U.rnd(1, l === 1 ? 5 : 9);
      const r1 = paren ? ev(b, o2, c) : ev(a, o1, b);
      if (r1 <= 0 || r1 > max) continue;
      const r = paren ? ev(a, o1, r1) : ev(r1, o2, c);
      if (r < 0 || r > max) continue;
      if (l >= 2 && !paren && !crosses(a, o1, b) && !crosses(r1, o2, c) && Math.random() < 0.7) continue;
      return three(a, o1, b, o2, c, paren, r1, r);
    }
    return three(5, '+', 3, '-', 2, false, 8, 6);
  }

  function three(a, o1, b, o2, c, paren, r1, r) {
    const parts = paren
      ? [N(a), OP(o1), '<span class="par">(</span>', N(b), OP(o2), N(c), '<span class="par">)</span>', OP('='), SLOT]
      : [N(a), OP(o1), N(b), OP(o2), N(c), OP('='), SLOT];
    const explain = paren
      ? note('Najprv vypočítame zátvorku.') + steps(`${b} ${opS(o2)} ${c} = ${r1}`, `${a} ${opS(o1)} ${r1} = ${r}`)
      : note('Počítame postupne zľava doprava.') + steps(`${a} ${opS(o1)} ${b} = ${r1}`, `${r1} ${opS(o2)} ${c} = ${r}`);
    const speak = paren
      ? `Koľko je ${a} ${word(o1)} zátvorka ${b} ${word(o2)} ${c}?`
      : `Koľko je ${a} ${word(o1)} ${b} ${word(o2)} ${c}?`;
    return {
      title: 'Vypočítaj:', body: expr(parts), speak, input: 'keypad', answer: r,
      hint: paren ? 'Najprv vypočítaj zátvorku.' : 'Počítaj postupne zľava.', explain,
    };
  }

  /* ---------- chýbajúce číslo ---------- */
  function genMissing(l) {
    const max = l === 1 ? 10 : 20;
    for (let t = 0; t < 400; t++) {
      const form = U.pick(['a+?', '?+b', 'a-?', '?-b']);
      let a, x, c, cr;
      if (form === 'a+?' || form === '?+b') { a = U.rnd(1, max - 1); x = U.rnd(1, max - a); c = a + x; cr = crosses(a, '+', x); }
      else if (form === 'a-?') { a = U.rnd(3, max); x = U.rnd(1, a - 1); c = a - x; cr = crosses(a, '-', x); }
      else { a = U.rnd(1, 9); c = U.rnd(1, max - a); x = a + c; cr = crosses(x, '-', a); }
      if (l === 2 && cr) continue;
      if (l === 3 && !cr && Math.random() < 0.75) continue;
      return missing(form, a, x, c);
    }
    return missing('a+?', 4, 3, 7);
  }

  function missing(form, a, x, c) {
    let parts, explain, speak;
    if (form === 'a+?') {
      parts = [N(a), OP('+'), SLOT, OP('='), N(c)];
      speak = `${a} plus koľko je ${c}?`;
      explain = note(`Koľko chýba od ${a} do ${c}?`) + steps(`${c} ${M} ${a} = ${x}`, `Skúška: ${a} + ${x} = ${c}`);
    } else if (form === '?+b') {
      parts = [SLOT, OP('+'), N(a), OP('='), N(c)];
      speak = `Koľko plus ${a} je ${c}?`;
      explain = note('Od výsledku odčítame známe číslo.') + steps(`${c} ${M} ${a} = ${x}`, `Skúška: ${x} + ${a} = ${c}`);
    } else if (form === 'a-?') {
      parts = [N(a), OP('-'), SLOT, OP('='), N(c)];
      speak = `${a} mínus koľko je ${c}?`;
      explain = note(`Koľko treba ubrať z ${a}, aby zostalo ${c}?`) + steps(`${a} ${M} ${c} = ${x}`, `Skúška: ${a} ${M} ${x} = ${c}`);
    } else {
      parts = [SLOT, OP('-'), N(a), OP('='), N(c)];
      speak = `Koľko mínus ${a} je ${c}?`;
      explain = note('K výsledku pripočítame to, čo sme ubrali.') + steps(`${c} + ${a} = ${x}`, `Skúška: ${x} ${M} ${a} = ${c}`);
    }
    return { title: 'Ktoré číslo chýba?', body: expr(parts), speak, input: 'keypad', answer: x, hint: 'Skús to otočiť.', explain };
  }

  /* ---------- porovnávanie ---------- */
  function side(max, small) {
    for (let t = 0; t < 200; t++) {
      const o = U.pick(['+', '-']), a = U.rnd(1, max), b = U.rnd(1, small ? 5 : 9), v = ev(a, o, b);
      if (v >= 0 && v <= max) return { txt: `${a} ${opS(o)} ${b}`, say: `${a} ${word(o)} ${b}`, html: N(a) + OP(o) + N(b), v };
    }
    return { txt: '3 + 2', say: '3 plus 2', html: N(3) + OP('+') + N(2), v: 5 };
  }
  function sameValue(v) {
    for (let t = 0; t < 100; t++) {
      const o = U.pick(['+', '-']), b = U.rnd(1, 9), a = o === '+' ? v - b : v + b;
      if (a >= 1 && a <= 20) return { txt: `${a} ${opS(o)} ${b}`, say: `${a} ${word(o)} ${b}`, html: N(a) + OP(o) + N(b), v };
    }
    return { txt: `${v}`, say: `${v}`, html: N(v), v };
  }
  function genCompare(l) {
    const max = l === 1 ? 10 : 20;
    const L = side(max, l === 1);
    let R;
    if (l === 3 && Math.random() < 0.65) {
      R = Math.random() < 0.3 ? sameValue(L.v) : side(max, false);
    } else {
      const v = Math.random() < 0.3 ? L.v : U.rnd(Math.max(0, L.v - 3), Math.min(max, L.v + 3));
      R = { txt: `${v}`, say: `${v}`, html: N(v), v };
    }
    const ans = L.v < R.v ? 'lt' : L.v > R.v ? 'gt' : 'eq';
    const sym = { lt: '&lt;', gt: '&gt;', eq: '=' }[ans];
    const rel = { lt: 'je menej ako', gt: 'je viac ako', eq: 'sa rovná' }[ans];
    const rWas = R.txt === `${R.v}` ? '' : ` = ${R.v}`;
    return {
      title: 'Porovnaj. Ktorý znak patrí do krúžku?',
      body: `<div class="expr cmp">${L.html}<span class="slot cmp">?</span>${R.html}</div>`,
      speak: `Porovnaj ${L.say} a ${R.say}.`,
      input: 'cmp', answer: ans, answerLabel: `${L.txt} ${sym} ${R.txt}`,
      hint: 'Najprv vypočítaj, koľko je na každej strane.',
      explain: steps(`Vľavo: ${L.txt} = ${L.v}`, `Vpravo: ${R.txt}${rWas}`, `${L.v} ${rel} ${R.v}`)
        + note(ans === 'eq' ? 'Na oboch stranách je rovnako veľa, preto patrí do krúžku =.' : 'Zobáčik je vždy otvorený k väčšiemu číslu.'),
    };
  }

  /* ---------- slovné úlohy z dielne ---------- */
  function pick2(o, max) {
    for (let t = 0; t < 300; t++) {
      const a = U.rnd(2, max), b = U.rnd(1, Math.min(9, max - 1)), r = ev(a, o, b);
      if (r >= 1 && r <= max) return [a, b];
    }
    return o === '+' ? [3, 2] : [7, 3];
  }
  function pick3(o1, o2, max, { aMin = 3, bMax = 9, cMax = 9 } = {}) {
    for (let t = 0; t < 600; t++) {
      const a = U.rnd(aMin, max), b = U.rnd(1, bMax), c = U.rnd(1, cMax);
      const r1 = ev(a, o1, b), r = ev(r1, o2, c);
      if (r1 >= 1 && r1 <= max && r >= 0 && r <= max) return [a, b, c];
    }
    return [9, 3, 2];
  }
  const auta = n => pl(n, 'auto', 'autá', 'áut');
  const vlaky = n => pl(n, 'vlak', 'vlaky', 'vlakov');
  const skrutky = n => pl(n, 'skrutku', 'skrutky', 'skrutiek');
  const vagony = n => pl(n, 'vagón', 'vagóny', 'vagónov');

  const WORD = [
    { lv: 1, f(max) {
      const [a, b] = pick2('+', max);
      return { e: [a, '+', b], text: `V dielni ${pl(a, 'stálo', 'stáli', 'stálo')} ${a} ${auta(a)}. ${cap(pl(b, 'prišlo', 'prišli', 'prišlo'))} ešte ${b} ${auta(b)}. Koľko áut je teraz v dielni?` };
    } },
    { lv: 1, f(max) {
      const [a, b] = pick2('-', max);
      return { e: [a, '-', b], text: `Na stanici ${pl(a, 'stál', 'stáli', 'stálo')} ${a} ${vlaky(a)}. ${cap(pl(b, 'odišiel', 'odišli', 'odišlo'))} ${b} ${vlaky(b)}. Koľko vlakov zostalo na stanici?` };
    } },
    { lv: 1, f(max) {
      const [a, b] = pick2('-', max);
      return { e: [a, '-', b], text: `Mechanik mal v krabici ${a} ${skrutky(a)}. Na opravu auta použil ${b} ${skrutky(b)}. Koľko skrutiek mu zostalo?` };
    } },
    { lv: 1, f(max) {
      const [a, b] = pick2('+', max);
      return { e: [a, '+', b], text: `Na regáli ${pl(a, 'je', 'sú', 'je')} ${a} ${pl(a, 'koleso', 'kolesá', 'kolies')} a v sklade ${pl(b, 'je', 'sú', 'je')} ešte ${b} ${pl(b, 'koleso', 'kolesá', 'kolies')}. Koľko kolies je spolu?` };
    } },
    { lv: 2, f(max) {
      const [a, b, c] = pick3('-', '+', max);
      return { e: [a, '-', b, '+', c], text: `V depe ${pl(a, 'stál', 'stáli', 'stálo')} ${a} ${vlaky(a)}. ${cap(pl(b, 'odišiel', 'odišli', 'odišlo'))} ${b} ${vlaky(b)} a potom ${pl(c, 'prišiel', 'prišli', 'prišlo')} ${c}. Koľko vlakov je teraz v depe?` };
    } },
    { lv: 2, f(max) {
      const [a, b, c] = pick3('+', '+', max, { aMin: 1, bMax: 6, cMax: 6 });
      return { e: [a, '+', b, '+', c], text: `Mechanik ráno nalakoval ${a} ${auta(a)}, na obed ${b} a večer ${c}. Koľko áut nalakoval za celý deň?` };
    } },
    { lv: 2, f(max) {
      const [a, b, c] = pick3('-', '-', max, { aMin: 8 });
      return { e: [a, '-', b, '-', c], text: `V krabici ${pl(a, 'bola', 'boli', 'bolo')} ${a} ${pl(a, 'skrutka', 'skrutky', 'skrutiek')}. Mechanik zobral ${b} ${skrutky(b)} a pomocník ${c}. Koľko skrutiek zostalo v krabici?` };
    } },
    { lv: 2, f(max) {
      const [a, b, c] = pick3('+', '-', max);
      return { e: [a, '+', b, '-', c], text: `V autobuse ${pl(a, 'sedel', 'sedeli', 'sedelo')} ${a} ${pl(a, 'cestujúci', 'cestujúci', 'cestujúcich')}. Na zastávke ${pl(b, 'nastúpil', 'nastúpili', 'nastúpilo')} ${b} a ${pl(c, 'vystúpil', 'vystúpili', 'vystúpilo')} ${c}. Koľko cestujúcich je teraz v autobuse?` };
    } },
    { lv: 3, f(max) {
      const [a, b, c] = pick3('+', '-', max);
      return { e: [a, '+', b, '-', c], text: `Vlak mal ${a} ${vagony(a)}. Na stanici pripojili ${b} ${vagony(b)} a potom ${c} ${vagony(c)} odpojili. Koľko vagónov má teraz vlak?` };
    } },
    { lv: 3, f() {
      const b = U.rnd(3, 12), a = Math.min(20, b + U.rnd(2, 8));
      return { e: [a, '-', b], text: `Hasičské auto prešlo ráno ${a} km a autobus ${b} km. O koľko kilometrov viac prešlo hasičské auto?` };
    } },
    { lv: 3, f() {
      const b = U.rnd(3, 9), d = U.rnd(2, 9);
      return { e: [b, '+', d], text: `Zelený vlak má ${b} ${vagony(b)}. Modrý vlak má o ${d} ${vagony(d)} viac. Koľko vagónov má modrý vlak?` };
    } },
  ];

  function genWord(l) {
    const max = l === 1 ? 10 : 20;
    const exact = WORD.filter(w => w.lv === l), easier = WORD.filter(w => w.lv < l);
    const pool = easier.length && Math.random() < 0.3 ? easier : exact;
    const { e, text } = U.pick(pool).f(max);
    let r = e[0];
    for (let i = 1; i < e.length; i += 2) r = ev(r, e[i], e[i + 1]);
    const ex = e.map(v => (v === '-' ? M : v)).join(' ');
    return {
      title: 'Slovná úloha:', body: `<p class="word">${text}</p>`, speak: text,
      input: 'keypad', answer: r, hint: 'Prečítaj si úlohu ešte raz pomaly.',
      explain: note('Z úlohy si napíšeme príklad:') + steps(`${ex} = ${r}`),
    };
  }

  /* ---------- rovinné útvary ---------- */
  const SH = { triangle: 'trojuholník', square: 'štvorec', rectangle: 'obdĺžnik', circle: 'kruh' };
  const SH_GEN = { triangle: 'trojuholníkov', square: 'štvorcov', rectangle: 'obdĺžnikov', circle: 'kruhov' };
  const SIDES = { triangle: 3, square: 4, rectangle: 4 };
  const SH_INFO = {
    triangle: 'Trojuholník má 3 strany a 3 vrcholy.',
    square: 'Štvorec má 4 rovnako dlhé strany a 4 vrcholy.',
    rectangle: 'Obdĺžnik má 4 strany a 4 vrcholy. Dve protiľahlé strany sú dlhšie, dve kratšie.',
    circle: 'Kruh je okrúhly. Nemá strany ani vrcholy.',
  };
  const bigShape = (k, deg = 0) => Geo.box(Geo.shape(k, 70, 60, 92, U.pick(Geo.PAL), deg, U.rnd(0, 2)), 140, 120);

  function genShapes(l) {
    const kinds = Object.keys(SH);
    const mode = l === 1 ? 'tap' : l === 2 ? U.pick(['name', 'name', 'sides']) : U.pick(['tap', 'sum', 'name']);
    const tilt = l === 3 ? 40 : 10;
    if (mode === 'tap') {
      const target = U.pick(kinds), cols = U.shuffle(Geo.PAL);
      return {
        title: `Ťukni na ${SH[target]}.`, body: '', speak: `Ťukni na ${SH[target]}.`,
        input: 'choice', answer: target, answerLabel: SH[target],
        choices: U.shuffle(kinds).map((k, i) => ({ value: k, html: Geo.box(Geo.shape(k, 60, 60, 80, cols[i], U.rnd(-tilt, tilt), U.rnd(0, 2)), 120, 120) })),
        explain: note(SH_INFO[target]) + bigShape(target),
      };
    }
    if (mode === 'name') {
      const target = U.pick(kinds);
      return {
        title: 'Ako sa volá tento útvar?', body: bigShape(target, U.rnd(-tilt, tilt)), speak: 'Ako sa volá tento útvar?',
        input: 'choice', layout: 'txt', answer: target, answerLabel: SH[target],
        choices: U.shuffle(kinds).map(k => ({ value: k, html: SH[k] })),
        explain: note(SH_INFO[target]),
      };
    }
    if (mode === 'sides') {
      const k = U.pick(['triangle', 'square', 'rectangle']), what = U.pick(['strán', 'vrcholov']);
      return {
        title: `Koľko ${what} má ${SH[k]}?`, body: bigShape(k), speak: `Koľko ${what} má ${SH[k]}?`,
        input: 'keypad', answer: SIDES[k], hint: 'Ukáž si ich prstom.', explain: note(SH_INFO[k]),
      };
    }
    const k1 = U.pick(['triangle', 'square', 'rectangle']), k2 = U.pick(['triangle', 'square', 'rectangle']);
    const s1 = SIDES[k1], s2 = SIDES[k2];
    const two = Geo.box(Geo.shape(k1, 60, 60, 80, U.pick(Geo.PAL), 0, U.rnd(0, 2)) + Geo.shape(k2, 170, 60, 80, U.pick(Geo.PAL), 0, U.rnd(0, 2)), 230, 120);
    const TWO = { triangle: 'dva trojuholníky', square: 'dva štvorce', rectangle: 'dva obdĺžniky' };
    const both = k1 === k2 ? TWO[k1] : `${SH[k1]} a ${SH[k2]}`;
    return {
      title: `Koľko strán majú spolu ${both}?`, body: two, speak: `Koľko strán majú spolu ${both}?`,
      input: 'keypad', answer: s1 + s2, hint: 'Spočítaj strany každého útvaru zvlášť.',
      explain: steps(`${U.cap(SH[k1])} má ${s1} strany, ${SH[k2]} má ${s2} strany.`, `${s1} + ${s2} = ${s1 + s2}`),
    };
  }

  /* ---------- telesá ---------- */
  const SOL = { kocka: ['kocka', 'kocku'], kvader: ['kváder', 'kváder'], gula: ['guľa', 'guľu'], valec: ['valec', 'valec'], kuzel: ['kužeľ', 'kužeľ'], ihlan: ['ihlan', 'ihlan'] };
  const SOL_INFO = {
    kocka: 'Kocka má 6 rovnakých štvorcových stien.',
    kvader: 'Kváder má 6 stien, sú to obdĺžniky (niektoré môžu byť štvorce).',
    gula: 'Guľa je celá okrúhla, kotúľa sa na všetky strany.',
    valec: 'Valec má dve kruhové podstavy a oblý plášť, ako plechovka.',
    kuzel: 'Kužeľ má jednu kruhovú podstavu a špičku, ako kornútok.',
    ihlan: 'Ihlan má podstavu a bočné steny sú trojuholníky, ktoré sa stretnú v špičke.',
  };
  const OBJECTS = [
    { e: '⚽', s: 'gula' }, { e: '🍊', s: 'gula' }, { e: '🏀', s: 'gula' },
    { e: '🎲', s: 'kocka' }, { e: '🧊', s: 'kocka' },
    { svg: 'krabica', s: 'kvader' }, { e: '🧱', s: 'kvader' },
    { e: '🥫', s: 'valec' }, { svg: 'sud', s: 'valec' },
    { e: '🍦', s: 'kuzel' }, { svg: 'ciapka', s: 'kuzel' },
    { svg: 'pyramida', s: 'ihlan' },
  ];
  function genSolids(l) {
    const kinds = Object.keys(SOL);
    const mode = l === 1 ? 'tap' : l === 2 ? U.pick(['name', 'tap']) : U.pick(['thing', 'thing', 'name']);
    const pickWith = target => U.shuffle([target, ...U.shuffle(kinds.filter(k => k !== target)).slice(0, 3)]);
    if (mode === 'tap') {
      const target = U.pick(kinds), cols = U.shuffle(Geo.PAL);
      return {
        title: `Ťukni na ${SOL[target][1]}.`, body: '', speak: `Ťukni na ${SOL[target][1]}.`,
        input: 'choice', answer: target, answerLabel: SOL[target][0],
        choices: pickWith(target).map((k, i) => ({ value: k, html: Geo.solid(k, cols[i]) })),
        explain: note(SOL_INFO[target]) + Geo.solid(target, '#42a5f5'),
      };
    }
    if (mode === 'name') {
      const target = U.pick(kinds);
      return {
        title: 'Ako sa volá toto teleso?', body: Geo.solid(target, U.pick(Geo.PAL)), speak: 'Ako sa volá toto teleso?',
        input: 'choice', layout: 'txt', answer: target, answerLabel: SOL[target][0],
        choices: pickWith(target).map(k => ({ value: k, html: SOL[k][0] })),
        explain: note(SOL_INFO[target]),
      };
    }
    const o = U.pick(OBJECTS);
    const pic = o.svg ? Geo.thing(o.svg) : `<span class="emoji-big" aria-hidden="true">${o.e}</span>`;
    return {
      title: 'Akému telesu sa podobá táto vec?', body: pic, speak: 'Akému telesu sa podobá táto vec?',
      input: 'choice', layout: 'txt', answer: o.s, answerLabel: SOL[o.s][0],
      choices: pickWith(o.s).map(k => ({ value: k, html: SOL[k][0] })),
      explain: note(SOL_INFO[o.s]) + Geo.solid(o.s, '#42a5f5'),
    };
  }

  /* ---------- čiary ---------- */
  const LN = { rovna: ['rovná', 'rovnú'], kriva: ['krivá', 'krivú'], lomena: ['lomená', 'lomenú'] };
  const LN_INFO = 'Rovná čiara ide rovno. Krivá čiara je oblá ako had. Lomená čiara má ostré zlomy.';
  function genLines(l) {
    const kinds = Object.keys(LN);
    const mode = l === 1 ? 'tap' : l === 2 ? U.pick(['name', 'tap']) : U.pick(['segs', 'segs', 'name']);
    if (mode === 'tap') {
      const target = U.pick(kinds);
      return {
        title: `Ťukni na ${LN[target][1]} čiaru.`, body: '', speak: `Ťukni na ${LN[target][1]} čiaru.`,
        input: 'choice', layout: 'lines', answer: target, answerLabel: `${LN[target][0]} čiara`,
        choices: U.shuffle(kinds).map(k => ({ value: k, html: Geo.lineSVG(Geo.line(k)) })),
        explain: note(LN_INFO) + Geo.lineSVG(Geo.line(target)),
      };
    }
    if (mode === 'name') {
      const target = U.pick(kinds);
      return {
        title: 'Aká je to čiara?', body: Geo.lineSVG(Geo.line(target)), speak: 'Aká je to čiara?',
        input: 'choice', layout: 'txt', answer: target, answerLabel: `${LN[target][0]} čiara`,
        choices: kinds.map(k => ({ value: k, html: `${LN[k][0]} čiara` })),
        explain: note(LN_INFO),
      };
    }
    const ln = Geo.line('lomena', U.rnd(2, 6));
    return {
      title: 'Z koľkých úsečiek sa skladá táto lomená čiara?', body: Geo.lineSVG(ln, { dots: true }),
      speak: 'Z koľkých úsečiek sa skladá táto lomená čiara?',
      input: 'keypad', answer: ln.segs, hint: 'Úsečka je kúsok medzi dvoma bodkami.',
      explain: note('Každá úsečka ide od bodky k bodke.') + Geo.lineSVG(ln, { numbered: true, dots: true }),
    };
  }

  /* ---------- meranie a rysovanie úsečky ---------- */
  function genMeasure(l) {
    const a = l === 3 ? U.rnd(1, 4) : 0;
    const len = l === 1 ? U.rnd(2, 8) : l === 2 ? U.rnd(3, 12) : U.rnd(2, Geo.MAXCM - a - 1);
    const b = a + len;
    return {
      title: 'Zmeraj úsečku AB. Koľko centimetrov meria?', body: Geo.ruler({ a, b }),
      speak: 'Zmeraj úsečku A B. Koľko centimetrov meria?',
      input: 'keypad', unit: 'cm', answer: len,
      hint: a ? 'Pozor, bod A nie je pri nule.' : 'Pozri, pri ktorom čísle je bod B.',
      explain: (a
        ? note(`Bod A je pri čísle ${a}, bod B pri čísle ${b}.`) + steps(`${b} ${M} ${a} = ${len}`)
        : note(`Úsečka začína pri nule a končí pri čísle ${b}.`))
        + Geo.ruler({ a, b, hl: true }) + steps(`Úsečka AB meria ${len} cm.`),
    };
  }

  function genDraw(l) {
    const a = l === 3 ? U.rnd(1, 3) : 0;
    const len = l === 1 ? U.rnd(2, 8) : U.rnd(3, Math.min(12, Geo.MAXCM - a));
    const b = a + len;
    return {
      title: `Narysuj úsečku AB dlhú ${len} cm. Posuň žltý bod B.`,
      body: Geo.ruler({ a, b: a + 1, drag: true }),
      speak: `Narysuj úsečku A B dlhú ${len} centimetrov. Posuň žltý bod B.`,
      input: 'draw', drawA: a, answer: b, answerLabel: `bod B pri čísle ${b}`,
      hint: a ? `Bod A je pri čísle ${a}, nie pri nule.` : 'Pozri na čísla na pravítku.',
      explain: note(a ? `Bod A je pri čísle ${a}. Pripočítame ${len}:` : `Bod A je pri nule, takže bod B patrí k číslu ${b}.`)
        + (a ? steps(`${a} + ${len} = ${b}`) : '') + Geo.ruler({ a, b, hl: true }),
    };
  }

  /* ---------- útvary na obrázku ---------- */
  function genCount(l) {
    let pic, kinds;
    if (l === 1) {
      kinds = [U.pick(['circle', 'triangle', 'square'])];
      pic = Geo.scatter(kinds[0]);
    } else {
      pic = Geo.trainPic();
      kinds = l === 2 ? [U.pick(['circle', 'square', 'triangle'])] : U.pick([['circle', 'triangle'], ['square', 'triangle'], ['circle', 'square'], ['triangle']]);
    }
    const counts = kinds.map(k => pic.count(k));
    const n = counts.reduce((s, c) => s + c, 0);
    const title = kinds.length === 1
      ? `Koľko ${SH_GEN[kinds[0]]} je na obrázku?`
      : `Koľko ${SH_GEN[kinds[0]]} a ${SH_GEN[kinds[1]]} je spolu na obrázku?`;
    return {
      title, body: pic.svg(), speak: title, input: 'keypad', answer: n,
      hint: 'Ukazuj si prstom a počítaj pomaly.',
      explain: pic.svg(kinds) + (kinds.length === 2 ? steps(`${counts[0]} + ${counts[1]} = ${n}`) : steps(`Spolu ${n}.`)),
    };
  }

  /* ---------- výber úlohy a náročnosť ---------- */
  const GEN = {
    add: genAdd, sub: genSub, three: genThree, missing: genMissing, compare: genCompare, word: genWord,
    shapes: genShapes, solids: genSolids, lines: genLines, measure: genMeasure, draw: genDraw, count: genCount,
  };

  function skill(S, id) {
    return S.skill[id] || (S.skill[id] = { lvl: 1, streak: 0, hist: [] });
  }

  function make(S, type) {
    const l = skill(S, type).lvl;
    const t = GEN[type](l);
    t.type = type;
    t.lvl = l;
    return t;
  }

  function choose(S, prev) {
    let list = TYPES.filter(t => S.settings.types[t.id]);
    if (!list.length) list = TYPES;
    const weights = list.map(t => {
      if (list.length > 1 && t.id === prev) return 0;
      const h = skill(S, t.id).hist;
      const rate = h.length ? h.reduce((a, b) => a + b, 0) / h.length : 0.7;
      return t.w * (1 + (1 - rate) * 1.5);
    });
    let r = Math.random() * weights.reduce((a, b) => a + b, 0);
    for (let i = 0; i < list.length; i++) {
      r -= weights[i];
      if (r <= 0) return list[i].id;
    }
    return list[list.length - 1].id;
  }

  // ok = správne na prvý pokus. Po 4 správnych za sebou ide úroveň hore, po 2 chybách z posledných 4 dole.
  function record(S, type, ok) {
    const k = skill(S, type);
    k.hist.push(ok ? 1 : 0);
    if (k.hist.length > 12) k.hist.shift();
    if (ok) {
      k.streak++;
      if (k.streak >= 4 && k.lvl < 3) { k.lvl++; k.streak = 0; }
    } else {
      k.streak = 0;
      if (k.lvl > 1 && k.hist.slice(-4).filter(x => !x).length >= 2) { k.lvl--; k.hist = []; }
    }
  }

  return { make, choose, record, skill };
})();
