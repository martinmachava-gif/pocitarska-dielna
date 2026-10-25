'use strict';
/* Obrazovky a herná slučka: dielňa, oprava cez úlohy, vylepšovanie, skúšobná jazda, rodičia. */
(() => {
  let S = Store.load();
  const screen = document.getElementById('screen');
  const fx = document.getElementById('fx');
  const D = Art.DEFS;
  const VIEWS = {}, AFTER = {}, ACT = {};
  let current = '';
  let R = null;          // prebiehajúca oprava
  let driveRAF = 0;
  let gate = null;

  const g = (m, f) => (S.gender === 'f' ? f : m);
  const esc = U.esc;
  const pl = U.pl;

  /* ---------- stav vozidiel ---------- */
  function vs(id) {
    return S.vehicles[id] || (S.vehicles[id] = {
      unlocked: false, broken: null, total: 0, fixed: 0,
      color: D[id].color, colors: { [D[id].color]: true }, owned: {}, on: {}, wagons: 0,
    });
  }
  function vsvg(id, extra = {}) {
    const v = vs(id);
    return Art.svg(id, {
      color: v.color, on: v.on, broken: v.broken || [], name: S.name,
      wagons: extra.withWagons ? v.wagons : 0, steam: extra.steam, driving: extra.driving,
    });
  }
  function breakV(id) {
    const v = vs(id);
    v.broken = Art.makeDamage(id, S.settings.perRepair);
    v.total = v.broken.length;
  }
  const waitingIds = () => Art.ORDER.filter(k => vs(k).unlocked && vs(k).broken);

  function completeRepair(id) {
    const v = vs(id);
    v.broken = null;
    v.fixed++;
    S.repairs++;
    S.screws += 10;
    const info = { unlocked: [], returned: [] };
    Art.ORDER.forEach(k => {
      if (D[k].after === id && !vs(k).unlocked) { vs(k).unlocked = true; breakV(k); info.unlocked.push(k); }
    });
    const want = Art.ORDER.filter(k => vs(k).unlocked).length >= 3 ? 2 : 1;
    while (waitingIds().length < want) {
      const cand = Art.ORDER.filter(k => vs(k).unlocked && !vs(k).broken && k !== id);
      if (!cand.length) break;
      const k = U.pick(cand);
      breakV(k);
      info.returned.push(k);
    }
    Store.save();
    return info;
  }

  function stat(type, ok) {
    const day = U.dayKey();
    const d = S.stats[day] || (S.stats[day] = { n: 0, ok: 0, t: {} });
    d.n++;
    if (ok) d.ok++;
    const t = d.t[type] || (d.t[type] = [0, 0]);
    t[0]++;
    if (ok) t[1]++;
  }

  function seed() {
    Art.ORDER.forEach(vs);
    if (!S.seeded) {
      ['auto', 'para'].forEach(id => { vs(id).unlocked = true; breakV(id); });
      S.seeded = true;
    }
    const keep = U.dayKey(new Date(Date.now() - 120 * 864e5));
    Object.keys(S.stats).forEach(k => { if (k < keep) delete S.stats[k]; });
    Store.save();
  }

  /* ---------- spoločné kúsky UI ---------- */
  const pill = () => `<div class="pill" aria-label="Skrutky"><span aria-hidden="true">🔩</span><span class="val">${S.screws}</span></div>`;
  const updScrews = () => document.querySelectorAll('.pill .val').forEach(e => { e.textContent = S.screws; });
  const keypad = act => `<div class="keypad">${[1, 2, 3, 4, 5, 6, 7, 8, 9].map(n => `<button class="key" data-act="${act}" data-k="${n}">${n}</button>`).join('')}`
    + `<button class="key del" data-act="${act}" data-k="del" aria-label="Zmazať">⌫</button><button class="key" data-act="${act}" data-k="0">0</button>`
    + `<button class="key ok" data-act="${act}" data-k="ok" aria-label="Potvrdiť">✔</button></div>`;

  function toast(text) {
    const t = document.createElement('div');
    t.className = 'toast';
    t.textContent = text;
    fx.appendChild(t);
    setTimeout(() => t.remove(), 2600);
  }

  function flyScrews(fromEl, n) {
    const p = document.querySelector('.pill');
    if (!p || !fromEl) return;
    const a = fromEl.getBoundingClientRect(), b = p.getBoundingClientRect();
    const tag = document.createElement('div');
    tag.className = 'gain';
    tag.textContent = `+${n} 🔩`;
    tag.style.left = `${a.left + a.width / 2}px`;
    tag.style.top = `${a.top + 24}px`;
    fx.appendChild(tag);
    setTimeout(() => tag.remove(), 1200);
    for (let i = 0; i < n; i++) {
      const d = document.createElement('div');
      d.className = 'fly';
      d.textContent = '🔩';
      const x = a.left + a.width / 2 + U.rnd(-40, 40), y = a.top + a.height / 2;
      d.style.left = `${x}px`;
      d.style.top = `${y}px`;
      fx.appendChild(d);
      requestAnimationFrame(() => requestAnimationFrame(() => {
        d.style.transitionDelay = `${i * 0.09}s`;
        d.style.transform = `translate(${b.left + 12 - x}px, ${b.top + 6 - y}px) scale(.6)`;
        d.style.opacity = '0.2';
      }));
      setTimeout(() => d.remove(), 1100 + i * 90);
    }
    setTimeout(() => {
      updScrews();
      p.classList.remove('bump');
      void p.offsetWidth;
      p.classList.add('bump');
      Snd.screw();
    }, 760);
  }

  function burst(px, py, chars = ['✨', '⭐', '✨', '🔧']) {
    chars.forEach((ch, i) => {
      const d = document.createElement('div');
      d.className = 'spark';
      d.textContent = ch;
      const ang = (i / chars.length) * Math.PI * 2 + Math.random();
      d.style.left = `${px}px`;
      d.style.top = `${py}px`;
      d.style.setProperty('--dx', `${Math.cos(ang) * 46}px`);
      d.style.setProperty('--dy', `${Math.sin(ang) * 34 - 12}px`);
      fx.appendChild(d);
      setTimeout(() => d.remove(), 1000);
    });
  }
  function sparkleAt(svgEl, id, key) {
    if (!svgEl) return;
    const [x, y] = Art.anchorOf(id, key);
    const [vx, vy, vw, vh] = D[id].vb;
    const r = svgEl.getBoundingClientRect();
    const sc = Math.min(r.width / vw, r.height / vh);
    burst(r.left + (r.width - vw * sc) / 2 + (x - vx) * sc, r.top + (r.height - vh * sc) / 2 + (y - vy) * sc);
  }
  function burstOn(el) {
    if (!el) return;
    const r = el.getBoundingClientRect();
    burst(r.left + r.width / 2, r.top + r.height / 2, ['✨', '⭐', '✨', '🎉', '⭐']);
  }

  function confetti() {
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const cols = ['#ffc21a', '#e5483b', '#1f6fd1', '#2f9e4f', '#ab47bc', '#ff7043'];
    for (let i = 0; i < 48; i++) {
      const d = document.createElement('i');
      d.className = 'conf';
      d.style.left = `${Math.random() * 100}%`;
      d.style.background = U.pick(cols);
      d.style.animationDuration = `${1.6 + Math.random() * 1.4}s`;
      d.style.animationDelay = `${Math.random() * 0.4}s`;
      d.style.setProperty('--rot', `${U.rnd(-540, 540)}deg`);
      d.style.setProperty('--sx', `${U.rnd(-60, 60)}px`);
      fx.appendChild(d);
      setTimeout(() => d.remove(), 3500);
    }
  }

  function honk(id) {
    const v = vs(id);
    if (v.on.siren) Snd.siren();
    else if (v.on.melody) Snd.melody();
    else Snd[D[id].horn]();
  }

  /* ---------- navigácia ---------- */
  function show(name, arg) {
    cancelAnimationFrame(driveRAF);
    driveRAF = 0;
    Snd.hush();
    current = name;
    screen.className = `scr-${name}`;
    screen.innerHTML = VIEWS[name](arg);
    if (AFTER[name]) AFTER[name](arg);
  }
  function rerender(name, arg) {
    const sc = screen.querySelector('.scroll');
    const top = sc ? sc.scrollTop : 0;
    show(name, arg);
    const sc2 = screen.querySelector('.scroll');
    if (sc2) sc2.scrollTop = top;
  }

  screen.addEventListener('click', e => {
    const el = e.target.closest('[data-act]');
    if (!el || !screen.contains(el)) return;
    const fn = ACT[el.dataset.act];
    if (fn) fn(el.dataset, el, e);
  });

  /* ---------- privítanie ---------- */
  VIEWS.welcome = () => `
    <div class="scroll gut welcome">
      <div class="hero-veh lift">${Art.svg('auto', { broken: ['wheel:1', 'crack:0', 'smoke', 'rust:0', 'mud:1', 'web', 'paint'] })}</div>
      <h1 class="title">Počtárska dielňa</h1>
      <p class="lead">Do dielne prichádzajú pokazené autá a vlaky. Za každý správny príklad jednu vec opravíš. Za skrutky potom vozidlá vylepšíš.</p>
      <label class="lbl" for="wName">Ako sa voláš?</label>
      <input id="wName" class="name-input" maxlength="14" autocomplete="off" autocapitalize="words" placeholder="Tvoje meno" value="${esc(S.name)}">
      <div class="row2">
        <button class="btn big go" data-act="start" data-g="m">Som chlapec</button>
        <button class="btn big go" data-act="start" data-g="f">Som dievča</button>
      </div>
    </div>`;
  ACT.start = ({ g: gen }) => {
    S.name = (document.getElementById('wName').value || '').trim().slice(0, 14);
    S.gender = gen;
    S.started = true;
    Store.save();
    Snd.correct();
    show('home');
  };

  /* ---------- dielňa ---------- */
  function depotCard(id) {
    const v = vs(id), d = D[id];
    if (!v.unlocked) {
      return `<button class="dcard locked" data-act="locked" data-id="${id}">
        <div class="dveh">${Art.svg(id)}</div><b>${d.name}</b><span class="chip">🔒 Najprv oprav: ${D[d.after].name}</span></button>`;
    }
    if (v.broken) {
      return `<button class="dcard" data-act="repair" data-id="${id}">
        <div class="dveh">${vsvg(id)}</div><b>${d.name}</b><span class="chip warn">🔧 V dielni</span></button>`;
    }
    return `<button class="dcard" data-act="garage" data-id="${id}">
      <div class="dveh">${vsvg(id)}</div><b>${d.name}</b><span class="chip ok">✨ Vylepšiť</span></button>`;
  }

  VIEWS.home = () => {
    const waiting = waitingIds();
    const today = S.stats[U.dayKey()];
    const n = today ? today.n : 0;
    const hello = n
      ? `Dnes ${g('si vyriešil', 'si vyriešila')} už <b>${n}</b> ${pl(n, 'úlohu', 'úlohy', 'úloh')}.`
      : 'Pustíme sa do práce?';
    return `
      <header class="bar gut"><div class="brand"><span class="brand-mark" aria-hidden="true">🔧</span>Počtárska dielňa</div>${pill()}</header>
      <div class="scroll gut">
        <p class="hello">Ahoj, <b>${esc(S.name || g('mechanik', 'mechanička'))}</b>! ${hello}</p>
        <h2 class="sec">Čakajú na opravu</h2>
        <div class="wait-list">
          ${waiting.map(id => {
            const v = vs(id), k = v.broken.length;
            return `<button class="wait-card" data-act="repair" data-id="${id}">
              <div class="lift">${vsvg(id)}</div>
              <div class="wc-row"><span><b>${D[id].name}</b><small>${k} ${pl(k, 'oprava', 'opravy', 'opráv')}</small></span><span class="btn go as-btn">Opraviť ▶</span></div>
            </button>`;
          }).join('')}
        </div>
        <h2 class="sec">Moje depo</h2>
        <div class="depot">${Art.ORDER.map(depotCard).join('')}</div>
        <button class="parent-link" data-act="gate">Pre rodičov</button>
      </div>`;
  };
  ACT.home = () => show('home');
  ACT.repair = ({ id }) => show('repair', id);
  ACT.locked = ({ id }) => toast(`Najprv oprav: ${D[D[id].after].name}`);

  /* ---------- oprava ---------- */
  function progHTML(v) {
    const done = v.total - v.broken.length;
    return Array.from({ length: v.total }, (_, i) => `<i class="${i < done ? 'on' : ''}"></i>`).join('')
      + `<span class="prog-txt">${done}/${v.total}</span>`;
  }
  function nextFix(v) {
    const [ic, txt] = Art.FIX[v.broken[0].split(':')[0]];
    return `<span aria-hidden="true">${ic}</span> Ďalšia oprava: <b>${txt}</b>`;
  }

  VIEWS.repair = id => {
    const v = vs(id);
    return `<div class="repair">
      <header class="bar gut">
        <button class="icon-btn" data-act="home" aria-label="Späť do dielne">✕</button>
        <div class="prog" id="prog">${progHTML(v)}</div>
        ${pill()}
      </header>
      <div class="bay gut"><div class="lift" id="bayVeh">${vsvg(id)}</div><div class="next-fix" id="nextFix">${nextFix(v)}</div></div>
      <div class="task gut" id="task"></div>
    </div>`;
  };
  AFTER.repair = id => {
    R = { id, task: null, tries: 0, prev: null, busy: false, input: '' };
    nextTask();
  };

  function nextTask() {
    const type = Tasks.choose(S, R.prev);
    R.task = Tasks.make(S, type);
    R.prev = type;
    R.tries = 0;
    R.input = '';
    R.busy = false;
    renderTask();
    if (S.settings.autoSpeak) Snd.speak(R.task.speak);
  }

  function answerHTML(t, hasSlot) {
    if (t.input === 'keypad') {
      return (hasSlot ? '' : `<div class="ans-box"><span class="slot" id="ansSlot">?</span>${t.unit ? `<span class="unit">${t.unit}</span>` : ''}</div>`) + keypad('key');
    }
    if (t.input === 'cmp') {
      return `<div class="choices n3 sym">${[['lt', '&lt;'], ['eq', '='], ['gt', '&gt;']].map(([v, l]) => `<button class="opt" data-act="pick" data-v="${v}">${l}</button>`).join('')}</div>`;
    }
    if (t.input === 'choice') {
      return `<div class="choices n${t.choices.length} ${t.layout || 'pics'}">${t.choices.map(c => `<button class="opt" data-act="pick" data-v="${c.value}">${c.html}</button>`).join('')}</div>`;
    }
    return '<button class="btn big go wide" data-act="drawdone">Hotovo ✔</button>';
  }

  function renderTask() {
    const t = R.task;
    const hasSlot = /class="slot/.test(t.body);
    document.getElementById('task').innerHTML = `
      <div class="card task-card t-${t.type}${t.body ? '' : ' compact'}" id="tcard">
        <div class="t-head"><p class="t-prompt">${t.title}</p>${Snd.canSpeak() ? '<button class="speak" data-act="speak" aria-label="Prečítať nahlas">🔊</button>' : ''}</div>
        ${t.body ? `<div class="t-body">${t.body}</div>` : ''}
        <p class="t-msg" id="tmsg" aria-live="polite"></p>
      </div>
      <div class="answer a-${t.input}${t.body ? '' : ' grow'}" id="answer">${answerHTML(t, hasSlot)}</div>`;
    if (t.input === 'draw') bindDraw();
  }

  const slotEl = () => document.querySelector('#tcard .slot') || document.getElementById('ansSlot');
  function updSlot() {
    const s = slotEl();
    if (s) s.textContent = R.input || '?';
  }
  function msg(text, kind) {
    const m = document.getElementById('tmsg');
    if (!m) return;
    m.textContent = text;
    m.className = `t-msg ${kind}`;
  }

  ACT.key = ({ k }) => {
    if (!R || R.busy || !R.task || R.task.input !== 'keypad') return;
    if (k === 'ok') {
      if (R.input !== '') answer(Number(R.input));
      return;
    }
    Snd.tap();
    if (k === 'del') R.input = R.input.slice(0, -1);
    else if (R.input.length < 2) R.input = (R.input === '0' ? '' : R.input) + k;
    updSlot();
  };
  ACT.pick = ({ v }, el) => {
    if (!R || R.busy) return;
    if (R.task.input === 'cmp') {
      const s = slotEl();
      if (s) s.innerHTML = el.innerHTML;
    }
    answer(v, el);
  };
  ACT.speak = () => { if (R && R.task) Snd.speak(R.task.speak); };
  ACT.next = () => { if (R && current === 'repair') nextTask(); };

  function bindDraw() {
    const svg = document.querySelector('#tcard .ruler.drag');
    if (!svg) return;
    const a = R.task.drawA;
    R.drawB = a + 1;
    const toCm = e => {
      const pt = svg.createSVGPoint();
      pt.x = e.clientX;
      pt.y = e.clientY;
      const p = pt.matrixTransform(svg.getScreenCTM().inverse());
      return Math.max(a + 1, Math.min(Geo.MAXCM, Geo.cmAt(p.x)));
    };
    const set = cm => {
      if (cm === R.drawB) return;
      R.drawB = cm;
      Geo.setRulerB(svg, a, cm);
      Snd.tap();
    };
    let drag = false;
    svg.addEventListener('pointerdown', e => {
      if (R.busy) return;
      drag = true;
      try { svg.setPointerCapture(e.pointerId); } catch (err) { /* staršie prehliadače */ }
      set(toCm(e));
      e.preventDefault();
    });
    svg.addEventListener('pointermove', e => { if (drag && !R.busy) set(toCm(e)); });
    const stop = () => { drag = false; };
    svg.addEventListener('pointerup', stop);
    svg.addEventListener('pointercancel', stop);
  }
  ACT.drawdone = () => { if (R && !R.busy) answer(R.drawB); };

  const PRAISE = () => ['Výborne!', 'Super!', 'Správne!', 'Paráda!', 'Bravo!', g('Si šikovný!', 'Si šikovná!')];

  function answer(val, el) {
    if (!R || R.busy) return;
    if (String(val) === String(R.task.answer)) good(el);
    else bad(el);
  }

  async function good(el) {
    const me = R;
    me.busy = true;
    const t = me.task, first = me.tries === 0;
    if (el) el.classList.add('right');
    Tasks.record(S, t.type, first);
    stat(t.type, first);
    const gain = first ? 3 : 1;
    S.screws += gain;
    const card = document.getElementById('tcard');
    card.classList.add('ok');
    msg(first ? U.pick(PRAISE()) : 'Teraz je to správne!', 'good');
    Snd.correct();
    flyScrews(card, gain);
    const v = vs(me.id);
    const key = v.broken.shift();
    const info = v.broken.length ? null : completeRepair(me.id);
    Store.save();
    await U.wait(700);
    if (R !== me || current !== 'repair') return;
    Snd.ratchet();
    const bay = document.getElementById('bayVeh');
    bay.innerHTML = Art.svg(me.id, { color: v.color, on: v.on, broken: v.broken || [], name: S.name });
    bay.classList.remove('hop');
    void bay.offsetWidth;
    bay.classList.add('hop');
    sparkleAt(bay.querySelector('svg'), me.id, key);
    document.getElementById('prog').innerHTML = progHTML({ total: v.total, broken: v.broken || [] });
    await U.wait(1000);
    if (R !== me || current !== 'repair') return;
    if (info) { show('done', { id: me.id, info }); return; }
    document.getElementById('nextFix').innerHTML = nextFix(v);
    nextTask();
  }

  function bad(el) {
    const t = R.task;
    R.tries++;
    Snd.wrong();
    const card = document.getElementById('tcard');
    card.classList.remove('shake');
    void card.offsetWidth;
    card.classList.add('shake');
    if (el) el.classList.add('wrong');
    if (R.tries === 1) {
      msg(`Skús ešte raz. ${t.hint || ''}`, 'bad');
      R.input = '';
      if (t.input === 'keypad') setTimeout(updSlot, 350);
      if (t.input === 'cmp') setTimeout(() => { const s = slotEl(); if (s && R && R.task === t) s.textContent = '?'; }, 600);
      return;
    }
    Tasks.record(S, t.type, false);
    stat(t.type, false);
    Store.save();
    R.busy = true;
    const me = R;
    setTimeout(() => { if (R === me && me.task === t && current === 'repair') explain(); }, 700);
  }

  function explain() {
    const t = R.task;
    document.getElementById('tcard').className = 'card task-card';
    document.getElementById('tcard').innerHTML = `<div class="explain">
      <p class="t-prompt">Pozri sa, ako na to:</p>${t.explain}
      <p class="ex-ans">Správna odpoveď: <b>${t.answerLabel || t.answer}${t.unit ? ` ${t.unit}` : ''}</b></p></div>`;
    document.getElementById('answer').innerHTML = '<button class="btn big go wide" data-act="next">Ďalší príklad ▶</button>';
    document.getElementById('answer').className = 'answer';
  }

  /* ---------- hotovo ---------- */
  VIEWS.done = ({ id, info }) => {
    const d = D[id];
    const like = { f: 'ako nová', n: 'ako nové', m: 'ako nový' }[d.g];
    return `<div class="scroll gut done">
      <div class="done-veh lift">${vsvg(id)}</div>
      <h1 class="title">Hotovo!</h1>
      <p class="lead">${d.name} je ${like}! Odmena za celú opravu: <b>+10 🔩</b></p>
      ${info.unlocked.map(k => `<p class="news">🎉 Do dielne prišlo nové vozidlo: <b>${D[k].name}</b></p>`).join('')}
      ${info.returned.map(k => `<p class="news">🔧 Na servis sa vrátilo vozidlo: <b>${D[k].name}</b></p>`).join('')}
      <div class="stack">
        <button class="btn big go" data-act="drive" data-id="${id}">🚦 Skúšobná jazda</button>
        <button class="btn big" data-act="garage" data-id="${id}">✨ Vylepšiť za skrutky</button>
        <button class="btn" data-act="home">🏠 Späť do dielne</button>
      </div>
    </div>`;
  };
  AFTER.done = () => {
    R = null;
    updScrews();
    Snd.fanfare();
    confetti();
  };

  /* ---------- vylepšovňa ---------- */
  function upTile(id, u) {
    const v = vs(id), up = Art.UPGRADES[u], d = D[id];
    if (u === 'wagon') {
      const full = v.wagons >= d.wagonMax, price = Art.wagonPrice(v.wagons);
      return `<div class="up"><span class="up-ic" aria-hidden="true">${d.wagonStyle === 'tram' ? '🚋' : up.icon}</span>
        <span class="up-name">${d.wagonName}<small>${v.wagons} z ${d.wagonMax}</small></span>
        ${full ? '<span class="chip ok">Plné ✓</span>' : `<button class="buy${S.screws < price ? ' short' : ''}" data-act="buy" data-id="${id}" data-u="${u}">🔩 ${price}</button>`}</div>`;
    }
    const owned = v.owned[u];
    return `<div class="up${owned ? ' owned' : ''}"><span class="up-ic" aria-hidden="true">${up.icon}</span><span class="up-name">${up.name}</span>
      ${owned
        ? `<button class="toggle${v.on[u] ? ' on' : ''}" data-act="toggle" data-id="${id}" data-u="${u}" aria-pressed="${!!v.on[u]}">${v.on[u] ? 'Zapnuté' : 'Vypnuté'}</button>`
        : `<button class="buy${S.screws < up.price ? ' short' : ''}" data-act="buy" data-id="${id}" data-u="${u}">🔩 ${up.price}</button>`}</div>`;
  }

  VIEWS.garage = id => {
    const d = D[id], v = vs(id);
    return `
      <header class="bar gut"><button class="icon-btn" data-act="home" aria-label="Späť do dielne">◀</button><div class="brand small">Vylepšovňa</div>${pill()}</header>
      <div class="scroll gut garage">
        <h1 class="title">${d.name}</h1>
        <div class="showroom" id="showroom" data-act="honk" data-id="${id}">${vsvg(id, { withWagons: true, steam: true })}</div>
        <div class="row2">
          <button class="btn big go" data-act="drive" data-id="${id}">🚦 Jazda</button>
          <button class="btn big" data-act="honk" data-id="${id}">📯 Zatrúbiť</button>
        </div>
        <h2 class="sec">Farba</h2>
        <div class="swatches">${[[d.color, 'pôvodná farba'], ...Art.COLORS.filter(([hex]) => hex !== d.color)].map(([hex, name]) => {
          const own = v.colors[hex], sel = v.color === hex;
          return `<button class="sw${sel ? ' sel' : ''}" style="--c:${hex}" data-act="color" data-id="${id}" data-c="${hex}" aria-label="${name}${own ? '' : `, ${Art.COLOR_PRICE} skrutiek`}">${own ? (sel ? '✓' : '') : `<span class="price">${Art.COLOR_PRICE}</span>`}</button>`;
        }).join('')}</div>
        <h2 class="sec">Vylepšenia</h2>
        <div class="ups">${d.ups.map(u => upTile(id, u)).join('')}</div>
      </div>`;
  };
  AFTER.garage = () => {
    const sh = document.getElementById('showroom');
    if (sh) sh.scrollLeft = sh.scrollWidth;
  };
  ACT.garage = ({ id }) => show('garage', id);
  ACT.honk = ({ id }) => honk(id);

  function spend(price) {
    if (S.screws < price) {
      Snd.wrong();
      toast(`Chýba ti ešte ${price - S.screws} 🔩. Oprav ďalšie vozidlo!`);
      return false;
    }
    S.screws -= price;
    return true;
  }
  ACT.color = ({ id, c }) => {
    const v = vs(id);
    let bought = false;
    if (!v.colors[c]) {
      if (!spend(Art.COLOR_PRICE)) return;
      v.colors[c] = true;
      bought = true;
    }
    v.color = c;
    Store.save();
    rerender('garage', id);
    if (bought) { Snd.buy(); burstOn(document.querySelector('#showroom svg')); } else Snd.tap();
  };
  ACT.buy = ({ id, u }) => {
    const v = vs(id);
    if (u === 'wagon') {
      if (v.wagons >= D[id].wagonMax || !spend(Art.wagonPrice(v.wagons))) return;
      v.wagons++;
    } else {
      if (!spend(Art.UPGRADES[u].price)) return;
      v.owned[u] = true;
      v.on[u] = true;
    }
    Store.save();
    rerender('garage', id);
    Snd.buy();
    burstOn(document.querySelector('#showroom svg'));
    if (u === 'melody' || u === 'siren') setTimeout(() => honk(id), 600);
  };
  ACT.toggle = ({ id, u }) => {
    const v = vs(id);
    v.on[u] = !v.on[u];
    Store.save();
    Snd.tap();
    rerender('garage', id);
  };

  /* ---------- skúšobná jazda ---------- */
  VIEWS.drive = id => {
    const d = D[id];
    const electric = id === 'elektricka' || id === 'rychlik';
    return `<div class="drive ${d.kind}${electric ? ' electric' : ''}">
      <div class="sun"></div><div class="cloud c1"></div><div class="cloud c2"></div><div class="cloud c3"></div>
      <svg class="hills" viewBox="0 0 400 100" preserveAspectRatio="none" aria-hidden="true">
        <path d="M0 55 Q60 15 120 45 T240 40 T400 35 V100 H0Z" fill="#9ccc65"/>
        <path d="M0 72 Q80 42 160 66 T320 60 T400 66 V100 H0Z" fill="#7cb342"/>
      </svg>
      ${electric ? '<div class="wire"></div>' : ''}
      <div class="track"></div>
      <div class="runner" id="runner" data-act="honk" data-id="${id}">${vsvg(id, { withWagons: true, steam: true, driving: true })}</div>
      <div class="drive-ui gut">
        <button class="btn" data-act="garage" data-id="${id}">◀ Späť</button>
        <button class="btn go" data-act="honk" data-id="${id}">📯 Zatrúbiť</button>
      </div>
    </div>`;
  };
  AFTER.drive = id => {
    const runner = document.getElementById('runner');
    const scene = runner.parentElement;
    const speed = vs(id).on.turbo ? 260 : 140;
    let x = -runner.offsetWidth, last = performance.now();
    const step = t => {
      const dt = Math.min(0.05, (t - last) / 1000);
      last = t;
      x += speed * dt;
      if (x > scene.offsetWidth) x = -runner.offsetWidth;
      runner.style.transform = `translateX(${x}px)`;
      driveRAF = requestAnimationFrame(step);
    };
    driveRAF = requestAnimationFrame(step);
  };
  ACT.drive = ({ id }) => show('drive', id);

  /* ---------- rodičia ---------- */
  VIEWS.gate = () => {
    const a = U.rnd(6, 9), b = U.rnd(6, 9);
    gate = { ans: a * b, input: '' };
    return `<div class="repair">
      <header class="bar gut"><button class="icon-btn" data-act="home" aria-label="Späť do dielne">✕</button><div class="brand small">Pre rodičov</div><span></span></header>
      <div class="task gut">
        <div class="card task-card"><p class="t-prompt">Sem môžu len dospelí. Koľko je ${a} × ${b}?</p>
          <div class="t-body"><div class="expr"><span class="n">${a}</span><span class="op">×</span><span class="n">${b}</span><span class="op">=</span><span class="slot" id="gslot">?</span></div></div>
          <p class="t-msg bad" id="gmsg"></p></div>
        <div class="answer">${keypad('gkey')}</div>
      </div>
    </div>`;
  };
  ACT.gate = () => show('gate');
  ACT.gkey = ({ k }) => {
    if (!gate) return;
    if (k === 'ok') {
      if (Number(gate.input) === gate.ans) { show('parent'); return; }
      gate.input = '';
      document.getElementById('gmsg').textContent = 'To nie je správne.';
    } else if (k === 'del') gate.input = gate.input.slice(0, -1);
    else if (gate.input.length < 2) gate.input += k;
    document.getElementById('gslot').textContent = gate.input || '?';
  };

  function lastDays(n) {
    const out = [];
    for (let i = 0; i < n; i++) {
      const d = new Date(Date.now() - i * 864e5);
      const k = U.dayKey(d);
      out.push({ label: i === 0 ? 'dnes' : i === 1 ? 'včera' : `${d.getDate()}. ${d.getMonth() + 1}.`, s: S.stats[k] || { n: 0, ok: 0 } });
    }
    return out;
  }
  const pct = (ok, n) => (n ? `${Math.round((100 * ok) / n)} %` : '–');

  VIEWS.parent = () => {
    const groups = [...new Set(TYPES.map(t => t.group))];
    const days = lastDays(7);
    return `
      <header class="bar gut"><button class="icon-btn" data-act="home" aria-label="Späť do dielne">◀</button><div class="brand small">Pre rodičov</div><span></span></header>
      <div class="scroll gut parent">
        <section class="panel">
          <h2>Hráč</h2>
          <label class="lbl" for="pName">Meno</label>
          <div class="row-in"><input id="pName" class="name-input" maxlength="14" value="${esc(S.name)}" autocomplete="off"><button class="btn" data-act="saveName">Uložiť</button></div>
          <div class="seg" role="group" aria-label="Oslovenie">
            <button class="${S.gender !== 'f' ? 'sel' : ''}" data-act="gender" data-g="m">chlapec</button>
            <button class="${S.gender === 'f' ? 'sel' : ''}" data-act="gender" data-g="f">dievča</button>
          </div>
        </section>
        <section class="panel">
          <h2>Aké úlohy dávať</h2>
          ${groups.map(gr => `<h3>${gr}</h3>${TYPES.filter(t => t.group === gr).map(t => `
            <label class="chk"><input type="checkbox" id="t-${t.id}" data-act="ptype" data-t="${t.id}"${S.settings.types[t.id] ? ' checked' : ''}><span>${t.name}</span></label>`).join('')}`).join('')}
          <h3>Počet úloh na jednu opravu</h3>
          <div class="seg" role="group" aria-label="Počet úloh na opravu">${[5, 8, 10, 12].map(n => `<button class="${n === S.settings.perRepair ? 'sel' : ''}" data-act="per" data-n="${n}">${n}</button>`).join('')}</div>
          <p class="hint">Platí pre vozidlá, ktoré prídu do dielne odteraz.</p>
        </section>
        <section class="panel">
          <h2>Zvuk</h2>
          <label class="chk"><input type="checkbox" id="pSound" data-act="psound"${S.settings.sound ? ' checked' : ''}><span>Zvuky v hre</span></label>
          <label class="chk"><input type="checkbox" id="pSpeak" data-act="pspeak"${S.settings.autoSpeak ? ' checked' : ''}><span>Čítať každé zadanie nahlas</span></label>
          ${Snd.canSpeak() ? '' : '<p class="hint">Tento telefón nemá slovenský hlas, čítanie nahlas preto nefunguje.</p>'}
        </section>
        <section class="panel">
          <h2>Ako sa darí</h2>
          <p>Spolu opravených vozidiel: <b>${S.repairs}</b>, skrutiek: <b>${S.screws}</b></p>
          <div class="tbl-wrap"><table>
            <thead><tr><th>Deň</th><th>Úlohy</th><th>Hneď správne</th></tr></thead>
            <tbody>${days.map(d => `<tr><td>${d.label}</td><td>${d.s.n}</td><td>${pct(d.s.ok, d.s.n)}</td></tr>`).join('')}</tbody>
          </table></div>
          <h3>Podľa typu úloh</h3>
          <p class="hint">Úroveň 1 až 3 sa mení sama: po štyroch správnych odpovediach za sebou ide hore, po chybách dole.</p>
          <div class="tbl-wrap"><table>
            <thead><tr><th>Typ</th><th>Úroveň</th><th>Posledné</th></tr></thead>
            <tbody>${TYPES.map(t => {
              const k = S.skill[t.id], h = k ? k.hist : [];
              return `<tr><td>${t.name}</td><td>${k ? k.lvl : 1}</td><td>${pct(h.reduce((a, b) => a + b, 0), h.length)}</td></tr>`;
            }).join('')}</tbody>
          </table></div>
        </section>
        <section class="panel">
          <h2>Odmena navyše</h2>
          <p>Za domácu úlohu alebo upratanú izbu môžete pridať skrutky.</p>
          <button class="btn go" data-act="gift">Darovať 20 🔩</button>
        </section>
        <section class="panel">
          <h2>Záloha postupu</h2>
          <p class="hint">Postup je uložený len v tomto telefóne. Kód si skopírujte, ak chcete hru preniesť alebo zálohovať.</p>
          <textarea id="bkOut" readonly rows="3"></textarea>
          <button class="btn" data-act="copy">Vytvoriť a skopírovať kód</button>
          <label class="lbl" for="bkIn">Obnoviť zo zálohy</label>
          <textarea id="bkIn" rows="3" placeholder="Sem vložte kód zálohy"></textarea>
          <button class="btn" data-act="restore">Obnoviť</button>
          <p class="t-msg" id="bkMsg" aria-live="polite"></p>
        </section>
        <section class="panel danger">
          <h2>Začať odznova</h2>
          <div id="resetBox"><button class="btn" data-act="reset">Vymazať všetok postup</button></div>
        </section>
      </div>`;
  };
  ACT.saveName = () => {
    S.name = (document.getElementById('pName').value || '').trim().slice(0, 14);
    Store.save();
    toast('Meno je uložené.');
  };
  ACT.gender = ({ g: gen }) => { S.gender = gen; Store.save(); rerender('parent'); };
  ACT.ptype = ({ t }, el) => {
    S.settings.types[t] = el.checked;
    if (!TYPES.some(x => S.settings.types[x.id])) {
      S.settings.types[t] = true;
      el.checked = true;
      toast('Aspoň jeden typ úloh musí zostať zapnutý.');
    }
    Store.save();
  };
  ACT.per = ({ n }) => { S.settings.perRepair = Number(n); Store.save(); rerender('parent'); };
  ACT.psound = (_, el) => { S.settings.sound = el.checked; Snd.setEnabled(el.checked); Store.save(); };
  ACT.pspeak = (_, el) => { S.settings.autoSpeak = el.checked; Store.save(); };
  ACT.gift = () => { S.screws += 20; Store.save(); updScrews(); Snd.buy(); toast('Pridali ste 20 skrutiek.'); };
  ACT.copy = () => {
    const out = document.getElementById('bkOut');
    out.value = Store.exportCode();
    const fallback = () => { out.focus(); out.select(); document.getElementById('bkMsg').textContent = 'Kód je označený, skopírujte ho.'; };
    try {
      navigator.clipboard.writeText(out.value)
        .then(() => { document.getElementById('bkMsg').textContent = 'Kód je skopírovaný.'; })
        .catch(fallback);
    } catch (e) { fallback(); }
  };
  ACT.restore = () => {
    try {
      S = Store.importCode(document.getElementById('bkIn').value);
      seed();
      Snd.setEnabled(S.settings.sound);
      show('home');
      toast('Postup je obnovený.');
    } catch (e) {
      document.getElementById('bkMsg').textContent = 'Tento kód sa nedá použiť. Skontrolujte, či je skopírovaný celý.';
    }
  };
  ACT.reset = () => {
    document.getElementById('resetBox').innerHTML = '<p>Naozaj vymazať mená, skrutky, vozidlá aj štatistiky?</p>'
      + '<div class="row2"><button class="btn danger-btn" data-act="resetYes">Áno, vymazať</button><button class="btn" data-act="resetNo">Nie</button></div>';
  };
  ACT.resetNo = () => rerender('parent');
  ACT.resetYes = () => {
    S = Store.reset();
    seed();
    Snd.setEnabled(true);
    show('welcome');
  };

  /* ---------- klávesnica na počítači ---------- */
  document.addEventListener('keydown', e => {
    if (e.target.matches && e.target.matches('input, textarea')) return;
    let k = null;
    if (/^[0-9]$/.test(e.key)) k = e.key;
    else if (e.key === 'Backspace') k = 'del';
    else if (e.key === 'Enter') k = 'ok';
    if (!k) return;
    if (current === 'repair' && R && R.task && R.task.input === 'keypad') { ACT.key({ k }); e.preventDefault(); }
    else if (current === 'gate') { ACT.gkey({ k }); e.preventDefault(); }
  });

  /* ---------- štart ---------- */
  Snd.setEnabled(S.settings.sound);
  seed();
  show(S.started ? 'home' : 'welcome');

  try {
    // offline režim len na https (napr. GitHub Pages); pri vývoji na localhoste by prekážal starou verziou
    if ('serviceWorker' in navigator && location.protocol === 'https:') {
      navigator.serviceWorker.register('sw.js').catch(() => {});
    }
  } catch (e) { /* bez offline režimu */ }
})();
