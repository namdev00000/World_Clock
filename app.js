/* ═══════════════════════════════════════════════════════
   app.js — Main App Initialisation & Tab Switcher
   This is the entry point that wires everything together
═══════════════════════════════════════════════════════ */

/* ── On DOM ready ────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {

  // ── 1. Initialise icons (Lucide) ──────────────────────
  if (window.lucide) lucide.createIcons();

  // ── 2. Initialise theme ───────────────────────────────
  initTheme();

  // ── 3. Initialise main clock (always visible) ─────────
  initClock();

  // ── 4. Initialise calendar ────────────────────────────
  initCalendar();

  // ── 5. Initialise runner canvas (stopwatch animation) ─
  initRunner();

  // ── 6. Initialise sand timer (drawn at start) ─────────
  initSandTimer();

  // ── 7. Initialise sparrow window ──────────────────────
  initSparrow();

  // ── 8. Set up tab navigation ──────────────────────────
  setupTabs();

  // ── 9. Set up clock type & format toggles ────────────
  setupClockToggles();

  // ── 10. Lazy-init globe when user visits World tab ────
  //  (Three.js is heavy; only render it when needed)
  let globeInited = false;
  document.querySelector('[data-tab="world"]').addEventListener('click', () => {
    if (!globeInited) {
      globeInited = true;
      setTimeout(() => {
        initGlobe();
        initZoneCards();
      }, 80); // small delay ensures container is visible and has size
    } else {
      resumeGlobe();
    }
  });
});

/* ═══════════════════════════════════════════════════════
   TAB SWITCHING
═══════════════════════════════════════════════════════ */

function setupTabs() {
  const tabBtns    = document.querySelectorAll('.tab-btn');
  const tabPanels  = document.querySelectorAll('.tab-content');

  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const target = btn.dataset.tab;

      // Update button active state
      tabBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      // Show/hide panels
      tabPanels.forEach(panel => {
        const isActive = panel.id === `tab-${target}`;
        panel.classList.toggle('hidden', !isActive);
      });

      // Pause globe if leaving world tab
      if (target !== 'world' && window.globeMesh) stopGlobe();
      if (target === 'world' && window.globeRenderer) resumeGlobe();

      // Re-initialise Lucide icons (some may be inside hidden panels)
      if (window.lucide) lucide.createIcons();
    });
  });
}

/* ═══════════════════════════════════════════════════════
   CLOCK TYPE & FORMAT TOGGLES
═══════════════════════════════════════════════════════ */

function setupClockToggles() {
  // Digital / Analog
  document.querySelectorAll('.type-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      setClockType(btn.dataset.type);
    });
  });

  // 12 / 24 hour
  document.querySelectorAll('.fmt-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      setClockFormat(parseInt(btn.dataset.fmt));
    });
  });
}

/* ═══════════════════════════════════════════════════════
   KEYBOARD SHORTCUTS (optional convenience)
═══════════════════════════════════════════════════════ */

document.addEventListener('keydown', e => {
  // Escape dismisses bell
  if (e.key === 'Escape') dismissBell();

  // Space bar — start/pause stopwatch when on stopwatch tab
  if (e.key === ' ' && document.getElementById('tab-stopwatch').classList.contains('hidden') === false) {
    e.preventDefault();
    if (swRunning) swPause();
    else swStart();
  }
});
