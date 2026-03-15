/* ============================================================
   Kalimba Tuner – app.js
   21-key kalimba – user's exact layout (F4 center)
   Pitch detection: autocorrelation (YIN-inspired)
   ============================================================ */

'use strict';

// ── 21-key kalimba note layout ────────────────────────────────
// Physical tine order LEFT → RIGHT as they sit on the instrument.
// Center tine (position 11) = F4 – the lowest / longest tine.
// Left side goes outward to D6, right side goes outward to C6.
//
// Layout (left → right):
//   D6  B5  G5  E5  C5  A4  F4  D4  B3   |  G4  A4  C5  E5  G5  B5  D5  F5  A5  C6
// Wait – exact user list:
//   pos  1: D(2'')  = D6   – far left
//   pos  2: B(7')   = B5
//   pos  3: G(5')   = G5
//   pos  4: E(3')   = E5
//   pos  5: C(1')   = C5
//   pos  6: A(6)    = A4
//   pos  7: F(4)    = F4   ← left-of-center
//   pos  8: D(2)    = D4
//   pos  9: B(7)    = B3
//   pos 10: G(5)    = G3   ← just left of center
//   pos 11: F(4)    = F4   ← CENTER (lowest / tallest tine)
//   pos 12: G(5)    = G4
//   pos 13: A(6)    = A4
//   pos 14: C(1)    = C5
//   pos 15: E(3)    = E5
//   pos 16: G(5)    = G5   ← duplicate label, higher octave
//   pos 17: B(7)    = B5
//   pos 18: D(2')   = D5   (one prime = one octave above D4... but fits as D5)
//   pos 19: F(4')   = F5
//   pos 20: A(6')   = A5
//   pos 21: C(1'')  = C6   – far right
//
// Note: pos 7 F(4) and pos 11 F(4) are the same pitch – pos 7 is a duplicate
// helper tine. We keep both so the visual matches the physical instrument.

// DISPLAY_ORDER: exactly left→right physical position on the instrument.
// Labels match what is printed on each tine: letter + scale-degree + primes.
// Both sides ascend in pitch outward from the center F4.
//
// Left side outward from center (pos 10→1):
//   G4, B4, D5, F5, A5, C6, E6, G6, B6, D7  ← but user list stops at D(2'')
// Right side outward from center (pos 12→21):
//   G4, A4, C5, E5, G5, B5, D5, F5, A5, C6
//
// Re-checking with user's exact list and knowing center=F4, both sides go UP:
// Left:  pos10=G4, pos9=B4, pos8=D5, pos7=F5, pos6=A5, pos5=C6, pos4=E6, pos3=G6, pos2=B6, pos1=D7
//   but user has pos6=A(6) no prime, pos5=C(1') one prime...
//   "no prime" = lower octave group, "'" = one octave higher, "''" = two higher.
//   Base (no prime) group around F4: F4,G4,A4,B4 → then C5 gets "1'" since C is above B in next octave
//   Actually: F=4 is root. Going up the scale from F4:
//     F4(4), G4(5), A4(6), B4(7), C5(1'), D5(2'), E5(3'), F5(4'), G5(5'), A5(6'), B5(7'),
//     C6(1''), D6(2''), E6(3''), ...
//   So "no prime" = octave containing F4 (F4–B4), "'" = next octave (C5–B5), "''" = (C6–B6)
//
// Left side (pos10→1, outward from center):
//   pos10: G(5)     = G4   (no prime, same octave as F4)
//   pos9:  B(7)     = B4
//   pos8:  D(2)     = D5   (wait – D is in the "'" group if C5=1'... but user wrote D(2) no prime)
//   Hmm – the prime system labels D(2) no prime as the D just above C4, i.e. D4 < F4.
//   That would make pos8 D4 which is LOWER than center F4 – impossible for a tine outward.
//
// CONCLUSION: The left side of this kalimba goes DOWN from center outward (sub-bass tines),
// which is unusual but matches the user's data literally:
//   center F4, then leftward: G3→B3→D4→F4→A4→C5→E5→G5→B5→D6
//   (descending as you go further left, so the tines get LONGER leftward – this is a
//    non-standard layout sometimes called "Hugh Tracey" style where the left bass tines
//    extend below the center).
// The tine heights should therefore reflect actual frequency: lower freq = taller tine.

// ── Exact tine list left→right as engraved on the instrument ──
// Jianpu notation: scale degrees 1=C 2=D 3=E 4=F 5=G 6=A 7=B
// Dots BEFORE the digit (between letter and number) = octave UP
// Dots AFTER the digit = octave DOWN
// No dots = middle octave (4)
//
// Left → right:
//  D''2  B'7  G'5  E'3  C'1  A6  F4  D2  B7'  G5'  F4'  A6'  C1  E3  G5  B7  D'2  F'4  A'6  C''1  E''3
//
// Decoded frequencies:
//  D''2  = D, dot-dot BEFORE  = D oct6  = 1174.66 Hz
//  B'7   = B, dot BEFORE      = B oct5  =  987.77 Hz
//  G'5   = G, dot BEFORE      = G oct5  =  783.99 Hz
//  E'3   = E, dot BEFORE      = E oct5  =  659.25 Hz
//  C'1   = C, dot BEFORE      = C oct5  =  523.25 Hz
//  A6    = A, no dot          = A oct4  =  440.00 Hz
//  F4    = F, no dot          = F oct4  =  349.23 Hz
//  D2    = D, no dot          = D oct4  =  293.66 Hz
//  B7'   = B, dot AFTER       = B oct3  =  246.94 Hz
//  G5'   = G, dot AFTER       = G oct3  =  196.00 Hz
//  F4'   = F, dot AFTER       = F oct3  =  174.61 Hz  ← CENTER (lowest/tallest)
//  A6'   = A, dot AFTER       = A oct3  =  220.00 Hz
//  C1    = C, no dot          = C oct4  =  261.63 Hz
//  E3    = E, no dot          = E oct4  =  329.63 Hz
//  G5    = G, no dot          = G oct4  =  392.00 Hz
//  B7    = B, no dot          = B oct4  =  493.88 Hz
//  D'2   = D, dot BEFORE      = D oct5  =  587.33 Hz
//  F'4   = F, dot BEFORE      = F oct5  =  698.46 Hz
//  A'6   = A, dot BEFORE      = A oct5  =  880.00 Hz
//  C''1  = C, dot-dot BEFORE  = C oct6  = 1046.50 Hz
//  E''3  = E, dot-dot BEFORE  = E oct6  = 1318.51 Hz

const DISPLAY_ORDER = [
  { note: 'D', octave: 6, freq: 1174.66, tineLabel: "D''2"  },  //  1 far left
  { note: 'B', octave: 5, freq:  987.77, tineLabel: "B'7"   },  //  2
  { note: 'G', octave: 5, freq:  783.99, tineLabel: "G'5"   },  //  3
  { note: 'E', octave: 5, freq:  659.25, tineLabel: "E'3"   },  //  4
  { note: 'C', octave: 5, freq:  523.25, tineLabel: "C'1"   },  //  5
  { note: 'A', octave: 4, freq:  440.00, tineLabel: "A6"    },  //  6
  { note: 'F', octave: 4, freq:  349.23, tineLabel: "F4"    },  //  7
  { note: 'D', octave: 4, freq:  293.66, tineLabel: "D2"    },  //  8
  { note: 'B', octave: 3, freq:  246.94, tineLabel: "B7'"   },  //  9
  { note: 'G', octave: 3, freq:  196.00, tineLabel: "G5'"   },  // 10
  { note: 'F', octave: 3, freq:  174.61, tineLabel: "F4'",  center: true }, // 11 CENTER
  { note: 'A', octave: 3, freq:  220.00, tineLabel: "A6'"   },  // 12
  { note: 'C', octave: 4, freq:  261.63, tineLabel: "C1"    },  // 13
  { note: 'E', octave: 4, freq:  329.63, tineLabel: "E3"    },  // 14
  { note: 'G', octave: 4, freq:  392.00, tineLabel: "G5"    },  // 15
  { note: 'B', octave: 4, freq:  493.88, tineLabel: "B7"    },  // 16
  { note: 'D', octave: 5, freq:  587.33, tineLabel: "D'2"   },  // 17
  { note: 'F', octave: 5, freq:  698.46, tineLabel: "F'4"   },  // 18
  { note: 'A', octave: 5, freq:  880.00, tineLabel: "A'6"   },  // 19
  { note: 'C', octave: 6, freq: 1046.50, tineLabel: "C''1"  },  // 20
  { note: 'E', octave: 6, freq: 1318.51, tineLabel: "E''3"  },  // 21 far right
];

// Flat list of unique notes for pitch-snap (deduped by freq)
const KALIMBA_NOTES = DISPLAY_ORDER.reduce((acc, n) => {
  if (!acc.find(x => x.freq === n.freq)) acc.push(n);
  return acc;
}, []);

// ── Audio state ───────────────────────────────────────────────
let audioCtx = null;
let analyser  = null;
let mediaStream = null;
let rafId = null;
let isRunning = false;
let lockedNote = null; // { note, octave, freq } or null

const BUFFER_SIZE = 4096;
const MIN_FREQ = 155;  // Hz – below F3 (174.61 Hz) with margin
const MAX_FREQ = 1450; // Hz – above E6 (1318.51 Hz) with margin
const IN_TUNE_CENTS = 8;
const CLARITY_THRESHOLD = 0.93;

// ── DOM refs ──────────────────────────────────────────────────
const startBtn       = document.getElementById('start-btn');
const detectedNote   = document.getElementById('detected-note');
const detectedOctave = document.getElementById('detected-octave');
const centsFill      = document.getElementById('cents-fill');
const tuningStatus   = document.getElementById('tuning-status');
const freqValue      = document.getElementById('freq-value');
const tineContainer  = document.getElementById('tine-container');
const installBanner  = document.getElementById('install-banner');
const installBtn     = document.getElementById('install-btn');
const dismissBtn     = document.getElementById('dismiss-btn');

// ── Build tine UI ─────────────────────────────────────────────
const MAX_TINE_HEIGHT = 110;
const MIN_TINE_HEIGHT = 38;
const TINE_WIDTH = 18;

function buildTines() {
  const freqs = DISPLAY_ORDER.map(n => n.freq);
  const minFreq = Math.min(...freqs);
  const maxFreq = Math.max(...freqs);

  DISPLAY_ORDER.forEach((n, i) => {
    const t = (n.freq - minFreq) / (maxFreq - minFreq);
    const h = MAX_TINE_HEIGHT - t * (MAX_TINE_HEIGHT - MIN_TINE_HEIGHT);

    const div = document.createElement('div');
    div.className = 'tine';
    if (n.center) div.classList.add('center-tine');
    div.dataset.freq  = n.freq;
    div.dataset.idx   = i;

    const bar = document.createElement('div');
    bar.className = 'tine-bar';
    bar.style.width  = TINE_WIDTH + 'px';
    bar.style.height = Math.round(h) + 'px';

    const label = document.createElement('div');
    label.className = 'tine-label';
    label.textContent = n.tineLabel; // e.g. "D2''", "B7'", "F4"

    div.appendChild(bar);
    div.appendChild(label);
    tineContainer.appendChild(div);

    div.addEventListener('click', () => toggleLock(div, n));
  });
}

function toggleLock(div, noteObj) {
  const idx = div.dataset.idx;
  if (lockedNote && lockedNote._idx === idx) {
    // Unlock
    lockedNote = null;
    div.classList.remove('locked');
  } else {
    document.querySelectorAll('.tine.locked').forEach(t => t.classList.remove('locked'));
    lockedNote = { ...noteObj, _idx: idx };
    div.classList.add('locked');
  }
}

// ── Pitch detection (autocorrelation) ─────────────────────────
function autoCorrelate(buffer, sampleRate) {
  const SIZE = buffer.length;
  let rms = 0;
  for (let i = 0; i < SIZE; i++) rms += buffer[i] * buffer[i];
  rms = Math.sqrt(rms / SIZE);
  if (rms < 0.01) return -1; // silence

  let r1 = 0, r2 = SIZE - 1;
  const THRESH = 0.2;
  for (let i = 0; i < SIZE / 2; i++) {
    if (Math.abs(buffer[i]) < THRESH) { r1 = i; break; }
  }
  for (let i = 1; i < SIZE / 2; i++) {
    if (Math.abs(buffer[SIZE - i]) < THRESH) { r2 = SIZE - i; break; }
  }

  const buf = buffer.slice(r1, r2);
  const len = buf.length;

  const corr = new Float32Array(len);
  for (let lag = 0; lag < len; lag++) {
    for (let i = 0; i < len - lag; i++) {
      corr[lag] += buf[i] * buf[i + lag];
    }
  }

  // Find first dip then first peak after
  let d = 1;
  while (d < len && corr[d] > corr[d - 1]) d++;
  while (d < len && corr[d] <= corr[d - 1]) d++;

  if (d >= len) return -1;

  let maxVal = -Infinity, maxLag = -1;
  for (let i = d; i < len; i++) {
    if (corr[i] > maxVal) { maxVal = corr[i]; maxLag = i; }
  }

  if (maxLag === -1 || corr[0] === 0) return -1;
  const clarity = maxVal / corr[0];
  if (clarity < CLARITY_THRESHOLD) return -1;

  // Parabolic interpolation for sub-sample accuracy
  let betterLag = maxLag;
  if (maxLag > 0 && maxLag < len - 1) {
    const x0 = corr[maxLag - 1];
    const x1 = corr[maxLag];
    const x2 = corr[maxLag + 1];
    const d2 = 2 * x1 - x0 - x2;
    if (d2 !== 0) betterLag = maxLag + 0.5 * (x0 - x2) / d2;
  }

  return sampleRate / betterLag;
}

// ── Note math ─────────────────────────────────────────────────
function freqToCents(freq, targetFreq) {
  return 1200 * Math.log2(freq / targetFreq);
}

function findClosestNote(freq) {
  // If locked, only snap to that note
  const pool = lockedNote ? [lockedNote] : KALIMBA_NOTES;
  let best = null, bestDist = Infinity;
  for (const n of pool) {
    const dist = Math.abs(freqToCents(freq, n.freq));
    if (dist < bestDist) { bestDist = dist; best = n; }
  }
  return { note: best, cents: freqToCents(freq, best.freq) };
}

// ── UI update ─────────────────────────────────────────────────
function updateUI(freq) {
  if (freq < MIN_FREQ || freq > MAX_FREQ) {
    clearDisplay();
    return;
  }

  const { note, cents } = findClosestNote(freq);
  if (!note) return;

  detectedNote.textContent   = note.tineLabel;
  detectedOctave.textContent = '';
  freqValue.textContent      = freq.toFixed(1) + ' Hz';

  // Cents bar: -50 to +50
  const clamped = Math.max(-50, Math.min(50, cents));
  const pct = ((clamped + 50) / 100); // 0→1
  const center = 50; // percent
  const fillPct = Math.abs(clamped);
  const isLeft = cents < 0;

  // Draw from center toward left or right
  if (isLeft) {
    centsFill.style.left  = pct * 100 + '%';
    centsFill.style.width = (center - pct * 100) + '%';
  } else {
    centsFill.style.left  = '50%';
    centsFill.style.width = (pct * 100 - 50) + '%';
  }

  const absCents = Math.abs(cents);
  let color, statusText, statusClass;
  if (absCents <= IN_TUNE_CENTS) {
    color = 'var(--in-tune)'; statusText = '✓ IN TUNE'; statusClass = 'in-tune';
  } else if (cents > 0) {
    color = 'var(--sharp)';  statusText = '▲ SHARP';   statusClass = 'sharp';
  } else {
    color = 'var(--flat)';   statusText = '▼ FLAT';    statusClass = 'flat';
  }
  centsFill.style.background = color;
  detectedNote.style.color   = color;
  tuningStatus.textContent   = statusText;
  tuningStatus.className     = statusClass;

  // Highlight tine(s)
  document.querySelectorAll('.tine').forEach(t => {
    t.classList.remove('active', 'in-tune');
    const freqMatch = parseFloat(t.dataset.freq) === note.freq;
    const idxMatch  = lockedNote ? t.dataset.idx === lockedNote._idx : freqMatch;
    if (idxMatch) {
      t.classList.add(absCents <= IN_TUNE_CENTS ? 'in-tune' : 'active');
    }
  });
}

function clearDisplay() {
  detectedNote.textContent   = '–';
  detectedOctave.textContent = '';
  freqValue.textContent      = '– Hz';
  tuningStatus.textContent   = '–';
  tuningStatus.className     = '';
  centsFill.style.width      = '0';
  detectedNote.style.color   = '';
  document.querySelectorAll('.tine.active, .tine.in-tune').forEach(t => {
    t.classList.remove('active', 'in-tune');
  });
}

// ── Audio loop ────────────────────────────────────────────────
function audioLoop() {
  if (!isRunning) return;
  const buffer = new Float32Array(BUFFER_SIZE);
  analyser.getFloatTimeDomainData(buffer);
  const freq = autoCorrelate(buffer, audioCtx.sampleRate);
  updateUI(freq);
  rafId = requestAnimationFrame(audioLoop);
}

// ── Start / stop ──────────────────────────────────────────────
async function startTuner() {
  try {
    if (audioCtx && audioCtx.state === 'suspended') await audioCtx.resume();

    mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
    audioCtx    = new (window.AudioContext || window.webkitAudioContext)();
    analyser    = audioCtx.createAnalyser();
    analyser.fftSize = BUFFER_SIZE * 2;

    const source = audioCtx.createMediaStreamSource(mediaStream);
    source.connect(analyser);

    isRunning = true;
    startBtn.textContent = '⏹ Stop';
    startBtn.classList.add('active');
    audioLoop();
  } catch (err) {
    alert('Microphone access denied or unavailable.\n' + err.message);
  }
}

function stopTuner() {
  isRunning = false;
  if (rafId) cancelAnimationFrame(rafId);
  if (mediaStream) mediaStream.getTracks().forEach(t => t.stop());
  if (audioCtx) audioCtx.suspend();
  startBtn.textContent = '🎤 Start Tuning';
  startBtn.classList.remove('active');
  clearDisplay();
}

startBtn.addEventListener('click', () => {
  if (isRunning) stopTuner(); else startTuner();
});

// ── PWA install banner ────────────────────────────────────────
let deferredPrompt = null;

window.addEventListener('beforeinstallprompt', e => {
  e.preventDefault();
  deferredPrompt = e;
  installBanner.hidden = false;
});

installBtn.addEventListener('click', async () => {
  if (!deferredPrompt) return;
  deferredPrompt.prompt();
  const { outcome } = await deferredPrompt.userChoice;
  deferredPrompt = null;
  installBanner.hidden = true;
});

dismissBtn.addEventListener('click', () => {
  installBanner.hidden = true;
});

window.addEventListener('appinstalled', () => {
  installBanner.hidden = true;
  deferredPrompt = null;
});

// ── Service Worker registration ───────────────────────────────
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('sw.js')
      .catch(err => console.warn('SW registration failed:', err));
  });
}

// ── Init ──────────────────────────────────────────────────────
buildTines();
