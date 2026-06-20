/* ═══════════════════════════════════════════════════════
   globe.js — 3D Interactive Earth
   Uses a high-quality NASA Earth texture loaded via URL.
   Falls back to a clean canvas texture if fetch fails.

   Features:
   · Realistic Earth texture (NASA Blue Marble)
   · Slow auto-rotation
   · Drag to rotate (mouse + touch) with inertia
   · Red pin at every timezone lat/lng
   · Small abbreviation label ONLY for pins on the FRONT
     face of the globe (back-face pins are hidden)
   · Click a pin → popup freezes globe; ✕ resumes it
═══════════════════════════════════════════════════════ */

let globeScene, globeCamera, globeRenderer, globeMesh, globeAnimId;
let zoneUpdateInterval;

// ── Rotation state ─────────────────────────────────────
let isDragging      = false;
let dragStartX      = 0;
let dragStartY      = 0;
let rotationX       = 0;
let rotationY       = 0;
let velocityX       = 0;
let velocityY       = 0;
let autoRotateSpeed = 0.0012;

// ── Pins + labels ──────────────────────────────────────
let pinMeshes = [];   // [{ mesh, tz }]
let tzLabels  = [];   // [{ div, pinMesh, tz }]

// ── Popup ──────────────────────────────────────────────
let globePopup = null;

// ── Pause flag (set while a pin popup is open) ─────────
let globePaused = false;

// ── Auto-rotate toggle (user can turn off spinning) ────
let autoRotate  = true;

/* ══════════════════════════════════════════════════════
   INIT
══════════════════════════════════════════════════════ */
function initGlobe() {
  const container = document.getElementById('globe-container');
  if (!container || !window.THREE) return;

  const W = container.clientWidth  || 520;
  const H = container.clientHeight || 420;

  // Scene
  globeScene = new THREE.Scene();

  // Camera — pulled back enough to see full globe
  globeCamera = new THREE.PerspectiveCamera(40, W / H, 0.1, 100);
  globeCamera.position.z = 2.5;

  // Renderer
  globeRenderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  globeRenderer.setSize(W, H);
  globeRenderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  container.appendChild(globeRenderer.domElement);

  // ── Rotation ON/OFF toggle button (top-right of globe) ──
  const rotBtn = document.createElement('button');
  rotBtn.id    = 'globe-rot-btn';
  rotBtn.title = 'Toggle auto-rotation';
  rotBtn.innerHTML = '⏸ Pause';
  rotBtn.style.cssText = `
    position: absolute;
    top: 10px; right: 10px;
    z-index: 20;
    background: rgba(14,165,233,0.88);
    color: #fff;
    border: none;
    border-radius: 20px;
    padding: 5px 13px;
    font-family: 'Outfit', sans-serif;
    font-size: 0.75rem;
    font-weight: 600;
    cursor: pointer;
    backdrop-filter: blur(4px);
    transition: background 0.2s;
    letter-spacing: 0.3px;
  `;
  rotBtn.addEventListener('mouseenter', () => {
    rotBtn.style.background = 'rgba(14,165,233,1)';
  });
  rotBtn.addEventListener('mouseleave', () => {
    rotBtn.style.background = autoRotate
      ? 'rgba(14,165,233,0.88)'
      : 'rgba(100,116,139,0.88)';
  });
  rotBtn.addEventListener('click', () => {
    autoRotate = !autoRotate;
    velocityX  = 0;          // clear inertia when pausing
    velocityY  = 0;
    rotBtn.innerHTML         = autoRotate ? '⏸ Pause' : '▶ Rotate';
    rotBtn.style.background  = autoRotate
      ? 'rgba(14,165,233,0.88)'
      : 'rgba(100,116,139,0.88)';
  });
  container.appendChild(rotBtn);

  // Lighting
  const ambient = new THREE.AmbientLight(0xffffff, 0.5);
  globeScene.add(ambient);
  const sun = new THREE.DirectionalLight(0xfff8e8, 1.6);
  sun.position.set(5, 3, 4);
  globeScene.add(sun);
  const rim = new THREE.DirectionalLight(0x334466, 0.3);
  rim.position.set(-4, -2, -3);
  globeScene.add(rim);

  // Atmosphere glow (slightly larger sphere, additive blend)
  const atmGeo = new THREE.SphereGeometry(1.08, 48, 48);
  const atmMat = new THREE.MeshPhongMaterial({
    color: 0x3399ff, transparent: true,
    opacity: 0.10, side: THREE.FrontSide,
    depthWrite: false,
  });
  globeScene.add(new THREE.Mesh(atmGeo, atmMat));

  // Create popup element
  createGlobePopup(container);

  // Load texture then build Earth
  buildEarth(container);

  window.addEventListener('resize', onGlobeResize);
}

/* ══════════════════════════════════════════════════════
   BUILD EARTH  (texture → sphere → pins → animate)
══════════════════════════════════════════════════════ */
function buildEarth(container) {
  const loader = new THREE.TextureLoader();

  // NASA Blue Marble texture via public CDN
  // Using a reliable public domain Earth texture
  const NASA_URL = 'https://unpkg.com/three-globe@2.31.0/example/img/earth-blue-marble.jpg';

  loader.load(
    NASA_URL,
    (texture) => {
      texture.anisotropy = globeRenderer.capabilities.getMaxAnisotropy();
      createEarthSphere(texture);
      finishGlobe(container);
    },
    undefined,
    () => {
      // Fallback: load a second CDN option
      loader.load(
        'https://raw.githubusercontent.com/turban/webgl-earth/master/images/2_no_clouds_4k.jpg',
        (texture) => {
          createEarthSphere(texture);
          finishGlobe(container);
        },
        undefined,
        () => {
          // Final fallback: canvas texture
          const canvasTex = new THREE.CanvasTexture(createEarthCanvasTexture());
          createEarthSphere(canvasTex);
          finishGlobe(container);
        }
      );
    }
  );
}

/* ── Create the Earth sphere mesh ────────────────────── */
function createEarthSphere(texture) {
  const geo = new THREE.SphereGeometry(1, 64, 64);
  const mat = new THREE.MeshPhongMaterial({
    map:       texture,
    specular:  new THREE.Color(0x111122),
    shininess: 12,
  });
  globeMesh = new THREE.Mesh(geo, mat);
  globeScene.add(globeMesh);
}

/* ── Add pins, labels, interaction, start loop ────────── */
function finishGlobe(container) {
  // Add pins and labels
  pinMeshes = [];
  tzLabels  = [];
  TIMEZONES.forEach(tz => addPin(tz, container));

  // Setup drag/click
  setupGlobeInteraction(container);

  // Start render loop
  animateGlobe();
}

/* ══════════════════════════════════════════════════════
   PINS  (3D sphere dot, attached to globeMesh)
══════════════════════════════════════════════════════ */
function addPin(tz, container) {
  // Position on globe surface
  const pos = latLngToVec3(tz.lat, tz.lng, 1.025);

  // Red glowing dot
  const geo  = new THREE.SphereGeometry(0.018, 8, 8);
  const mat  = new THREE.MeshPhongMaterial({
    color:    0xFF2222,
    emissive: 0xBB0000,
    emissiveIntensity: 0.7,
  });
  const pin = new THREE.Mesh(geo, mat);
  pin.position.copy(pos);

  // Attach to globe so it rotates with it
  globeMesh.add(pin);
  pinMeshes.push({ mesh: pin, tz });

  // DOM label for timezone abbreviation
  const label = document.createElement('div');
  label.className = 'globe-tz-label';
  label.textContent = tz.abbr;
  label.style.cssText = `
    position: absolute;
    pointer-events: none;
    font-family: 'Outfit', sans-serif;
    font-size: 0.55rem;
    font-weight: 700;
    color: #fff;
    background: rgba(220,38,38,0.90);
    border: 1px solid rgba(255,200,200,0.6);
    border-radius: 3px;
    padding: 1px 4px;
    white-space: nowrap;
    letter-spacing: 0.2px;
    text-shadow: 0 1px 2px rgba(0,0,0,0.7);
    transform: translate(-50%, -170%);
    display: none;
    z-index: 4;
    box-shadow: 0 1px 4px rgba(0,0,0,0.4);
  `;
  container.appendChild(label);
  tzLabels.push({ label, pin, tz });
}

/* ── Project a 3D pin to 2D screen position ─────────── */
function projectPin(pinMesh, containerW, containerH) {
  // Get the pin world position (globe may be rotated)
  const worldPos = new THREE.Vector3();
  pinMesh.getWorldPosition(worldPos);

  // Check if it's on the front face (facing camera)
  // Camera looks down -Z; if worldPos.z < 0 it's behind the globe
  // More accurate: dot product of surface normal with camera direction
  const normal = worldPos.clone().normalize();
  const camDir = new THREE.Vector3(0, 0, 1); // camera is at +Z looking at origin
  const dot    = normal.dot(camDir);

  // dot > 0.10 means pin is on the front-facing hemisphere
  // Use a small positive threshold so edge pins don't flicker
  const visible = dot > 0.10;

  // Project to NDC then to pixel coords
  const ndc = worldPos.clone().project(globeCamera);
  const x   = (ndc.x  *  0.5 + 0.5) * containerW;
  const y   = (ndc.y * -0.5 + 0.5) * containerH;

  return { x, y, visible };
}

/* ── Update all label positions every frame ──────────── */
function updateLabels() {
  if (!globeMesh || !tzLabels.length) return;
  const container = document.getElementById('globe-container');
  if (!container) return;
  const cW = container.clientWidth;
  const cH = container.clientHeight;

  tzLabels.forEach(({ label, pin }) => {
    const { x, y, visible } = projectPin(pin, cW, cH);
    if (visible) {
      label.style.display = 'block';
      label.style.left    = x + 'px';
      label.style.top     = y + 'px';
    } else {
      label.style.display = 'none';
    }
  });
}

/* ══════════════════════════════════════════════════════
   POPUP  (pause globe while open)
══════════════════════════════════════════════════════ */
function createGlobePopup(container) {
  globePopup = document.createElement('div');
  globePopup.id = 'globe-popup';
  globePopup.style.cssText = `
    position: absolute;
    background: var(--surface, #fff);
    border: 2px solid var(--accent, #0EA5E9);
    border-radius: 12px;
    padding: 12px 14px 10px;
    font-family: 'Outfit', sans-serif;
    font-size: 0.83rem;
    color: var(--text, #0f172a);
    box-shadow: 0 10px 32px rgba(0,0,0,0.22);
    pointer-events: auto;
    display: none;
    z-index: 30;
    min-width: 180px;
    max-width: 245px;
    line-height: 1.5;
  `;
  container.style.position = 'relative';
  container.appendChild(globePopup);
}

function showGlobePopup(tz, screenX, screenY, containerRect) {
  if (!globePopup) return;

  // Freeze globe
  globePaused = true;
  velocityX   = 0;
  velocityY   = 0;

  const timeStr   = getTimeInZone(tz.offset);
  const offsetStr = formatOffset(tz.offset);

  globePopup.innerHTML = `
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:7px;">
      <div style="font-weight:700;font-size:0.95rem;color:var(--accent,#0EA5E9);">
        📍 ${tz.abbr}
      </div>
      <button onclick="hideGlobePopup()" title="Close · resume rotation"
        style="background:none;border:1.5px solid var(--border,#e2e8f0);
               border-radius:50%;width:22px;height:22px;cursor:pointer;
               font-size:12px;color:var(--text2,#64748b);
               display:flex;align-items:center;justify-content:center;
               font-family:inherit;flex-shrink:0;line-height:1;">✕</button>
    </div>
    <div style="font-weight:600;font-size:0.9rem;color:var(--text,#0f172a);margin-bottom:3px;">
      ${tz.name}
    </div>
    <div style="font-family:'Space Mono',monospace;font-size:1.1rem;font-weight:700;
                color:var(--text,#0f172a);margin:5px 0;">
      ⏰ ${timeStr}
    </div>
    <div style="color:var(--text2,#64748b);font-size:0.75rem;">UTC${offsetStr}</div>
    <div style="color:var(--text2,#64748b);font-size:0.75rem;margin-top:2px;">
      🌍 ${tz.countries.split(',')[0].trim()}
    </div>
    <div style="margin-top:8px;padding-top:7px;border-top:1px solid var(--border,#e2e8f0);
                font-size:0.68rem;color:var(--text2,#64748b);">
      ⏸ Globe paused — click ✕ to close
    </div>
  `;

  // Position popup near the click, keeping it inside the container
  let left = screenX - containerRect.left + 16;
  let top  = screenY - containerRect.top  - 20;
  const pw = 245, ph = 155;
  if (left + pw > containerRect.width)  left = screenX - containerRect.left - pw - 16;
  if (top  + ph > containerRect.height) top  = screenY - containerRect.top  - ph - 8;
  if (left < 4) left = 4;
  if (top  < 4) top  = 4;

  globePopup.style.left    = left + 'px';
  globePopup.style.top     = top  + 'px';
  globePopup.style.display = 'block';
}

function hideGlobePopup() {
  if (globePopup) globePopup.style.display = 'none';
  globePaused = false;  // Resume rotation
}

/* ══════════════════════════════════════════════════════
   INTERACTION (drag + click)
══════════════════════════════════════════════════════ */
function setupGlobeInteraction(container) {
  const canvas = globeRenderer.domElement;

  // Track total drag distance to distinguish click from drag
  let dragDist = 0;

  canvas.addEventListener('mousedown', e => {
    isDragging = true;
    dragDist   = 0;
    dragStartX = e.clientX;
    dragStartY = e.clientY;
    velocityX  = 0;
    velocityY  = 0;
    canvas.style.cursor = 'grabbing';
  });

  window.addEventListener('mousemove', e => {
    if (!isDragging) return;
    const dx = e.clientX - dragStartX;
    const dy = e.clientY - dragStartY;
    dragDist  += Math.abs(dx) + Math.abs(dy);
    velocityY  = dx * 0.003;
    velocityX  = dy * 0.003;
    rotationY += dx * 0.004;
    rotationX += dy * 0.004;
    rotationX  = Math.max(-Math.PI / 2.2, Math.min(Math.PI / 2.2, rotationX));
    dragStartX = e.clientX;
    dragStartY = e.clientY;
  });

  window.addEventListener('mouseup', e => {
    if (!isDragging) return;
    isDragging = false;
    canvas.style.cursor = 'grab';
    // Only treat as click if barely moved
    if (dragDist < 6) checkPinClick(e, container);
  });

  canvas.style.cursor = 'grab';

  // Click on empty space → close popup
  canvas.addEventListener('click', e => {
    const hit = getPinAtEvent(e, container);
    if (!hit) hideGlobePopup();
  });

  // Touch
  canvas.addEventListener('touchstart', e => {
    if (e.touches.length !== 1) return;
    isDragging = true;
    dragDist   = 0;
    dragStartX = e.touches[0].clientX;
    dragStartY = e.touches[0].clientY;
    velocityX  = 0;
    velocityY  = 0;
  }, { passive: true });

  canvas.addEventListener('touchmove', e => {
    if (!isDragging || e.touches.length !== 1) return;
    const dx = e.touches[0].clientX - dragStartX;
    const dy = e.touches[0].clientY - dragStartY;
    dragDist  += Math.abs(dx) + Math.abs(dy);
    velocityY  = dx * 0.003;
    velocityX  = dy * 0.003;
    rotationY += dx * 0.004;
    rotationX += dy * 0.004;
    rotationX  = Math.max(-Math.PI / 2.2, Math.min(Math.PI / 2.2, rotationX));
    dragStartX = e.touches[0].clientX;
    dragStartY = e.touches[0].clientY;
  }, { passive: true });

  canvas.addEventListener('touchend', e => {
    isDragging = false;
    if (dragDist < 6 && e.changedTouches.length) {
      checkPinClick(e.changedTouches[0], container);
    }
  });
}

/* ── Find nearest front-face pin to click in 2D screen space ─
   Using screen-space proximity is far more forgiving than 3D
   raycasting against tiny pin spheres. Hit radius = 22 px.     */
function getPinAtEvent(e, container) {
  if (!globeMesh || !pinMeshes.length) return null;
  const rect       = container.getBoundingClientRect();
  const cW         = rect.width;
  const cH         = rect.height;
  const clickX     = e.clientX - rect.left;
  const clickY     = e.clientY - rect.top;
  const HIT_RADIUS = 22;   // generous hit zone in pixels

  let best     = null;
  let bestDist = Infinity;

  pinMeshes.forEach(({ mesh, tz }) => {
    // World position of this pin (globe may be rotated)
    const worldPos = new THREE.Vector3();
    mesh.getWorldPosition(worldPos);

    // Hide pins on the back hemisphere (facing away from camera)
    const dot = worldPos.clone().normalize().dot(new THREE.Vector3(0, 0, 1));
    if (dot < 0.05) return;

    // Project 3D → 2D screen coords
    const ndc = worldPos.clone().project(globeCamera);
    const sx  = (ndc.x  *  0.5 + 0.5) * cW;
    const sy  = (ndc.y * -0.5 + 0.5) * cH;

    // Distance from click to projected pin position
    const dist = Math.hypot(clickX - sx, clickY - sy);
    if (dist < HIT_RADIUS && dist < bestDist) {
      bestDist = dist;
      best     = { mesh, tz };
    }
  });

  return best;
}

function checkPinClick(e, container) {
  const hit = getPinAtEvent(e, container);
  if (hit) showGlobePopup(hit.tz, e.clientX, e.clientY, container.getBoundingClientRect());
}

/* ══════════════════════════════════════════════════════
   ANIMATION LOOP
══════════════════════════════════════════════════════ */
function animateGlobe() {
  globeAnimId = requestAnimationFrame(animateGlobe);

  if (globeMesh && !isDragging && !globePaused) {
    velocityY *= 0.95;
    velocityX *= 0.95;
    if (autoRotate) rotationY += autoRotateSpeed + velocityY;  // only spin when on
    else            rotationY += velocityY;                     // still apply inertia decay
    rotationX += velocityX;
    rotationX  = Math.max(-Math.PI / 2.2, Math.min(Math.PI / 2.2, rotationX));
  }

  if (globeMesh) {
    globeMesh.rotation.y = rotationY;
    globeMesh.rotation.x = rotationX;
  }

  // Reposition all labels based on current globe rotation
  updateLabels();

  globeRenderer.render(globeScene, globeCamera);
}

/* ══════════════════════════════════════════════════════
   HELPERS
══════════════════════════════════════════════════════ */

/* lat/lng  →  3D point on sphere surface */
function latLngToVec3(lat, lng, radius) {
  const phi   = (90 - lat)  * (Math.PI / 180);
  const theta = (lng + 180) * (Math.PI / 180);
  return new THREE.Vector3(
    -radius * Math.sin(phi) * Math.cos(theta),
     radius * Math.cos(phi),
     radius * Math.sin(phi) * Math.sin(theta)
  );
}

/* Fallback canvas Earth texture (clean, not cartoon) */
function createEarthCanvasTexture() {
  const c   = document.createElement('canvas');
  c.width   = 2048;
  c.height  = 1024;
  const ctx = c.getContext('2d');

  // Deep ocean gradient
  const ocean = ctx.createLinearGradient(0, 0, 0, c.height);
  ocean.addColorStop(0,   '#0a2a4a');
  ocean.addColorStop(0.5, '#0e4272');
  ocean.addColorStop(1,   '#0a2a4a');
  ctx.fillStyle = ocean;
  ctx.fillRect(0, 0, c.width, c.height);

  // Land masses — more detailed, realistic green-brown colours
  function blob(pts, color) {
    ctx.beginPath();
    ctx.moveTo(pts[0][0] * 2, pts[0][1] * 2);
    for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0] * 2, pts[i][1] * 2);
    ctx.closePath();
    ctx.fillStyle = color;
    ctx.fill();
  }

  const LAND  = '#3a6b35';
  const LAND2 = '#4a7c45';
  const DRY   = '#b8a060';
  const ICE   = '#ddeeff';

  // North America
  blob([[60,85],[80,70],[130,68],[180,65],[210,72],[225,110],[215,145],[195,170],[175,185],[155,185],[140,195],[125,210],[110,240],[80,255],[60,250],[45,230],[38,205],[35,175],[38,145],[45,115]], LAND);
  // Central America
  blob([[155,185],[175,185],[175,200],[160,215],[150,220],[140,215],[140,195]], LAND2);
  // South America
  blob([[155,220],[175,210],[200,215],[225,240],[240,275],[248,310],[248,355],[235,395],[215,425],[190,440],[165,440],[140,425],[120,400],[112,365],[115,330],[118,285],[130,255],[140,235]], LAND);
  // Greenland
  blob([[255,30],[310,25],[345,38],[355,60],[345,85],[310,92],[265,85],[245,65],[248,45]], ICE);
  // Europe
  blob([[415,68],[500,60],[545,68],[565,80],[570,105],[555,125],[530,138],[505,148],[480,148],[455,138],[435,118],[420,100]], LAND2);
  // Scandinavia
  blob([[460,48],[490,38],[510,48],[520,72],[500,88],[470,88],[450,72]], LAND2);
  // Africa
  blob([[435,148],[530,138],[570,155],[585,190],[585,240],[575,295],[555,355],[525,405],[490,435],[455,450],[415,440],[385,415],[368,375],[365,325],[370,270],[380,220],[400,185],[420,162]], LAND);
  // Madagascar
  blob([[570,330],[585,320],[595,345],[590,380],[575,390],[562,370],[560,345]], LAND2);
  // Asia (west + central)
  blob([[545,68],[620,55],[720,48],[820,50],[890,60],[940,80],[960,105],[955,140],[930,165],[890,188],[840,205],[780,215],[730,220],[690,210],[650,195],[605,170],[575,145],[555,125],[545,100]], LAND);
  // Asia (east)
  blob([[820,50],[890,45],[945,58],[975,80],[980,120],[970,160],[950,190],[920,215],[880,235],[840,245],[800,248],[760,238],[730,220],[780,215],[840,205],[890,188],[930,165],[955,140],[960,105],[940,80],[890,60]], LAND2);
  // Japan
  blob([[940,105],[955,98],[968,112],[962,132],[948,138],[935,125]], LAND2);
  // South-East Asia
  blob([[780,215],[830,210],[860,232],[855,262],[830,278],[795,268],[770,250],[760,238]], LAND2);
  // India
  blob([[630,145],[680,138],[720,148],[738,172],[730,210],[710,240],[690,255],[665,250],[645,225],[630,195],[618,168]], LAND);
  // Sri Lanka
  blob([[695,258],[705,252],[712,262],[705,272],[694,268]], LAND2);
  // Australia
  blob([[748,292],[845,278],[910,295],[932,318],[930,365],[915,405],[885,428],[845,435],[800,432],[760,415],[735,382],[730,345],[738,312]], DRY);
  // New Zealand (N)
  blob([[940,378],[952,368],[962,382],[954,395],[940,395]], LAND2);
  // New Zealand (S)
  blob([[935,400],[950,396],[958,415],[948,435],[928,438],[918,422],[922,408]], LAND2);
  // Antarctica
  blob([[0,490],[2048,490],[2048,512],[0,512]], ICE);
  // Ice caps at top
  blob([[0,0],[2048,0],[2048,22],[0,22]], ICE);

  // Subtle grid lines (latitude/longitude)
  ctx.strokeStyle = 'rgba(255,255,255,0.04)';
  ctx.lineWidth   = 1;
  for (let i = 0; i <= 24; i++) {
    ctx.beginPath();
    ctx.moveTo((i / 24) * c.width, 0);
    ctx.lineTo((i / 24) * c.width, c.height);
    ctx.stroke();
  }
  for (let i = 0; i <= 12; i++) {
    ctx.beginPath();
    ctx.moveTo(0, (i / 12) * c.height);
    ctx.lineTo(c.width, (i / 12) * c.height);
    ctx.stroke();
  }

  return c;
}

/* Resize handler */
function onGlobeResize() {
  const container = document.getElementById('globe-container');
  if (!container || !globeRenderer) return;
  const W = container.clientWidth;
  const H = container.clientHeight;
  globeCamera.aspect = W / H;
  globeCamera.updateProjectionMatrix();
  globeRenderer.setSize(W, H);
}

/* Stop / resume (tab switching) */
function stopGlobe()   { if (globeAnimId) cancelAnimationFrame(globeAnimId); }
function resumeGlobe() { if (globeMesh)   animateGlobe(); }

/* ══════════════════════════════════════════════════════
   TIMEZONE CARDS (below the globe)
══════════════════════════════════════════════════════ */
function initZoneCards() {
  renderZoneCards(TIMEZONES);
  document.getElementById('zone-search-input').addEventListener('input', e => {
    const q = e.target.value.toLowerCase().trim();
    renderZoneCards(q ? TIMEZONES.filter(z =>
      z.name.toLowerCase().includes(q) || z.abbr.toLowerCase().includes(q) ||
      z.countries.toLowerCase().includes(q) || z.desc.toLowerCase().includes(q)
    ) : TIMEZONES);
  });
  zoneUpdateInterval = setInterval(updateZoneTimes, 1000);
}

function renderZoneCards(zones) {
  const grid = document.getElementById('zones-grid');
  grid.innerHTML = '';
  if (!zones.length) {
    grid.innerHTML = '<p style="color:var(--text2);grid-column:1/-1;text-align:center;padding:24px;">No timezones found.</p>';
    return;
  }
  zones.forEach(tz => {
    const card = document.createElement('div');
    card.className    = 'zone-card';
    card.dataset.iana = tz.iana;
    const offsetStr   = formatOffset(tz.offset);
    card.innerHTML = `
      <div class="zone-card-header">
        <div class="zone-name">${tz.name}</div>
        <div class="zone-offset">UTC${offsetStr}</div>
      </div>
      <div class="zone-time" data-offset="${tz.offset}">${getTimeInZone(tz.offset)}</div>
      <div class="zone-desc">${tz.desc}</div>
      <div class="zone-countries">📍 ${tz.countries}</div>
    `;
    grid.appendChild(card);
  });
}

function updateZoneTimes() {
  document.querySelectorAll('.zone-time[data-offset]').forEach(el => {
    el.textContent = getTimeInZone(parseFloat(el.dataset.offset));
  });
}

function getTimeInZone(offsetHours) {
  const now   = new Date();
  const utcMs = now.getTime() + now.getTimezoneOffset() * 60000;
  const d     = new Date(utcMs + offsetHours * 3600000);
  let h       = d.getHours();
  const m     = String(d.getMinutes()).padStart(2, '0');
  const s     = String(d.getSeconds()).padStart(2, '0');
  if (typeof clockFormat !== 'undefined' && clockFormat === 12) {
    const ampm = h >= 12 ? 'PM' : 'AM';
    h = h % 12 || 12;
    return `${String(h).padStart(2,'0')}:${m}:${s} ${ampm}`;
  }
  return `${String(d.getHours()).padStart(2,'0')}:${m}:${s}`;
}

function formatOffset(offset) {
  const sign  = offset >= 0 ? '+' : '-';
  const abs   = Math.abs(offset);
  const hours = Math.floor(abs);
  const mins  = Math.round((abs - hours) * 60);
  return `${sign}${hours}${mins ? ':' + String(mins).padStart(2,'0') : ''}`;
}
