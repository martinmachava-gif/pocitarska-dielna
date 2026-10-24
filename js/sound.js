'use strict';
/* Zvuky generované priamo v prehliadači (bez súborov) a čítanie zadaní nahlas. */
const Snd = (() => {
  let ctx = null;
  let enabled = true;

  function ac() {
    if (!enabled) return null;
    if (!ctx) {
      try { ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { return null; }
    }
    if (ctx.state === 'suspended') ctx.resume().catch(() => {});
    return ctx;
  }

  function tone(freq, start, dur, { type = 'sine', vol = 0.2, slide = null } = {}) {
    const c = ac();
    if (!c) return;
    const t0 = c.currentTime + start;
    const o = c.createOscillator(), g = c.createGain();
    o.type = type;
    o.frequency.setValueAtTime(freq, t0);
    if (slide) o.frequency.exponentialRampToValueAtTime(slide, t0 + dur);
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(vol, t0 + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    o.connect(g);
    g.connect(c.destination);
    o.start(t0);
    o.stop(t0 + dur + 0.05);
  }

  function noise(start, dur, { vol = 0.3, freq = 2500, q = 3 } = {}) {
    const c = ac();
    if (!c) return;
    const len = Math.max(1, Math.floor(c.sampleRate * dur));
    const buf = c.createBuffer(1, len, c.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len);
    const s = c.createBufferSource();
    s.buffer = buf;
    const f = c.createBiquadFilter();
    f.type = 'bandpass';
    f.frequency.value = freq;
    f.Q.value = q;
    const g = c.createGain();
    g.gain.value = vol;
    s.connect(f);
    f.connect(g);
    g.connect(c.destination);
    const t0 = c.currentTime + start;
    s.start(t0);
    s.stop(t0 + dur);
  }

  function siren() {
    const c = ac();
    if (!c) return;
    const t0 = c.currentTime;
    const o = c.createOscillator(), g = c.createGain();
    o.type = 'sawtooth';
    for (let i = 0; i < 6; i++) {
      o.frequency.setValueAtTime(i % 2 ? 650 : 950, t0 + i * 0.36);
    }
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(0.05, t0 + 0.05);
    g.gain.setValueAtTime(0.05, t0 + 2.0);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + 2.2);
    o.connect(g);
    g.connect(c.destination);
    o.start(t0);
    o.stop(t0 + 2.25);
  }

  const fx = {
    tap() { tone(700, 0, 0.05, { type: 'triangle', vol: 0.06 }); },
    correct() {
      tone(784, 0, 0.14, { type: 'triangle', vol: 0.2 });
      tone(1175, 0.1, 0.32, { type: 'triangle', vol: 0.2 });
    },
    wrong() { tone(260, 0, 0.22, { type: 'sine', vol: 0.22, slide: 170 }); },
    ratchet() { for (let i = 0; i < 7; i++) noise(i * 0.065, 0.035, { vol: 0.55, freq: 2600, q: 5 }); },
    screw() {
      tone(1568, 0, 0.1, { vol: 0.1 });
      tone(2093, 0.06, 0.22, { vol: 0.09 });
    },
    buy() { [523, 659, 784, 1047].forEach((f, i) => tone(f, i * 0.07, 0.16, { type: 'square', vol: 0.05 })); },
    fanfare() {
      [523, 659, 784, 1047, 784, 1047].forEach((f, i) => tone(f, i * 0.13, i === 5 ? 0.6 : 0.16, { type: 'triangle', vol: 0.18 }));
    },
    horn() {
      for (const t of [0, 0.3]) {
        tone(370, t, 0.22, { type: 'square', vol: 0.06 });
        tone(466, t, 0.22, { type: 'square', vol: 0.06 });
      }
    },
    melody() {
      [523, 659, 784, 659, 880, 784, 1047].forEach((f, i) => tone(f, i * 0.14, 0.13, { type: 'square', vol: 0.06 }));
    },
    whistle() {
      tone(740, 0, 0.9, { vol: 0.12 });
      tone(932, 0, 0.9, { vol: 0.1 });
      noise(0, 0.9, { vol: 0.08, freq: 1800, q: 1 });
    },
    trainhorn() {
      tone(311, 0, 0.8, { type: 'square', vol: 0.05 });
      tone(370, 0, 0.8, { type: 'square', vol: 0.05 });
      tone(466, 0, 0.8, { type: 'square', vol: 0.04 });
    },
    bell() {
      for (const t of [0, 0.28]) {
        tone(1319, t, 0.45, { vol: 0.18 });
        tone(2637, t, 0.3, { type: 'triangle', vol: 0.04 });
      }
    },
    siren,
  };

  // Čítanie nahlas: použijeme slovenský hlas, ak ho telefón má.
  let voice = null, voicesLoaded = false;
  function loadVoices() {
    try {
      const vs = speechSynthesis.getVoices();
      voicesLoaded = vs.length > 0;
      voice = vs.find(v => /^sk(-|_|$)/i.test(v.lang)) || null;
    } catch (e) { /* bez hlasu */ }
  }
  const hasSpeech = 'speechSynthesis' in window;
  if (hasSpeech) {
    loadVoices();
    try { speechSynthesis.addEventListener('voiceschanged', loadVoices); } catch (e) { /* staršie prehliadače */ }
  }
  const canSpeak = () => hasSpeech && (!!voice || !voicesLoaded);
  function speak(text) {
    if (!hasSpeech) return;
    try {
      speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text);
      u.lang = 'sk-SK';
      if (voice) u.voice = voice;
      u.rate = 0.92;
      speechSynthesis.speak(u);
    } catch (e) { /* ticho */ }
  }
  function hush() {
    if (hasSpeech) try { speechSynthesis.cancel(); } catch (e) { /* nič */ }
  }

  return { ...fx, speak, hush, canSpeak, setEnabled: v => { enabled = v; } };
})();
