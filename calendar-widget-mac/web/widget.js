// =========================================================================
// 1. WEB AUDIO SYNTHESIZER (Zero External Assets, Zero Lag)
// =========================================================================
const AudioEngine = {
  ctx: null,

  init() {
    if (!this.ctx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (AudioContext) {
        this.ctx = new AudioContext();
      }
    }
    if (this.ctx && this.ctx.state === "suspended") {
      this.ctx.resume();
    }
  },

  // Soft Zen Bell Chime (Dual harmonic sine waves with exponential decay)
  playZenBell() {
    this.init();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    
    // Fundamental (D5: 587.33Hz) and Overtone (A5: 880Hz)
    const freqs = [587.33, 880.0];
    freqs.forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, now);

      const peakGain = idx === 0 ? 0.22 : 0.14;
      gain.gain.setValueAtTime(0.001, now);
      gain.gain.exponentialRampToValueAtTime(peakGain, now + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + (idx === 0 ? 1.4 : 1.0));

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 1.5);
    });
  },

  // Classic Digital Wristwatch Double Beep
  playWatchBeep() {
    this.init();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const beep = (startTime) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = "square";
      osc.frequency.setValueAtTime(2048, startTime);

      gain.gain.setValueAtTime(0.08, startTime);
      gain.gain.setValueAtTime(0.001, startTime + 0.06);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(startTime);
      osc.stop(startTime + 0.07);
    };

    beep(now);
    beep(now + 0.09);
  },

  // Celebratory 3-Tone Arpeggio for Pomodoro Finish
  playCompletionChime() {
    this.init();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
    notes.forEach((freq, i) => {
      const startTime = now + i * 0.12;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, startTime);

      gain.gain.setValueAtTime(0.001, startTime);
      gain.gain.exponentialRampToValueAtTime(0.18, startTime + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, startTime + 0.7);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(startTime);
      osc.stop(startTime + 0.75);
    });
  }
};

// Resume AudioContext on any user interaction
document.addEventListener("pointerdown", () => AudioEngine.init(), { once: true });


// =========================================================================
// 2. HOURLY CHIME BACKGROUND WATCHER
// =========================================================================
const HourlyChime = {
  enabled: localStorage.getItem("qa_chime_enabled") !== "false", // Default true
  soundStyle: localStorage.getItem("qa_chime_style") || "bell", // "bell" or "beep"
  lastChimedHour: -1,

  toggle() {
    this.enabled = !this.enabled;
    localStorage.setItem("qa_chime_enabled", this.enabled);
    this.updateUI();
    if (this.enabled) {
      this.playChime();
    }
  },

  playChime() {
    if (this.soundStyle === "beep") {
      AudioEngine.playWatchBeep();
    } else {
      AudioEngine.playZenBell();
    }
    const clock = document.getElementById("clockFace");
    if (clock) {
      clock.classList.remove("chime-pulse");
      void clock.offsetWidth; // Trigger reflow
      clock.classList.add("chime-pulse");
    }
  },

  check(d) {
    if (!this.enabled) return;
    const h = d.getHours();
    const m = d.getMinutes();
    const s = d.getSeconds();

    if (m === 0 && s === 0 && this.lastChimedHour !== h) {
      this.lastChimedHour = h;
      this.playChime();
    }
  },

  updateUI() {
    const btn = document.getElementById("chimeToggleBtn");
    if (btn) {
      btn.classList.toggle("active", this.enabled);
      btn.title = this.enabled ? "Hourly Chime: ON (Click to mute)" : "Hourly Chime: OFF (Click to unmute)";
      btn.textContent = this.enabled ? "🔔" : "🔕";
    }
  }
};


// =========================================================================
// 3. POMODORO & FOCUS TIMER
// =========================================================================
const Pomodoro = {
  totalSeconds: 25 * 60,
  remainingSeconds: 25 * 60,
  isRunning: false,
  timerInterval: null,
  currentType: "Focus",
  circumference: 276.46, // 2 * PI * 44

  init() {
    this.updateDisplay();
    this.setupEvents();
  },

  setupEvents() {
    document.querySelectorAll(".pomo-pill").forEach(pill => {
      pill.addEventListener("click", () => {
        const mins = parseInt(pill.dataset.mins, 10);
        const type = pill.dataset.type;
        document.querySelectorAll(".pomo-pill").forEach(p => p.classList.remove("active"));
        pill.classList.add("active");
        this.setPreset(mins, type);
      });
    });

    const toggleBtn = document.getElementById("pomoToggleBtn");
    const resetBtn = document.getElementById("pomoResetBtn");

    if (toggleBtn) toggleBtn.addEventListener("click", () => this.toggle());
    if (resetBtn) resetBtn.addEventListener("click", () => this.reset());
  },

  setPreset(mins, type) {
    this.pause();
    this.totalSeconds = mins * 60;
    this.remainingSeconds = this.totalSeconds;
    this.currentType = type;
    this.updateDisplay();
  },

  toggle() {
    if (this.isRunning) {
      this.pause();
    } else {
      this.start();
    }
  },

  start() {
    AudioEngine.init();
    this.isRunning = true;
    document.getElementById("widgetContainer")?.classList.add("is-running");
    this.updateButtons();
    
    if (this.timerInterval) clearInterval(this.timerInterval);
    this.timerInterval = setInterval(() => this.tick(), 1000);
  },

  pause() {
    this.isRunning = false;
    document.getElementById("widgetContainer")?.classList.remove("is-running");
    if (this.timerInterval) clearInterval(this.timerInterval);
    this.updateButtons();
  },

  reset() {
    this.pause();
    this.remainingSeconds = this.totalSeconds;
    document.getElementById("widgetContainer")?.classList.remove("is-running");
    this.updateDisplay();
  },

  tick() {
    if (this.remainingSeconds > 0) {
      this.remainingSeconds--;
      this.updateDisplay();
    } else {
      this.onComplete();
    }
  },

  onComplete() {
    this.pause();
    AudioEngine.playCompletionChime();
    
    const clock = document.getElementById("clockFace");
    if (clock) {
      clock.classList.remove("chime-pulse");
      void clock.offsetWidth;
      clock.classList.add("chime-pulse");
    }

    // Auto toggle to break or focus if desired
    if (this.currentType === "Focus") {
      this.setPreset(5, "Short Break");
      const breakPill = document.getElementById("pomoPreset5");
      if (breakPill) {
        document.querySelectorAll(".pomo-pill").forEach(p => p.classList.remove("active"));
        breakPill.classList.add("active");
      }
    }
  },

  updateDisplay() {
    const mins = Math.floor(this.remainingSeconds / 60);
    const secs = this.remainingSeconds % 60;
    const formatted = `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;

    const digitsEl = document.getElementById("pomoDigits");
    const labelEl = document.getElementById("pomoLabel");
    const ringFill = document.getElementById("pomoRingFill");

    if (digitsEl) digitsEl.textContent = formatted;
    if (labelEl) labelEl.textContent = this.currentType.toUpperCase();

    if (ringFill) {
      const progress = this.remainingSeconds / this.totalSeconds;
      const offset = this.circumference * (1 - progress);
      ringFill.style.strokeDashoffset = offset;
      ringFill.classList.toggle("break", this.currentType.includes("Break"));
    }
  },

  updateButtons() {
    const toggleBtn = document.getElementById("pomoToggleBtn");
    if (toggleBtn) {
      toggleBtn.textContent = this.isRunning ? "⏸" : "▶";
      toggleBtn.classList.toggle("running", this.isRunning);
    }
  }
};


// =========================================================================
// 4. STOPWATCH & LAP TIMER
// =========================================================================
const Stopwatch = {
  startTime: 0,
  elapsedTime: 0,
  isRunning: false,
  animationId: null,
  laps: [],
  lastLapTime: 0,

  init() {
    this.updateDisplay(0);
    this.setupEvents();
  },

  setupEvents() {
    const toggleBtn = document.getElementById("swToggleBtn");
    const lapBtn = document.getElementById("swLapBtn");
    const resetBtn = document.getElementById("swResetBtn");

    if (toggleBtn) toggleBtn.addEventListener("click", () => this.toggle());
    if (lapBtn) lapBtn.addEventListener("click", () => this.recordLap());
    if (resetBtn) resetBtn.addEventListener("click", () => this.reset());
  },

  toggle() {
    if (this.isRunning) {
      this.pause();
    } else {
      this.start();
    }
  },

  start() {
    AudioEngine.init();
    this.isRunning = true;
    document.getElementById("widgetContainer")?.classList.add("is-running");
    this.startTime = performance.now() - this.elapsedTime;
    this.updateButtons();

    const loop = () => {
      if (!this.isRunning) return;
      this.elapsedTime = performance.now() - this.startTime;
      this.updateDisplay(this.elapsedTime);
      this.animationId = requestAnimationFrame(loop);
    };
    this.animationId = requestAnimationFrame(loop);
  },

  pause() {
    this.isRunning = false;
    document.getElementById("widgetContainer")?.classList.remove("is-running");
    if (this.animationId) cancelAnimationFrame(this.animationId);
    this.updateButtons();
  },

  reset() {
    this.pause();
    this.elapsedTime = 0;
    this.lastLapTime = 0;
    this.laps = [];
    document.getElementById("widgetContainer")?.classList.remove("is-running");
    this.updateDisplay(0);
    this.renderLaps();
    this.updateButtons();
  },

  recordLap() {
    if (!this.isRunning) return;
    const current = this.elapsedTime;
    const split = current - this.lastLapTime;
    this.lastLapTime = current;

    this.laps.unshift({
      num: this.laps.length + 1,
      split: split,
      total: current
    });

    this.renderLaps();
  },

  formatTime(ms) {
    const totalSecs = Math.floor(ms / 1000);
    const m = Math.floor(totalSecs / 60);
    const s = totalSecs % 60;
    const centis = Math.floor((ms % 1000) / 10);
    return {
      main: `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`,
      ms: `.${String(centis).padStart(2, "0")}`
    };
  },

  updateDisplay(ms) {
    const time = this.formatTime(ms);
    const mainEl = document.getElementById("swMain");
    const msEl = document.getElementById("swMs");
    if (mainEl) mainEl.textContent = time.main;
    if (msEl) msEl.textContent = time.ms;
  },

  renderLaps() {
    const container = document.getElementById("lapContainer");
    const list = document.getElementById("lapList");
    if (!container || !list) return;

    if (this.laps.length === 0) {
      container.classList.add("hidden");
      list.innerHTML = "";
      return;
    }

    container.classList.remove("hidden");

    let minSplit = Math.min(...this.laps.map(l => l.split));

    list.innerHTML = this.laps.map(lap => {
      const splitTime = this.formatTime(lap.split);
      const totalTime = this.formatTime(lap.total);
      const isFastest = this.laps.length > 1 && lap.split === minSplit;

      return `
        <div class="lap-row ${isFastest ? 'fastest' : ''}">
          <span>#${lap.num}</span>
          <span>+${splitTime.main}${splitTime.ms}</span>
          <span>${totalTime.main}${totalTime.ms}</span>
        </div>
      `;
    }).join("");
  },

  updateButtons() {
    const toggleBtn = document.getElementById("swToggleBtn");
    const lapBtn = document.getElementById("swLapBtn");

    if (toggleBtn) {
      toggleBtn.textContent = this.isRunning ? "⏸" : "▶";
      toggleBtn.classList.toggle("running", this.isRunning);
    }
    if (lapBtn) {
      lapBtn.disabled = !this.isRunning;
    }
  }
};


// =========================================================================
// 5. MODE SWITCHER MANAGER
// =========================================================================
let currentMode = localStorage.getItem("qa_active_mode") || "clock";

function setMode(mode) {
  currentMode = mode;
  localStorage.setItem("qa_active_mode", mode);

  const container = document.getElementById("widgetContainer");
  const popover = document.getElementById("calendarPopover");
  const dateBtn = document.getElementById("clockDate");

  if (popover && popover.classList.contains("open")) {
    popover.classList.remove("open");
    if (dateBtn) dateBtn.classList.remove("active");
    if (container) container.classList.remove("calendar-open");
    try {
      if (window.webkit?.messageHandlers?.popoverState) {
        window.webkit.messageHandlers.popoverState.postMessage({ open: false });
      }
    } catch (err) {}
  }

  if (container) {
    container.dataset.mode = mode;
  }

  // Switch dial views
  const clockSvg = document.getElementById("clockSvg");
  const pomoRingSvg = document.getElementById("pomoRingSvg");
  const pomoDisplay = document.getElementById("pomoDisplay");
  const swDisplay = document.getElementById("swDisplay");

  const clockView = document.getElementById("clockModeView");
  const pomoView = document.getElementById("pomoModeView");
  const swView = document.getElementById("swModeView");

  if (clockSvg) clockSvg.classList.toggle("hidden", mode !== "clock");
  if (pomoRingSvg) pomoRingSvg.classList.toggle("hidden", mode !== "pomodoro");
  if (pomoDisplay) pomoDisplay.classList.toggle("hidden", mode !== "pomodoro");
  if (swDisplay) swDisplay.classList.toggle("hidden", mode !== "stopwatch");

  if (clockView) clockView.classList.toggle("hidden", mode !== "clock");
  if (pomoView) pomoView.classList.toggle("hidden", mode !== "pomodoro");
  if (swView) swView.classList.toggle("hidden", mode !== "stopwatch");
}

function setupModeEvents() {
  document.querySelectorAll(".mode-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      setMode(btn.dataset.mode);
    });
  });

  const chimeBtn = document.getElementById("chimeToggleBtn");
  if (chimeBtn) {
    chimeBtn.addEventListener("click", () => HourlyChime.toggle());
  }

  // Double click clock face to cycle modes
  const clockFace = document.getElementById("clockFace");
  if (clockFace) {
    clockFace.addEventListener("dblclick", (e) => {
      e.stopPropagation();
      const modes = ["clock", "pomodoro", "stopwatch"];
      const nextIdx = (modes.indexOf(currentMode) + 1) % modes.length;
      setMode(modes[nextIdx]);
    });
  }

  // Keyboard shortcuts 1, 2, 3
  window.addEventListener("keydown", (e) => {
    if (e.key === "1") setMode("clock");
    if (e.key === "2") setMode("pomodoro");
    if (e.key === "3") setMode("stopwatch");
  });
}


// =========================================================================
// 6. CALENDAR & ANALOG CLOCK ENGINE WITH DAY COUNTDOWNS
// =========================================================================
const DEFAULT_TARGET_DATE = "2026-12-31"; // 31 December 2026
let calViewDate = new Date();
let calSelectedDate = null;
let pinnedTargetDate = localStorage.getItem("qa_pinned_target_date") || DEFAULT_TARGET_DATE;

function formatShortDate(d) {
  return d.toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
}

function updateClockTargetBadge() {
  const badge = document.getElementById("clockTargetBadge");
  if (!badge) return;

  const targetDateStr = pinnedTargetDate || DEFAULT_TARGET_DATE;
  badge.classList.remove("hidden");

  const [py, pm, pd] = targetDateStr.split("-").map(Number);
  const targetZero = new Date(py, pm - 1, pd).getTime();
  const today = new Date();
  const todayZero = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
  
  // Year/Target Days Left
  const diffDaysYear = Math.round((targetZero - todayZero) / (1000 * 60 * 60 * 24));

  if (diffDaysYear === 0) {
    badge.textContent = "0d";
  } else if (diffDaysYear > 0) {
    badge.textContent = `${diffDaysYear}d`;
  } else {
    badge.textContent = "0d";
  }

  const targetObj = new Date(py, pm - 1, pd);
  const targetFormatted = targetObj.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
  badge.title = `${diffDaysYear} days left until ${targetFormatted}`;
}

function updateCountdownBar() {
  updateClockTargetBadge();
  const monthPill = document.getElementById("monthPill");
  const monthPillText = document.getElementById("monthPillText");
  const yearPill = document.getElementById("yearPill");
  const yearPillText = document.getElementById("yearPillText");
  const pinBtn = document.getElementById("countdownPinBtn");

  if (!monthPillText || !yearPillText) return;

  const today = new Date();
  const todayZero = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
  const lastDayOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
  const diffDaysMonth = lastDayOfMonth - today.getDate();
  const monthFullName = today.toLocaleDateString(undefined, { month: 'long' });

  // Default Pill 1: Month Countdown (First)
  monthPillText.textContent = `${diffDaysMonth} days left in ${monthFullName}`;
  monthPill.title = `${diffDaysMonth} days left in ${monthFullName}`;
  monthPill.classList.remove("selected-pill");

  // Default Pill 2: 31 Dec Target Countdown (Second)
  const effectiveTarget = pinnedTargetDate || DEFAULT_TARGET_DATE;
  const [py, pm, pd] = effectiveTarget.split("-").map(Number);
  const targetZero = new Date(py, pm - 1, pd).getTime();
  const diffDaysYear = Math.round((targetZero - todayZero) / (1000 * 60 * 60 * 24));
  const targetObj = new Date(py, pm - 1, pd);
  const targetShort = `${targetObj.getDate()} ${targetObj.toLocaleDateString(undefined, { month: 'short' })}`;

  yearPillText.textContent = `${diffDaysYear} days to ${targetShort} ${py}`;
  yearPill.title = `${diffDaysYear} days left until ${targetShort} ${py}`;
  yearPill.classList.remove("selected-pill");

  if (pinBtn) {
    const isCustomPinned = pinnedTargetDate && pinnedTargetDate !== DEFAULT_TARGET_DATE;
    pinBtn.classList.toggle("hidden", !isCustomPinned);
  }

  // If a specific calendar cell is clicked
  if (calSelectedDate) {
    const selectedZero = new Date(calSelectedDate.getFullYear(), calSelectedDate.getMonth(), calSelectedDate.getDate()).getTime();
    const diffDays = Math.round((selectedZero - todayZero) / (1000 * 60 * 60 * 24));
    const selectedStr = `${calSelectedDate.getFullYear()}-${String(calSelectedDate.getMonth() + 1).padStart(2, '0')}-${String(calSelectedDate.getDate()).padStart(2, '0')}`;

    if (diffDays === 0) {
      monthPillText.textContent = `Today • ${diffDaysMonth} days left in ${monthFullName}`;
      monthPill.classList.add("selected-pill");
    } else if (diffDays > 0) {
      monthPillText.textContent = `${formatShortDate(calSelectedDate)} (in ${diffDays} days)`;
      monthPill.classList.add("selected-pill");
    } else {
      const absDays = Math.abs(diffDays);
      monthPillText.textContent = `${formatShortDate(calSelectedDate)} (${absDays} days ago)`;
      monthPill.classList.add("selected-pill");
    }

    if (pinBtn && diffDays > 0) {
      pinBtn.classList.remove("hidden");
      pinBtn.textContent = pinnedTargetDate === selectedStr ? "✕" : "📌";
      pinBtn.title = pinnedTargetDate === selectedStr ? "Reset to 31 Dec" : "Pin as target";
    }
  }
}

function renderCalendar() {
  const year = calViewDate.getFullYear();
  const month = calViewDate.getMonth();
  
  const fullMonthNames = [
    "JANUARY", "FEBRUARY", "MARCH", "APRIL", "MAY", "JUNE",
    "JULY", "AUGUST", "SEPTEMBER", "OCTOBER", "NOVEMBER", "DECEMBER"
  ];
  
  const titleEl = document.getElementById("calMonthTitle");
  if (titleEl) {
    titleEl.textContent = `${fullMonthNames[month]} ${year}`;
  }

  const todayEl = document.getElementById("calTodayDate");
  if (todayEl) {
    const today = new Date();
    todayEl.textContent = `${today.getDate()} ${today.toLocaleDateString(undefined, { month: 'short' })}`;
  }

  const gridEl = document.getElementById("calGrid");
  if (!gridEl) return;

  const firstDayIndex = (new Date(year, month, 1).getDay() + 6) % 7;
  const lastDayCurrentMonth = new Date(year, month + 1, 0).getDate();

  const today = new Date();
  const todayZero = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();

  const dayLabels = ["M", "T", "W", "T", "F", "S", "S"];
  let html = dayLabels.map(d => `<div class="cal-day-label">${d}</div>`).join("");

  for (let i = 0; i < firstDayIndex; i++) {
    html += `<div class="cal-cell empty"></div>`;
  }

  for (let d = 1; d <= lastDayCurrentMonth; d++) {
    const cellDateObj = new Date(year, month, d);
    const cellDate = cellDateObj.getTime();
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    
    const isToday = cellDate === todayZero;
    const isPast = cellDate < todayZero;
    const isSelected = calSelectedDate && cellDate === new Date(calSelectedDate.getFullYear(), calSelectedDate.getMonth(), calSelectedDate.getDate()).getTime();
    const isPinned = pinnedTargetDate === dateStr;

    let classes = "cal-cell";
    if (isToday) classes += " today";
    else if (isPast) classes += " past";
    else classes += " future";

    if (isSelected) classes += " selected";
    if (isPinned) classes += " pinned-target";

    html += `<div class="${classes}" data-day="${d}" data-datestr="${dateStr}" title="Click to view countdown">${d}</div>`;
  }

  gridEl.innerHTML = html;

  // Setup click listener for individual day cells
  gridEl.querySelectorAll(".cal-cell:not(.empty)").forEach(cell => {
    cell.addEventListener("click", (e) => {
      e.stopPropagation();
      const day = parseInt(cell.dataset.day, 10);
      const clickedDate = new Date(year, month, day);

      if (calSelectedDate && calSelectedDate.getTime() === clickedDate.getTime()) {
        calSelectedDate = null; // Toggle off if clicked again
      } else {
        calSelectedDate = clickedDate;
      }
      renderCalendar();
      updateCountdownBar();
    });
  });

  updateCountdownBar();
}

function tickClock() {
  const d = new Date();
  const s = d.getSeconds();
  const m = d.getMinutes() + s / 60;
  const h = (d.getHours() % 12) + m / 60;

  const secEl = document.getElementById("clkSec");
  const minEl = document.getElementById("clkMin");
  const hourEl = document.getElementById("clkHour");
  const dateBtn = document.getElementById("clockDate");

  if (secEl) secEl.setAttribute("transform", `rotate(${s * 6} 50 50)`);
  if (minEl) minEl.setAttribute("transform", `rotate(${m * 6} 50 50)`);
  if (hourEl) hourEl.setAttribute("transform", `rotate(${h * 30} 50 50)`);

  if (dateBtn) {
    const weekday = d.toLocaleDateString(undefined, { weekday: 'short' });
    const day = d.getDate();
    const month = d.toLocaleDateString(undefined, { month: 'short' });
    dateBtn.innerHTML =
      `<span class="clock-prefix">${weekday}</span>` +
      `<span class="clock-day">${day}</span>` +
      `<span class="clock-suffix">${month}</span>`;
  }

  // Check hourly chime trigger
  HourlyChime.check(d);

  setTimeout(tickClock, 1000);
}

function setupCalendarEvents() {
  const dateBtn = document.getElementById("clockDate");
  const popover = document.getElementById("calendarPopover");
  const prevBtn = document.getElementById("calPrevBtn");
  const nextBtn = document.getElementById("calNextBtn");
  const closeBtn = document.getElementById("calCloseBtn");
  const todayBtn = document.getElementById("calTodayBtn");
  const container = document.getElementById("widgetContainer");

  if (!dateBtn || !popover) return;

  function closeCal() {
    popover.classList.remove("open");
    dateBtn.classList.remove("active");
    if (container) container.classList.remove("calendar-open");
    try {
      if (window.webkit?.messageHandlers?.popoverState) {
        window.webkit.messageHandlers.popoverState.postMessage({ open: false });
      }
    } catch (err) {}
  }

  dateBtn.addEventListener("click", (e) => {
    if (window._justDragged) return;
    e.preventDefault();
    e.stopPropagation();
    const isOpen = popover.classList.toggle("open");
    dateBtn.classList.toggle("active", isOpen);
    if (container) container.classList.toggle("calendar-open", isOpen);
    try {
      if (window.webkit?.messageHandlers?.popoverState) {
        window.webkit.messageHandlers.popoverState.postMessage({ open: isOpen });
      }
    } catch (err) {}
    if (isOpen) {
      calViewDate = new Date();
      renderCalendar();
    }
  });

  if (closeBtn) {
    closeBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      closeCal();
    });
  }

  popover.addEventListener("click", (e) => {
    e.stopPropagation();
  });

  if (prevBtn) {
    prevBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      calViewDate.setMonth(calViewDate.getMonth() - 1);
      renderCalendar();
    });
  }

  if (nextBtn) {
    nextBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      calViewDate.setMonth(calViewDate.getMonth() + 1);
      renderCalendar();
    });
  }

  if (todayBtn) {
    todayBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      calViewDate = new Date();
      calSelectedDate = null;
      renderCalendar();
    });
  }

  const pinBtn = document.getElementById("countdownPinBtn");
  if (pinBtn) {
    pinBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      if (calSelectedDate) {
        const selectedStr = `${calSelectedDate.getFullYear()}-${String(calSelectedDate.getMonth() + 1).padStart(2, '0')}-${String(calSelectedDate.getDate()).padStart(2, '0')}`;
        if (pinnedTargetDate === selectedStr) {
          pinnedTargetDate = DEFAULT_TARGET_DATE;
          localStorage.setItem("qa_pinned_target_date", DEFAULT_TARGET_DATE);
        } else {
          pinnedTargetDate = selectedStr;
          localStorage.setItem("qa_pinned_target_date", selectedStr);
        }
      } else {
        pinnedTargetDate = DEFAULT_TARGET_DATE;
        localStorage.setItem("qa_pinned_target_date", DEFAULT_TARGET_DATE);
      }
      calSelectedDate = null;
      renderCalendar();
      updateCountdownBar();
    });
  }

  document.addEventListener("click", (e) => {
    if (!popover.contains(e.target) && !dateBtn.contains(e.target)) {
      if (popover.classList.contains("open")) {
        closeCal();
      }
    }
  });
}


// =========================================================================
// 7. DRAGGING & GLOBAL IPC BRIDGES
// =========================================================================
let isDragging = false;
let startX = 0, startY = 0;
let hasMoved = false;

function setupDragging() {
  const clockWrap = document.getElementById("clockWrap");
  const clockFace = document.getElementById("clockFace");
  const dragTarget = clockFace || clockWrap;

  if (!dragTarget) return;

  dragTarget.addEventListener("pointerdown", (e) => {
    if (e.target.closest("#clockDate") || e.target.closest("#calendarPopover") || e.target.closest(".action-btn") || e.target.closest(".pomo-pill") || e.target.closest(".mode-btn")) return;
    if (e.button !== 0) return;

    isDragging = true;
    hasMoved = false;
    startX = e.screenX;
    startY = e.screenY;

    try {
      if (window.webkit?.messageHandlers?.dragStart) {
        window.webkit.messageHandlers.dragStart.postMessage({ screenX: e.screenX, screenY: e.screenY });
      }
    } catch (err) {}
  });

  window.addEventListener("pointermove", (e) => {
    if (!isDragging) return;

    const dx = e.screenX - startX;
    const dy = e.screenY - startY;

    if (!hasMoved && Math.hypot(dx, dy) > 3) {
      hasMoved = true;
      clockWrap.classList.add("dragging");
    }

    if (hasMoved) {
      try {
        if (window.webkit?.messageHandlers?.dragMove) {
          window.webkit.messageHandlers.dragMove.postMessage({ dx: dx, dy: dy, screenX: e.screenX, screenY: e.screenY });
        }
      } catch (err) {}
      startX = e.screenX;
      startY = e.screenY;
    }
  });

  function endDrag() {
    if (!isDragging) return;
    isDragging = false;
    clockWrap.classList.remove("dragging");

    if (hasMoved) {
      window._justDragged = true;
      setTimeout(() => { window._justDragged = false; }, 150);
      try {
        if (window.webkit?.messageHandlers?.dragEnd) {
          window.webkit.messageHandlers.dragEnd.postMessage({});
        }
      } catch (err) {}
    }
  }

  window.addEventListener("pointerup", endDrag);
  window.addEventListener("pointercancel", endDrag);

  // Click directly on dial to toggle Play / Pause in Pomodoro or Stopwatch
  dragTarget.addEventListener("click", (e) => {
    if (window._justDragged) return;
    if (e.target.closest("#clockDate") || e.target.closest("#calendarPopover") || e.target.closest(".action-btn") || e.target.closest(".pomo-pill") || e.target.closest(".mode-btn")) return;

    if (currentMode === "pomodoro") {
      Pomodoro.toggle();
    } else if (currentMode === "stopwatch") {
      Stopwatch.toggle();
    }
  });
}

// Global hooks for macOS Menu Bar calls
window.setTheme = function(theme) {
  if (theme === "auto") {
    document.documentElement.removeAttribute("data-theme");
  } else {
    document.documentElement.setAttribute("data-theme", theme);
  }
};

window.setAppMode = function(mode) {
  setMode(mode);
};

window.toggleHourlyChime = function() {
  HourlyChime.toggle();
};

window.startPomodoro = function(mins = 25) {
  setMode("pomodoro");
  Pomodoro.setPreset(mins, mins === 25 ? "Focus" : "Break");
  Pomodoro.start();
};


// =========================================================================
// 8. INIT
// =========================================================================
document.addEventListener("DOMContentLoaded", () => {
  tickClock();
  updateClockTargetBadge();
  renderCalendar();
  setupCalendarEvents();
  setupModeEvents();
  setupDragging();

  HourlyChime.updateUI();
  Pomodoro.init();
  Stopwatch.init();

  setMode(currentMode);
});
