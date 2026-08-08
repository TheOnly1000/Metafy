(function () {
  "use strict";

  if (window.MetaX && window.MetaX.tutorial) return;

  var running = false;
  var step = 0;
  var timer = null;
  var playing = true;
  var prevTabs = null;
  var prevLogHTML = null;
  var prevStatus = null;
  var prevStatusClass = null;
  var activeGroup = "main";

  var root = null;
  var slabTop = null, slabBottom = null, slabLeft = null, slabRight = null;
  var ring = null;
  var tooltip = null;

  function noop() {}

  // ── Sample data (never touches the real engine or disk) ──
  var SAMPLE_COLUMNS = ["Asset ID", "Title", "Season", "Episode", "Language", "Video Filename", "Tags"];

  function buildSampleTabs() {
    return [
      {
        assetId: "NBCU-0007",
        columns: SAMPLE_COLUMNS,
        rows: [
          { "Asset ID": "NBCU-0007",   "Title": "Late Night with Mark — Episode 5", "Season": "3", "Episode": "5", "Language": "English", "Video Filename": "", "Tags": "comedy, entertainment" },
          { "Asset ID": "NBCU-0007-A1", "Title": "Late Night with Mark — Clip 1",  "Season": "3", "Episode": "5", "Language": "English", "Video Filename": "", "Tags": "comedy" },
          { "Asset ID": "NBCU-0007-A1-1", "Title": "Late Night — Cold Open",       "Season": "3", "Episode": "5", "Language": "English", "Video Filename": "", "Tags": "comedy" },
        ],
      },
      {
        assetId: "NBCU-0008",
        columns: SAMPLE_COLUMNS,
        rows: [
          { "Asset ID": "NBCU-0008", "Title": "Morning News Roundup — Full Show", "Season": "20", "Episode": "112", "Language": "English", "Video Filename": "", "Tags": "news, weather" },
          { "Asset ID": "NBCU-0008-A1", "Title": "Morning News — Weather Block",   "Season": "20", "Episode": "112", "Language": "English", "Video Filename": "", "Tags": "weather" },
        ],
      },
    ];
  }

  function buildSampleLog() {
    return [
      { type: "step", data: { id: "dl", message: "Downloading schedule sheet from Google Drive", status: "running" } },
      { type: "step", data: { id: "dl", status: "completed" } },
      { type: "step", data: { id: "parse", message: "Parsing schedule data for 2026-08-09", status: "running" } },
      { type: "step", data: { id: "parse", status: "completed" } },
      { type: "status", data: "Found 2 show(s)" },
      { type: "log", data: "Processing NBCU-0007: Late Night with Mark (2 segments)" },
      { type: "progress", data: { current: 1, total: 2 } },
      { type: "log", data: "  Template cached, reusing" },
      { type: "log", data: "  Wrote 4 rows" },
      { type: "log", data: "Processing NBCU-0008: Morning News Roundup (2 segments)" },
      { type: "progress", data: { current: 2, total: 2 } },
      { type: "log", data: "  Wrote 2 rows" },
      { type: "status", data: "All done!" },
    ];
  }

  // ── Step data ──
  var GROUPS = {
    toolbar:   { open: noop, close: noop },
    main:      { open: noop, close: noop },
    viewer:    { open: feedSample, close: noop },
    shortcuts: { open: openShortcuts, close: closeShortcuts },
    settings:  { open: openSettingsDemo, close: closeSettings },
    queue:     { open: openQueue, close: closeQueue },
  };

  var STEPS = [
    {
      group: "main", scope: "full",
      title: "Welcome to MetaX V3",
      text: "This is an <b>interactive tutorial</b> that walks you through every button, panel, and setting in the app — all running on <b>sample data</b> so nothing real is touched.<br><br>Follow the pulsing ring and read each card. Use <b>Next / Back</b>, the dots, or the arrow keys; press <b>pause</b> to stop the auto-advance.",
      tip: "Tip: The demo below runs the exact same UI pipeline as a real generation — only the data is made-up.",
    },
    {
      group: "main", target: "#logo-btn",
      title: "Brand &amp; View Menu",
      text: "Click the <b>MetaX</b> badge to open the <b>View Menu</b>: theme, queue, status bar, full screen, export, settings and this tutorial all live there.",
    },
    {
      group: "toolbar", target: "#theme-btn",
      title: "Theme Toggle",
      text: "Switch between <b>Dark</b> and <b>Light</b> theme. Your choice is remembered on next launch.",
      tip: "Shortcut: Ctrl+T. This tutorial adapts to either.",
    },
    {
      group: "toolbar", target: "#tutorial-btn",
      title: "Interactive Tutorial Button",
      text: "You are here right now. This button re-opens the tour whenever you need it. Shortcut: <b>Ctrl+Shift+T</b>.",
    },
    {
      group: "toolbar", target: "#queue-btn",
      title: "Queue Manager",
      text: "Queue multiple air-dates and run them back-to-back automatically — ideal for overnight batches.",
      tip: "Shortcut: Ctrl+Shift+Q, or the View Menu entry.",
    },
    {
      group: "toolbar", target: "#edit-mode-btn",
      title: "Edit Mode",
      text: "Toggles <b>edit mode</b> on the results table. Click any cell to fix it, then Save Cell or Save Column. A green banner appears while editing.",
      warn: "Edits are written back to the CSV files on disk — double-check before touching shared folders.",
      tip: "Ctrl+E toggles, Ctrl+Shift+A applies a value to a whole column.",
    },
    {
      group: "toolbar", target: "#shortcuts-btn",
      title: "Keyboard Shortcuts Reference",
      text: "A full in-app cheat sheet for every shortcut from run to tabs. Shortcut: <b>Ctrl+/</b>.",
    },
    {
      group: "toolbar", target: "#update-btn",
      title: "Update Center",
      text: "Checks the update sheet for a newer build, downloads, and installs it with one click.",
      warn: "Needs Internet. After install the app restarts by itself.",
    },
    {
      group: "main", scope: "full",
      title: "The Scheduling Toolbar",
      text: "Now the row of controls that decides what gets generated, how many rows, and where the CSVs land.",
    },
    {
      group: "toolbar", target: "#date-display",
      title: "Air Date Picker",
      text: "Choose the <b>air date</b> you're scheduling. Only shows with that date in the schedule sheet are processed. Click to open the calendar.",
    },
    {
      group: "toolbar", target: "#date-calendar",
      title: "Calendar &amp; Presets",
      text: "Flip months or jump straight to Today / Yesterday / Last 7 / Last 30 with the shortcut buttons, then pick any day.",
      enter: demoOpenCalendar, exit: demoCloseCalendar,
    },
    {
      group: "toolbar", target: "#extra-segments",
      title: "Extra Segments",
      text: "Adds extra segment rows on top of what's in the schedule. Every asset ID stays unique via appended letters (A, B, C…).",
      warn: "Keep this in check — it multiplies with Sub Segments to drive the total row count.",
    },
    {
      group: "toolbar", target: "#sub-segments",
      title: "Sub Segments",
      text: "Each segment gets this many sub-rows (e.g. segment A also produces A1, A2…).",
      warn: "Segments × sub-segments grows rows fast — 30 extra × 10 subs on many assets = thousands of rows.",
    },
    {
      group: "toolbar", target: "#browse-btn",
      title: "Output Folder",
      text: "Pick where the generated CSVs are written. The engine nests them into <b>Year / Month / Day</b> folders inside it.",
      warn: "Required before Generate unlocks. Nothing is written until you press generate.",
    },
    {
      group: "toolbar", target: "#dir-path",
      title: "Selected Path",
      text: "The current destination path, shown at a glance.",
    },
    {
      group: "toolbar", target: "#run-btn",
      title: "Generate Button",
      text: "The main action: download schedule → parse → fetch each template → clean descriptions → build rows → write CSVs. Shortcut: <b>Ctrl+Enter</b>.",
      warn: "In the tutorial the button is simulated — in real use it writes actual files.",
    },
    {
      group: "main", target: "#log-panel",
      title: "The Process Log",
      text: "This side-panel narrates the engine step-by-step while it runs — every download, parse and write.",
    },
    {
      group: "main", target: "#log-filter",
      title: "Log Filters",
      text: "Filter by status: <b>All</b> / <b>Active</b> / <b>Done</b> / <b>Errors</b> — invaluable after a large run.",
    },
    {
      group: "viewer", scope: "full",
      title: "The Results Viewer",
      text: "Below the log, every generated asset becomes a tab with a searchable, editable table. Watch the sample tabs fill in live…",
    },
    {
      group: "viewer", target: "#tab-bar",
      title: "Asset Tabs",
      text: "One tab per asset, with row count, a status tick, plus icons to <b>copy</b> the table as TSV (paste into Sheets) or <b>close</b> the tab.",
      tip: "Ctrl+Tab / Ctrl+Shift+Tab cycles tabs; Ctrl+W closes the active one.",
    },
    {
      group: "viewer", target: "#results-table",
      title: "The Results Table",
      text: "Rendered straight from the generated CSV. Click any cell to inspect the raw value in a modal; hover long cells for a preview; drag header edges to resize columns.",
    },
    {
      group: "viewer", target: "#search-bar",
      title: "Search",
      text: "Search the current table instantly — matching cells glow and the row count appears. Shortcut: <b>Ctrl+F</b>.",
      enter: demoShowSearch, exit: demoHideSearch,
    },
    {
      group: "viewer", target: "#statusbar",
      title: "Status Bar",
      text: "Live engine health: current status, asset / total counts, and the show being processed. Left label marks this as internal tooling.",
    },
    {
      group: "main", scope: "full",
      title: "Settings &amp; Queue",
      text: "Up next: the real preference centers and everything inside the gear icon.",
    },
    {
      group: "settings", target: "#settings-modal",
      title: "Settings",
      text: "The gear (button or <b>Ctrl+,</b>) opens Settings. Stored with Windows security, only values from SDK returns — secrets never leave the main process.",
    },
    {
      group: "settings", target: "#s3-enabled",
      title: "S3 Auto-Upload Toggle",
      text: "When on, every successful run is pushed straight to your S3 bucket after generation — no manual step.",
      warn: "If the bucket or keys are wrong the run still succeeds locally, then shows an upload-error toast.",
    },
    {
      group: "settings", target: "#s3-fields",
      title: "Bucket / Region / Prefix",
      text: "Bucket name (must exist), AWS region, and an optional prefix prepended to every uploaded key (e.g. metax/output/).",
    },
    {
      group: "settings", target: "#s3-access-key",
      title: "Access Key ID",
      text: "The public half of your AWS credential. It's shown masked here — paste yours for real uploads.",
      warn: "Keys are encrypted (safeStorage/DPAPI) before being written to config.json, and are displayed as asterisks on next open.",
    },
    {
      group: "settings", target: "#s3-secret-key",
      title: "Secret Access Key",
      text: "The private half — never share it, and keep the config.json it lives in away from version control.",
    },
    {
      group: "settings", target: "#jingle-select",
      title: "Completion Sound",
      text: "Choose a jingle that plays when a generation finishes: beep, fanfare, chord… or Silent.",
    },
    {
      group: "settings", target: "#jingle-play-btn",
      title: "Preview Sound",
      text: "The ▶ button plays the selected jingle so you can hear it before you save.",
    },
    {
      group: "settings", target: "#typing-sound-toggle",
      title: "Iteration Tick",
      text: "Plays a soft tick per typed character while a table animates — purely cosmetic.",
    },
    {
      group: "settings", target: "#settings-save-btn",
      title: "Save Settings",
      text: "Writes it all back. S3 credentials only get written when you actually type a new value.",
      warn: "Leave the key fields as ******** to keep your already-stored credentials untouched.",
    },
    {
      group: "queue", scope: "full",
      title: "The Queue Panel",
      text: "Batch-schedule multiple air-dates and let them run overnight.",
    },
    {
      group: "queue", target: "#queue-auto",
      title: "Auto (12 AM)",
      text: "When on, queued dates run automatically at midnight — so your day's schedule generates itself.",
      warn: "Only fires while the app is open at midnight; closing MetaX stops the timer.",
    },
    {
      group: "queue", target: "#queue-progress",
      title: "Queue Progress",
      text: "Tracks the whole batch as each date is processed one after another.",
      enter: demoShowQueueProgress,
    },
    {
      group: "main", target: "#open-out-btn",
      title: "Open Output Folder",
      text: "Appears after a successful run — a one-click way to open the latest output folder in Explorer.",
      warn: "Only opens the folder from the most recent engine run.",
      enter: demoShowOpenBtn, exit: demoHideOpenBtn,
    },
    {
      group: "main", target: "#empty-state",
      title: "Empty / Ready State",
      text: "The friendly landing that guides you: pick a date, choose a folder, press Generate.",
      enter: demoShowEmptyState,
      exit: demoHideEmptyState,
    },
    {
      group: "main", scope: "full",
      title: "Tutorial complete!",
      text: "You've seen every control and setting MetaX has. <b>Sample data is cleaned up when this tour ends</b>, restoring whatever you had before.<br><br>Re-open anytime with the book button, the View Menu, or <b>Ctrl+Shift+T</b>. Happy generating!",
    },
  ];

  // ── DOM build ──
  function build() {
    if (root && root.parentNode === document.body) return; // reuse existing overlay

    var body = document.body;
    root = document.createElement("div");
    root.className = "tutorial-overlay";
    root.id = "tutorial-root";

    ring = document.createElement("div");
    ring.className = "tut-ring";
    var glow = document.createElement("div");
    glow.className = "tut-glow";
    ring.appendChild(glow);

    tooltip = document.createElement("div");
    tooltip.className = "tut-tooltip";
    tooltip.innerHTML =
      '<div class="tut-head">' +
      '<span class="tut-count"></span>' +
      '<button class="tut-close" title="Exit tutorial">&#10005;</button>' +
      "</div>" +
      '<div class="tut-body"></div>' +
      '<div class="tut-nav">' +
      '<button class="tut-btn tut-prev" title="Previous (&#8592;)">&#8592; Back</button>' +
      '<div class="tut-dots"></div>' +
      '<button class="tut-btn tut-next" title="Next (&#8594;)">Next &#8594;</button>' +
      "</div>" +
      '<div class="tut-playbar"><button class="tut-play" title="Pause / Resume"></button>' +
      '<span class="tut-hint">&#8592; &#8594; navigate &middot; Esc to quit</span></div>';

    slabTop = div("tut-slab tut-top");
    slabBottom = div("tut-slab tut-bottom");
    slabLeft = div("tut-slab tut-left");
    slabRight = div("tut-slab tut-right");

    var scrim = document.createElement("div");
    scrim.className = "tutorial-scrim";
    scrim.appendChild(slabTop);
    scrim.appendChild(slabBottom);
    scrim.appendChild(slabLeft);
    scrim.appendChild(slabRight);
    scrim.appendChild(ring);

    root.appendChild(scrim);
    root.appendChild(tooltip);
    body.appendChild(root);

    tooltip.querySelector(".tut-close").addEventListener("click", end);
    tooltip.querySelector(".tut-next").addEventListener("click", nextStep);
    tooltip.querySelector(".tut-prev").addEventListener("click", function () { go(Math.max(0, step - 1)); });
    tooltip.querySelector(".tut-play").addEventListener("click", togglePlay);
  }

  function div(cls) {
    var d = document.createElement("div");
    d.className = cls;
    return d;
  }

  // ── Public API ──
  function start() {
    if (running) return;
    if (window.MetaX && window.MetaX.tabs && window.MetaX.tabs.length > 0) {
      prevTabs = { tabs: window.MetaX.tabs.slice(), activeTabId: window.MetaX.activeTabId };
    } else {
      prevTabs = null;
    }
    var out = document.getElementById("log-output");
    prevLogHTML = out ? out.innerHTML : null;
    prevStatus = (document.getElementById("status-text") || {}).textContent || null;
    prevStatusClass = (document.getElementById("status-icon") || {}).className || null;
    running = true;
    step = 0;
    playing = true;
    activeGroup = "main";
    build();
    root.classList.add("visible");
    document.body.classList.add("tutorial-active");
    renderStep();
    schedule();
  }

  function end() {
    if (!running) return;
    running = false;
    stopTimer();
    runStepExit(STEPS[step]);
    var g = GROUPS[activeGroup] || GROUPS.main;
    if (g && g.close) g.close();
    if (window.MetaX && window.MetaX.sample) {
      if (prevTabs) window.MetaX.sample.restore(prevTabs);
      else window.MetaX.sample.restore({ tabs: [], activeTabId: null });
    }
    restoreLog();
    if (root) root.classList.remove("visible");
    document.body.classList.remove("tutorial-active");
  }

  function restoreLog() {
    if (!prevStatus) return;
    var status = document.getElementById("status-text");
    if (status) status.textContent = prevStatus;
    var statIcon = document.getElementById("status-icon");
    if (statIcon) statIcon.className = prevStatusClass || "idle";
    var prog = document.getElementById("progress-info");
    if (prog) prog.classList.add("hidden");
    if (window.MetaX && window.MetaX.sample && prevLogHTML !== null) {
      var out = document.getElementById("log-output");
      if (out) out.innerHTML = prevLogHTML;
    }
  }

  function stopTimer() { if (timer) { clearTimeout(timer); timer = null; } }
  function schedule() {
    stopTimer();
    if (!playing) return;
    timer = setTimeout(function () { if (running) go(step + 1); }, 5000);
  }

  function go(n) {
    if (!running) return;
    if (n < 0 || n >= STEPS.length) { end(); return; }
    runStepExit(STEPS[step]);
    var nextGroup = STEPS[n].group;
    if (nextGroup !== activeGroup) {
      var g = GROUPS[activeGroup] || GROUPS.main;
      if (g.close) g.close();
      activeGroup = nextGroup;
      g = GROUPS[nextGroup] || GROUPS.main;
      if (g.open) g.open();
    }
    step = n;
    runStepEnter(STEPS[step]);
    renderStep();
    schedule();
  }

  function nextStep() { go(step + 1); }
  function prevStep() { go(Math.max(0, step - 1)); }

  function togglePlay() {
    playing = !playing;
    var playBtn = tooltip.querySelector(".tut-play");
    playBtn.innerHTML = playing ? "&#10074;&#10074;" : "&#9654;";
    playBtn.classList.toggle("paused", !playing);
    if (playing) schedule(); else stopTimer();
  }

  // ── Per-step demo hooks ──
  function demoOpenCalendar() {
    var disp = document.getElementById("date-display");
    if (disp && !document.getElementById("date-display").classList.contains("open")) {
      try { disp.click(); } catch (e) {}
    }
  }
  function demoCloseCalendar() {
    var disp = document.getElementById("date-display");
    if (disp && disp.classList.contains("open")) {
      try { disp.click(); } catch (e) {}
    }
  }
  function demoShowOpenBtn() {
    var b = document.getElementById("open-out-btn");
    if (b) b.classList.remove("hidden");
  }
  function demoHideOpenBtn() {
    var b = document.getElementById("open-out-btn");
    if (b) b.classList.add("hidden");
  }
  function demoShowSearch() {
    var sb = document.getElementById("search-bar");
    if (sb) sb.classList.remove("hidden");
  }
  function demoHideSearch() {
    var sb = document.getElementById("search-bar");
    if (sb) sb.classList.add("hidden");
  }
  function demoShowEmptyState() {
    var es = document.getElementById("empty-state");
    var tw = document.getElementById("table-wrap");
    var tb = document.getElementById("tab-bar");
    if (es) es.classList.remove("hidden");
    if (tw) tw.classList.add("hidden");
    if (tb) tb.classList.add("hidden");
  }
  function demoHideEmptyState() {
    var es = document.getElementById("empty-state");
    if (es) es.classList.add("hidden");
  }
  function demoShowQueueProgress() {
    var qp = document.getElementById("queue-progress");
    if (qp) qp.classList.remove("hidden");
  }
  function runStepEnter(s) { if (s.enter) { try { s.enter(); } catch (e) {} } }
  function runStepExit(s) { if (s.exit) { try { s.exit(); } catch (e) {} } }

  // ── Render step ──
  function renderStep() {
    var s = STEPS[step];
    tooltip.querySelector(".tut-count").textContent = "Step " + (step + 1) + " / " + STEPS.length;
    var html = '<h3 class="tut-title">' + (s.title || "") + "</h3>" +
      '<div class="tut-text">' + (s.text || "") + "</div>";
    if (s.warn) html += '<div class="tut-warn">&#9888; ' + s.warn + "</div>";
    if (s.tip) html += '<div class="tut-tip">' + s.tip + "</div>";
    var body = tooltip.querySelector(".tut-body");
    body.innerHTML = html;

    var dotsHtml = "";
    for (var i = 0; i < STEPS.length; i++) {
      dotsHtml += '<button class="tut-dot' + (i === step ? " on" : "") + '" data-i="' + i + '"></button>';
    }
    var dots = tooltip.querySelector(".tut-dots");
    dots.innerHTML = dotsHtml;
    Array.prototype.forEach.call(dots.querySelectorAll(".tut-dot"), function (d) {
      d.addEventListener("click", function () { go(parseInt(d.getAttribute("data-i"), 10)); });
    });

    var playBtn = tooltip.querySelector(".tut-play");
    playBtn.innerHTML = playing ? "&#10074;&#10074;" : "&#9654;";
    playBtn.classList.toggle("paused", !playing);

    position(s);
    // Re-measure on subsequent frames so modals/panels that fall in on enter
    // are measured after their open animation settles. rAF-based, no janky timeout.
    var frames = 0;
    var tick = function () {
      if (!running || step < 0 || step >= STEPS.length) return;
      frames++;
      position(STEPS[step]);
      if (frames < 6) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }

  function position(s) {
    var rect = null;
    if (s.target) {
      var el = document.querySelector(s.target);
      if (el) rect = el.getBoundingClientRect();
    }
    var scrim = root.querySelector(".tutorial-scrim");
    if (!rect || rect.width < 2 || rect.height < 2) {
      scrim.classList.add("full");
      ring.style.cssText = "display:none";
      moveTooltip(s, null);
      return;
    }
    scrim.classList.remove("full");
    padSlabs(rect);
    ring.style.cssText = "";
    ring.style.left = rect.left + "px";
    ring.style.top = rect.top + "px";
    ring.style.width = rect.width + "px";
    ring.style.height = rect.height + "px";
    moveTooltip(s, rect);
  }

  function padSlabs(rect) {
    var pad = 6;
    var vw = window.innerWidth, vh = window.innerHeight;
    var t = Math.max(0, rect.top - pad),
        l = Math.max(0, rect.left - pad),
        r = Math.min(vw, rect.right + pad),
        b = Math.min(vh, rect.bottom + pad);
    slabTop.style.cssText = "display:block;top:0;left:0;width:100%;height:" + t + "px;";
    slabBottom.style.cssText = "display:block;top:" + b + "px;left:0;width:100%;height:" + (vh - b) + "px;";
    slabLeft.style.cssText = "display:block;top:" + t + "px;left:0;width:" + l + "px;height:" + (b - t) + "px;";
    slabRight.style.cssText = "display:block;top:" + t + "px;left:" + r + "px;width:" + (vw - r) + "px;height:" + (b - t) + "px;";
  }

  function moveTooltip(s, rect) {
    tooltip.classList.remove("tut-centered", "tut-flip");
    var vw = window.innerWidth, vh = window.innerHeight;
    var gap = 16;

    if (!rect) {
      tooltip.classList.add("tut-centered");
      tooltip.style.left = "50%";
      tooltip.style.top = "50%";
      tooltip.style.transform = "translate(-50%,-50%)";
      return;
    }
    // measure
    tooltip.style.left = "0";
    tooltip.style.top = "0";
    tooltip.style.transform = "none";
    tooltip.style.visibility = "hidden";
    var tw = tooltip.offsetWidth, th = tooltip.offsetHeight;
    tooltip.style.visibility = "";

    var rightSpace = vw - rect.right - gap - tw;
    var leftSpace = rect.left - gap - tw;
    var belowSpace = vh - rect.bottom - gap - th;
    var aboveSpace = rect.top - gap - th;

    var left, top, flip = false;
    if (rightSpace >= 0 && rightSpace >= leftSpace) {
      left = rect.right + gap;
      top = clamp(rect.top + rect.height / 2 - th / 2, 8, vh - th - 8);
    } else if (leftSpace >= 0) {
      left = rect.left - gap - tw;
      top = clamp(rect.top + rect.height / 2 - th / 2, 8, vh - th - 8);
    } else if (belowSpace >= 0 && belowSpace >= aboveSpace) {
      left = clamp(rect.left + rect.width / 2 - tw / 2, 8, vw - tw - 8);
      top = rect.bottom + gap;
    } else if (aboveSpace >= 0) {
      left = clamp(rect.left + rect.width / 2 - tw / 2, 8, vw - tw - 8);
      top = rect.top - gap - th;
      flip = true;
    } else {
      left = clamp(rect.left, 8, vw - tw - 8);
      top = clamp(rect.bottom + gap, 8, vh - th - 8);
    }
    tooltip.style.left = left + "px";
    tooltip.style.top = top + "px";
    tooltip.style.transform = "";
    if (flip) tooltip.classList.add("tut-flip");
  }

  function clamp(v, a, b) { return Math.max(a, Math.min(v, b)); }

  // ── Groups ──
  var savedSettingsState = null;

  function openSettingsDemo() {
    var modal = document.getElementById("settings-modal");
    if (modal && modal.classList.contains("hidden")) {
      modal.classList.remove("hidden");
      if (window.MetaX && window.MetaX.openSettings) window.MetaX.openSettings();
    }
    setTimeout(function () {
      var b = document.getElementById("s3-bucket"), r = document.getElementById("s3-region"),
          p = document.getElementById("s3-prefix"), ak = document.getElementById("s3-access-key"),
          sk = document.getElementById("s3-secret-key"), tog = document.getElementById("s3-enabled"),
          f = document.getElementById("s3-fields");
      if (!savedSettingsState) {
        savedSettingsState = {
          bucket: b ? b.value : "", region: r ? r.value : "", prefix: p ? p.value : "",
          ak: ak ? ak.value : "", sk: sk ? sk.value : "", checked: tog ? tog.checked : false,
          fieldsHidden: f ? f.classList.contains("hidden") : true,
        };
      }
      // demo values — non-destructive, restored on close
      if (b) b.value = "metax-demo-bucket";
      if (r) r.value = "us-east-1";
      if (p) p.value = "metax/output/";
      if (ak) ak.value = "AKIA-demo-key";
      if (sk) sk.value = "********************";
      if (tog) tog.checked = true;
      if (f) f.classList.remove("hidden");
    }, 80);
  }

  function closeSettings() {
    var modal = document.getElementById("settings-modal");
    if (modal) modal.classList.add("hidden");
    if (savedSettingsState) {
      var b = document.getElementById("s3-bucket"), r = document.getElementById("s3-region"),
          p = document.getElementById("s3-prefix"), ak = document.getElementById("s3-access-key"),
          sk = document.getElementById("s3-secret-key"), tog = document.getElementById("s3-enabled"),
          f = document.getElementById("s3-fields"), st = savedSettingsState;
      if (b) b.value = st.bucket;
      if (r) r.value = st.region;
      if (p) p.value = st.prefix;
      if (ak) ak.value = st.ak;
      if (sk) sk.value = st.sk;
      if (tog) tog.checked = st.checked;
      if (f) f.classList.toggle("hidden", st.fieldsHidden);
      savedSettingsState = null;
    }
  }

  function openQueue() {
    if (window.MetaX && window.MetaX.queue && window.MetaX.queue.show) window.MetaX.queue.show();
  }
  function closeQueue() {
    if (window.MetaX && window.MetaX.queue && window.MetaX.queue.hide) window.MetaX.queue.hide();
  }

  function openShortcuts() {
    var ov = document.getElementById("shortcuts-overlay");
    if (ov) ov.classList.remove("hidden");
  }
  function closeShortcuts() {
    var ov = document.getElementById("shortcuts-overlay");
    if (ov) ov.classList.add("hidden");
  }

  function feedSample() {
    if (!window.MetaX || !window.MetaX.sample) return;
    window.MetaX.sample.load(buildSampleTabs());
    // the viewer group is entered once — get the tabs + log + status nice and filled
    try {
      window.MetaX.sample.log(buildSampleLog());
    } catch (e) {}
  }

  // ── Global listeners ──
  window.addEventListener("resize", function () {
    if (running) position(STEPS[step]);
  });

  document.addEventListener("keydown", function (e) {
    if (!running) return;
    if (e.key === "Escape") { e.preventDefault(); end(); return; }
    if (e.key === "ArrowRight") { e.preventDefault(); if (e.target && e.target.tagName !== "INPUT") nextStep(); return; }
    if (e.key === "ArrowLeft") { e.preventDefault(); if (e.target && e.target.tagName !== "INPUT") prevStep(); return; }
  });

  // entry hooks
  if (window.MetaX && window.MetaX.keyboard) {
    window.MetaX.keyboard.register("Ctrl+Shift+T", function () {
      if (running) end(); else start();
    });
  }
  var btn = document.getElementById("tutorial-btn");
  if (btn) btn.addEventListener("click", function () { if (running) end(); else start(); });

  window.MetaX = window.MetaX || {};
  window.MetaX.tutorial = { start: start, end: end, isActive: function () { return running; } };
})();