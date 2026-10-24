'use strict';
/* Vozidlá v SVG. Každé má karosériu (draw), kotvy pre poškodenia (a) a zoznam vylepšení (ups).
   Poškodenia sa kreslia podľa zoznamu `broken`, napr. ['mud:0', 'wheel:1', 'paint']. */
const Art = (() => {
  const OUT = '#263238', SW = 3, GLASS = '#b3e5fc';
  const f1 = v => Math.round(v * 10) / 10;

  const COLORS = [
    ['#e53935', 'červená'], ['#1e88e5', 'modrá'], ['#43a047', 'zelená'], ['#fdd835', 'žltá'],
    ['#fb8c00', 'oranžová'], ['#8e24aa', 'fialová'], ['#ec407a', 'ružová'], ['#00acc1', 'tyrkysová'],
    ['#eceff1', 'biela'], ['#546e7a', 'grafitová'],
  ];
  const COLOR_PRICE = 15;

  const UPGRADES = {
    stripes: { name: 'Pretekárske pruhy', icon: '〰️', price: 25 },
    checker: { name: 'Výstražné pruhy', icon: '🏁', price: 30 },
    bolt: { name: 'Nálepka blesk', icon: '⚡', price: 20 },
    rims: { name: 'Zlaté disky', icon: '⭐', price: 30 },
    spoiler: { name: 'Spojler', icon: '🏎️', price: 40 },
    lights: { name: 'Silné svetlá', icon: '💡', price: 25 },
    turbo: { name: 'Turbo plamene', icon: '🔥', price: 50 },
    beacons: { name: 'Blikajúce majáky', icon: '🚨', price: 35 },
    siren: { name: 'Siréna', icon: '📢', price: 35 },
    board: { name: 'Tabuľa s tvojím menom', icon: '📛', price: 30 },
    gold: { name: 'Zlaté ozdoby', icon: '✨', price: 40 },
    rainbow: { name: 'Dúhová para', icon: '🌈', price: 50 },
    melody: { name: 'Hudobný klaksón', icon: '🎵', price: 35 },
    wagon: { name: 'Pripojiť vagón', icon: '🚃', price: 30 },
  };
  const wagonPrice = n => 30 + 10 * n;

  const FIX = {
    wheel: ['🔧', 'Nasadiť koleso'], flat: ['💨', 'Nafúkať pneumatiku'], crack: ['🔨', 'Vymeniť sklo'],
    light: ['💡', 'Opraviť svetlo'], smoke: ['⚙️', 'Opraviť motor'], panto: ['⚡', 'Opraviť zberač prúdu'],
    rust: ['🧽', 'Odstrániť hrdzu'], mud: ['🚿', 'Umyť blato'], web: ['🧹', 'Zmiesť pavučinu'], paint: ['🎨', 'Nalakovať'],
  };
  const FIX_ORDER = { web: 0, mud: 1, smoke: 2, panto: 2, wheel: 3, flat: 3, crack: 4, light: 5, rust: 6, paint: 9 };

  /* ---------- pomocné kreslenie ---------- */
  const shadow = (cx, cy, rx) => `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="6" fill="#000" opacity=".14"/>`;
  const arch = (x, y, r) => `<path d="M${x - r} ${y} A${r} ${r} 0 0 1 ${x + r} ${y} Z" fill="${OUT}"/>`;
  const boltDecal = (x, y, s = 1) =>
    `<path transform="translate(${x} ${y}) scale(${s})" d="M4 -16 L-9 3 L-1 3 L-5 17 L10 -4 L2 -4 L7 -16 Z" fill="#ffeb3b" stroke="${OUT}" stroke-width="2" stroke-linejoin="round"/>`;
  const flame = (x, y) =>
    `<g class="flame"><path d="M${x} ${y - 5} Q${x - 14} ${y - 9} ${x - 26} ${y} Q${x - 14} ${y + 9} ${x} ${y + 5} Z" fill="#ff7043"/>`
    + `<path d="M${x} ${y - 3} Q${x - 8} ${y - 5} ${x - 15} ${y} Q${x - 8} ${y + 5} ${x} ${y + 3} Z" fill="#ffee58"/></g>`;
  function checkerBand(x, y, w, h) {
    const q = h / 2;
    let s = `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="#ffeb3b"/>`;
    for (let i = 0; i * q < w; i++) {
      s += `<rect x="${x + i * q}" y="${y + (i % 2 ? q : 0)}" width="${Math.min(q, w - i * q)}" height="${q}" fill="#1565c0"/>`;
    }
    return s;
  }
  const board = (x, y, w, text) =>
    `<rect x="${x}" y="${y}" width="${w}" height="15" rx="3" fill="#1b1b1b" stroke="${OUT}" stroke-width="2"/>`
    + `<text x="${x + w / 2}" y="${y + 11.5}" text-anchor="middle" font-family="ui-monospace, Menlo, Consolas, monospace" font-weight="700" font-size="11.5" letter-spacing="1.5" fill="#ffb300">${U.esc(text)}</text>`;

  function panto(x, y, broken) {
    let s = `<rect x="${x - 18}" y="${y - 4}" width="36" height="5" rx="1" fill="#546e7a" stroke="${OUT}" stroke-width="1.5"/>`;
    if (broken) {
      return s + `<path d="M${x - 26} ${y - 6} L${x + 6} ${y - 11} L${x + 32} ${y - 5}" fill="none" stroke="${OUT}" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>`
        + `<path d="M${x + 22} ${y - 26} l8 8 m0 -8 l-8 8" stroke="#e53935" stroke-width="3.5" stroke-linecap="round"/>`;
    }
    return s + `<path d="M${x - 14} ${y - 4} L${x} ${y - 24} L${x + 14} ${y - 4} M${x} ${y - 24} L${x - 4} ${y - 38}" fill="none" stroke="${OUT}" stroke-width="3.5" stroke-linejoin="round" stroke-linecap="round"/>`
      + `<rect x="${x - 22}" y="${y - 42}" width="36" height="5" rx="2" fill="#90a4ae" stroke="${OUT}" stroke-width="2"/>`;
  }

  function crack(cx, cy, r) {
    let d = '';
    for (let k = 0; k < 6; k++) {
      const a = (k * Math.PI) / 3 + 0.3, m = r * 0.5;
      d += `M${f1(cx)} ${f1(cy)} L${f1(cx + Math.cos(a) * m + 2)} ${f1(cy + Math.sin(a) * m)} L${f1(cx + Math.cos(a + 0.25) * r)} ${f1(cy + Math.sin(a + 0.25) * r)} `;
    }
    return `<path d="${d}" stroke="#fff" stroke-width="2" fill="none" stroke-linecap="round"/><circle cx="${f1(cx)}" cy="${f1(cy)}" r="2.5" fill="#fff"/>`;
  }
  function glass(cracked, open, x, y, w, h) {
    let s = `${open} fill="${cracked ? '#90a4ae' : GLASS}" stroke="${OUT}" stroke-width="${SW}" stroke-linejoin="round"/>`;
    if (!cracked) s += `<path d="M${f1(x + w * 0.22)} ${f1(y + h * 0.78)} L${f1(x + w * 0.48)} ${f1(y + h * 0.22)}" stroke="#fff" stroke-width="4" stroke-linecap="round" opacity=".75"/>`;
    else s += crack(x + w * 0.45, y + h * 0.48, Math.min(w, h) * 0.42);
    return s;
  }

  function wheel(x, y, r, gold, train) {
    const rim = gold ? '#ffca28' : train ? '#c62828' : '#cfd8dc';
    let sp = '';
    for (let k = 0; k < 3; k++) {
      const a = (k * Math.PI) / 3, dx = f1(Math.cos(a) * r * 0.5), dy = f1(Math.sin(a) * r * 0.5);
      sp += `M${f1(x - dx)} ${f1(y - dy)} L${f1(x + dx)} ${f1(y + dy)} `;
    }
    return `<g class="wheel"><circle cx="${x}" cy="${y}" r="${r}" fill="${train ? '#546e7a' : '#37474f'}" stroke="${OUT}" stroke-width="${SW}"/>`
      + `<circle cx="${x}" cy="${y}" r="${f1(r * 0.64)}" fill="${rim}" stroke="${OUT}" stroke-width="2"/>`
      + `<path d="${sp}" stroke="${OUT}" stroke-width="2.5" stroke-linecap="round"/><circle cx="${x}" cy="${y}" r="${f1(r * 0.16)}" fill="${OUT}"/></g>`;
  }
  const ghostWheel = (x, y, r) =>
    `<circle cx="${x}" cy="${y}" r="${r}" fill="none" stroke="${OUT}" stroke-width="2.5" stroke-dasharray="5 5" opacity=".55"/>`
    + `<circle cx="${x}" cy="${y}" r="${f1(r * 0.22)}" fill="#90a4ae" stroke="${OUT}" stroke-width="2"/>`;
  function flatWheel(x, y, r, gold) {
    const rim = gold ? '#ffca28' : '#cfd8dc';
    return `<path d="M${f1(x - r * 1.15)} ${y + r} Q${f1(x - r * 1.2)} ${f1(y - r * 0.5)} ${x} ${f1(y - r * 0.5)} Q${f1(x + r * 1.2)} ${f1(y - r * 0.5)} ${f1(x + r * 1.15)} ${y + r} Z" fill="#37474f" stroke="${OUT}" stroke-width="${SW}" stroke-linejoin="round"/>`
      + `<ellipse cx="${x}" cy="${f1(y + r * 0.28)}" rx="${f1(r * 0.55)}" ry="${f1(r * 0.4)}" fill="${rim}" stroke="${OUT}" stroke-width="2"/>`;
  }

  const rust = (x, y) =>
    `<g opacity=".95"><circle cx="${x}" cy="${y}" r="9" fill="#8d4a1c"/><circle cx="${x + 7}" cy="${y - 4}" r="6" fill="#b5652a"/>`
    + `<circle cx="${x - 6}" cy="${y + 5}" r="5" fill="#a0522d"/><circle cx="${x + 4}" cy="${y + 6}" r="3" fill="#6d3610"/><circle cx="${x - 3}" cy="${y - 5}" r="2.5" fill="#c97a3a"/></g>`;
  const mud = (x, y) =>
    `<g fill="#6d4c41"><path d="M${x - 13} ${y + 2} Q${x - 12} ${y - 9} ${x - 2} ${y - 8} Q${x + 9} ${y - 12} ${x + 12} ${y - 2} Q${x + 17} ${y + 6} ${x + 6} ${y + 8} Q${x - 4} ${y + 12} ${x - 13} ${y + 2} Z"/>`
    + `<circle cx="${x + 18}" cy="${y - 9}" r="3"/><circle cx="${x - 17}" cy="${y - 8}" r="2.5"/><circle cx="${x + 2}" cy="${y - 15}" r="2"/></g>`;
  function web(x, y) {
    let d = '';
    const n = 5;
    for (let k = 0; k <= n; k++) {
      const a = (k / n) * (Math.PI / 2);
      d += `M${x} ${y} L${f1(x + Math.cos(a) * 30)} ${f1(y + Math.sin(a) * 30)} `;
    }
    for (const rr of [9, 17, 25]) {
      for (let k = 0; k <= n; k++) {
        const a = (k / n) * (Math.PI / 2);
        d += `${k ? 'L' : 'M'}${f1(x + Math.cos(a) * rr)} ${f1(y + Math.sin(a) * rr)} `;
      }
    }
    return `<path d="${d}" stroke="${OUT}" stroke-width="3" fill="none" opacity=".25"/><path d="${d}" stroke="#f5f5f5" stroke-width="1.6" fill="none"/>`
      + `<path d="M${x + 20} ${y + 21} V${y + 35}" stroke="#f5f5f5" stroke-width="1.3"/>`
      + `<g stroke="${OUT}" stroke-width="1.5"><path d="M${x + 14} ${y + 35} L${x + 26} ${y + 43} M${x + 26} ${y + 35} L${x + 14} ${y + 43} M${x + 12} ${y + 39} H${x + 28}"/></g>`
      + `<circle cx="${x + 20}" cy="${y + 39}" r="4.5" fill="${OUT}"/>`;
  }
  const smoke = (x, y) =>
    `<g><circle class="puff" cx="${x}" cy="${y}" r="9" fill="#455a64"/><circle class="puff p2" cx="${x + 5}" cy="${y - 4}" r="11" fill="#37474f"/>`
    + `<circle class="puff p3" cx="${x - 4}" cy="${y - 8}" r="12" fill="#546e7a"/></g>`;
  function steam(x, y, rainbow) {
    const cols = rainbow ? ['#ef5350', '#ffca28', '#66bb6a', '#42a5f5', '#ab47bc'] : ['#ffffff', '#f1f1f1', '#ffffff', '#eeeeee', '#ffffff'];
    return cols.map((c, i) => `<circle class="steam s${i}" cx="${x}" cy="${y}" r="10" fill="${c}" stroke="${OUT}" stroke-width="1.2"/>`).join('');
  }

  /* ---------- kontext kreslenia ---------- */
  function ctx(def, o) {
    const broken = new Set(o.broken || []);
    const on = o.on || {};
    const base = o.color || def.color;
    const body = broken.has('paint') ? U.mix(base, '#a1887f', 0.62) : base;
    return {
      broken, on, body,
      dark: U.shade(body, -0.22),
      contrast: U.lum(body) > 0.62 ? OUT : '#ffffff',
      label: (o.name || 'Dielňa').toUpperCase().slice(0, 12),
      has: k => broken.has(k),
      up: k => !!on[k],
      clip(d, inner) {
        const id = U.uid('clip');
        return `<clipPath id="${id}"><path d="${d}"/></clipPath><g clip-path="url(#${id})">${inner}</g>`;
      },
      win(i, x, y, w, h, rx = 6) {
        return glass(broken.has('crack:' + i), `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${rx}"`, x, y, w, h);
      },
      winPoly(i, ptsStr) {
        const p = ptsStr.split(' ').map(s => s.split(',').map(Number));
        const xs = p.map(q => q[0]), ys = p.map(q => q[1]);
        const x = Math.min(...xs), y = Math.min(...ys);
        return glass(broken.has('crack:' + i), `<polygon points="${ptsStr}"`, x, y, Math.max(...xs) - x, Math.max(...ys) - y);
      },
      lamp(x, y, r) {
        if (broken.has('light')) {
          return `<circle cx="${x}" cy="${y}" r="${r}" fill="#78909c" stroke="${OUT}" stroke-width="${SW}"/>`
            + `<path d="M${f1(x - r * 0.6)} ${f1(y - r * 0.6)} L${f1(x + r * 0.6)} ${f1(y + r * 0.6)} M${f1(x + r * 0.6)} ${f1(y - r * 0.6)} L${f1(x - r * 0.6)} ${f1(y + r * 0.6)}" stroke="${OUT}" stroke-width="2"/>`;
        }
        return (on.lights ? `<circle class="glow" cx="${x}" cy="${y}" r="${f1(r * 2.6)}" fill="#fff59d" opacity=".65"/>` : '')
          + `<circle cx="${x}" cy="${y}" r="${r}" fill="${on.lights ? '#ffffff' : '#fff176'}" stroke="${OUT}" stroke-width="${SW}"/>`;
      },
    };
  }

  /* ---------- vozidlá ---------- */
  const DEFS = {
    auto: {
      name: 'Osobné auto', g: 'n', kind: 'car', color: '#e53935', vb: [-26, 0, 326, 162], after: null,
      horn: 'horn', ups: ['stripes', 'bolt', 'rims', 'spoiler', 'lights', 'turbo', 'melody'],
      a: {
        wheels: [[75, 136, 22], [225, 136, 22]], win: [[118, 66], [182, 66]],
        light: [276, 102], smoke: [252, 76],
        rust: [[58, 106], [206, 108], [252, 104], [112, 104]], mud: [[38, 128], [148, 130], [264, 126]], web: [104, 50],
      },
      draw(c) {
        const body = 'M32 136 Q18 136 18 122 L18 102 Q18 89 32 87 L74 82 L98 47 Q103 40 114 40 L188 40 Q200 40 208 49 L238 83 L268 89 Q286 93 286 110 L286 124 Q286 136 272 136 Z';
        let s = shadow(150, 156, 140);
        if (c.up('spoiler')) s += `<path d="M36 88 L30 66" stroke="${OUT}" stroke-width="7" stroke-linecap="round"/><rect x="6" y="56" width="52" height="11" rx="5" fill="${c.dark}" stroke="${OUT}" stroke-width="${SW}"/>`;
        s += `<path d="${body}" fill="${c.body}"/>`;
        s += c.clip(body, `<rect x="0" y="119" width="300" height="20" fill="${c.dark}"/>`
          + (c.up('stripes') ? `<rect x="0" y="97" width="300" height="8" fill="${c.contrast}"/><rect x="0" y="108" width="300" height="4" fill="${c.contrast}"/>` : ''));
        s += `<path d="${body}" fill="none" stroke="${OUT}" stroke-width="${SW}" stroke-linejoin="round"/>`;
        s += c.winPoly(0, '104,50 140,50 140,80 84,80') + c.winPoly(1, '148,50 196,50 224,80 148,80');
        s += `<path d="M144 46 V118" stroke="${OUT}" stroke-width="2.5"/><rect x="152" y="90" width="16" height="5" rx="2.5" fill="${OUT}"/>`;
        if (c.up('bolt')) s += boltDecal(200, 100, 0.9);
        s += c.lamp(276, 102, 7);
        s += `<rect x="15" y="95" width="8" height="13" rx="3" fill="#e53935" stroke="${OUT}" stroke-width="2"/>`;
        s += `<rect x="268" y="119" width="24" height="10" rx="4" fill="#b0bec5" stroke="${OUT}" stroke-width="2.5"/><rect x="10" y="119" width="18" height="10" rx="4" fill="#b0bec5" stroke="${OUT}" stroke-width="2.5"/>`;
        s += `<rect x="2" y="128" width="18" height="6" rx="3" fill="#78909c" stroke="${OUT}" stroke-width="2"/>`;
        if (c.up('turbo')) s += flame(2, 131);
        return s + arch(75, 136, 28) + arch(225, 136, 28);
      },
    },

    hasici: {
      name: 'Hasičské auto', g: 'n', kind: 'car', color: '#d32f2f', vb: [0, 0, 344, 172], after: 'auto',
      horn: 'horn', ups: ['checker', 'beacons', 'siren', 'rims', 'lights'],
      a: {
        wheels: [[72, 146, 22], [134, 146, 22], [290, 146, 22]], win: [[276, 71]],
        light: [326, 112], smoke: [300, 40],
        rust: [[42, 104], [128, 98], [206, 104], [312, 126]], mud: [[36, 140], [196, 140], [318, 140]], web: [18, 66],
      },
      draw(c) {
        let s = shadow(172, 166, 160);
        s += `<path d="M44 62 V50 M214 62 V50" stroke="${OUT}" stroke-width="5"/>`;
        s += `<rect x="20" y="36" width="230" height="6" rx="2" fill="#cfd8dc" stroke="${OUT}" stroke-width="2"/><rect x="20" y="48" width="230" height="6" rx="2" fill="#cfd8dc" stroke="${OUT}" stroke-width="2"/>`;
        for (let x = 30; x < 248; x += 15) s += `<path d="M${x} 42 V48" stroke="${OUT}" stroke-width="2.5"/>`;
        s += `<rect x="14" y="62" width="224" height="80" rx="8" fill="${c.body}" stroke="${OUT}" stroke-width="${SW}"/>`;
        for (const x of [26, 98, 170]) {
          s += `<rect x="${x}" y="72" width="60" height="44" rx="4" fill="${c.dark}" stroke="${OUT}" stroke-width="2.5"/>`;
          for (let y = 80; y < 116; y += 8) s += `<path d="M${x + 4} ${y} H${x + 56}" stroke="${OUT}" stroke-width="1.5" opacity=".4"/>`;
        }
        const cab = 'M240 142 V52 Q240 44 248 44 H292 Q302 44 308 54 L328 94 Q332 100 332 108 V132 Q332 142 322 142 Z';
        s += `<path d="${cab}" fill="${c.body}" stroke="${OUT}" stroke-width="${SW}" stroke-linejoin="round"/>`;
        s += c.winPoly(0, '252,54 290,54 308,88 252,88');
        s += `<rect x="258" y="100" width="16" height="5" rx="2.5" fill="${OUT}"/>`;
        s += c.up('checker')
          ? checkerBand(16, 120, 220, 10) + checkerBand(242, 120, 88, 10)
          : `<rect x="16" y="121" width="220" height="7" fill="#fff" opacity=".9"/><rect x="242" y="121" width="88" height="7" fill="#fff" opacity=".9"/>`;
        s += c.up('beacons')
          ? `<rect x="254" y="38" width="46" height="8" rx="3" fill="${OUT}"/><circle class="blink" cx="263" cy="35" r="8" fill="#29b6f6" stroke="${OUT}" stroke-width="2"/><circle class="blink b2" cx="291" cy="35" r="8" fill="#29b6f6" stroke="${OUT}" stroke-width="2"/>`
          : `<path d="M266 44 Q266 32 274 32 Q282 32 282 44 Z" fill="#1565c0" stroke="${OUT}" stroke-width="2"/>`;
        s += c.lamp(326, 112, 6);
        s += `<rect x="322" y="128" width="18" height="10" rx="4" fill="#b0bec5" stroke="${OUT}" stroke-width="2.5"/>`;
        return s + arch(72, 146, 28) + arch(134, 146, 28) + arch(290, 146, 28);
      },
    },

    autobus: {
      name: 'Autobus', g: 'm', kind: 'car', color: '#fdd835', vb: [0, 0, 384, 172], after: 'hasici',
      horn: 'horn', ups: ['stripes', 'board', 'rims', 'lights', 'melody'],
      a: {
        wheels: [[80, 146, 22], [318, 146, 22]], win: [[46, 74], [100, 74], [154, 74], [208, 74], [327, 73]],
        light: [362, 122], smoke: [24, 36],
        rust: [[52, 104], [160, 108], [226, 104], [348, 108]], mud: [[38, 138], [200, 140], [354, 138]], web: [26, 58],
      },
      draw(c) {
        const body = 'M10 52 Q10 32 30 32 H350 Q372 32 372 54 V132 Q372 142 362 142 H20 Q10 142 10 132 Z';
        let s = shadow(192, 166, 180);
        s += `<path d="${body}" fill="${c.body}"/>`;
        s += c.clip(body, `<rect x="0" y="114" width="384" height="30" fill="${c.dark}"/>`
          + (c.up('stripes') ? `<rect x="0" y="100" width="384" height="6" fill="${c.contrast}"/><rect x="0" y="108" width="384" height="3" fill="${c.contrast}"/>` : ''));
        s += `<path d="${body}" fill="none" stroke="${OUT}" stroke-width="${SW}"/>`;
        [22, 76, 130, 184].forEach((x, i) => { s += c.win(i, x, 56, 48, 36, 6); });
        s += `<rect x="242" y="54" width="36" height="84" rx="4" fill="${GLASS}" stroke="${OUT}" stroke-width="${SW}"/><path d="M260 54 V138" stroke="${OUT}" stroke-width="2.5"/>`;
        s += c.winPoly(4, '290,50 350,50 364,62 364,96 290,96');
        if (c.up('board')) s += board(40, 36, 190, c.label);
        s += c.lamp(362, 122, 6);
        s += `<rect x="12" y="116" width="7" height="14" rx="3" fill="#e53935" stroke="${OUT}" stroke-width="2"/>`;
        return s + arch(80, 146, 28) + arch(318, 146, 28);
      },
    },

    para: {
      name: 'Parná lokomotíva', g: 'f', kind: 'train', color: '#2e7d32', vb: [0, 0, 340, 182], after: null,
      horn: 'whistle', ups: ['gold', 'rainbow', 'lights', 'wagon', 'melody'],
      wagonMax: 3, wagonStyle: 'old', wagonW: 220, wagonName: 'Pripojiť vagón',
      a: {
        wheels: [[78, 160, 15], [142, 152, 23], [204, 152, 23], [276, 160, 15]], win: [[62, 72], [98, 72]],
        light: [302, 56], smoke: [270, 24], steam: [270, 26],
        rust: [[150, 104], [244, 110], [66, 108], [104, 116]], mud: [[60, 140], [176, 136], [296, 140]], web: [38, 48],
      },
      draw(c) {
        const gold = c.up('gold'), trim = gold ? '#ffca28' : c.dark;
        let s = shadow(170, 177, 160);
        s += `<rect x="30" y="126" width="282" height="16" rx="3" fill="#37474f" stroke="${OUT}" stroke-width="${SW}"/>`;
        s += `<rect x="36" y="44" width="88" height="86" rx="4" fill="${c.body}" stroke="${OUT}" stroke-width="${SW}"/>`;
        s += `<rect x="28" y="34" width="104" height="13" rx="6" fill="${trim}" stroke="${OUT}" stroke-width="${SW}"/>`;
        s += c.win(0, 48, 58, 28, 28, 5) + c.win(1, 84, 58, 28, 28, 5);
        s += `<rect x="120" y="68" width="172" height="60" rx="8" fill="${c.body}" stroke="${OUT}" stroke-width="${SW}"/>`;
        s += `<rect x="128" y="74" width="156" height="8" rx="4" fill="#fff" opacity=".25"/>`;
        s += [168, 234].map(x => `<rect x="${x}" y="68" width="8" height="60" fill="${trim}" stroke="${OUT}" stroke-width="2"/>`).join('');
        s += `<path d="M192 69 Q192 50 208 50 Q224 50 224 69 Z" fill="${gold ? '#ffca28' : c.body}" stroke="${OUT}" stroke-width="${SW}"/>`;
        s += `<rect x="282" y="62" width="28" height="70" rx="9" fill="#37474f" stroke="${OUT}" stroke-width="${SW}"/>`;
        s += `<path d="M260 66 L262 42 L254 32 H286 L278 42 L280 66 Z" fill="#37474f" stroke="${OUT}" stroke-width="${SW}" stroke-linejoin="round"/>`;
        if (gold) s += `<rect x="252" y="29" width="36" height="6" rx="2" fill="#ffca28" stroke="${OUT}" stroke-width="2"/>`;
        s += `<path d="M306 140 L334 168 H306 Z" fill="#c62828" stroke="${OUT}" stroke-width="${SW}" stroke-linejoin="round"/>`;
        s += `<rect x="310" y="116" width="16" height="9" rx="3" fill="#90a4ae" stroke="${OUT}" stroke-width="2"/>`;
        return s + c.lamp(302, 56, 7);
      },
      // ojnica medzi hnacími kolesami, kreslí sa nad kolesá
      over(c) {
        if (c.has('wheel:1') || c.has('wheel:2') || c.has('flat:1') || c.has('flat:2')) return '';
        return `<path d="M142 160 H204" stroke="${OUT}" stroke-width="9" stroke-linecap="round"/><path d="M142 160 H204" stroke="#cfd8dc" stroke-width="4" stroke-linecap="round"/>`;
      },
    },

    elektricka: {
      name: 'Električka', g: 'f', kind: 'train', color: '#e53935', vb: [0, 0, 380, 182], after: 'para',
      horn: 'bell', ups: ['stripes', 'board', 'lights', 'wagon', 'melody'],
      wagonMax: 1, wagonStyle: 'tram', wagonW: 300, wagonName: 'Vlečný vozeň',
      a: {
        wheels: [[70, 164, 13], [106, 164, 13], [274, 164, 13], [310, 164, 13]],
        win: [[54, 89], [100, 89], [146, 89], [244, 89], [290, 89], [342, 89]],
        light: [360, 134], panto: [190, 52],
        rust: [[40, 124], [140, 128], [250, 124], [332, 128]], mud: [[52, 148], [190, 150], [330, 148]], web: [20, 62],
      },
      draw(c) {
        const body = 'M14 78 Q14 52 40 52 H340 Q368 52 368 80 V146 Q368 154 360 154 H22 Q14 154 14 146 Z';
        let s = shadow(190, 177, 175);
        s += panto(190, 52, c.has('panto'));
        s += `<path d="${body}" fill="${c.body}"/>`;
        s += c.clip(body, `<rect x="0" y="52" width="380" height="16" fill="#f5f5f5"/><rect x="0" y="136" width="380" height="22" fill="${c.dark}"/>`
          + (c.up('stripes') ? `<rect x="0" y="114" width="380" height="7" fill="${c.contrast === '#ffffff' ? '#ffffff' : OUT}"/><rect x="0" y="124" width="380" height="3" fill="${c.contrast === '#ffffff' ? '#ffffff' : OUT}"/>` : ''));
        s += `<path d="${body}" fill="none" stroke="${OUT}" stroke-width="${SW}"/>`;
        [34, 80, 126].forEach((x, i) => { s += c.win(i, x, 72, 40, 34, 6); });
        s += `<rect x="172" y="72" width="36" height="78" rx="4" fill="${GLASS}" stroke="${OUT}" stroke-width="${SW}"/><path d="M190 72 V150" stroke="${OUT}" stroke-width="2.5"/>`;
        [224, 270].forEach((x, i) => { s += c.win(3 + i, x, 72, 40, 34, 6); });
        s += c.winPoly(5, '322,66 350,66 362,78 362,112 322,112');
        if (c.up('board')) s += board(56, 54, 112, c.label);
        s += `<rect x="52" y="152" width="72" height="10" rx="3" fill="#37474f" stroke="${OUT}" stroke-width="2"/><rect x="256" y="152" width="72" height="10" rx="3" fill="#37474f" stroke="${OUT}" stroke-width="2"/>`;
        return s + c.lamp(360, 134, 6);
      },
    },

    rychlik: {
      name: 'Rýchlik', g: 'm', kind: 'train', color: '#1565c0', vb: [0, 0, 360, 182], after: 'elektricka',
      horn: 'trainhorn', ups: ['stripes', 'bolt', 'lights', 'wagon', 'melody'],
      wagonMax: 4, wagonStyle: 'modern', wagonW: 240, wagonName: 'Pripojiť vagón',
      a: {
        wheels: [[66, 164, 14], [106, 164, 14], [238, 164, 14], [278, 164, 14]],
        win: [[316, 80], [38, 78], [78, 75], [270, 75]],
        light: [338, 124], panto: [110, 50],
        rust: [[60, 116], [170, 114], [236, 118], [312, 124]], mud: [[44, 136], [176, 136], [300, 136]], web: [20, 54],
      },
      draw(c) {
        const body = 'M16 140 V62 Q16 50 28 50 H298 Q312 50 320 62 L344 112 Q348 120 348 128 V140 Z';
        let s = shadow(180, 177, 170);
        s += panto(250, 50, false) + panto(110, 50, c.has('panto'));
        s += `<path d="${body}" fill="${c.body}"/>`;
        s += c.clip(body, `<rect x="0" y="128" width="360" height="14" fill="${c.dark}"/>`
          + (c.up('stripes')
            ? `<path d="M0 108 H250 L292 92 H360 V102 H296 L256 118 H0 Z" fill="${c.contrast}"/>`
            : `<rect x="0" y="116" width="360" height="3" fill="#ffffff" opacity=".85"/>`));
        s += `<path d="${body}" fill="none" stroke="${OUT}" stroke-width="${SW}" stroke-linejoin="round"/>`;
        s += c.winPoly(0, '300,60 314,60 336,102 300,102');
        s += c.win(1, 24, 62, 28, 32, 5) + c.win(2, 66, 64, 24, 22, 4) + c.win(3, 258, 64, 24, 22, 4);
        for (let x = 104; x < 244; x += 12) s += `<rect x="${x}" y="64" width="6" height="30" rx="2" fill="${c.dark}" opacity=".7"/>`;
        if (c.up('bolt')) s += boltDecal(180, 110, 0.75);
        s += `<rect x="14" y="140" width="336" height="8" fill="#37474f" stroke="${OUT}" stroke-width="2"/>`;
        s += `<rect x="46" y="152" width="80" height="10" rx="3" fill="#37474f" stroke="${OUT}" stroke-width="2"/><rect x="218" y="152" width="80" height="10" rx="3" fill="#37474f" stroke="${OUT}" stroke-width="2"/>`;
        return s + c.lamp(336, 124, 6);
      },
    },
  };
  const ORDER = ['auto', 'hasici', 'autobus', 'para', 'elektricka', 'rychlik'];

  /* ---------- vagóny ---------- */
  function wagon(style, c, w) {
    const col = c.body, dk = c.dark;
    let s = '';
    if (style === 'old') {
      s += `<rect x="20" y="138" width="${w - 40}" height="10" rx="3" fill="#455a64"/>`;
      s += `<rect x="6" y="124" width="${w - 12}" height="14" rx="3" fill="#37474f" stroke="${OUT}" stroke-width="2.5"/>`;
      s += `<rect x="10" y="62" width="${w - 20}" height="64" rx="5" fill="${col}" stroke="${OUT}" stroke-width="${SW}"/>`;
      s += `<path d="M4 66 Q${w / 2} 42 ${w - 4} 66 Z" fill="${dk}" stroke="${OUT}" stroke-width="${SW}" stroke-linejoin="round"/>`;
      for (let i = 0; i < 5; i++) s += `<rect x="${f1(22 + i * ((w - 70) / 4))}" y="76" width="26" height="24" rx="4" fill="${GLASS}" stroke="${OUT}" stroke-width="2.5"/>`;
      s += `<rect x="10" y="108" width="${w - 20}" height="6" fill="${c.up('gold') ? '#ffca28' : dk}"/>`;
      s += `<rect x="${w - 8}" y="126" width="16" height="6" rx="2" fill="${OUT}"/>`;
      s += [40, 74, w - 74, w - 40].map(x => wheel(x, 160, 15, false, true)).join('');
    } else if (style === 'modern') {
      s += `<rect x="6" y="136" width="${w - 12}" height="10" fill="#37474f" stroke="${OUT}" stroke-width="2"/>`;
      s += `<rect x="8" y="52" width="${w - 16}" height="86" rx="12" fill="${col}" stroke="${OUT}" stroke-width="${SW}"/>`;
      s += `<rect x="9" y="110" width="${w - 18}" height="7" fill="${c.contrast}" opacity=".85"/>`;
      s += `<rect x="16" y="62" width="16" height="70" rx="3" fill="${dk}" stroke="${OUT}" stroke-width="2.5"/><rect x="${w - 32}" y="62" width="16" height="70" rx="3" fill="${dk}" stroke="${OUT}" stroke-width="2.5"/>`;
      for (let i = 0; i < 6; i++) s += `<rect x="${f1(42 + i * ((w - 106) / 5))}" y="66" width="22" height="28" rx="5" fill="${GLASS}" stroke="${OUT}" stroke-width="2.5"/>`;
      s += `<rect x="${w - 8}" y="128" width="16" height="6" rx="2" fill="${OUT}"/>`;
      s += `<rect x="26" y="150" width="76" height="10" rx="3" fill="#37474f"/><rect x="${w - 102}" y="150" width="76" height="10" rx="3" fill="#37474f"/>`;
      s += [44, 84, w - 84, w - 44].map(x => wheel(x, 164, 14, false, true)).join('');
    } else {
      const d = `M14 78 Q14 52 40 52 H${w - 26} Q${w - 8} 52 ${w - 8} 78 V146 Q${w - 8} 154 ${w - 16} 154 H22 Q14 154 14 146 Z`;
      s += `<path d="${d}" fill="${col}"/>`;
      s += c.clip(d, `<rect x="0" y="52" width="${w}" height="16" fill="#f5f5f5"/><rect x="0" y="136" width="${w}" height="22" fill="${dk}"/>`);
      s += `<path d="${d}" fill="none" stroke="${OUT}" stroke-width="${SW}"/>`;
      for (let i = 0; i < 5; i++) {
        const x = 30 + i * 52;
        s += i === 2
          ? `<rect x="${x}" y="72" width="36" height="78" rx="4" fill="${GLASS}" stroke="${OUT}" stroke-width="${SW}"/><path d="M${x + 18} 72 V150" stroke="${OUT}" stroke-width="2.5"/>`
          : `<rect x="${x}" y="72" width="40" height="34" rx="6" fill="${GLASS}" stroke="${OUT}" stroke-width="${SW}"/>`;
      }
      s += `<rect x="${w - 10}" y="132" width="16" height="6" rx="2" fill="${OUT}"/>`;
      s += `<rect x="40" y="152" width="72" height="10" rx="3" fill="#37474f"/><rect x="${w - 112}" y="152" width="72" height="10" rx="3" fill="#37474f"/>`;
      s += [58, 94, w - 94, w - 58].map(x => wheel(x, 164, 13, false, true)).join('');
    }
    return s;
  }

  /* ---------- celé vozidlo ---------- */
  function svg(id, o = {}) {
    const d = DEFS[id], c = ctx(d, o);
    const [vx, vy, vw, vh] = d.vb;
    const nW = o.wagons ? Math.min(o.wagons, d.wagonMax || 0) : 0;
    const ww = d.wagonW || 0;
    let s = '';
    for (let i = 0; i < nW; i++) s += `<g transform="translate(${vx + i * ww} 0)">${wagon(d.wagonStyle, c, ww - 6)}</g>`;
    let v = d.draw(c);
    v += d.a.wheels.map(([x, y, r], i) => (c.has('wheel:' + i)
      ? ghostWheel(x, y, r)
      : c.has('flat:' + i) ? flatWheel(x, y, r, c.up('rims')) : wheel(x, y, r, c.up('rims'), d.kind === 'train'))).join('');
    if (d.over) v += d.over(c);
    for (const k of c.broken) {
      const [t, i] = k.split(':');
      if (t === 'rust') v += rust(...d.a.rust[i]);
      else if (t === 'mud') v += mud(...d.a.mud[i]);
      else if (t === 'web') v += web(...d.a.web);
      else if (t === 'smoke') v += smoke(...d.a.smoke);
    }
    if (o.steam && d.a.steam && !c.has('smoke')) v += steam(...d.a.steam, c.up('rainbow'));
    s += `<g transform="translate(${nW * ww} 0)">${v}</g>`;
    return `<svg class="veh${o.driving ? ' driving' : ''}" viewBox="${vx} ${vy} ${vw + nW * ww} ${vh}" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${U.esc(d.name)}">${s}</svg>`;
  }

  /* ---------- poškodenia ---------- */
  function makeDamage(id, n) {
    const a = DEFS[id].a;
    const wheels = U.shuffle(a.wheels.map((_, i) => i));
    const nMissing = Math.max(1, Math.min(2, Math.floor(a.wheels.length / 2)));
    const pool = [];
    wheels.slice(0, nMissing).forEach(i => pool.push('wheel:' + i));
    if (wheels.length > nMissing) pool.push('flat:' + wheels[nMissing]);
    a.win.forEach((_, i) => pool.push('crack:' + i));
    if (a.light) pool.push('light');
    if (a.smoke) pool.push('smoke');
    if (a.panto) pool.push('panto');
    a.rust.forEach((_, i) => pool.push('rust:' + i));
    a.mud.forEach((_, i) => pool.push('mud:' + i));
    if (a.web) pool.push('web');
    // striedame druhy poškodení, aby oprava nebola len samá hrdza
    const byKind = {};
    U.shuffle(pool).forEach(k => { const t = k.split(':')[0]; (byKind[t] = byKind[t] || []).push(k); });
    const kinds = U.shuffle(Object.keys(byKind));
    const picked = [];
    while (picked.length < n - 1 && kinds.some(k => byKind[k].length)) {
      for (const k of kinds) {
        if (picked.length >= n - 1) break;
        if (byKind[k].length) picked.push(byKind[k].pop());
      }
    }
    picked.sort((p, q) => FIX_ORDER[p.split(':')[0]] - FIX_ORDER[q.split(':')[0]]);
    picked.push('paint');
    return picked;
  }

  function anchorOf(id, key) {
    const d = DEFS[id], a = d.a;
    const [t, i] = key.split(':');
    if (t === 'wheel' || t === 'flat') return a.wheels[i].slice(0, 2);
    if (t === 'crack') return a.win[i];
    if (t === 'rust' || t === 'mud') return a[t][i];
    if (t === 'web') return [a.web[0] + 15, a.web[1] + 15];
    if (t === 'panto') return [a.panto[0], a.panto[1] - 20];
    if (a[t]) return a[t];
    return [d.vb[0] + d.vb[2] / 2, d.vb[1] + d.vb[3] / 2];
  }

  return { DEFS, ORDER, COLORS, COLOR_PRICE, UPGRADES, wagonPrice, FIX, svg, makeDamage, anchorOf };
})();
