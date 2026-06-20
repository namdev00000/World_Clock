/* ═══════════════════════════════════════════════════════
   clock.js — Digital & Analog Clock Logic
   CHANGES:
   - Digital / Analog toggle: only one shown at a time (fixed)
   - Tick-tock sound every second
═══════════════════════════════════════════════════════ */

// ── State ──────────────────────────────────────────────
let clockFormat   = 12;       // 12 or 24 hour
let clockType     = 'digital'; // 'digital' or 'analog'
let clockInterval = null;
let tickEnabled   = true;      // tick-tock on by default
let tickAudioCtx  = null;      // Web Audio context for tick

const DAYS   = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
const MONTHS = ['January','February','March','April','May','June',
                'July','August','September','October','November','December'];

/* ── Initialise clock on page load ─────────────────── */
function initClock() {
  updateDateDisplay();
  updateWelcomeMessage();
  // Make sure correct clock type is shown from the start
  showCorrectClock();
  tickClock();
  clockInterval = setInterval(() => {
    tickClock();
    playTickSound(); // tick every second
  }, 1000);
}

/* ── Make sure only the right clock is visible ───────── */
function showCorrectClock() {
  const digital = document.getElementById('digital-clock');
  const analog  = document.getElementById('analog-clock');
  if (!digital || !analog) return;

  if (clockType === 'digital') {
    digital.classList.remove('hidden');
    analog.classList.add('hidden');
  } else {
    digital.classList.add('hidden');
    analog.classList.remove('hidden');
  }
}

/* ── Main tick: runs every second ─────────────────── */
function tickClock() {
  const now = new Date();
  updateDateDisplay(now);

  if (clockType === 'digital') {
    updateDigitalClock(now);
  } else {
    drawAnalogClock(now);
  }
}

/* ── Header date ──────────────────────────────────── */
function updateDateDisplay(now = new Date()) {
  const dd   = String(now.getDate()).padStart(2, '0');
  const mm   = String(now.getMonth() + 1).padStart(2, '0');
  const yyyy = now.getFullYear();
  document.getElementById('current-day-name').textContent    = DAYS[now.getDay()];
  document.getElementById('current-date-display').textContent = `${dd}/${mm}/${yyyy}`;
}

/* ── Welcome message ─────────────────────────────── */
function updateWelcomeMessage() {
  const h   = new Date().getHours();
  let msg   = 'Good Morning';
  if (h >= 12 && h < 17) msg = 'Good Afternoon';
  if (h >= 17 && h < 21) msg = 'Good Evening';
  if (h >= 21 || h < 5)  msg = 'Good Night';
  document.getElementById('welcome-text').textContent = msg;
}

/* ── Digital clock display ──────────────────────── */
function updateDigitalClock(now) {
  let h    = now.getHours();
  let m    = now.getMinutes();
  let s    = now.getSeconds();
  let ampm = '';

  if (clockFormat === 12) {
    ampm = h >= 12 ? 'PM' : 'AM';
    h = h % 12 || 12;
  }

  document.getElementById('dig-hours').textContent   = String(h).padStart(2, '0');
  document.getElementById('dig-minutes').textContent = String(m).padStart(2, '0');
  document.getElementById('dig-seconds').textContent = String(s).padStart(2, '0');

  const ampmEl = document.getElementById('dig-ampm');
  ampmEl.textContent = ampm;
  ampmEl.style.display = clockFormat === 12 ? '' : 'none';

  document.getElementById('dig-timezone').textContent = getLocalTZName();
}

/* ── Analog clock canvas ─────────────────────────── */
function drawAnalogClock(now) {
  const canvas = document.getElementById('analog-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const W   = canvas.width;
  const H   = canvas.height;
  const cx  = W / 2;
  const cy  = H / 2;
  const R   = Math.min(W, H) / 2 - 12;

  const style   = getComputedStyle(document.body);
  const surface = style.getPropertyValue('--surface').trim() || '#fff';
  const border  = style.getPropertyValue('--border').trim()  || '#e2e8f0';
  const textCol = style.getPropertyValue('--text').trim()    || '#0f172a';
  const accent  = style.getPropertyValue('--accent').trim()  || '#0EA5E9';
  const text2   = style.getPropertyValue('--text2').trim()   || '#64748b';

  ctx.clearRect(0, 0, W, H);

  // Face
  ctx.beginPath();
  ctx.arc(cx, cy, R, 0, Math.PI * 2);
  ctx.fillStyle = surface;
  ctx.fill();
  ctx.strokeStyle = border;
  ctx.lineWidth = 3;
  ctx.stroke();

  // Hour markers
  for (let i = 0; i < 12; i++) {
    const angle  = (i / 12) * Math.PI * 2 - Math.PI / 2;
    const isMain = i % 3 === 0;
    ctx.beginPath();
    ctx.moveTo(cx + Math.cos(angle) * (R - 6),  cy + Math.sin(angle) * (R - 6));
    ctx.lineTo(cx + Math.cos(angle) * (isMain ? R - 20 : R - 14),
               cy + Math.sin(angle) * (isMain ? R - 20 : R - 14));
    ctx.strokeStyle = isMain ? textCol : text2;
    ctx.lineWidth   = isMain ? 3 : 1.5;
    ctx.stroke();
  }

  // 12 3 6 9 numbers
  ctx.fillStyle = textCol;
  ctx.font = `bold 14px 'Space Mono', monospace`;
  ctx.textAlign    = 'center';
  ctx.textBaseline = 'middle';
  [12, 3, 6, 9].forEach((n, i) => {
    const a = (i / 4) * Math.PI * 2 - Math.PI / 2;
    ctx.fillText(n, cx + Math.cos(a) * (R - 34), cy + Math.sin(a) * (R - 34));
  });

  const h = now.getHours() % 12;
  const m = now.getMinutes();
  const s = now.getSeconds();

  // Hour hand
  drawHand(ctx, cx, cy, ((h + m/60) / 12) * Math.PI*2 - Math.PI/2, R*0.55, 6, textCol);
  // Minute hand
  drawHand(ctx, cx, cy, ((m + s/60) / 60) * Math.PI*2 - Math.PI/2, R*0.8,  4, textCol);
  // Second hand
  drawHand(ctx, cx, cy, (s / 60) * Math.PI*2 - Math.PI/2, R*0.88, 2, accent);

  // Center dot
  ctx.beginPath();
  ctx.arc(cx, cy, 7, 0, Math.PI * 2);
  ctx.fillStyle = accent;
  ctx.fill();

  document.getElementById('analog-timezone').textContent = getLocalTZName();
}

function drawHand(ctx, cx, cy, angle, length, width, color) {
  ctx.beginPath();
  ctx.moveTo(cx, cy);
  ctx.lineTo(cx + Math.cos(angle) * length, cy + Math.sin(angle) * length);
  ctx.strokeStyle = color;
  ctx.lineWidth   = width;
  ctx.lineCap     = 'round';
  ctx.stroke();
}

function getLocalTZName() {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone.replace(/_/g,' ');
  } catch(e) { return 'Local Time'; }
}

/* ── Toggle 12 / 24 hour ─────────────────────────── */
function setClockFormat(fmt) {
  clockFormat = fmt;
  document.querySelectorAll('.fmt-btn').forEach(b => {
    b.classList.toggle('active', parseInt(b.dataset.fmt) === fmt);
  });
  tickClock();
}

/* ── Toggle Digital / Analog (only show one) ─────── */
function setClockType(type) {
  clockType = type;
  document.querySelectorAll('.type-btn').forEach(b => {
    b.classList.toggle('active', b.dataset.type === type);
  });

  // Show only the selected clock, hide the other
  showCorrectClock();
  tickClock();
}

/* ════════════════════════════════════════════════════════
   TICK-TOCK SOUND every second
   Uses Web Audio API — no file needed
════════════════════════════════════════════════════════ */

/* ── Get or create the audio context for ticks ─────── */
function getTickAudioCtx() {
  if (!tickAudioCtx) {
    tickAudioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  return tickAudioCtx;
}

/* ── Play a single soft tick sound ─────────────────── */
function playTickSound() {
  if (!tickEnabled) return;
  try {
    const ctx  = getTickAudioCtx();
    const osc  = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.connect(gain);
    gain.connect(ctx.destination);

    // Short, crisp tick — high frequency, very brief
    osc.type = 'square';
    osc.frequency.setValueAtTime(1200, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(800, ctx.currentTime + 0.015);

    gain.gain.setValueAtTime(0.06, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.04);

    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.05);
  } catch(e) {
    // Silently fail if audio not available
  }
}

/* ── Toggle tick sound on/off ─────────────────────── */
function toggleTickSound(enabled) {
  tickEnabled = enabled;
}
