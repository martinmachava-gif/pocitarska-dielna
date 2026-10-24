'use strict';
/* Geometria v SVG: rovinné útvary, telesá, čiary, pravítko, číselná os a obrázky na počítanie. */
const Geo = (() => {
  const OUT = '#263238';
  const HL = '#ff6d00';
  const PAL = ['#ef5350', '#42a5f5', '#66bb6a', '#ffca28', '#ab47bc', '#ff7043', '#26c6da', '#ec407a'];
  const FONT = "'Baloo 2', system-ui, sans-serif";
  const f1 = v => Math.round(v * 10) / 10;
  const box = (inner, w, h, cls = 'geo') =>
    `<svg class="${cls}" viewBox="0 0 ${w} ${h}" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">${inner}</svg>`;
  const pts = arr => arr.map(p => f1(p[0]) + ',' + f1(p[1])).join(' ');
  const strokeOf = hl => (hl ? `stroke="${HL}" stroke-width="5"` : `stroke="${OUT}" stroke-width="3"`);

  function rotate(arr, cx, cy, deg) {
    const a = (deg * Math.PI) / 180, s = Math.sin(a), c = Math.cos(a);
    return arr.map(([x, y]) => [cx + (x - cx) * c - (y - cy) * s, cy + (x - cx) * s + (y - cy) * c]);
  }

  /* ---------- rovinné útvary ---------- */
  function shapePts(kind, cx, cy, size, variant) {
    const h = size / 2;
    if (kind === 'square') {
      const q = size * 0.42;
      return [[cx - q, cy - q], [cx + q, cy - q], [cx + q, cy + q], [cx - q, cy + q]];
    }
    if (kind === 'rectangle') {
      const w = size * 0.58, q = size * 0.28;
      return [[cx - w, cy - q], [cx + w, cy - q], [cx + w, cy + q], [cx - w, cy + q]];
    }
    return [
      [[cx, cy - h], [cx + h * 1.05, cy + h * 0.8], [cx - h * 1.05, cy + h * 0.8]],
      [[cx - h * 0.9, cy - h], [cx + h, cy + h * 0.8], [cx - h * 0.9, cy + h * 0.8]],
      [[cx - h * 0.2, cy - h], [cx + h * 1.1, cy + h * 0.75], [cx - h * 1.05, cy + h * 0.55]],
    ][variant % 3];
  }
  function shape(kind, cx, cy, size, fill, deg = 0, variant = 0, hl = false) {
    if (kind === 'circle') return `<circle cx="${f1(cx)}" cy="${f1(cy)}" r="${f1(size * 0.48)}" fill="${fill}" ${strokeOf(hl)}/>`;
    const p = rotate(shapePts(kind, cx, cy, size, variant), cx, cy, deg);
    return `<polygon points="${pts(p)}" fill="${fill}" ${strokeOf(hl)} stroke-linejoin="round"/>`;
  }

  /* ---------- telesá ---------- */
  function solid(kind, fill = '#42a5f5') {
    const d = U.shade(fill, -0.28), l = U.shade(fill, 0.32);
    const st = `stroke="${OUT}" stroke-width="3" stroke-linejoin="round"`;
    const dash = `stroke="${OUT}" stroke-width="2" stroke-dasharray="5 4" fill="none" opacity=".55"`;
    let s = '';
    switch (kind) {
      case 'kocka':
        s = `<polygon points="22,44 78,44 78,100 22,100" fill="${fill}" ${st}/>`
          + `<polygon points="22,44 44,22 100,22 78,44" fill="${l}" ${st}/>`
          + `<polygon points="78,44 100,22 100,78 78,100" fill="${d}" ${st}/>`;
        break;
      case 'kvader':
        s = `<polygon points="8,60 84,60 84,104 8,104" fill="${fill}" ${st}/>`
          + `<polygon points="8,60 30,38 106,38 84,60" fill="${l}" ${st}/>`
          + `<polygon points="84,60 106,38 106,82 84,104" fill="${d}" ${st}/>`;
        break;
      case 'gula': {
        const gid = U.uid('g');
        s = `<defs><radialGradient id="${gid}" cx=".35" cy=".32" r=".75"><stop offset="0" stop-color="${l}"/><stop offset="1" stop-color="${d}"/></radialGradient></defs>`
          + `<circle cx="60" cy="60" r="44" fill="url(#${gid})" ${st}/>`
          + `<path d="M16 60 A44 13 0 0 0 104 60" fill="none" stroke="${OUT}" stroke-width="2" opacity=".5"/>`
          + `<path d="M16 60 A44 13 0 0 1 104 60" ${dash}/>`;
        break;
      }
      case 'valec':
        s = `<path d="M30 26 V94 A30 10 0 0 0 90 94 V26 Z" fill="${fill}" ${st}/>`
          + `<ellipse cx="60" cy="26" rx="30" ry="10" fill="${l}" ${st}/>`
          + `<path d="M30 94 A30 10 0 0 1 90 94" ${dash}/>`;
        break;
      case 'kuzel':
        s = `<path d="M60 12 L96 94 A36 11 0 0 1 24 94 Z" fill="${fill}" ${st}/>`
          + `<path d="M24 94 A36 11 0 0 1 96 94" ${dash}/>`;
        break;
      case 'ihlan':
        s = `<path d="M40 78 L100 78 M40 78 L18 96 M40 78 L60 14" ${dash}/>`
          + `<polygon points="18,96 78,96 60,14" fill="${fill}" ${st}/>`
          + `<polygon points="78,96 100,78 60,14" fill="${d}" ${st}/>`;
        break;
    }
    return box(s, 120, 120);
  }

  // Predmety z dielne, ktoré sa podobajú telesám (kreslené, aby nezáviseli od emoji v telefóne)
  const THINGS = {
    sud: `<path d="M34 24 Q27 60 34 96 A26 8 0 0 0 86 96 Q93 60 86 24 Z" fill="#1e88e5" stroke="${OUT}" stroke-width="3"/>`
      + `<ellipse cx="60" cy="24" rx="26" ry="8" fill="#64b5f6" stroke="${OUT}" stroke-width="3"/>`
      + `<path d="M31 48 Q60 57 89 48 M31 74 Q60 83 89 74" stroke="${OUT}" stroke-width="3" fill="none"/>`
      + `<circle cx="66" cy="22" r="3" fill="${OUT}"/>`,
    ciapka: `<path d="M60 14 L92 98 A32 9 0 0 1 28 98 Z" fill="#ab47bc" stroke="${OUT}" stroke-width="3" stroke-linejoin="round"/>`
      + `<circle cx="56" cy="50" r="5" fill="#ffca28"/><circle cx="70" cy="72" r="5" fill="#ffca28"/><circle cx="48" cy="82" r="5" fill="#ffca28"/>`
      + `<circle cx="60" cy="12" r="8" fill="#ff7043" stroke="${OUT}" stroke-width="3"/>`,
    pyramida: `<path d="M4 104 H116" stroke="#d7b46a" stroke-width="8" stroke-linecap="round"/>`
      + `<polygon points="14,100 76,100 62,18" fill="#e9c46a" stroke="${OUT}" stroke-width="3" stroke-linejoin="round"/>`
      + `<polygon points="76,100 108,86 62,18" fill="#c99a3c" stroke="${OUT}" stroke-width="3" stroke-linejoin="round"/>`
      + `<path d="M24 82 H72 M36 62 H68 M48 42 H65" stroke="${OUT}" stroke-width="1.5" opacity=".35"/>`,
    krabica: `<polygon points="8,58 82,58 82,104 8,104" fill="#c8915a" stroke="${OUT}" stroke-width="3" stroke-linejoin="round"/>`
      + `<polygon points="8,58 30,38 104,38 82,58" fill="#ddb07c" stroke="${OUT}" stroke-width="3" stroke-linejoin="round"/>`
      + `<polygon points="82,58 104,38 104,84 82,104" fill="#a8743f" stroke="${OUT}" stroke-width="3" stroke-linejoin="round"/>`
      + `<path d="M45 58 V104 M19 48 L93 48" stroke="#8d6e63" stroke-width="5" opacity=".7"/>`,
  };
  const thing = key => box(THINGS[key], 120, 120);

  /* ---------- čiary ---------- */
  const LW = 240, LH = 90;
  function line(kind, segs) {
    let d, p = null;
    if (kind === 'rovna') {
      d = `M20 ${U.rnd(14, 76)} L${LW - 20} ${U.rnd(14, 76)}`;
    } else if (kind === 'kriva') {
      const a = Math.random() < 0.5 ? 1 : -1;
      d = `M20 45 C70 ${45 - a * 38}, 100 ${45 + a * 38}, 130 45 S 190 ${45 - a * 34}, ${LW - 20} ${U.rnd(30, 60)}`;
    } else {
      const n = segs || U.rnd(2, 5);
      p = [];
      for (let i = 0; i <= n; i++) p.push([20 + (i * (LW - 40)) / n, i % 2 ? U.rnd(12, 32) : U.rnd(58, 78)]);
      d = 'M' + p.map(q => f1(q[0]) + ' ' + f1(q[1])).join(' L');
    }
    return { d, p, segs: p ? p.length - 1 : 1 };
  }
  function lineSVG(ln, o = {}) {
    let s = '';
    if (o.numbered && ln.p) {
      for (let i = 0; i < ln.p.length - 1; i++) {
        const [x1, y1] = ln.p[i], [x2, y2] = ln.p[i + 1];
        s += `<path d="M${f1(x1)} ${f1(y1)} L${f1(x2)} ${f1(y2)}" stroke="${PAL[i % PAL.length]}" stroke-width="6" stroke-linecap="round"/>`;
      }
      for (let i = 0; i < ln.p.length - 1; i++) {
        const [x1, y1] = ln.p[i], [x2, y2] = ln.p[i + 1];
        s += badge(f1((x1 + x2) / 2), f1((y1 + y2) / 2), i + 1, OUT);
      }
    } else {
      s = `<path d="${ln.d}" fill="none" stroke="#1f6fd1" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/>`;
    }
    if (o.dots && ln.p) s += ln.p.map(q => `<circle cx="${f1(q[0])}" cy="${f1(q[1])}" r="5" fill="${OUT}"/>`).join('');
    return box(s, LW, LH, 'geo line');
  }

  /* ---------- pravítko a úsečka ---------- */
  const X0 = 22, CM = 27, MAXCM = 12, RW = X0 * 2 + MAXCM * CM, SEGY = 40;
  const label = (x, y, t, cls = '') =>
    `<text ${cls ? `class="${cls}" ` : ''}x="${x}" y="${y}" text-anchor="middle" font-size="19" font-weight="800" fill="${OUT}" font-family="${FONT}">${t}</text>`;
  function ruler(o) {
    const ax = X0 + o.a * CM, bx = X0 + o.b * CM;
    let s = `<rect x="6" y="58" width="${RW - 12}" height="52" rx="6" fill="#ffe08a" stroke="${OUT}" stroke-width="2.5"/>`;
    if (o.hl) s += `<rect x="${ax}" y="59.5" width="${bx - ax}" height="15" fill="#ff8a65" opacity=".6"/>`;
    for (let mm = 0; mm <= MAXCM * 10; mm += 5) {
      const x = f1(X0 + (mm / 10) * CM), whole = mm % 10 === 0;
      s += `<path d="M${x} 58 V${whole ? 74 : 66}" stroke="${OUT}" stroke-width="${whole ? 2 : 1.2}"/>`;
    }
    for (let i = 0; i <= MAXCM; i++) {
      s += `<text x="${X0 + i * CM}" y="93" text-anchor="middle" font-size="17" font-weight="800" fill="${OUT}" font-family="${FONT}">${i}</text>`;
    }
    s += `<text x="${RW - 9}" y="105" text-anchor="end" font-size="10" font-weight="700" fill="${OUT}" font-family="system-ui, sans-serif">cm</text>`;
    s += `<path d="M${ax} ${SEGY} V58" stroke="#78909c" stroke-width="1.5" stroke-dasharray="3 3"/>`;
    s += `<path class="gB" d="M${bx} ${SEGY} V58" stroke="#78909c" stroke-width="1.5" stroke-dasharray="3 3"/>`;
    s += `<path class="seg" d="M${ax} ${SEGY} H${bx}" stroke="#d32f2f" stroke-width="5" stroke-linecap="round"/>`;
    s += `<path d="M${ax} ${SEGY - 8} V${SEGY + 8}" stroke="${OUT}" stroke-width="3"/>`;
    s += `<path class="tB" d="M${bx} ${SEGY - 8} V${SEGY + 8}" stroke="${OUT}" stroke-width="3"/>`;
    s += label(ax, 22, 'A') + label(bx, 22, 'B', 'lB');
    if (o.drag) {
      s += `<g class="hB" transform="translate(${bx} ${SEGY})"><circle r="13" fill="#ffc21a" stroke="${OUT}" stroke-width="3"/>`
        + `<path d="M-6 0 H6 M-6 0 l3 -3 M-6 0 l3 3 M6 0 l-3 -3 M6 0 l-3 3" stroke="${OUT}" stroke-width="2" stroke-linecap="round" fill="none"/></g>`;
    }
    return box(s, RW, 113, 'ruler' + (o.drag ? ' drag' : ''));
  }
  function setRulerB(svg, a, b) {
    const ax = X0 + a * CM, bx = X0 + b * CM;
    svg.querySelector('.seg').setAttribute('d', `M${ax} ${SEGY} H${bx}`);
    svg.querySelector('.gB').setAttribute('d', `M${bx} ${SEGY} V58`);
    svg.querySelector('.tB').setAttribute('d', `M${bx} ${SEGY - 8} V${SEGY + 8}`);
    svg.querySelector('.lB').setAttribute('x', bx);
    svg.querySelector('.hB').setAttribute('transform', `translate(${bx} ${SEGY})`);
  }
  // pozícia v cm podľa súradnice x v rámci SVG
  const cmAt = x => Math.round((x - X0) / CM);

  /* ---------- číselná os ---------- */
  function numberLine(start, jumps) {
    const NX = 14, S = 17, W = NX * 2 + 20 * S, Y = 70;
    const marks = new Set([start]);
    let p = start;
    jumps.forEach(j => { p += j; marks.add(p); });
    let s = `<path d="M${NX - 8} ${Y} H${W - NX + 8}" stroke="${OUT}" stroke-width="2.5"/>`;
    for (let i = 0; i <= 20; i++) {
      const x = NX + i * S, big = marks.has(i), t = i % 5 ? 5 : 8;
      s += `<path d="M${x} ${Y - t} V${Y + t}" stroke="${OUT}" stroke-width="${i % 10 ? 1.5 : 2.5}"/>`;
      s += `<text x="${x}" y="${Y + 23}" text-anchor="middle" font-size="${big ? 15 : 10.5}" font-weight="${big ? 800 : 600}" fill="${big ? '#d84315' : OUT}" font-family="${FONT}">${i}</text>`;
    }
    const cols = ['#1f6fd1', '#2f9e4f', '#8e24aa'];
    p = start;
    jumps.forEach((j, k) => {
      const q = p + j, x1 = NX + p * S, x2 = NX + q * S, mx = (x1 + x2) / 2;
      const h = 14 + Math.min(Math.abs(j), 10) * 2.6;
      const col = cols[k % cols.length];
      s += `<path d="M${x1} ${Y - 5} Q${mx} ${Y - 5 - h * 2} ${x2} ${Y - 5}" fill="none" stroke="${col}" stroke-width="3"/>`;
      s += `<path d="M${x2 - 5} ${Y - 15} L${x2 + 5} ${Y - 15} L${x2} ${Y - 5} Z" fill="${col}"/>`;
      s += `<text x="${mx}" y="${f1(Y - 10 - h)}" text-anchor="middle" font-size="14" font-weight="800" fill="${col}" font-family="${FONT}">${j > 0 ? '+' : '−'}${Math.abs(j)}</text>`;
      p = q;
    });
    s += `<circle cx="${NX + start * S}" cy="${Y}" r="5" fill="#d84315"/>`;
    return box(s, W, 100, 'geo numline');
  }

  /* ---------- obrázky na počítanie útvarov ---------- */
  const badge = (x, y, n, col) =>
    `<circle cx="${x}" cy="${y}" r="10" fill="${col}" stroke="#fff" stroke-width="2"/>`
    + `<text x="${x}" y="${f1(y + 4.5)}" text-anchor="middle" font-size="13" font-weight="800" fill="#fff" font-family="system-ui, sans-serif">${n}</text>`;
  const rectEl = (x, y, w, h, fill, hl) => `<rect x="${f1(x)}" y="${f1(y)}" width="${w}" height="${h}" rx="2" fill="${fill}" ${strokeOf(hl)}/>`;
  const circEl = (cx, cy, r, fill, hl) => `<circle cx="${f1(cx)}" cy="${f1(cy)}" r="${r}" fill="${fill}" ${strokeOf(hl)}/>`;
  const triEl = (p, fill, hl) => `<polygon points="${pts(p)}" fill="${fill}" ${strokeOf(hl)} stroke-linejoin="round"/>`;

  function pic(items, w, h, under = '') {
    return {
      count: k => items.filter(it => it.kind === k).length,
      svg(hlKinds = []) {
        const hl = new Set(hlKinds);
        let s = under + items.map(it => it.draw(hl.has(it.kind))).join('');
        const n = {};
        items.forEach(it => {
          if (!hl.has(it.kind)) return;
          n[it.kind] = (n[it.kind] || 0) + 1;
          s += badge(f1(it.cx), f1(it.cy), n[it.kind], hlKinds.indexOf(it.kind) ? '#6a1b9a' : OUT);
        });
        return box(s, w, h, 'geo pic');
      },
    };
  }

  function scatter(target) {
    const cells = U.shuffle([...Array(12).keys()]).slice(0, U.rnd(8, 11));
    const nT = U.rnd(2, Math.min(6, cells.length - 3));
    const others = ['circle', 'square', 'triangle', 'rectangle'].filter(k => k !== target);
    const items = cells.map((cell, i) => {
      const kind = i < nT ? target : U.pick(others);
      const cx = 44 + (cell % 4) * 84 + U.rnd(-7, 7), cy = 38 + Math.floor(cell / 4) * 72 + U.rnd(-5, 5);
      const size = U.rnd(40, 50), fill = U.pick(PAL), deg = U.rnd(-25, 25), variant = U.rnd(0, 2);
      return { kind, cx, cy, draw: hl => shape(kind, cx, cy, size, fill, deg, variant, hl) };
    });
    return pic(items, 344, 222);
  }

  function trainPic() {
    const items = [];
    const add = (kind, cx, cy, draw) => items.push({ kind, cx, cy, draw });
    const col = U.shuffle(PAL);
    const base = 128;
    let x = 12;
    const nW = U.rnd(1, 3);
    for (let i = 0; i < nW; i++) {
      const w = 86, h = 44, y = base - 18 - h, c = col[i], x0 = x;
      add('rectangle', x0 + w / 2, y + h / 2, hl => rectEl(x0, y, w, h, c, hl));
      const nWin = U.rnd(1, 3), ws = 17, gap = (w - nWin * ws) / (nWin + 1);
      for (let j = 0; j < nWin; j++) {
        const wx = x0 + gap + j * (ws + gap);
        add('square', wx + ws / 2, y + 10 + ws / 2, hl => rectEl(wx, y + 10, ws, ws, '#e1f5fe', hl));
      }
      if (Math.random() < 0.55) {
        const tx = x0 + U.rnd(18, w - 18), tc = col[(i + 4) % 8];
        add('triangle', tx, y - 7, hl => triEl([[tx - 11, y], [tx + 11, y], [tx, y - 17]], tc, hl));
      }
      for (const dx of [20, w - 20]) {
        const cx = x0 + dx;
        add('circle', cx, base - 10, hl => circEl(cx, base - 10, 10, '#546e7a', hl));
      }
      x += w + 12;
    }
    // lokomotíva: kabína (štvorec) so strechou (trojuholník), kotol a komín (obdĺžniky), pluh (trojuholník)
    const lx = x, cab = 46, cy0 = base - 18 - cab, lc = col[5], rc = col[6];
    add('square', lx + cab / 2, cy0 + cab / 2, hl => rectEl(lx, cy0, cab, cab, lc, hl));
    add('triangle', lx + cab / 2, cy0 - 8, hl => triEl([[lx - 5, cy0], [lx + cab + 5, cy0], [lx + cab / 2, cy0 - 20]], rc, hl));
    const bx = lx + cab, bw = 72, bh = 34, by = base - 18 - bh;
    add('rectangle', bx + bw / 2, by + bh / 2, hl => rectEl(bx, by, bw, bh, lc, hl));
    add('rectangle', bx + 60, by - 11, hl => rectEl(bx + 54, by - 22, 12, 22, '#455a64', hl));
    const px = bx + bw;
    add('triangle', px + 6, base - 8, hl => triEl([[px, base - 20], [px, base - 2], [px + 20, base - 2]], '#d32f2f', hl));
    const wx = U.rnd(0, 1) ? [lx + 16, lx + 56, lx + 96] : [lx + 22, lx + 92];
    wx.forEach(cx => add('circle', cx, base - 11, hl => circEl(cx, base - 11, 11, '#546e7a', hl)));
    const W = px + 30;
    return pic(items, W, base + 10, `<path d="M0 ${base + 1} H${W}" stroke="${OUT}" stroke-width="3"/>`);
  }

  return {
    PAL, OUT, box, shape, solid, thing, line, lineSVG, ruler, setRulerB, cmAt, MAXCM, numberLine, scatter, trainPic,
  };
})();
