'use strict';
/* Uloženie postupu v telefóne (localStorage) a záloha cez kód. */
const Store = (() => {
  const KEY = 'pocitarska-dielna';
  let s = null;

  function fresh() {
    const types = {};
    TYPES.forEach(t => { types[t.id] = true; });
    return {
      v: 1, name: '', gender: 'm', started: false, seeded: false, screws: 0, repairs: 0,
      vehicles: {}, skill: {}, stats: {},
      settings: { types, perRepair: 8, sound: true, autoSpeak: false },
    };
  }

  // nové kľúče z fresh() prežijú aj nahratie staršieho uloženia
  function merge(base, data) {
    for (const k in data) {
      const b = base[k], d = data[k];
      if (d && typeof d === 'object' && !Array.isArray(d) && b && typeof b === 'object' && !Array.isArray(b)) merge(b, d);
      else base[k] = d;
    }
  }

  function load() {
    s = fresh();
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) merge(s, JSON.parse(raw));
    } catch (e) { /* súkromné okno alebo zablokované úložisko: hráme bez ukladania */ }
    return s;
  }

  function save() {
    try { localStorage.setItem(KEY, JSON.stringify(s)); } catch (e) { /* bez ukladania */ }
  }

  const exportCode = () => btoa(unescape(encodeURIComponent(JSON.stringify(s))));

  function importCode(code) {
    const data = JSON.parse(decodeURIComponent(escape(atob(code.trim()))));
    if (!data || data.v !== 1 || typeof data.vehicles !== 'object') throw new Error('Neplatný kód');
    s = fresh();
    merge(s, data);
    save();
    return s;
  }

  function reset() {
    s = fresh();
    save();
    return s;
  }

  return { load, save, exportCode, importCode, reset };
})();
