/* ═══════════════════════════════════════════════════════
   theme.js — Dark / Light / System (Auto Day/Night) Theme
   In "system" mode: Light during 6am–7pm, Dark at night
═══════════════════════════════════════════════════════ */

let currentTheme      = 'system'; // 'light' | 'dark' | 'system'
let starsCanvas, starsCtx;
let themeCheckInterval;

/* ── Initialise theme system ─────────────────────────── */
function initTheme() {
  // Set up star canvas
  starsCanvas = document.getElementById('stars-canvas');
  if (starsCanvas) starsCtx = starsCanvas.getContext('2d');

  // Bind theme buttons
  document.querySelectorAll('.theme-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      applyTheme(btn.dataset.theme);
    });
  });

  // Apply saved theme (or default: system)
  const saved = localStorage.getItem('wc-theme') || 'system';
  applyTheme(saved);

  // Check every minute if system mode needs to switch day/night
  themeCheckInterval = setInterval(() => {
    if (currentTheme === 'system') updateSystemTheme();
  }, 60000);
}

/* ── Apply a theme by name ───────────────────────────── */
function applyTheme(theme) {
  currentTheme = theme;
  localStorage.setItem('wc-theme', theme);

  // Update active button
  document.querySelectorAll('.theme-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.theme === theme);
  });

  // Remove all theme classes from body
  document.body.classList.remove('theme-dark', 'theme-light', 'theme-system');

  if (theme === 'dark') {
    document.body.classList.add('theme-dark');
    showNightOverlay(true);
  } else if (theme === 'light') {
    document.body.classList.add('theme-light');
    showNightOverlay(false);
  } else {
    // System auto mode
    document.body.classList.add('theme-system');
    updateSystemTheme();
  }
}

/* ── Determine day or night for system theme ─────────── */
function updateSystemTheme() {
  const hour = new Date().getHours();
  const isNight = hour < 6 || hour >= 19; // Night = 7pm to 6am

  document.body.classList.toggle('is-night', isNight);
  showNightOverlay(isNight);
}

/* ── Show or hide the night overlay (stars + moon) ────── */
function showNightOverlay(show) {
  const overlay = document.getElementById('night-overlay');
  if (!overlay) return;

  if (show) {
    overlay.classList.remove('hidden');
    resizeStarsCanvas();
    drawStars();
  } else {
    overlay.classList.add('hidden');
  }
}

/* ── Resize the stars canvas to fill the viewport ────── */
function resizeStarsCanvas() {
  if (!starsCanvas) return;
  starsCanvas.width  = window.innerWidth;
  starsCanvas.height = window.innerHeight;
}

/* ── Draw a starfield on the canvas ─────────────────── */
function drawStars() {
  if (!starsCtx || !starsCanvas) return;
  const W = starsCanvas.width;
  const H = starsCanvas.height;

  starsCtx.clearRect(0, 0, W, H);

  // Draw ~150 stars of varying size and brightness
  for (let i = 0; i < 150; i++) {
    const x      = Math.random() * W;
    const y      = Math.random() * H * 0.75; // stars only in top 75%
    const r      = Math.random() * 1.8 + 0.2;
    const alpha  = Math.random() * 0.7 + 0.3;

    starsCtx.beginPath();
    starsCtx.arc(x, y, r, 0, Math.PI * 2);
    starsCtx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
    starsCtx.fill();
  }

  // A few slightly bigger "bright" stars
  for (let i = 0; i < 12; i++) {
    const x = Math.random() * W;
    const y = Math.random() * H * 0.6;

    // Star shape (4-pointed)
    drawStarShape(starsCtx, x, y, 3, 'rgba(255,255,220,0.9)');
  }
}

/* ── Draw a small 4-pointed star shape ──────────────── */
function drawStarShape(ctx, cx, cy, size, color) {
  ctx.fillStyle = color;
  ctx.beginPath();
  for (let p = 0; p < 4; p++) {
    const outerAngle = (p * Math.PI) / 2 - Math.PI / 4;
    const innerAngle = outerAngle + Math.PI / 4;
    if (p === 0) {
      ctx.moveTo(cx + size * Math.cos(outerAngle), cy + size * Math.sin(outerAngle));
    } else {
      ctx.lineTo(cx + size * Math.cos(outerAngle), cy + size * Math.sin(outerAngle));
    }
    ctx.lineTo(cx + size * 0.4 * Math.cos(innerAngle), cy + size * 0.4 * Math.sin(innerAngle));
  }
  ctx.closePath();
  ctx.fill();
}

// Redraw stars if window is resized
window.addEventListener('resize', () => {
  if (currentTheme === 'dark' ||
     (currentTheme === 'system' && document.body.classList.contains('is-night'))) {
    resizeStarsCanvas();
    drawStars();
  }
});
