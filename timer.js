/* ═══════════════════════════════════════════════════════
   timer.js — Countdown Timer with Sand Animation + Bells
   CHANGE: Bell repeats continuously until user dismisses
═══════════════════════════════════════════════════════ */

// ── State ──────────────────────────────────────────────
let timerRunning    = false;
let timerRemaining  = 0;   // remaining seconds
let timerTotal      = 0;   // total seconds set
let timerInterval   = null;
let selectedBell    = 1;   // 1-5

// Bell repeating loop state
let bellRepeating   = false;  // true while alert is shown and bell keeps ringing
let bellRepeatTimer = null;   // interval handle for repeated bell

// Audio context (Web Audio API — no file needed)
let audioCtx = null;

/* ── Select a bell sound ─────────────────────────────── */
function selectBell(btn, num) {
  selectedBell = num;
  document.querySelectorAll('.bell-opt').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  // Preview the sound on click
  playBell(num);
}

/* ── Start the countdown timer ──────────────────────── */
function timerStart() {
  if (timerRunning) return;

  // If not already counting down, read input values
  if (timerRemaining <= 0) {
    const h = parseInt(document.getElementById('timer-h').value) || 0;
    const m = parseInt(document.getElementById('timer-m').value) || 0;
    const s = parseInt(document.getElementById('timer-s').value) || 0;
    timerTotal     = h * 3600 + m * 60 + s;
    timerRemaining = timerTotal;
  }

  if (timerRemaining <= 0) return; // nothing set

  timerRunning = true;

  // Show running display, dim input section
  document.getElementById('timer-input-section').style.opacity = '0.5';
  document.getElementById('timer-input-section').style.pointerEvents = 'none';
  document.getElementById('timer-display').classList.remove('hidden');

  // Button states
  document.getElementById('timer-start').disabled = true;
  document.getElementById('timer-pause').disabled = false;

  timerInterval = setInterval(timerTick, 1000);
  timerTick(); // immediate first update
  drawSandTimer(timerRemaining / timerTotal);
}

/* ── Pause the timer ─────────────────────────────────── */
function timerPause() {
  if (!timerRunning) return;
  timerRunning = false;
  clearInterval(timerInterval);

  document.getElementById('timer-start').disabled = false;
  document.getElementById('timer-pause').disabled = true;
}

/* ── Reset the timer ─────────────────────────────────── */
function timerReset() {
  timerRunning   = false;
  timerRemaining = 0;
  timerTotal     = 0;
  clearInterval(timerInterval);

  // Stop any repeating bell
  stopBellRepeating();

  document.getElementById('timer-input-section').style.opacity = '';
  document.getElementById('timer-input-section').style.pointerEvents = '';
  document.getElementById('timer-display').classList.add('hidden');

  document.getElementById('timer-start').disabled = false;
  document.getElementById('timer-pause').disabled = true;

  // Reset sand timer to full
  drawSandTimer(1);
}

/* ── One tick of the countdown ──────────────────────── */
function timerTick() {
  if (timerRemaining <= 0) {
    clearInterval(timerInterval);
    timerRunning = false;
    updateTimerDisplay(0);
    drawSandTimer(0);

    // Show alert and START REPEATING BELL — keeps ringing until dismissed
    showBellAlert('⏰ Time\'s up! Tap Dismiss to stop.');
    startBellRepeating();

    // Reset form state so it can be reused
    document.getElementById('timer-input-section').style.opacity = '';
    document.getElementById('timer-input-section').style.pointerEvents = '';
    document.getElementById('timer-display').classList.add('hidden');
    document.getElementById('timer-start').disabled = false;
    document.getElementById('timer-pause').disabled = true;
    timerRemaining = 0;
    timerTotal = 0;
    return;
  }

  timerRemaining--;
  updateTimerDisplay(timerRemaining);

  // Update sand animation
  const progress = timerTotal > 0 ? timerRemaining / timerTotal : 0;
  drawSandTimer(progress);
}

/* ── Update the timer digits display ────────────────── */
function updateTimerDisplay(totalSec) {
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;

  document.getElementById('t-hours').textContent   = String(h).padStart(2, '0');
  document.getElementById('t-minutes').textContent = String(m).padStart(2, '0');
  document.getElementById('t-seconds').textContent = String(s).padStart(2, '0');
}

/* ════════════════════════════════════════════════════════
   REPEATING BELL — plays again every ~3 seconds until dismissed
════════════════════════════════════════════════════════ */

/* ── Start repeating the selected bell ──────────────── */
function startBellRepeating() {
  if (bellRepeating) return;
  bellRepeating = true;

  // Play immediately once
  playBell(selectedBell);

  // Then repeat every 3 seconds until user dismisses
  bellRepeatTimer = setInterval(() => {
    if (!bellRepeating) {
      clearInterval(bellRepeatTimer);
      return;
    }
    playBell(selectedBell);
  }, 3000);
}

/* ── Stop the repeating bell ─────────────────────────── */
function stopBellRepeating() {
  bellRepeating = false;
  if (bellRepeatTimer) {
    clearInterval(bellRepeatTimer);
    bellRepeatTimer = null;
  }
}

/* ════════════════════════════════════════════════════════
   SAND TIMER ANIMATION (Canvas)
════════════════════════════════════════════════════════ */

function drawSandTimer(progress) {
  // progress = 1 means full (start), 0 means empty (end)
  const canvas = document.getElementById('sand-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const W   = canvas.width;   // 160
  const H   = canvas.height;  // 220

  const style   = getComputedStyle(document.body);
  const surface = style.getPropertyValue('--surface').trim() || '#fff';
  const border  = style.getPropertyValue('--border').trim()  || '#e2e8f0';
  const accent  = style.getPropertyValue('--accent').trim()  || '#0EA5E9';
  const text    = style.getPropertyValue('--text').trim()    || '#0f172a';

  const sandTop    = '#F59E0B';  // amber — sand in top half
  const sandBottom = '#FCD34D';  // lighter sand in bottom half

  ctx.clearRect(0, 0, W, H);

  const cx          = W / 2;
  const topBulbY    = 20;
  const bottomBulbY = H - 20;
  const neckY       = H / 2;
  const bulbR       = 55;
  const neckW       = 10;

  /* Draw hourglass background */
  ctx.beginPath();
  ctx.moveTo(cx - bulbR, topBulbY);
  ctx.lineTo(cx + bulbR, topBulbY);
  ctx.lineTo(cx + neckW, neckY);
  ctx.lineTo(cx + bulbR, bottomBulbY);
  ctx.lineTo(cx - bulbR, bottomBulbY);
  ctx.lineTo(cx - neckW, neckY);
  ctx.closePath();
  ctx.fillStyle = surface;
  ctx.fill();
  ctx.strokeStyle = border;
  ctx.lineWidth = 3;
  ctx.stroke();

  /* Top bulb sand — fills from neck upward as time remains */
  if (progress > 0) {
    const topHalfH = neckY - topBulbY;
    const sandH    = topHalfH * progress;
    const sandTopY = neckY - sandH;

    ctx.save();
    ctx.beginPath();
    ctx.moveTo(cx - bulbR, topBulbY);
    ctx.lineTo(cx + bulbR, topBulbY);
    ctx.lineTo(cx + neckW, neckY);
    ctx.lineTo(cx - neckW, neckY);
    ctx.closePath();
    ctx.clip();

    const grad = ctx.createLinearGradient(0, sandTopY, 0, neckY);
    grad.addColorStop(0, sandTop);
    grad.addColorStop(1, '#D97706');
    ctx.fillStyle = grad;
    ctx.fillRect(cx - bulbR, sandTopY, bulbR * 2, neckY - sandTopY);
    ctx.restore();
  }

  /* Bottom bulb sand — fills from bottom up as time passes */
  {
    const bottomHalfH = bottomBulbY - neckY;
    const sandH       = bottomHalfH * (1 - progress);
    const sandTopY    = bottomBulbY - sandH;

    ctx.save();
    ctx.beginPath();
    ctx.moveTo(cx - neckW, neckY);
    ctx.lineTo(cx + neckW, neckY);
    ctx.lineTo(cx + bulbR, bottomBulbY);
    ctx.lineTo(cx - bulbR, bottomBulbY);
    ctx.closePath();
    ctx.clip();

    const grad = ctx.createLinearGradient(0, sandTopY, 0, bottomBulbY);
    grad.addColorStop(0, sandBottom);
    grad.addColorStop(1, '#F59E0B');
    ctx.fillStyle = grad;
    ctx.fillRect(cx - bulbR, sandTopY, bulbR * 2, bottomBulbY - sandTopY);
    ctx.restore();
  }

  /* Falling sand particle at neck */
  if (progress > 0.01 && progress < 0.99) {
    const particleY = neckY + ((Date.now() / 120) % 30);
    ctx.fillStyle = sandTop;
    ctx.beginPath();
    ctx.arc(cx, particleY, 3, 0, Math.PI * 2);
    ctx.fill();
  }

  /* Redraw hourglass border on top */
  ctx.beginPath();
  ctx.moveTo(cx - bulbR, topBulbY);
  ctx.lineTo(cx + bulbR, topBulbY);
  ctx.lineTo(cx + neckW, neckY);
  ctx.lineTo(cx + bulbR, bottomBulbY);
  ctx.lineTo(cx - bulbR, bottomBulbY);
  ctx.lineTo(cx - neckW, neckY);
  ctx.closePath();
  ctx.strokeStyle = accent;
  ctx.lineWidth = 3;
  ctx.stroke();

  /* Top and bottom caps */
  ctx.fillStyle = accent;
  ctx.fillRect(cx - bulbR - 4, topBulbY - 8,   (bulbR + 4) * 2, 10);
  ctx.fillRect(cx - bulbR - 4, bottomBulbY - 2, (bulbR + 4) * 2, 10);

  /* Progress percentage */
  ctx.fillStyle = text;
  ctx.font = `bold 13px 'Space Mono', monospace`;
  ctx.textAlign = 'center';
  ctx.fillText(`${Math.round((1 - progress) * 100)}%`, cx, H - 2);
}

/* ════════════════════════════════════════════════════════
   BELL SOUNDS — Web Audio API (no external files needed)
════════════════════════════════════════════════════════ */

function getAudioCtx() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  return audioCtx;
}

function playBell(num) {
  try {
    const ctx = getAudioCtx();
    switch(num) {
      case 1: bellChime(ctx);    break;
      case 2: bellMelody(ctx);   break;
      case 3: bellDingDong(ctx); break;
      case 4: bellAlarm(ctx);    break;
      case 5: bellSoft(ctx);     break;
    }
  } catch(e) {
    console.warn('Audio play failed:', e);
  }
}

/* Bell 1: Simple chime */
function bellChime(ctx) {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.connect(gain); gain.connect(ctx.destination);
  osc.type = 'sine';
  osc.frequency.setValueAtTime(880, ctx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + 1.5);
  gain.gain.setValueAtTime(0.5, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 2);
  osc.start(); osc.stop(ctx.currentTime + 2);
}

/* Bell 2: Melody sequence */
function bellMelody(ctx) {
  [523, 659, 784, 1047].forEach((freq, i) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain); gain.connect(ctx.destination);
    osc.type = 'triangle';
    osc.frequency.value = freq;
    const t = ctx.currentTime + i * 0.22;
    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(0.4, t + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.5);
    osc.start(t); osc.stop(t + 0.6);
  });
}

/* Bell 3: Ding-Dong */
function bellDingDong(ctx) {
  [[700, 0], [525, 0.5]].forEach(([freq, delay]) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain); gain.connect(ctx.destination);
    osc.type = 'sine';
    osc.frequency.value = freq;
    const t = ctx.currentTime + delay;
    gain.gain.setValueAtTime(0.5, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 1.2);
    osc.start(t); osc.stop(t + 1.4);
  });
}

/* Bell 4: Repeating alarm beep */
function bellAlarm(ctx) {
  for (let i = 0; i < 6; i++) {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain); gain.connect(ctx.destination);
    osc.type = 'square';
    osc.frequency.value = 1000;
    const t = ctx.currentTime + i * 0.3;
    gain.gain.setValueAtTime(0.3, t);
    gain.gain.setValueAtTime(0, t + 0.2);
    osc.start(t); osc.stop(t + 0.25);
  }
}

/* Bell 5: Soft warm tone */
function bellSoft(ctx) {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.connect(gain); gain.connect(ctx.destination);
  osc.type = 'sine';
  osc.frequency.setValueAtTime(528, ctx.currentTime);
  gain.gain.setValueAtTime(0.3, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 3);
  osc.start(); osc.stop(ctx.currentTime + 3.2);
}

/* ── Show the bell alert overlay ─────────────────────── */
function showBellAlert(msg) {
  const el = document.getElementById('bell-alert');
  document.getElementById('bell-message').textContent = msg;
  el.classList.remove('hidden');
}

/* ── Dismiss the bell alert AND stop repeating bell ─── */
function dismissBell() {
  document.getElementById('bell-alert').classList.add('hidden');
  stopBellRepeating(); // IMPORTANT: stop the repeating bell on dismiss
}

/* ── Initialise sand timer at full ──────────────────── */
function initSandTimer() {
  drawSandTimer(1);
}
