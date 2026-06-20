/* ═══════════════════════════════════════════════════════
   stopwatch.js — Stopwatch with Running Boy Animation
═══════════════════════════════════════════════════════ */

// ── State ──────────────────────────────────────────────
let swRunning    = false;
let swStartTime  = 0;
let swElapsed    = 0;
let swInterval   = null;
let swLapCount   = 0;
let runnerAnimId = null;
let runnerFrame  = 0;
let treeOffset   = 0;
let runnerSpeed  = 0;  // pixels per frame trees scroll

/* ── Start the stopwatch ────────────────────────────── */
function swStart() {
  if (swRunning) return;
  swRunning   = true;
  swStartTime = Date.now() - swElapsed;
  swInterval  = setInterval(swTick, 50); // update every 50ms for milliseconds

  // Button states
  document.getElementById('sw-start').disabled = true;
  document.getElementById('sw-pause').disabled = false;
  document.getElementById('sw-lap').disabled   = false;

  // Start runner animation
  startRunner();
}

/* ── Pause the stopwatch ────────────────────────────── */
function swPause() {
  if (!swRunning) return;
  swRunning = false;
  swElapsed = Date.now() - swStartTime;
  clearInterval(swInterval);

  document.getElementById('sw-start').disabled = false;
  document.getElementById('sw-pause').disabled = true;

  // Slow runner to a stop
  runnerSpeed = 0;
}

/* ── Reset everything ───────────────────────────────── */
function swReset() {
  swRunning = false;
  swElapsed = 0;
  clearInterval(swInterval);
  swLapCount = 0;

  // Reset display
  document.getElementById('sw-hours').textContent   = '00';
  document.getElementById('sw-minutes').textContent = '00';
  document.getElementById('sw-seconds').textContent = '00';
  document.getElementById('sw-ms').textContent      = '000';

  // Button states
  document.getElementById('sw-start').disabled = false;
  document.getElementById('sw-pause').disabled = true;
  document.getElementById('sw-lap').disabled   = true;

  // Clear laps
  document.getElementById('lap-list').innerHTML = '';

  // Stop runner
  runnerSpeed = 0;
  treeOffset  = 0;
  cancelAnimationFrame(runnerAnimId);
  drawRunnerStatic(); // draw idle pose
}

/* ── Record a lap ───────────────────────────────────── */
function swLap() {
  if (!swRunning) return;
  swLapCount++;
  const elapsed = Date.now() - swStartTime;
  const timeStr = formatSWTime(elapsed);

  const item = document.createElement('div');
  item.className = 'lap-item';
  item.innerHTML = `
    <span class="lap-label">Lap ${swLapCount}</span>
    <span class="lap-time">${timeStr}</span>
  `;

  // Insert newest lap at top
  const list = document.getElementById('lap-list');
  list.insertBefore(item, list.firstChild);
}

/* ── Update display every tick ──────────────────────── */
function swTick() {
  const elapsed = Date.now() - swStartTime;
  const h  = Math.floor(elapsed / 3600000);
  const m  = Math.floor((elapsed % 3600000) / 60000);
  const s  = Math.floor((elapsed % 60000) / 1000);
  const ms = elapsed % 1000;

  document.getElementById('sw-hours').textContent   = String(h).padStart(2, '0');
  document.getElementById('sw-minutes').textContent = String(m).padStart(2, '0');
  document.getElementById('sw-seconds').textContent = String(s).padStart(2, '0');
  document.getElementById('sw-ms').textContent      = String(ms).padStart(3, '0');
}

/* ── Format elapsed ms to HH:MM:SS.mmm ─────────────── */
function formatSWTime(ms) {
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  const s = Math.floor((ms % 60000) / 1000);
  return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
}

/* ════════════════════════════════════════════════════════
   RUNNING BOY ANIMATION
   Draws: sky, road, trees scrolling past, running stick figure
════════════════════════════════════════════════════════ */

let runnerCanvas, runnerCtx;

function initRunner() {
  runnerCanvas = document.getElementById('runner-canvas');
  if (!runnerCanvas) return;
  runnerCtx = runnerCanvas.getContext('2d');
  drawRunnerStatic();
}

/* ── Start continuous runner animation ──────────────── */
function startRunner() {
  runnerSpeed = 3;
  function loop() {
    if (!swRunning) {
      drawRunnerFrame(); // draw one last frame
      return;
    }
    runnerFrame++;
    treeOffset = (treeOffset + runnerSpeed) % 200; // scroll trees
    drawRunnerFrame();
    runnerAnimId = requestAnimationFrame(loop);
  }
  cancelAnimationFrame(runnerAnimId);
  loop();
}

/* ── Draw a single animation frame ─────────────────── */
function drawRunnerFrame() {
  if (!runnerCtx) return;
  const W = runnerCanvas.width;
  const H = runnerCanvas.height;
  const ctx = runnerCtx;

  const style   = getComputedStyle(document.body);
  const bg2     = style.getPropertyValue('--bg2').trim()    || '#EFF6FF';
  const surface = style.getPropertyValue('--surface').trim()|| '#fff';
  const accent  = style.getPropertyValue('--accent').trim() || '#0EA5E9';
  const text    = style.getPropertyValue('--text').trim()   || '#0f172a';

  ctx.clearRect(0, 0, W, H);

  /* Sky */
  const skyGrad = ctx.createLinearGradient(0, 0, 0, H * 0.65);
  skyGrad.addColorStop(0, bg2);
  skyGrad.addColorStop(1, surface);
  ctx.fillStyle = skyGrad;
  ctx.fillRect(0, 0, W, H * 0.65);

  /* Road */
  ctx.fillStyle = '#475569';
  ctx.fillRect(0, H * 0.65, W, H * 0.35);

  /* Road center dashes */
  ctx.strokeStyle = '#F8FAFC';
  ctx.setLineDash([20, 20]);
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, H * 0.82);
  ctx.lineTo(W, H * 0.82);
  ctx.stroke();
  ctx.setLineDash([]);

  /* Trees (scrolling) */
  const treePositions = [80, 200, 350, 500];
  treePositions.forEach(x => {
    const tx = ((x - treeOffset % 200 + W) % W);
    drawTree(ctx, tx, H * 0.65, accent);
  });

  /* Running stick figure */
  const groundY = H * 0.63;
  const figX    = 140;
  const legPhase = (runnerFrame % 20) / 20; // 0..1 oscillation

  drawRunningFigure(ctx, figX, groundY, legPhase, text);
}

/* ── Draw idle (static) figure when not running ─────── */
function drawRunnerStatic() {
  if (!runnerCtx) return;
  const W = runnerCanvas.width;
  const H = runnerCanvas.height;
  const ctx = runnerCtx;
  const style   = getComputedStyle(document.body);
  const bg2     = style.getPropertyValue('--bg2').trim()    || '#EFF6FF';
  const surface = style.getPropertyValue('--surface').trim()|| '#fff';
  const accent  = style.getPropertyValue('--accent').trim() || '#0EA5E9';
  const text    = style.getPropertyValue('--text').trim()   || '#0f172a';

  ctx.clearRect(0, 0, W, H);

  const skyGrad = ctx.createLinearGradient(0, 0, 0, H * 0.65);
  skyGrad.addColorStop(0, bg2);
  skyGrad.addColorStop(1, surface);
  ctx.fillStyle = skyGrad;
  ctx.fillRect(0, 0, W, H * 0.65);

  ctx.fillStyle = '#475569';
  ctx.fillRect(0, H * 0.65, W, H * 0.35);

  ctx.strokeStyle = '#F8FAFC';
  ctx.setLineDash([20, 20]);
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, H * 0.82);
  ctx.lineTo(W, H * 0.82);
  ctx.stroke();
  ctx.setLineDash([]);

  [80, 250, 430].forEach(x => drawTree(ctx, x, H * 0.65, accent));

  // Standing figure
  drawRunningFigure(ctx, 140, H * 0.63, 0, text);
}

/* ── Draw a simple tree ─────────────────────────────── */
function drawTree(ctx, x, groundY, color) {
  // Trunk
  ctx.fillStyle = '#92400e';
  ctx.fillRect(x - 4, groundY - 32, 8, 32);
  // Foliage (triangle)
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(x, groundY - 80);
  ctx.lineTo(x - 22, groundY - 30);
  ctx.lineTo(x + 22, groundY - 30);
  ctx.closePath();
  ctx.fill();
  // Second layer
  ctx.beginPath();
  ctx.moveTo(x, groundY - 100);
  ctx.lineTo(x - 16, groundY - 60);
  ctx.lineTo(x + 16, groundY - 60);
  ctx.closePath();
  ctx.fill();
}

/* ── Draw the running stick figure ─────────────────── */
function drawRunningFigure(ctx, x, groundY, phase, color) {
  // Leg oscillation: front leg and back leg alternate
  const legSwing  = Math.sin(phase * Math.PI * 2) * 22;
  const armSwing  = -legSwing * 0.6;
  const bodyBob   = Math.abs(Math.sin(phase * Math.PI * 2)) * 4;

  const bodyTop = groundY - 70 + bodyBob;

  ctx.strokeStyle = color;
  ctx.lineCap  = 'round';
  ctx.lineJoin = 'round';

  // Head
  ctx.beginPath();
  ctx.arc(x, bodyTop - 14, 12, 0, Math.PI * 2);
  ctx.lineWidth = 2.5;
  ctx.stroke();

  // Body
  ctx.beginPath();
  ctx.moveTo(x, bodyTop - 2);
  ctx.lineTo(x, groundY - 24 + bodyBob);
  ctx.lineWidth = 3;
  ctx.stroke();

  // Arms
  ctx.beginPath();
  ctx.moveTo(x + armSwing * 0.4, bodyTop + 12);
  ctx.lineTo(x + armSwing,       bodyTop + 30);
  ctx.lineWidth = 2.5;
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(x - armSwing * 0.4, bodyTop + 12);
  ctx.lineTo(x - armSwing,       bodyTop + 30);
  ctx.stroke();

  // Legs
  const hipY = groundY - 22 + bodyBob;
  // Front leg
  ctx.beginPath();
  ctx.moveTo(x, hipY);
  ctx.lineTo(x + legSwing * 0.5,  hipY + 22);
  ctx.lineTo(x + legSwing,         groundY);
  ctx.lineWidth = 3;
  ctx.stroke();

  // Back leg
  ctx.beginPath();
  ctx.moveTo(x, hipY);
  ctx.lineTo(x - legSwing * 0.5,  hipY + 22);
  ctx.lineTo(x - legSwing,         groundY);
  ctx.stroke();

  // Shoes
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.ellipse(x + legSwing,  groundY, 8, 4, 0.2, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(x - legSwing,  groundY, 8, 4, -0.2, 0, Math.PI * 2);
  ctx.fill();
}
