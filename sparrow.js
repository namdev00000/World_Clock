/* ═══════════════════════════════════════════════════════
   sparrow.js — Hourly Sparrow Window Animation + Sound
   Each hour: window opens, sparrow flies out, chirps
═══════════════════════════════════════════════════════ */

let lastSparrowHour = -1;
let sparrowCheckInterval;

/* ── Start the sparrow check loop ───────────────────── */
function initSparrow() {
  sparrowCheckInterval = setInterval(checkSparrowHour, 5000); // check every 5s
  checkSparrowHour(); // check immediately on load
}

/* ── Check if a new hour has started ────────────────── */
function checkSparrowHour() {
  const now = new Date();
  const h   = now.getHours();
  const m   = now.getMinutes();
  const s   = now.getSeconds();

  // Trigger at the start of each hour (within first 30 seconds)
  if (m === 0 && s < 30 && h !== lastSparrowHour) {
    lastSparrowHour = h;
    triggerSparrow();
  }
}

/* ── Animate the sparrow ─────────────────────────────── */
function triggerSparrow() {
  const sparrow = document.getElementById('sparrow');
  if (!sparrow) return;

  // 1. Show sparrow
  sparrow.classList.add('visible');

  // 2. Play chirp sound
  playSparrowChirp();

  // 3. Add flap animation class
  sparrow.classList.add('flap');

  // 4. Open the window panes visually
  openWindowPanes();

  // 5. After animation, hide sparrow again
  setTimeout(() => {
    sparrow.classList.remove('flap');
    sparrow.classList.remove('visible');
    closeWindowPanes();
  }, 3500);
}

/* ── Open window panes (spread apart) ───────────────── */
function openWindowPanes() {
  const panes = document.querySelectorAll('.window-pane');
  panes[0].style.transform = 'translateX(-6px)';
  panes[1].style.transform = 'translateX(6px)';
  panes[0].style.transition = 'transform 0.3s ease';
  panes[1].style.transition = 'transform 0.3s ease';
}

/* ── Close window panes back ─────────────────────────── */
function closeWindowPanes() {
  const panes = document.querySelectorAll('.window-pane');
  panes[0].style.transform = '';
  panes[1].style.transform = '';
}

/* ── Sparrow chirp via Web Audio API ─────────────────── */
function playSparrowChirp() {
  try {
    const ctx  = new (window.AudioContext || window.webkitAudioContext)();

    // Make 3 quick chirp sounds in rapid succession
    [0, 0.18, 0.36].forEach((delay, i) => {
      chirp(ctx, delay, i);
    });
  } catch(e) {
    console.warn('Sparrow audio error:', e);
  }
}

/* ── A single chirp note ─────────────────────────────── */
function chirp(ctx, startDelay, variation) {
  const osc  = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.connect(gain);
  gain.connect(ctx.destination);

  // Frequency sweep for a bird-chirp feel
  const baseFreq = 2000 + variation * 200;
  osc.type = 'sine';
  osc.frequency.setValueAtTime(baseFreq, ctx.currentTime + startDelay);
  osc.frequency.linearRampToValueAtTime(
    baseFreq * 1.5,
    ctx.currentTime + startDelay + 0.06
  );
  osc.frequency.exponentialRampToValueAtTime(
    baseFreq * 0.8,
    ctx.currentTime + startDelay + 0.14
  );

  // Volume envelope
  gain.gain.setValueAtTime(0, ctx.currentTime + startDelay);
  gain.gain.linearRampToValueAtTime(0.25, ctx.currentTime + startDelay + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + startDelay + 0.16);

  osc.start(ctx.currentTime + startDelay);
  osc.stop(ctx.currentTime + startDelay + 0.2);
}

/* ── Manual trigger (click the sparrow window) ───────── */
document.addEventListener('DOMContentLoaded', () => {
  const windowEl = document.getElementById('sparrow-window');
  if (windowEl) {
    windowEl.title = 'Click to hear the sparrow! (auto-plays every hour)';
    windowEl.style.cursor = 'pointer';
    windowEl.addEventListener('click', () => {
      triggerSparrow();
    });
  }
});
