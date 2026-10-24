'use strict';
/* Drobné pomocné funkcie: náhoda, farby, slovenské tvary slov. */
const U = (() => {
  const rnd = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
  const pick = arr => arr[Math.floor(Math.random() * arr.length)];
  const shuffle = arr => {
    const r = arr.slice();
    for (let i = r.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [r[i], r[j]] = [r[j], r[i]];
    }
    return r;
  };
  const pad = n => String(n).padStart(2, '0');
  const dayKey = (d = new Date()) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

  const hexToRgb = h => {
    const n = parseInt(h.slice(1), 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  };
  const rgbToHex = (r, g, b) => '#' + [r, g, b]
    .map(v => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join('');
  const mix = (a, b, t) => {
    const x = hexToRgb(a), y = hexToRgb(b);
    return rgbToHex(x[0] + (y[0] - x[0]) * t, x[1] + (y[1] - x[1]) * t, x[2] + (y[2] - x[2]) * t);
  };
  const shade = (h, t) => (t < 0 ? mix(h, '#000000', -t) : mix(h, '#ffffff', t));
  const lum = h => {
    const [r, g, b] = hexToRgb(h);
    return (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  };

  // Slovenčina: 1 auto, 2–4 autá, 5 a viac áut (aj 0)
  const pl = (n, one, few, many) => (n === 1 ? one : n >= 2 && n <= 4 ? few : many);
  const cap = s => s.charAt(0).toUpperCase() + s.slice(1);
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  let uidN = 0;
  const uid = p => `${p}${++uidN}`;
  const wait = ms => new Promise(r => setTimeout(r, ms));

  return { rnd, pick, shuffle, dayKey, mix, shade, lum, pl, cap, esc, uid, wait };
})();
