/* ═══════════════════════════════════════════════════════
   calendar.js — Calendar 2001 to current date
   CHANGES:
   - Girl emoji 👧 system shows on Sundays and selected days
   - Blurred background card per month
   - Larger number font sizes
   - Time info panel (seconds/minutes/hours/days/weeks/months/years facts)
═══════════════════════════════════════════════════════ */

let calYear  = new Date().getFullYear();
let calMonth = new Date().getMonth();

const CAL_MONTHS    = ['January','February','March','April','May','June',
                       'July','August','September','October','November','December'];
const CAL_DAYS_FULL = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];

// Girl emoji set — different ones to add personality
const GIRL_EMOJIS = ['👧','👩','🧒','👩‍🦰','👩‍🦱','💁‍♀️','🙋‍♀️','🤷‍♀️'];

/* ── Initialise the calendar ─────────────────────────── */
function initCalendar() {
  buildCalendarSelects();
  renderCalendar();
  renderTimeInfoPanel();
}

/* ── Populate month and year dropdowns ───────────────── */
function buildCalendarSelects() {
  const monthSel = document.getElementById('cal-month-select');
  const yearSel  = document.getElementById('cal-year-select');
  const today    = new Date();

  CAL_MONTHS.forEach((m, i) => {
    const opt = document.createElement('option');
    opt.value = i;
    opt.textContent = m;
    monthSel.appendChild(opt);
  });
  monthSel.value = calMonth;

  for (let y = 2001; y <= today.getFullYear(); y++) {
    const opt = document.createElement('option');
    opt.value = y;
    opt.textContent = y;
    yearSel.appendChild(opt);
  }
  yearSel.value = calYear;
}

function calPrev() {
  calMonth--;
  if (calMonth < 0) { calMonth = 11; calYear--; }
  if (calYear < 2001) { calYear = 2001; calMonth = 0; }
  syncCalSelects();
  renderCalendar();
}

function calNext() {
  calMonth++;
  if (calMonth > 11) { calMonth = 0; calYear++; }
  const today = new Date();
  if (calYear > today.getFullYear() ||
     (calYear === today.getFullYear() && calMonth > today.getMonth())) {
    calYear  = today.getFullYear();
    calMonth = today.getMonth();
  }
  syncCalSelects();
  renderCalendar();
}

function calGoTo() {
  calMonth = parseInt(document.getElementById('cal-month-select').value);
  calYear  = parseInt(document.getElementById('cal-year-select').value);
  renderCalendar();
}

function calGoToday() {
  const today = new Date();
  calMonth = today.getMonth();
  calYear  = today.getFullYear();
  syncCalSelects();
  renderCalendar();
  highlightToday();
}

function syncCalSelects() {
  document.getElementById('cal-month-select').value = calMonth;
  document.getElementById('cal-year-select').value  = calYear;
}

/* ── Main calendar render ────────────────────────────── */
function renderCalendar() {
  const grid     = document.getElementById('cal-grid');
  const today    = new Date();
  grid.innerHTML = '';

  const firstDay  = new Date(calYear, calMonth, 1).getDay();
  const totalDays = new Date(calYear, calMonth + 1, 0).getDate();
  const prevDays  = new Date(calYear, calMonth, 0).getDate();

  // Pick a random girl emoji for this month (deterministic by month+year)
  const girlEmoji = GIRL_EMOJIS[(calYear * 12 + calMonth) % GIRL_EMOJIS.length];

  // Leading empty cells (previous month)
  for (let i = 0; i < firstDay; i++) {
    const cell = document.createElement('div');
    cell.className  = 'cal-cell other-month';
    cell.textContent = prevDays - firstDay + 1 + i;
    grid.appendChild(cell);
  }

  // This month's days
  for (let d = 1; d <= totalDays; d++) {
    const dayDate  = new Date(calYear, calMonth, d);
    const dow      = dayDate.getDay(); // 0=Sun
    const isToday  = (d === today.getDate() &&
                      calMonth === today.getMonth() &&
                      calYear  === today.getFullYear());
    const isSunday = dow === 0;

    const cell = document.createElement('div');
    cell.className = 'cal-cell';

    // Build cell content — number + optional girl emoji
    let inner = `<span class="cal-day-num">${d}</span>`;

    // Show girl emoji on Sundays or on today
    if (isSunday || isToday) {
      inner += `<span class="cal-girl" title="${isSunday ? 'Sunday!' : 'Today!'}">${girlEmoji}</span>`;
    }

    cell.innerHTML = inner;

    if (isToday)  { cell.classList.add('today');  cell.id = 'cal-today-cell'; }
    if (isSunday) cell.classList.add('sunday');

    cell.addEventListener('click', () => {
      document.querySelectorAll('.cal-cell.selected').forEach(el => el.classList.remove('selected'));
      if (!isToday) {
        cell.classList.add('selected');
        // Add girl to selected cell too
        if (!cell.querySelector('.cal-girl')) {
          const g = document.createElement('span');
          g.className = 'cal-girl selected-girl';
          g.textContent = girlEmoji;
          cell.appendChild(g);
        }
      }
      showCalInfo(calYear, calMonth, d, dow);
    });

    grid.appendChild(cell);
  }

  // Trailing empty cells (next month)
  const totalCells = firstDay + totalDays;
  const remaining  = totalCells % 7 === 0 ? 0 : 7 - (totalCells % 7);
  for (let i = 1; i <= remaining; i++) {
    const cell = document.createElement('div');
    cell.className   = 'cal-cell other-month';
    cell.textContent = i;
    grid.appendChild(cell);
  }

  syncCalSelects();

  // Update the month/year title on the blurred background
  updateCalBgLabel();
}

/* ── Update the blurred background month label ────────── */
function updateCalBgLabel() {
  const label = document.getElementById('cal-bg-label');
  if (label) {
    label.textContent = `${CAL_MONTHS[calMonth]} ${calYear}`;
  }
}

/* ── Show selected date info ──────────────────────────── */
function showCalInfo(year, month, day, dayOfWeek) {
  const text  = document.getElementById('cal-info-text');
  const date  = new Date(year, month, day);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diffMs   = date.getTime() - today.getTime();
  const diffDays = Math.round(diffMs / 86400000);

  let diffStr = '';
  if      (diffDays === 0)  diffStr = ' — That\'s today! 🎉';
  else if (diffDays === 1)  diffStr = ' — Tomorrow';
  else if (diffDays === -1) diffStr = ' — Yesterday';
  else if (diffDays > 0)    diffStr = ` — In ${diffDays} days`;
  else                       diffStr = ` — ${Math.abs(diffDays)} days ago`;

  text.textContent = `${CAL_DAYS_FULL[dayOfWeek]}, ${CAL_MONTHS[month]} ${day}, ${year}${diffStr}`;
}

function highlightToday() {
  setTimeout(() => {
    const cell = document.getElementById('cal-today-cell');
    if (cell) cell.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, 100);
}

/* ════════════════════════════════════════════════════════
   TIME INFO PANEL
   Facts about time units: seconds, minutes, hours, days, etc.
════════════════════════════════════════════════════════ */

function renderTimeInfoPanel() {
  const container = document.getElementById('time-info-panel');
  if (!container) return;

  const facts = [
    { icon: '⚡', label: 'Milliseconds in 1 Second',     value: '1,000',         sub: 'ms' },
    { icon: '⏱', label: 'Seconds in 1 Minute',           value: '60',            sub: 'sec' },
    { icon: '🕐', label: 'Minutes in 1 Hour',             value: '60',            sub: 'min' },
    { icon: '🌅', label: 'Hours in 1 Day',                value: '24',            sub: 'hrs' },
    { icon: '📅', label: 'Days in 1 Week',                value: '7',             sub: 'days' },
    { icon: '🗓',  label: 'Days in 1 Month (avg)',         value: '~30.44',        sub: 'days' },
    { icon: '📆', label: 'Weeks in 1 Month (avg)',         value: '~4.35',         sub: 'weeks' },
    { icon: '🌍', label: 'Days in 1 Year',                value: '365',           sub: 'days (366 in leap year)' },
    { icon: '📊', label: 'Weeks in 1 Year',               value: '52',            sub: 'weeks + 1 day' },
    { icon: '🗂',  label: 'Months in 1 Year',              value: '12',            sub: 'months' },
    { icon: '🔢', label: 'Seconds in 1 Hour',             value: '3,600',         sub: 'sec' },
    { icon: '🔢', label: 'Seconds in 1 Day',              value: '86,400',        sub: 'sec' },
    { icon: '🔢', label: 'Minutes in 1 Day',              value: '1,440',         sub: 'min' },
    { icon: '🔢', label: 'Minutes in 1 Year',             value: '525,600',       sub: 'min' },
    { icon: '🔢', label: 'Seconds in 1 Year',             value: '31,536,000',    sub: 'sec' },
    { icon: '🌐', label: 'Total World Time Zones',         value: '38',            sub: 'unique UTC offsets' },
  ];

  container.innerHTML = `
    <div class="time-info-title">
      <span>🕰️</span> <span>Time Facts & Conversions</span>
    </div>
    <div class="time-info-grid">
      ${facts.map(f => `
        <div class="time-info-card">
          <div class="ti-icon">${f.icon}</div>
          <div class="ti-value">${f.value}</div>
          <div class="ti-label">${f.label}</div>
          <div class="ti-sub">${f.sub}</div>
        </div>
      `).join('')}
    </div>
  `;
}
