# 🌍 World Clock

A feature-rich, interactive World Clock web application built with pure **HTML, CSS, and JavaScript** — no frameworks, no build tools. Just open `index.html` in your browser and it works.

> **Built by:** Namdev (Student)
> **Built with the help of:** [Claude AI](https://claude.ai) by Anthropic
> **Project completed in:** 5 conversation iterations with Claude

---

## ✨ Features

### 🕐 Clock
- **Digital clock** — Large, crisp display in `HH:MM:SS` format
- **Analog clock** — Canvas-drawn clock with smooth second hand
- **12-hour / 24-hour** format toggle
- **Tick-tock sound** every second (toggleable on/off)
- **Welcome greeting** — Changes based on time of day (Good Morning / Afternoon / Evening / Night)
- Live **date display** in `DD/MM/YYYY` format with day name

### 🌍 World Clock (3D Globe)
- **Interactive 3D Earth** — Loads a NASA Blue Marble texture for a realistic look
- **Drag to rotate** in any direction (mouse and touch supported) with smooth inertia
- **38 timezone pins** — Red markers placed at accurate lat/lng positions on the globe
- **Timezone abbreviation labels** (IST, GMT, JST, etc.) floating above each visible pin
- **Click any pin** → popup shows timezone name, live time, UTC offset, and country — globe pauses while popup is open
- **Rotation toggle** — "⏸ Pause / ▶ Rotate" button to stop and resume auto-spin
- Labels on the back side of the globe are automatically hidden
- **38 Timezone cards** below the globe — all showing live updating times
- **Search bar** to filter timezones by name, abbreviation, or country

### ⏱ Stopwatch
- Millisecond precision (`HH:MM:SS.mmm`)
- Start, Pause, Reset, and **Lap** recording
- **Animated running boy** — A stick figure runs on a road with scrolling trees while the stopwatch is running
- Bell sound plays when stopped after running

### ⏳ Timer
- Set hours, minutes, and seconds
- **Sand hourglass animation** — visually empties as time counts down
- **5 bell sounds** to choose from: Chime, Melody, Ding Dong, Alarm, Soft Bell
- **Bell repeats continuously** after time is up — stops only when you press Dismiss

### 📅 Calendar
- Full calendar from **January 2001** to the **current date**
- Month/year dropdowns for quick navigation
- **Girl emoji 👧** appears on Sundays and today's date
- **Blurred background** watermark showing the current month and year
- Large, readable date numbers
- Click any date to see how many days ago or ahead it is
- **Time Facts panel** — useful conversions like seconds in a minute, hours in a day, days in a year, and more

### 🌙 Themes
- **Light theme** — Clean white background
- **Dark theme** — Dark background with animated starfield and floating moon 🌙
- **Auto (System) theme** — Automatically switches to light during the day (6am–7pm) and dark at night

### 🐦 Sparrow Window
- A small window in the **top-left corner** of the app
- Every hour, a sparrow flies out of the window and chirps
- **Click the window anytime** to trigger the sparrow manually

---

## 📁 Project Structure

```
world-clock/
│
├── index.html      # Main HTML structure — all tabs and sections
├── style.css       # All styling — themes, animations, responsive layout
│
├── data.js         # All 38 world timezone data (name, offset, lat/lng, description)
├── clock.js        # Digital & analog clock logic + tick-tock sound
├── globe.js        # 3D Earth globe (Three.js) — pins, labels, popups, drag interaction
├── stopwatch.js    # Stopwatch logic + running boy canvas animation
├── timer.js        # Countdown timer + sand hourglass animation + 5 bell sounds
├── calendar.js     # Calendar (2001–present) + time facts panel
├── sparrow.js      # Hourly sparrow window animation + chirp sound
├── theme.js        # Dark / Light / Auto theme switcher + starfield
├── app.js          # Main entry point — initialises everything, handles tab switching
│
└── earth.glb       # NASA 3D Earth model (GLB format) — used by globe.js
```

---

## 🚀 How to Run

This is a **pure front-end project** — no installation, no server, no npm needed.

1. Download or clone this repository
2. Extract the files into a folder
3. Open `index.html` in any modern browser (Chrome, Firefox, Brave, Edge)

> **Note:** Because `earth.glb` is a local file (~13MB), some browsers may block it when opened via `file://`. If the globe shows a fallback texture instead of the NASA image, either:
> - Use **Brave** or **Firefox** (they allow local GLB loading), or
> - Run a simple local server: `python -m http.server 8000` then open `http://localhost:8000`

---

## 🛠️ Technologies Used

| Technology | Purpose |
|---|---|
| HTML5 | App structure and layout |
| CSS3 | Styling, animations, themes, responsive design |
| JavaScript (Vanilla) | All logic — clock, globe, stopwatch, timer, calendar |
| [Three.js r128](https://threejs.org/) | 3D Earth globe rendering (WebGL) |
| [Lucide Icons](https://lucide.dev/) | Clean icon set used throughout the UI |
| [Google Fonts](https://fonts.google.com/) | Outfit (UI font) + Space Mono (clock digits) |
| Web Audio API | Tick-tock sound, bell sounds, sparrow chirp — no audio files needed |
| Canvas API | Analog clock, stopwatch runner animation, sand hourglass |
| NASA Blue Marble | Earth texture image for the 3D globe |

---

## 🌐 All 38 Time Zones Covered

| # | Zone | UTC Offset |
|---|---|---|
| 1 | Baker Island Time (BIT) | UTC−12 |
| 2 | Samoa Standard Time (SST) | UTC−11 |
| 3 | Hawaii-Aleutian Time (HST) | UTC−10 |
| 4 | Alaska Time (AKST) | UTC−9 |
| 5 | Pacific Time (PST) | UTC−8 |
| 6 | Mountain Time (MST) | UTC−7 |
| 7 | Central Time (CST) | UTC−6 |
| 8 | Eastern Time (EST) | UTC−5 |
| 9 | Venezuela Time (VET) | UTC−4:30 |
| 10 | Atlantic Time (AST) | UTC−4 |
| 11 | Brasília Time (BRT) | UTC−3 |
| 12 | Fernando de Noronha Time (FNT) | UTC−2 |
| 13 | Azores Time (AZOT) | UTC−1 |
| 14 | Greenwich Mean Time (GMT) | UTC±0 |
| 15 | Central European Time (CET) | UTC+1 |
| 16 | Eastern European Time (EET) | UTC+2 |
| 17 | Moscow Time (MSK) | UTC+3 |
| 18 | Iran Standard Time (IRST) | UTC+3:30 |
| 19 | Gulf Standard Time (GST) | UTC+4 |
| 20 | Afghanistan Time (AFT) | UTC+4:30 |
| 21 | Pakistan Standard Time (PKT) | UTC+5 |
| 22 | India Standard Time (IST) | UTC+5:30 |
| 23 | Nepal Time (NPT) | UTC+5:45 |
| 24 | Bangladesh Time (BST) | UTC+6 |
| 25 | Myanmar Time (MMT) | UTC+6:30 |
| 26 | Indochina Time (ICT) | UTC+7 |
| 27 | China Standard Time (CST) | UTC+8 |
| 28 | Australian Central Western Time (ACWST) | UTC+8:45 |
| 29 | Japan Standard Time (JST) | UTC+9 |
| 30 | Australian Central Time (ACST) | UTC+9:30 |
| 31 | Australian Eastern Time (AEST) | UTC+10 |
| 32 | Lord Howe Island Time (LHST) | UTC+10:30 |
| 33 | Solomon Islands Time (SBT) | UTC+11 |
| 34 | Norfolk Island Time (NFT) | UTC+11:30 |
| 35 | New Zealand Standard Time (NZST) | UTC+12 |
| 36 | Chatham Islands Time (CHAST) | UTC+12:45 |
| 37 | Tonga Time (TOT) | UTC+13 |
| 38 | Line Islands Time (LINT) | UTC+14 |

---

## 🔄 Development Journey

This project was built **entirely through conversation** — no manual coding was done by the developer. Here is how each iteration shaped the final product:

| Iteration | What Was Built |
|---|---|
| **1** | Core structure — digital/analog clock, 38 timezone cards, 3D globe, stopwatch with running boy, countdown timer with sand animation, calendar (2001–present), sparrow window, dark/light/auto themes |
| **2** | Repeating timer bell until dismissed, girl emoji calendar system, blurred calendar background, larger date numbers, digital/analog clock toggle fixed, tick-tock sound, globe renamed to "World Clock", slower globe rotation, drag-to-rotate globe, pin popup with pause/resume |
| **3** | Globe pauses when popup opens, resumes when closed — implemented cleanly |
| **4** | NASA GLB Earth model integrated (with CDN fallback), timezone abbreviation labels on every front-facing pin |
| **5** | 2D screen-space pin hit detection (22px radius — much easier to click), Rotation ON/OFF toggle button on the globe |

---

## 👨‍💻 About the Developer

**Namdev** is a student from, Maharashtra, India**. This World Clock project was built as a personal learning exercise — combining curiosity about web development, geopolitics, and design into one polished application.

---

## 🤖 Built With Claude AI

This entire project — every line of HTML, CSS, and JavaScript — was generated through **5 conversation iterations** with **[Claude](https://claude.ai)** (Claude Sonnet, by [Anthropic](https://anthropic.com)).

The development process worked like this:
- **Namdev** described features in plain English, handled all design decisions, logic thinking, and testing
- **Claude** wrote all the code, explained every block with comments, and iterated on feedback


---

## 📄 License

This project is open source and free to use for learning and personal projects.

---

## 🙏 Acknowledgements

- [Three.js](https://threejs.org/) — Amazing WebGL library that powers the 3D globe
- [NASA](https://visibleearth.nasa.gov/) — Blue Marble Earth imagery
- [Lucide Icons](https://lucide.dev/) — Beautiful open-source icon set
- [Anthropic / Claude](https://claude.ai) — AI assistant that wrote all the code

---

*2026*
