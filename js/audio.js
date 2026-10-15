'use strict';
// Tiny procedural sfx synth (WebAudio). Starts on first user gesture.
const AUDIO_MASTER_GAIN = 2.1; // Three times the previous 0.7 effect gain.
let AC = null, MASTER = null, muted = false;
function audioInit() {
  if (typeof bgmStart === 'function') bgmStart();
  if (AC) { if (AC.state === 'suspended') AC.resume().catch(() => {}); return; }
  try {
    AC = new (window.AudioContext || window.webkitAudioContext)();
    MASTER = AC.createGain(); MASTER.gain.value = AUDIO_MASTER_GAIN;
    const limiter = AC.createDynamicsCompressor();
    limiter.threshold.value = -1; limiter.knee.value = 3; limiter.ratio.value = 12;
    limiter.attack.value = .003; limiter.release.value = .15;
    MASTER.connect(limiter); limiter.connect(AC.destination);
    if (typeof titleMenuApplyAudio === 'function') titleMenuApplyAudio();
  } catch (e) { AC = null; }
}
function toggleMute() {
  muted = !muted;
  if (MASTER) MASTER.gain.value = muted ? 0 : AUDIO_MASTER_GAIN;
  if (typeof titleMenuSaveAudio === 'function') titleMenuSaveAudio();
  return muted;
}

function tone(freq, dur, { type = 'square', vol = 0.3, slide = 0, delay = 0, attack = 0.005 } = {}) {
  if (!AC || muted) return;
  const t = AC.currentTime + delay;
  const o = AC.createOscillator(), g = AC.createGain();
  o.type = type; o.frequency.setValueAtTime(freq, t);
  if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(20, freq * slide), t + dur);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(vol, t + attack);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g); g.connect(MASTER); o.start(t); o.stop(t + dur + 0.02);
}
let NOISE = null;
function noise(dur, { vol = 0.3, freq = 1200, q = 1, delay = 0, type = 'bandpass', slide = 0 } = {}) {
  if (!AC || muted) return;
  if (!NOISE) {
    NOISE = AC.createBuffer(1, AC.sampleRate, AC.sampleRate);
    const d = NOISE.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  }
  const t = AC.currentTime + delay;
  const s = AC.createBufferSource(), f = AC.createBiquadFilter(), g = AC.createGain();
  s.buffer = NOISE; f.type = type; f.frequency.setValueAtTime(freq, t); f.Q.value = q;
  if (slide) f.frequency.exponentialRampToValueAtTime(Math.max(40, freq * slide), t + dur);
  g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  s.connect(f); f.connect(g); g.connect(MASTER); s.start(t); s.stop(t + dur + 0.02);
}
const SFX = {
  chargeRelease: ranged => { tone(ranged ? 580 : 180, .07, { type: 'triangle', vol: .09, slide: ranged ? 1.25 : .7 }); noise(.045, { vol: .07, freq: ranged ? 2200 : 1100 }); },
  swing: () => noise(0.12, { vol: 0.25, freq: 2400, q: 0.8, slide: 0.4 }),
  hit: () => { tone(180, 0.08, { vol: 0.25, slide: 0.5 }); noise(0.06, { vol: 0.3, freq: 900 }); },
  kill: () => { tone(320, 0.12, { vol: 0.2, slide: 0.3 }); noise(0.18, { vol: 0.25, freq: 500, slide: 0.3 }); },
  hurt: () => { tone(120, 0.22, { type: 'sawtooth', vol: 0.3, slide: 0.5 }); noise(0.15, { vol: 0.3, freq: 400 }); },
  roll: () => noise(0.16, { vol: 0.15, freq: 700, slide: 0.5 }),
  shoot: () => tone(660, 0.1, { type: 'triangle', vol: 0.12, slide: 0.6 }),
  coin: () => { tone(988, 0.06, { vol: 0.1 }); tone(1319, 0.12, { vol: 0.1, delay: 0.05 }); },
  heal: () => [523, 659, 784].forEach((f, i) => tone(f, 0.14, { type: 'triangle', vol: 0.15, delay: i * 0.06 })),
  door: () => { noise(0.3, { vol: 0.2, freq: 300, type: 'lowpass' }); tone(90, 0.25, { vol: 0.15, slide: 0.7 }); },
  rattle: k => { noise(0.05, { vol: 0.12 + 0.15 * k, freq: 1600 + 1200 * k, q: 3 }); },
  upgrade: t => [0, 4, 7, 12].forEach((s, i) => tone(392 * Math.pow(2, (s + t * 2) / 12), 0.18,
    { type: 'square', vol: 0.12, delay: i * 0.055 })),
  open: () => { noise(0.5, { vol: 0.4, freq: 3000, slide: 0.15 }); tone(110, 0.5, { type: 'sawtooth', vol: 0.25, slide: 0.5 });
    [523, 659, 784, 1047, 1319].forEach((f, i) => tone(f, 0.5, { type: 'triangle', vol: 0.12, delay: 0.08 + i * 0.07 })); },
  pickup: () => [659, 880, 1175].forEach((f, i) => tone(f, 0.16, { type: 'square', vol: 0.1, delay: i * 0.07 })),
  stairs: () => [392, 330, 262, 196].forEach((f, i) => tone(f, 0.2, { type: 'triangle', vol: 0.16, delay: i * 0.1 })),
  boss: () => { tone(55, 1.2, { type: 'sawtooth', vol: 0.3, slide: 1.5 }); noise(1, { vol: 0.25, freq: 200, type: 'lowpass' }); },
  slam: () => { tone(60, 0.4, { type: 'sawtooth', vol: 0.35, slide: 0.4 }); noise(0.4, { vol: 0.4, freq: 250, type: 'lowpass' }); },
  die: () => [330, 262, 196, 131].forEach((f, i) => tone(f, 0.35, { type: 'sawtooth', vol: 0.18, delay: i * 0.18, slide: 0.9 })),
  win: () => [523, 659, 784, 1047, 784, 1047, 1319].forEach((f, i) => tone(f, 0.22, { type: 'square', vol: 0.12, delay: i * 0.11 })),
  select: () => tone(880, 0.06, { vol: 0.1 }),
  move: () => tone(660, 0.04, { vol: 0.07 }),
  deny: () => tone(140, 0.15, { vol: 0.15 }),
  buy: () => { [784, 988, 1319].forEach((f, i) => tone(f, 0.12, { type: 'square', vol: 0.1, delay: i * 0.05 })); },
  zap: () => { noise(0.12, { vol: 0.2, freq: 4000, q: 2 }); tone(1400, 0.1, { type: 'sawtooth', vol: 0.08, slide: 0.3 }); },
  boom: () => { noise(0.35, { vol: 0.35, freq: 400, type: 'lowpass', slide: 0.3 }); tone(80, 0.3, { type: 'sawtooth', vol: 0.2, slide: 0.4 }); },
  block: () => { tone(1200, 0.08, { type: 'triangle', vol: 0.15 }); tone(1800, 0.12, { type: 'triangle', vol: 0.1, delay: 0.03 }); },
  fire: () => noise(0.18, { vol: 0.15, freq: 900, slide: 0.5 }),
  puff: () => noise(0.25, { vol: 0.12, freq: 500, type: 'lowpass' }),
  soul: () => tone(1046, 0.1, { type: 'sine', vol: 0.12, slide: 1.5 }),
  bow: () => { tone(300, 0.08, { type: 'triangle', vol: 0.15, slide: 2 }); noise(0.06, { vol: 0.1, freq: 3000 }); },
  magic: () => tone(880, 0.12, { type: 'sine', vol: 0.14, slide: 1.6 }),
  heavy: () => noise(0.2, { vol: 0.3, freq: 1200, q: 0.6, slide: 0.3 }),
  wave2: () => { tone(330, 0.3, { type: 'square', vol: 0.12 }); tone(440, 0.3, { type: 'square', vol: 0.1, delay: 0.12 }); },
};
