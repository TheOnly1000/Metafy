(function () {
  "use strict";

  // ── DOM refs ──
  var extraSegsInput = document.getElementById("extra-segments");
  var subSegsInput = document.getElementById("sub-segments");

  var updateBtn = document.getElementById("update-btn");
  var updateModal = document.getElementById("update-modal");
  var updateModalClose = document.getElementById("update-modal-close");
  var updateBackdrop = document.querySelector("#update-modal .modal-backdrop");
  var updateSpinner = document.getElementById("update-spinner");
  var updateResult = document.getElementById("update-result");
  var updateDlArea = document.getElementById("update-download-area");
  var updateDlFill = document.getElementById("update-dl-fill");
  var updateDlText = document.getElementById("update-dl-text");
  var updateFeatures = document.getElementById("update-features");
  var updateFeaturesList = document.getElementById("update-features-list");
  var updateDlBtn = document.getElementById("update-dl-btn");
  var updateInstallBtn = document.getElementById("update-install-btn");
  var updateFooter = document.getElementById("update-footer");

  var dateText = document.getElementById("date-text");
  var dateDisplay = document.getElementById("date-display");
  var dateCalendar = document.getElementById("date-calendar");
  var calMonthYear = document.getElementById("cal-month-year");
  var calDays = document.getElementById("cal-days");
  var calPrev = document.getElementById("cal-prev");
  var calNext = document.getElementById("cal-next");
  var browseBtn = document.getElementById("browse-btn");
  var dirPath = document.getElementById("dir-path");
  var runBtn = document.getElementById("run-btn");
  var tabBar = document.getElementById("tab-bar");
  var tabList = document.getElementById("tab-list");
  var emptyState = document.getElementById("empty-state");
  var tableWrap = document.getElementById("table-wrap");
  var waitingState = document.getElementById("waiting-state");
  var resultsHead = document.getElementById("results-head");
  var resultsBody = document.getElementById("results-body");
  var logOutput = document.getElementById("log-output");
  var statusText = document.getElementById("status-text");
  var statusIcon = document.getElementById("status-icon");
  var progressInfo = document.getElementById("progress-info");
  var assetProgress = document.getElementById("asset-progress");
  var modal = document.getElementById("detail-modal");
  var modalTitle = document.getElementById("modal-title");
  var modalBody = document.getElementById("modal-body-text");
  var modalClose = document.getElementById("modal-close");
  var modalCopy = document.getElementById("modal-copy");
  var modalBackdrop = document.querySelector(".modal-backdrop");
  var searchBar = document.getElementById("search-bar");
  var searchInput = document.getElementById("search-input");
  var searchCount = document.getElementById("search-count");
  var skeletonOverlay = document.getElementById("skeleton-overlay");
  var filterBtns = document.querySelectorAll(".filter-btn");
  var settingsModal = document.getElementById("settings-modal");
  var settingsModalClose = document.getElementById("settings-modal-close");
  var settingsBackdrop = document.querySelector("#settings-modal .modal-backdrop");
  var openOutBtn = document.getElementById("open-out-btn");
  var hoverPreview = document.getElementById("hover-preview");
  var shortcutsOverlay = document.getElementById("shortcuts-overlay");
  var settingsBtn = document.getElementById("settings-btn");
  var shortcutsBtn = document.getElementById("shortcuts-btn");
  var settingsSaveBtn = document.getElementById("settings-save-btn");
  var settingsCancelBtn = document.getElementById("settings-cancel-btn");
  var s3Enabled = document.getElementById("s3-enabled");
  var s3Fields = document.getElementById("s3-fields");
  var s3Bucket = document.getElementById("s3-bucket");
  var s3Region = document.getElementById("s3-region");
  var s3Prefix = document.getElementById("s3-prefix");
  var s3AccessKey = document.getElementById("s3-access-key");
  var s3SecretKey = document.getElementById("s3-secret-key");
  var s3Type = document.getElementById("s3-type");
  var s3Endpoint = document.getElementById("s3-endpoint");
  var s3EndpointField = document.getElementById("s3-endpoint-field");
  var s3RegionField = document.getElementById("s3-region-field");
  var jingleSelect = document.getElementById("jingle-select");
  var jinglePlayBtn = document.getElementById("jingle-play-btn");
  var typingSoundToggle = document.getElementById("typing-sound-toggle");
  var colorSwatches = document.querySelectorAll(".color-swatch");

  // ── Jingle definitions ──
  var JINGLES = {
    default: function(ctx) {
      var osc = ctx.createOscillator();
      var gain = ctx.createGain();
      osc.connect(gain); gain.connect(ctx.destination);
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      osc.frequency.setValueAtTime(1100, ctx.currentTime + 0.1);
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
      osc.start(ctx.currentTime); osc.stop(ctx.currentTime + 0.3);
    },
    ascending: function(ctx) {
      var osc = ctx.createOscillator();
      var gain = ctx.createGain();
      osc.connect(gain); gain.connect(ctx.destination);
      osc.frequency.setValueAtTime(523, ctx.currentTime);
      osc.frequency.setValueAtTime(659, ctx.currentTime + 0.1);
      osc.frequency.setValueAtTime(784, ctx.currentTime + 0.2);
      osc.frequency.setValueAtTime(1047, ctx.currentTime + 0.3);
      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
      osc.start(ctx.currentTime); osc.stop(ctx.currentTime + 0.5);
    },
    descending: function(ctx) {
      var osc = ctx.createOscillator();
      var gain = ctx.createGain();
      osc.connect(gain); gain.connect(ctx.destination);
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      osc.frequency.setValueAtTime(660, ctx.currentTime + 0.1);
      osc.frequency.setValueAtTime(440, ctx.currentTime + 0.2);
      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
      osc.start(ctx.currentTime); osc.stop(ctx.currentTime + 0.4);
    },
    chord: function(ctx) {
      [523, 659, 784].forEach(function(freq) {
        var o = ctx.createOscillator();
        var g = ctx.createGain();
        o.connect(g); g.connect(ctx.destination);
        o.frequency.setValueAtTime(freq, ctx.currentTime);
        g.gain.setValueAtTime(0.08, ctx.currentTime);
        g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6);
        o.start(ctx.currentTime); o.stop(ctx.currentTime + 0.6);
      });
    },
    fanfare: function(ctx) {
      [659, 784, 659, 1047].forEach(function(freq, i) {
        var o = ctx.createOscillator();
        var g = ctx.createGain();
        o.connect(g); g.connect(ctx.destination);
        var t = ctx.currentTime + i * 0.12;
        o.frequency.setValueAtTime(freq, t);
        g.gain.setValueAtTime(0.12, t);
        g.gain.exponentialRampToValueAtTime(0.001, t + 0.2);
        o.start(t); o.stop(t + 0.2);
      });
    },
  };

  var typingTickCtx = null;
  function playTick() {
    try {
      if (!typingTickCtx || typingTickCtx.state === "closed") typingTickCtx = new (window.AudioContext || window.webkitAudioContext)();
      if (typingTickCtx.state === "suspended") typingTickCtx.resume();
      var osc = typingTickCtx.createOscillator();
      var gain = typingTickCtx.createGain();
      osc.type = "sine";
      osc.connect(gain); gain.connect(typingTickCtx.destination);
      osc.frequency.setValueAtTime(380, typingTickCtx.currentTime);
      gain.gain.setValueAtTime(0.001, typingTickCtx.currentTime);
      gain.gain.linearRampToValueAtTime(0.008, typingTickCtx.currentTime + 0.01);
      gain.gain.linearRampToValueAtTime(0.001, typingTickCtx.currentTime + 0.05);
      osc.start(typingTickCtx.currentTime); osc.stop(typingTickCtx.currentTime + 0.05);
    } catch (e) {}
  }

  // ── Accent color map ──
  var ACCENTS = {
    purple: { accent:"#7c6af0", hover:"#9482ff", glow:"rgba(124,106,240,0.3)", subtle:"rgba(124,106,240,0.1)" },
    blue:   { accent:"#3b82f6", hover:"#60a5fa", glow:"rgba(59,130,246,0.3)", subtle:"rgba(59,130,246,0.1)" },
    green:  { accent:"#22c55e", hover:"#4ade80", glow:"rgba(34,197,94,0.3)",  subtle:"rgba(34,197,94,0.1)" },
    orange: { accent:"#f97316", hover:"#fb923c", glow:"rgba(249,115,22,0.3)", subtle:"rgba(249,115,22,0.1)" },
    red:    { accent:"#ef4444", hover:"#f87171", glow:"rgba(239,68,68,0.3)",  subtle:"rgba(239,68,68,0.1)" },
    pink:   { accent:"#ec4899", hover:"#f472b6", glow:"rgba(236,72,153,0.3)", subtle:"rgba(236,72,153,0.1)" },
  };

  function applyAccent(name) {
    var c = ACCENTS[name] || ACCENTS.purple;
    var root = document.documentElement;
    root.style.setProperty("--accent", c.accent);
    root.style.setProperty("--accent-hover", c.hover);
    root.style.setProperty("--accent-glow", c.glow);
    root.style.setProperty("--accent-subtle", c.subtle);
    try { localStorage.setItem("metax_accent", name); } catch (e) {}
    // Update color swatch active state
    document.querySelectorAll(".color-swatch").forEach(function (sw) {
      sw.classList.toggle("active", sw.dataset.color === name);
    });
  }

  // ── State ──
  var outputDir = null;
  var running = false;
  var cleanup = null;
  var pendingDoneData = null;

  var tabs = [];
  var activeTabId = null;
  var stepElements = {};
  var activeTypingSession = null;
  var assetQueue = [];
  var typingLock = false;
  var eventBuffer = [];
  var flushing = false;
  var engineExited = false;
  var currentQueueDate = null;
  var lastOutputDir = null;

  var debugLog = [];
  var debugEnabled = true;

  var currentFilter = "all";
  var stepGroupCount = 0;

  // Expose tabs for inline editing and other modules
  window.MetaX = window.MetaX || {};
  Object.defineProperty(window.MetaX, "tabs", { get: function () { return tabs; }, set: function (v) { tabs = v; } });
  Object.defineProperty(window.MetaX, "activeTabId", { get: function () { return activeTabId; }, set: function (v) { activeTabId = v; } });

  // ── Debug logger ──
  function debug() {
    if (!debugEnabled) return;
    var parts = [];
    for (var di = 0; di < arguments.length; di++) parts.push(arguments[di]);
    var msg = parts.join(" ");
    var d = new Date();
    var ts =
      String(d.getHours()).padStart(2, "0") + ":" +
      String(d.getMinutes()).padStart(2, "0") + ":" +
      String(d.getSeconds()).padStart(2, "0") + "." +
      String(d.getMilliseconds()).padStart(3, "0");
    var entry = "[" + ts + "] " + msg;
    debugLog.push(entry);
    if (debugLog.length > 10000) debugLog.splice(0, 2000);
    console.log(entry);
  }

  // ── Window title ──
  function setWindowTitle(suffix) {
    if (window.electronAPI && window.electronAPI.setTitle) {
      window.electronAPI.setTitle("MetaX" + (suffix ? " — " + suffix : ""));
    }
  }

  // ── Date picker ──
  var pickerDate = new Date();
  var selectedDate = new Date();
  var pickerOpen = false;

  function formatDate(d) {
    return d.toLocaleDateString("en-US", {
      year: "numeric", month: "short", day: "numeric"
    });
  }

  function formatDateISO(d) {
    var y = d.getFullYear();
    var m = String(d.getMonth() + 1).padStart(2, "0");
    var dd = String(d.getDate()).padStart(2, "0");
    return y + "-" + m + "-" + dd;
  }

  function renderCalendar() {
    var year = pickerDate.getFullYear();
    var month = pickerDate.getMonth();
    calMonthYear.textContent = new Date(year, month).toLocaleDateString("en-US", { year: "numeric", month: "long" });
    var firstDay = new Date(year, month, 1).getDay();
    var daysInMonth = new Date(year, month + 1, 0).getDate();
    var daysInPrev = new Date(year, month, 0).getDate();
    var today = new Date();
    var todayStr = formatDateISO(today);
    var selStr = formatDateISO(selectedDate);
    var html = "";
    for (var p = firstDay - 1; p >= 0; p--) {
      html += '<button class="other" data-d="' + (daysInPrev - p) + '" data-m="' + (month - 1) + '" data-y="' + year + '">' + (daysInPrev - p) + "</button>";
    }
    for (var d = 1; d <= daysInMonth; d++) {
      var date = new Date(year, month, d);
      var iso = formatDateISO(date);
      var cls = "";
      if (iso === selStr) cls = " selected";
      else if (iso === todayStr) cls = " today";
      html += '<button class="day' + cls + '" data-d="' + d + '" data-m="' + month + '" data-y="' + year + '">' + d + "</button>";
    }
    var totalCells = firstDay + daysInMonth;
    var remainder = totalCells % 7;
    if (remainder > 0) {
      for (var n = 1; n <= 7 - remainder; n++) {
        html += '<button class="other" data-d="' + n + '" data-m="' + (month + 1) + '" data-y="' + year + '">' + n + "</button>";
      }
    }
    calDays.innerHTML = html;
  }

  function pickDate(year, month, day) {
    selectedDate = new Date(year, month, day);
    dateText.textContent = formatDate(selectedDate);
    closePicker();
    checkReady();
    saveState();
  }

  function openPicker() {
    pickerDate = new Date(selectedDate);
    renderCalendar();
    dateCalendar.classList.remove("hidden");
    dateDisplay.classList.add("open");
    pickerOpen = true;
  }

  function closePicker() {
    dateCalendar.classList.add("hidden");
    dateDisplay.classList.remove("open");
    pickerOpen = false;
  }

  function togglePicker() {
    if (pickerOpen) closePicker(); else openPicker();
  }

  dateDisplay.addEventListener("click", togglePicker);
  document.addEventListener("click", function (e) {
    if (pickerOpen && !dateDisplay.contains(e.target) && !dateCalendar.contains(e.target)) closePicker();
  });
  dateDisplay.addEventListener("keydown", function (e) {
    if (e.key === "Enter" || e.key === " ") { e.preventDefault(); togglePicker(); }
    if (e.key === "Escape") closePicker();
  });
  calDays.addEventListener("click", function (e) {
    var btn = e.target.closest("button");
    if (!btn) return;
    pickDate(parseInt(btn.dataset.y, 10), parseInt(btn.dataset.m, 10), parseInt(btn.dataset.d, 10));
  });
  calPrev.addEventListener("click", function () { pickerDate.setMonth(pickerDate.getMonth() - 1); renderCalendar(); });
  calNext.addEventListener("click", function () { pickerDate.setMonth(pickerDate.getMonth() + 1); renderCalendar(); });

  // ── Smart date presets ──
  document.addEventListener("click", function (e) {
    var presetBtn = e.target.closest(".date-preset-btn");
    if (!presetBtn) return;
    var preset = presetBtn.dataset.preset;
    var d = new Date();
    if (preset === "today") { /* keep today */ }
    else if (preset === "yesterday") { d.setDate(d.getDate() - 1); }
    else if (preset === "-7") { d.setDate(d.getDate() - 7); }
    else if (preset === "-30") { d.setDate(d.getDate() - 30); }
    pickDate(d.getFullYear(), d.getMonth(), d.getDate());
  });

  // ── Persist state ──
  function saveState() {
    try {
      localStorage.setItem("metax_date", formatDateISO(selectedDate));
      if (outputDir) localStorage.setItem("metax_dir", outputDir);
      localStorage.setItem("metax_extra_segs", extraSegsInput.value);
      localStorage.setItem("metax_sub_segs", subSegsInput.value);
    } catch (e) {}
  }

  function loadState() {
    try {
      var savedDate = localStorage.getItem("metax_date");
      if (savedDate) {
        var parts = savedDate.split("-");
        if (parts.length === 3) {
          selectedDate = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
          dateText.textContent = formatDate(selectedDate);
        }
      }
      var savedDir = localStorage.getItem("metax_dir");
      if (savedDir) { outputDir = savedDir; dirPath.textContent = savedDir; dirPath.title = savedDir; }
      var savedExtra = localStorage.getItem("metax_extra_segs");
      if (savedExtra !== null) extraSegsInput.value = savedExtra;
      var savedSub = localStorage.getItem("metax_sub_segs");
      if (savedSub !== null) subSegsInput.value = savedSub;
    } catch (e) {}
    checkReady();
  }

  // ── Directory picker ──
  browseBtn.addEventListener("click", async function () {
    if (!window.electronAPI) return;
    var dir = await window.electronAPI.selectDir();
    if (dir) { outputDir = dir; dirPath.textContent = dir; dirPath.title = dir; checkReady(); saveState(); }
  });

  // ── Segment controls ──
  document.querySelectorAll(".num-btn").forEach(function (btn) {
    btn.addEventListener("click", function () {
      var target = btn.getAttribute("data-target");
      var input = target === "extra" ? extraSegsInput : subSegsInput;
      var dir = btn.textContent === "+" ? 1 : -1;
      var min = parseInt(input.min, 10);
      var max = parseInt(input.max, 10);
      var val = parseInt(input.value, 10) || 0;
      val = Math.max(min, Math.min(max, val + dir));
      input.value = val;
      saveState();
    });
  });
  extraSegsInput.addEventListener("change", saveState);
  subSegsInput.addEventListener("change", saveState);

  // ── Ready check ──
  function checkReady() {
    runBtn.disabled = !outputDir || running;
    if (!running && outputDir) {
      runBtn.innerHTML = '<svg class="icon" viewBox="0 0 20 20" fill="currentColor"><path d="M6.5 3.5v13l10-6.5-10-6.5z"/></svg><span>Generate</span>';
    }
  }

  // ── Helpers ──
  function setStatus(msg, type) {
    statusText.textContent = msg;
    statusIcon.className = type || "idle";
    setWindowTitle(msg === "Ready" ? "" : msg);
  }

  function escapeHtml(str) {
    var d = document.createElement("div");
    d.textContent = str;
    return d.innerHTML;
  }

  function updateAssetProgress(current, total) {
    if (current > 0 && total > 0) {
      assetProgress.textContent = "Asset " + current + " / " + total;
      assetProgress.classList.remove("hidden");
    } else {
      assetProgress.classList.add("hidden");
    }
  }

  // ── Smart auto-scroll ──
  var userScrolledUp = false;
  var scrollBtn = null;

  function createScrollBtn() {
    if (!scrollBtn) {
      scrollBtn = document.createElement("button");
      scrollBtn.id = "scroll-down-btn";
      scrollBtn.textContent = "\u2193 New activity";
      scrollBtn.style.cssText = "position:absolute;bottom:8px;left:50%;transform:translateX(-50%);z-index:20;background:var(--accent);color:#fff;border:none;border-radius:var(--radius-sm);padding:4px 12px;font-size:10px;font-weight:600;cursor:pointer;display:none;font-family:inherit;transition:opacity .2s";
      scrollBtn.addEventListener("click", function () {
        logOutput.scrollTop = logOutput.scrollHeight;
        userScrolledUp = false;
        scrollBtn.style.display = "none";
      });
      logOutput.parentNode.style.position = "relative";
      logOutput.parentNode.appendChild(scrollBtn);
    }
  }

  function checkLogScroll() {
    var threshold = 40;
    var atBottom = logOutput.scrollTop >= logOutput.scrollHeight - logOutput.clientHeight - threshold;
    if (!atBottom && logOutput.scrollHeight > logOutput.clientHeight) {
      userScrolledUp = true;
    } else {
      userScrolledUp = false;
    }
    if (scrollBtn) {
      scrollBtn.style.display = userScrolledUp ? "block" : "none";
    }
  }

  logOutput.addEventListener("scroll", checkLogScroll);

  // ── Log filter ──
  filterBtns.forEach(function (btn) {
    btn.addEventListener("click", function () {
      filterBtns.forEach(function (b) { b.classList.remove("active"); });
      btn.classList.add("active");
      currentFilter = btn.dataset.filter;
      applyLogFilter();
    });
  });

  function applyLogFilter() {
    var items = logOutput.querySelectorAll(".step-item, .step-group");
    items.forEach(function (el) {
      var cls = el.className;
      var show = currentFilter === "all" ||
        (currentFilter === "running" && cls.indexOf("running") !== -1) ||
        (currentFilter === "completed" && cls.indexOf("completed") !== -1) ||
        (currentFilter === "errored" && cls.indexOf("errored") !== -1);
      el.style.display = show ? "" : "none";
    });
  }

  // ── Step log ──
  function addStepGroup(assetId) {
    var groupId = "group-" + assetId;
    if (document.getElementById(groupId)) return groupId;
    var group = document.createElement("div");
    group.className = "step-group";
    group.id = groupId;
    var header = document.createElement("div");
    header.className = "step-group-header";
    header.innerHTML = '<span class="group-chevron">&#9660;</span><span>' + escapeHtml(assetId) + '</span>';
    var body = document.createElement("div");
    body.className = "step-group-body";
    header.addEventListener("click", function () { header.classList.toggle("collapsed"); body.classList.toggle("collapsed"); });
    group.appendChild(header);
    group.appendChild(body);
    logOutput.appendChild(group);
    return groupId;
  }

  function addStep(id, message, parent) {
    debug("[STEP] addStep", id, "parent:", parent, "msg:", message);
    var el = document.createElement("div");
    el.className = "step-item running" + (parent ? " is-child" : "");
    el.id = "step-" + id;
    var indicator = document.createElement("span");
    indicator.className = "step-indicator";
    indicator.innerHTML = '<svg viewBox="0 0 16 16" fill="none"><circle class="ind-ring" cx="8" cy="8" r="6.5" stroke="currentColor" stroke-width="2"/><circle class="ind-arc" cx="8" cy="8" r="6.5" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><path class="ind-check" d="M5 8.5l2 2 4-4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path class="ind-cross" d="M5 5l6 6M11 5l-6 6" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>';
    var msgWrap = document.createElement("span");
    msgWrap.className = "step-message";
    msgWrap.innerHTML = '<span class="step-label">' + escapeHtml(message) + '</span>';
    el.appendChild(indicator);
    el.appendChild(msgWrap);
    if (parent) {
      var parentGroup = document.getElementById("group-" + parent.replace("asset_", ""));
      if (parentGroup) parentGroup.querySelector(".step-group-body").appendChild(el);
      else logOutput.appendChild(el);
    } else {
      var assetMatch = message.match(/Processing\s+(\S+):/);
      if (assetMatch) {
        var gid = addStepGroup(assetMatch[1]);
        var g = document.getElementById(gid);
        if (g) g.querySelector(".step-group-body").appendChild(el);
        else logOutput.appendChild(el);
      } else {
        logOutput.appendChild(el);
      }
    }
    if (!userScrolledUp) {
      logOutput.scrollTop = logOutput.scrollHeight;
    } else if (scrollBtn) {
      scrollBtn.style.display = "block";
    }
    stepElements[id] = el;
    applyLogFilter();
  }

  function completeStep(id) {
    var el = stepElements[id];
    if (!el) { debug("[STEP] completeStep SKIP — no element for", id); return; }
    el.classList.remove("running");
    el.classList.add("completed");
    // CSS handles SVG indicator via .completed class
  }

  function errorStep(id, errMsg) {
    var el = stepElements[id];
    if (!el) { debug("[STEP] errorStep SKIP — no element for", id); return; }
    el.classList.remove("running");
    el.classList.add("errored");
    var msg = el.querySelector(".step-message");
    if (msg && errMsg) msg.innerHTML = msg.innerHTML + '<span class="step-detail">' + escapeHtml(errMsg) + "</span>";
  }

  function forceCompleteAllSteps() {
    debug("[STEP] force-completing all remaining running steps");
    for (var sid in stepElements) {
      if (stepElements[sid].classList.contains("running")) completeStep(sid);
    }
  }

  function addLogLine(text, cls) {
    debug("[LOG]", text, cls || "");
    var el = document.createElement("div");
    el.className = "step-item";
    var msgWrap = document.createElement("span");
    msgWrap.className = "step-message";
    if (cls === "log-success") msgWrap.style.color = "var(--green)";
    else msgWrap.style.color = "var(--text-dim)";
    msgWrap.textContent = text;
    el.appendChild(msgWrap);
    logOutput.appendChild(el);
    if (!userScrolledUp) {
      logOutput.scrollTop = logOutput.scrollHeight;
    } else if (scrollBtn) {
      scrollBtn.style.display = "block";
    }
    applyLogFilter();
  }

  // ── Tab management ──
  function switchTab(tabId) {
    if (typingLock) { debug("[TABS] switchTab blocked — typingLock active"); return; }
    debug("[TABS] switchTab — new:", tabId, "old:", activeTabId);
    activeTabId = tabId;
    updateTabs();
    renderActiveTab();
  }

  function closeTab(tabId) {
    if (typingLock) { debug("[TABS] closeTab blocked — typingLock active"); return; }
    var idx = -1;
    for (var i = 0; i < tabs.length; i++) {
      if (tabs[i].id === tabId) { idx = i; break; }
    }
    if (idx === -1) return;
    tabs.splice(idx, 1);
    if (tabs.length === 0) {
      activeTabId = null;
      tabBar.classList.add("hidden");
      searchBar.classList.add("hidden");
      tableWrap.classList.add("hidden");
      emptyState.classList.remove("hidden");
      return;
    }
    if (tabId === activeTabId) activeTabId = tabs[Math.min(idx, tabs.length - 1)].id;
    updateTabs();
    renderActiveTab();
  }

  function updateTabs() {
    tabList.innerHTML = "";
    if (tabs.length === 0) return;
    tabBar.classList.remove("hidden");
    for (var i = 0; i < tabs.length; i++) {
      var t = tabs[i];
      var el = document.createElement("button");
      el.className = "tab" + (t.id === activeTabId ? " active" : "");
      var statusIcon = "";
      if (t.status === "done") statusIcon = '<span class="tab-status done">&#10003;</span>';
      else if (t.status === "running") statusIcon = '<span class="tab-status running">&#9679;</span>';
      else if (t.status === "error") statusIcon = '<span class="tab-status error">&#10007;</span>';
      else statusIcon = '<span class="tab-status pending">&#9679;</span>';
      el.innerHTML = statusIcon + '<span class="tab-id">' + escapeHtml(t.assetId) + '</span><span class="tab-count">' + t.rows.length + '</span><span class="tab-copy" data-copy="' + t.id + '" title="Copy table for pasting into Sheets">' +
        '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" width="12" height="12"><rect x="3" y="5" width="10" height="10" rx="1"/><path d="M5 5V3a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1h-2"/></svg>' +
        '</span><span class="tab-close" data-close="' + t.id + '">&times;</span>';
      el.addEventListener("click", (function (id) { return function () { switchTab(id); }; })(t.id));
      var closeBtn = el.querySelector(".tab-close");
      closeBtn.addEventListener("click", (function (id) { return function (e) { e.stopPropagation(); closeTab(id); }; })(t.id));
      var copyBtn = el.querySelector(".tab-copy");
      copyBtn.addEventListener("click", (function (id) { return function (e) { e.stopPropagation(); copyTable(id); }; })(t.id));
      tabList.appendChild(el);
    }
    tabList.scrollLeft = tabList.scrollWidth;
  }

  // ── Copy table to clipboard as TSV ──
  function copyTable(tabId) {
    var tab = null;
    for (var i = 0; i < tabs.length; i++) {
      if (tabs[i].id === tabId) { tab = tabs[i]; break; }
    }
    if (!tab || !tab.columns || !tab.rows) {
      if (window.MetaX && window.MetaX.toast) window.MetaX.toast.warning("No data to copy");
      return;
    }
    var lines = [];
    tab.rows.forEach(function (r) {
      var vals = tab.columns.map(function (c) { return (r[c] || "").replace(/\t/g, " ").replace(/\n/g, " "); });
      lines.push(vals.join("\t"));
    });
    var text = lines.join("\n");
    if (window.electronAPI && window.electronAPI.copyToClipboard) {
      window.electronAPI.copyToClipboard(text).then(function () {
        if (window.MetaX && window.MetaX.toast) window.MetaX.toast.success("Table copied (" + tab.rows.length + " rows)");
      }).catch(function () {
        fallbackCopy(text);
      });
    } else {
      fallbackCopy(text);
    }
    function fallbackCopy(str) {
      try {
        navigator.clipboard.writeText(str).then(function () {
          if (window.MetaX && window.MetaX.toast) window.MetaX.toast.success("Table copied (" + tab.rows.length + " rows)");
        }).catch(function () {
          var ta = document.createElement("textarea");
          ta.value = str; ta.style.position = "fixed"; ta.style.opacity = "0";
          document.body.appendChild(ta); ta.select();
          document.execCommand("copy"); document.body.removeChild(ta);
          if (window.MetaX && window.MetaX.toast) window.MetaX.toast.success("Table copied (" + tab.rows.length + " rows)");
        });
      } catch (e) {
        if (window.MetaX && window.MetaX.toast) window.MetaX.toast.error("Copy failed");
      }
    }
  }

  // ── Search ──
  var searchVisible = false;

  function toggleSearch() {
    if (searchVisible) {
      searchBar.classList.add("hidden");
      searchInput.value = "";
      clearSearchHighlights();
      searchVisible = false;
    } else {
      searchBar.classList.remove("hidden");
      searchInput.focus();
      searchVisible = true;
      if (resultsBody.children.length > 0) searchInput.select();
    }
  }

  searchInput.addEventListener("input", function () {
    var q = searchInput.value.trim().toLowerCase();
    if (!q) { clearSearchHighlights(); return; }
    var rows = resultsBody.querySelectorAll("tr");
    var matchCount = 0;
    rows.forEach(function (tr) {
      var cells = tr.querySelectorAll("td");
      var found = false;
      cells.forEach(function (td) {
        td.classList.remove("highlight");
        if (td.dataset.fulltext && td.dataset.fulltext.toLowerCase().indexOf(q) !== -1) {
          td.classList.add("highlight");
          found = true;
        }
      });
      if (found) matchCount++;
    });
    searchCount.textContent = matchCount + " row" + (matchCount !== 1 ? "s" : "");
  });

  function clearSearchHighlights() {
    resultsBody.querySelectorAll(".highlight").forEach(function (el) { el.classList.remove("highlight"); });
    searchCount.textContent = "";
  }

  // ── Modal copy ──
  modalCopy.addEventListener("click", function () {
    var text = modalBody.textContent;
    if (!text) return;
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(function () {
        modalCopy.textContent = "Copied!";
        modalCopy.classList.add("copied");
        setTimeout(function () {
          modalCopy.innerHTML = '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" width="14" height="14"><rect x="3" y="5" width="10" height="10" rx="1" /><path d="M5 5V3a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1h-2" /></svg> Copy';
          modalCopy.classList.remove("copied");
        }, 1500);
      });
    }
  });

  // ── Render active tab ──
  function renderActiveTab(onDone) {
    if (!activeTabId) { debug("[TYPE] renderActiveTab SKIP — no activeTabId"); return; }
    var tab = null;
    for (var i = 0; i < tabs.length; i++) {
      if (tabs[i].id === activeTabId) { tab = tabs[i]; break; }
    }
    if (!tab) { debug("[TYPE] renderActiveTab SKIP — tab not found"); return; }

    debug("[TYPE] renderActiveTab — asset:", tab.assetId, "rows:", tab.rows.length);

    emptyState.classList.add("hidden");
    tableWrap.classList.remove("hidden");
    hideWaiting();

    var cols = tab.columns;
    var rows = tab.rows;

    resultsHead.innerHTML = cols.map(function (c) { return "<th>" + escapeHtml(c) + "</th>"; }).join("");
    resultsBody.innerHTML = "";

    for (var ri = 0; ri < rows.length; ri++) {
      var row = rows[ri];
      var tr = document.createElement("tr");
      for (var ci = 0; ci < cols.length; ci++) {
        var td = document.createElement("td");
        td.dataset.col = cols[ci];
        td.dataset.fulltext = row[cols[ci]] || "";
        td.textContent = "";

        // Click only opens modal if not in edit mode
        td.addEventListener("click", (function (c, r) {
          return function (e) {
            var mx = window.MetaX;
            if (mx && mx.inlineEdit && mx.inlineEdit.isActive()) return;
            modalTitle.textContent = c;
            modalBody.textContent = r[c] || "";
            modal.classList.remove("hidden");
          };
        })(cols[ci], row));

        // Hover preview (2s delay)
        var hoverTimer = null;
        td.addEventListener("mouseenter", (function (cell, text) {
          return function () {
            if (!text || text.length < 30) return;
            hoverTimer = setTimeout(function () {
              var rect = cell.getBoundingClientRect();
              hoverPreview.textContent = text;
              hoverPreview.classList.remove("hidden");
              var top = rect.bottom + 6;
              var left = rect.left;
              if (left + 400 > window.innerWidth) left = window.innerWidth - 410;
              if (left < 4) left = 4;
              hoverPreview.style.top = top + "px";
              hoverPreview.style.left = left + "px";
            }, 1000);
          };
        })(td, row[cols[ci]] || ""));
        td.addEventListener("mouseleave", function () {
          if (hoverTimer) { clearTimeout(hoverTimer); hoverTimer = null; }
          hoverPreview.classList.add("hidden");
        });

        tr.appendChild(td);
      }
      resultsBody.appendChild(tr);
    }

    // Column resize
    document.querySelectorAll("#results-table th").forEach(function (th, idx) {
      th.style.cursor = "col-resize";
    });

    if (tab.rendered) {
      debug("[TYPE] tab already rendered — filling instantly");
      var allTds = resultsBody.querySelectorAll("td");
      for (var tdi = 0; tdi < allTds.length; tdi++) {
        allTds[tdi].textContent = allTds[tdi].dataset.fulltext;
      }
      clearSearchHighlights();
      if (onDone) onDone();
      return;
    }

    // Typewriter
    var session = {};
    activeTypingSession = session;
    var allCells = Array.prototype.slice.call(resultsBody.querySelectorAll("td"));
    var remaining = allCells.length;
    if (remaining === 0) { if (onDone) onDone(); return; }

    skeletonOverlay.classList.remove("hidden");

    var typewriterSafetyTimer = setTimeout(function () {
      if (remaining > 0) {
        debug("[TYPE] SAFETY TIMEOUT — forcing completion");
        remaining = 0;
        if (onDone) onDone();
      }
    }, 15000);

    // Shuffle
    for (var i = allCells.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var tmp = allCells[i];
      allCells[i] = allCells[j];
      allCells[j] = tmp;
    }

    allCells.forEach(function (cell) {
      var text = cell.dataset.fulltext;
      var delay = Math.random() * 200 + 30;
      setTimeout(function () {
        if (activeTypingSession !== session) return;
        skeletonOverlay.classList.add("hidden");
        var ci = 0;
        cell.classList.add("typing");

        function typeChar() {
          if (activeTypingSession !== session) return;
          if (ci < text.length) {
            cell.textContent += text.charAt(ci);
            if (typingSoundToggle && typingSoundToggle.checked && cell.closest("tr") === resultsBody.firstElementChild) playTick();
            ci++;
            if (cell.scrollWidth > cell.clientWidth) {
              cell.textContent = text;
              cell.classList.remove("typing");
              remaining--;
              if (remaining === 0 && activeTypingSession === session) {
                clearTimeout(typewriterSafetyTimer);
                if (onDone) onDone();
              }
              return;
            }
            setTimeout(typeChar, 3);
          } else {
            cell.classList.remove("typing");
            remaining--;
            if (remaining === 0 && activeTypingSession === session) {
              clearTimeout(typewriterSafetyTimer);
              if (onDone) onDone();
            }
          }
        }
        typeChar();
      }, delay);
    });
  }

  // ── Process queue ──
  function processQueue() {
    if (typingLock || assetQueue.length === 0) return;
    typingLock = true;
    var item = assetQueue.shift();
    hideWaiting();

    var tabId = Date.now() + Math.random();
    tabs.push({ id: tabId, assetId: item.assetId, columns: item.columns, rows: item.rows, rendered: false, status: "running" });
    activeTabId = tabId;
    updateTabs();

    renderActiveTab(function onTableDone() {
      debug("[QUEUE] onTableDone fired for:", item.assetId);
      for (var ti = 0; ti < tabs.length; ti++) {
        if (tabs[ti].id === activeTabId) { tabs[ti].rendered = true; tabs[ti].status = "done"; break; }
      }
      addLogLine("✓ " + item.assetId + " — " + item.rows.length + " rows");
      updateTabs();
      typingLock = false;
      if (eventBuffer.length > 0) { flushEventBuffer(); return; }
      if (assetQueue.length === 0) showWaiting();
      processQueue();
      finalizeDone();
    });
  }

  // ── Engine event dispatch ──
  function dispatchEngineEvent(evt) {
    switch (evt.type) {
      case "step": {
        var s = evt.data;
        if (s.status === "running") addStep(s.id, s.message, s.parent);
        else if (s.status === "completed") completeStep(s.id);
        else if (s.status === "error") errorStep(s.id, s.message || "");
        break;
      }
      case "meta":
        setStatus("Processing " + evt.data.total_shows + " show(s)...", "busy");
        break;
      case "status":
        setStatus(evt.data, "busy");
        break;
      case "log":
        addLogLine(evt.data);
        break;
      case "progress":
        progressInfo.textContent = evt.data.current + " / " + evt.data.total;
        progressInfo.classList.remove("hidden");
        updateAssetProgress(evt.data.current, evt.data.total);
        break;
      case "asset_rows": {
        var r = evt.data.rows || [];
        var aid = evt.data.asset_id;
        var cols = evt.data.columns || [];
        assetQueue.push({ assetId: aid, columns: cols, rows: r });
        processQueue();
        break;
      }
      case "error":
        setStatus("Error — see log", "error");
        addLogLine("ERROR: " + evt.data);
        if (window.MetaX && window.MetaX.toast) window.MetaX.toast.error(evt.data);
        break;
      case "done":
        pendingDoneData = evt.data;
        if (evt.data && evt.data.output_dir) {
          lastOutputDir = evt.data.output_dir;
          openOutBtn.classList.remove("hidden");
          triggerS3Upload();
        }
        break;
      case "exit": {
        engineExited = true;
        forceCompleteAllSteps();
        hideWaiting();
        skeletonOverlay.classList.add("hidden");
        if (tabs.length > 0) { tableWrap.classList.remove("hidden"); emptyState.classList.add("hidden"); }
        if (cleanup) { cleanup(); cleanup = null; }
        running = false;
        runBtn.classList.remove("running");
        runBtn.disabled = !outputDir;
        runBtn.innerHTML = '<svg class="icon" viewBox="0 0 20 20" fill="currentColor"><path d="M6.5 3.5v13l10-6.5-10-6.5z"/></svg><span>Generate</span>';
        progressInfo.classList.add("hidden");
        assetProgress.classList.add("hidden");
        if (evt.data.code !== 0) setStatus("Engine exited with code " + evt.data.code, "error");

        finalizeDone();

        // Notify queue module
        if (currentQueueDate) {
          document.dispatchEvent(new CustomEvent("metax:engine-done", { detail: { date: currentQueueDate, code: evt.data.code } }));
          currentQueueDate = null;
        }
        break;
      }
    }
  }

  // ── Open output folder ──
  openOutBtn.addEventListener("click", function () {
    if (window.electronAPI && window.electronAPI.openPath && lastOutputDir) {
      window.electronAPI.openPath(lastOutputDir);
    }
  });

  // ── Settings button ──
  settingsBtn.addEventListener("click", openSettings);
  shortcutsBtn.addEventListener("click", function () {
    shortcutsOverlay.classList.toggle("hidden");
  });

  // ── Settings: toggle S3 fields ──
  s3Enabled.addEventListener("change", function () {
    s3Fields.classList.toggle("hidden", !s3Enabled.checked);
  });

  function applyS3Type(typ) {
    var isMinio = typ === "minio";
    if (s3EndpointField) s3EndpointField.classList.toggle("hidden", !isMinio);
    if (s3RegionField) s3RegionField.classList.toggle("hidden", isMinio);
  }
  if (s3Type) s3Type.addEventListener("change", function () { applyS3Type(s3Type.value); });

  // ── Settings: load ──
  function loadSettings() {
    if (window.electronAPI && window.electronAPI.getSettings) {
      window.electronAPI.getSettings().then(function (s) {
        if (!s) return;
        s3Enabled.checked = !!s.s3_enabled;
        s3Fields.classList.toggle("hidden", !s3Enabled.checked);
        var typ = s.s3_type === "minio" ? "minio" : "aws";
        if (s3Type) s3Type.value = typ;
        applyS3Type(typ);
        if (s.s3_bucket) s3Bucket.value = s.s3_bucket;
        if (s.s3_region) s3Region.value = s.s3_region;
        if (s.s3_prefix) s3Prefix.value = s.s3_prefix;
        if (s.s3_endpoint) s3Endpoint.value = s.s3_endpoint;
        if (s.s3_configured) {
          s3AccessKey.value = "********";
          s3SecretKey.value = "********";
        }
      });
    }
    // Load jingle preference
    try {
      var savedJingle = localStorage.getItem("metax_jingle") || "default";
      if (jingleSelect) jingleSelect.value = savedJingle;
    } catch (e) {}
    // Load accent color preference
    try {
      var savedAccent = localStorage.getItem("metax_accent") || "purple";
      applyAccent(savedAccent);
    } catch (e) {}
    // Load typing sound preference
    try {
      if (typingSoundToggle) typingSoundToggle.checked = localStorage.getItem("metax_typing_sound") === "on";
    } catch (e) {}
  }

  // ── Settings: save ──
  function saveSettings() {
    var ak = s3AccessKey.value.trim();
    var sk = s3SecretKey.value.trim();
    // Only send creds if user actually typed new values (not the "********" placeholder)
    var data = {
      s3_enabled: s3Enabled.checked,
      s3_type: s3Type ? s3Type.value : "aws",
      s3_bucket: s3Bucket.value.trim(),
      s3_region: s3Region.value.trim(),
      s3_prefix: s3Prefix.value.trim(),
      _access_key: ak === "********" ? "" : ak,
      _secret_key: sk === "********" ? "" : sk,
    };
    if (s3Endpoint) data.s3_endpoint = s3Endpoint.value.trim();
    if (window.electronAPI && window.electronAPI.saveSettings) {
      window.electronAPI.saveSettings(data).then(function (ok) {
        if (ok) {
          settingsModal.classList.add("hidden");
          if (window.MetaX && window.MetaX.toast) {
            window.MetaX.toast.success(data.s3_enabled ? "Auto-push to bucket enabled" : "Settings saved");
          }
        } else {
          if (window.MetaX && window.MetaX.toast) window.MetaX.toast.error("Failed to save settings");
        }
      });
    } else {
      settingsModal.classList.add("hidden");
    }
  }

  // ── S3 Upload trigger (main process handles all credential + path logic) ──
  var s3Uploading = false;

  function triggerS3Upload() {
    if (s3Uploading || !window.electronAPI || !window.electronAPI.triggerS3Upload) return;
    s3Uploading = true;

    if (window.MetaX && window.MetaX.toast) {
      window.MetaX.toast.info("Uploading to bucket...", 0);
    }

    window.electronAPI.triggerS3Upload().then(function (result) {
      s3Uploading = false;
      if (!result || result._skipped) return; // Bucket not enabled — silent
      if (result.success) {
        if (window.MetaX && window.MetaX.toast) {
          window.MetaX.toast.success("Uploaded " + result.uploaded + " file(s) to bucket " + result.bucket + "/" + (result.prefix || ""));
        }
      } else {
        if (window.MetaX && window.MetaX.toast) {
          window.MetaX.toast.error("Upload to bucket: " + (result.error || "failed"));
        }
      }
    }).catch(function (e) {
      s3Uploading = false;
      if (window.MetaX && window.MetaX.toast) window.MetaX.toast.error("Bucket upload error: " + e.message);
    });
  }

  settingsSaveBtn.addEventListener("click", saveSettings);
  settingsCancelBtn.addEventListener("click", function () { settingsModal.classList.add("hidden"); });

  // ── Jingle select ──
  if (jingleSelect) {
    jingleSelect.addEventListener("change", function () {
      try { localStorage.setItem("metax_jingle", jingleSelect.value); } catch (e) {}
    });
  }
  // ── Jingle play button (preview) ──
  if (jinglePlayBtn) {
    jinglePlayBtn.addEventListener("click", function () {
      var name = jingleSelect ? jingleSelect.value : "default";
      if (name === "none") return;
      var playFn = JINGLES[name] || JINGLES.default;
      try {
        var actx = new (window.AudioContext || window.webkitAudioContext)();
        if (actx.state === "suspended") actx.resume();
        playFn(actx);
      } catch (e) {}
    });
  }

  // ── Accent color swatches ──
  colorSwatches.forEach(function (sw) {
    sw.addEventListener("click", function () {
      var color = sw.dataset.color;
      if (color) applyAccent(color);
    });
  });

  // ── Typing sound toggle auto-save ──
  if (typingSoundToggle) {
    typingSoundToggle.addEventListener("change", function () {
      try { localStorage.setItem("metax_typing_sound", typingSoundToggle.checked ? "on" : "off"); } catch (e) {}
    });
  }

  function openSettings() {
    loadSettings();
    settingsModal.classList.remove("hidden");
  }

  // ── Run engine ──
  runBtn.addEventListener("click", function () { startEngine(); });

  function startEngine(queueDate) {
    if (running || !window.electronAPI || !outputDir) return;

    var date = queueDate || formatDateISO(selectedDate);

    running = true;
    currentQueueDate = queueDate || null;
    runBtn.disabled = true;
    runBtn.classList.add("running");
    runBtn.innerHTML = '<svg class="icon" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="2"><path d="M10 2v16M2 10h16"/></svg><span>Running...</span>';

    debug("[RUN] Reset — clearing state");
    logOutput.innerHTML = "";
    stepElements = {};
    eventBuffer = [];
    assetQueue = [];
    typingLock = false;
    engineExited = false;
    tabs = [];
    activeTabId = null;
    tabBar.classList.add("hidden");
    tabList.innerHTML = "";
    tableWrap.classList.add("hidden");
    emptyState.classList.remove("hidden");

    hideWaiting();
    setStatus("Starting engine...", "busy");
    progressInfo.classList.remove("hidden");
    progressInfo.textContent = "0 / 0";
    assetProgress.classList.add("hidden");
    skeletonOverlay.classList.add("hidden");
    searchBar.classList.add("hidden");
    searchInput.value = "";

    cleanup = window.electronAPI.onEngineEvent(function (evt) {
      if (typingLock && !flushing && evt.type !== "exit") {
        eventBuffer.push(evt);
        return;
      }
      dispatchEngineEvent(evt);
    });

    window.electronAPI.runEngine({
      date: date,
      outputDir: outputDir,
      extraSegments: parseInt(extraSegsInput.value, 10) || 4,
      subSegments: parseInt(subSegsInput.value, 10) || 2,
    });
  }

  // ── Custom event handlers ──

  // Run from keyboard shortcut
  document.addEventListener("metax:run", function () {
    if (!runBtn.disabled) startEngine();
  });

  // Run with specific date (from queue)
  document.addEventListener("metax:run-date", function (e) {
    var date = e.detail && e.detail.date;
    if (date && window.electronAPI && outputDir) {
      // Set the date display to match
      var parts = date.split("-");
      if (parts.length === 3) {
        pickDate(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
      }
      startEngine(date);
    }
  });

  // Search toggle
  document.addEventListener("metax:toggle-search", toggleSearch);

  // Close active tab
  document.addEventListener("metax:close-active-tab", function () {
    if (activeTabId) closeTab(activeTabId);
  });

  // Next/prev tab
  document.addEventListener("metax:next-tab", function () {
    if (tabs.length < 2) return;
    var idx = -1;
    for (var i = 0; i < tabs.length; i++) {
      if (tabs[i].id === activeTabId) { idx = i; break; }
    }
    if (idx === -1) return;
    switchTab(tabs[(idx + 1) % tabs.length].id);
  });
  document.addEventListener("metax:prev-tab", function () {
    if (tabs.length < 2) return;
    var idx = -1;
    for (var i = 0; i < tabs.length; i++) {
      if (tabs[i].id === activeTabId) { idx = i; break; }
    }
    if (idx === -1) return;
    switchTab(tabs[(idx - 1 + tabs.length) % tabs.length].id);
  });

  // Export all tabs
  document.addEventListener("metax:export-all", function () {
    if (tabs.length === 0) {
      if (window.MetaX && window.MetaX.toast) window.MetaX.toast.warning("No tabs to export");
      return;
    }
    if (window.MetaX && window.MetaX.toast) {
      window.MetaX.toast.success("Exporting " + tabs.length + " tab(s)... (CSV)");
    }
    // For now, log the action
    addLogLine("Export all triggered — " + tabs.length + " tab(s)", "log-success");
  });

  // ── Shortcuts overlay close ──
  if (shortcutsOverlay) {
    var shortcutsBackdrop = shortcutsOverlay.querySelector(".modal-backdrop");
    if (shortcutsBackdrop) {
      shortcutsBackdrop.addEventListener("click", function () { shortcutsOverlay.classList.add("hidden"); });
    }
  }

  // Also expose openSettings to the viewMenu module
  window.MetaX.openSettings = openSettings;

  // ── Settings modal close ──
  if (settingsModalClose) {
    settingsModalClose.addEventListener("click", function () { settingsModal.classList.add("hidden"); });
  }
  if (settingsBackdrop) {
    settingsBackdrop.addEventListener("click", function () { settingsModal.classList.add("hidden"); });
  }

  // ── Modal ──
  function closeModal() { modal.classList.add("hidden"); }
  modalClose.addEventListener("click", closeModal);
  modalBackdrop.addEventListener("click", closeModal);

  // ── Finalize done (deferred status + tone until all rendering completes) ──
  function finalizeDone() {
    if (!pendingDoneData) return;
    if (typingLock) return;
    if (eventBuffer.length > 0) return;
    if (assetQueue.length > 0) return;
    if (!engineExited) return;

    var data = pendingDoneData;
    pendingDoneData = null;

    setStatus(data ? data.shows + " show(s) processed" : "Nothing to do", data ? "success" : "idle");
    if (window.MetaX && window.MetaX.toast) {
      var summary = data ? data.shows + " asset(s) \u2192 " + (data.total_rows || "") + " rows" : "Nothing to do";
      if (lastOutputDir) summary += " \u2192 " + lastOutputDir.split("\\").pop();
      window.MetaX.toast.success(summary);
    }
    // Play selected jingle
    var jingleName = "default";
    try { jingleName = localStorage.getItem("metax_jingle") || "default"; } catch (e) {}
    if (jingleName !== "none" && data && data.shows > 0) {
      var playFn = JINGLES[jingleName] || JINGLES.default;
      try {
        var actx = new (window.AudioContext || window.webkitAudioContext)();
        playFn(actx);
      } catch (e) {}
    }
  }

  // ── Event buffer flush ──
  function flushEventBuffer() {
    var events = eventBuffer;
    eventBuffer = [];
    flushing = true;

    function flushDone() {
      flushing = false;
      if (engineExited) forceCompleteAllSteps();
      if (assetQueue.length > 0) processQueue();
      finalizeDone();
    }

    function processNextFlushEvent() {
      if (events.length === 0) { flushDone(); return; }
      if (typingLock) {
        eventBuffer = events.concat(eventBuffer);
        flushing = false;
        return;
      }
      var evt = events.shift();
      dispatchEngineEvent(evt);
      if (events.length > 0) setTimeout(processNextFlushEvent, 80);
      else flushDone();
    }
    processNextFlushEvent();
  }

  // ── Waiting state ──
  function showWaiting() {
    if (engineExited) return;
    if (assetQueue.length === 0 && !typingLock) {
      waitingState.classList.remove("hidden");
      tableWrap.classList.add("hidden");
    }
  }
  function hideWaiting() { waitingState.classList.add("hidden"); }

  // ── Keyboard shortcuts (legacy — superceded by keyboard module) ──
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") {
      if (!modal.classList.contains("hidden")) { closeModal(); return; }
      if (!shortcutsOverlay.classList.contains("hidden")) { shortcutsOverlay.classList.add("hidden"); return; }
      if (!settingsModal.classList.contains("hidden")) { settingsModal.classList.add("hidden"); return; }
    }
  });

  // ── Column resize ──
  document.addEventListener("mousedown", function (e) {
    var th = e.target.closest("th");
    if (!th || !th.closest("#results-table")) return;
    var rect = th.getBoundingClientRect();
    var offsetX = e.clientX - rect.left;
    if (offsetX < rect.width - 4) return;
    e.preventDefault();
    var table = th.closest("table");
    var colgroup = table.querySelector("colgroup");
    if (!colgroup) {
      colgroup = document.createElement("colgroup");
      var headerCells = table.querySelectorAll("thead th");
      headerCells.forEach(function () { colgroup.appendChild(document.createElement("col")); });
      table.insertBefore(colgroup, table.firstChild);
    }
    var startX = e.clientX;
    var startWidth = th.offsetWidth;

    function onMove(me) {
      var diff = me.clientX - startX;
      var newWidth = Math.max(40, startWidth + diff);
      th.style.width = newWidth + "px";
      th.style.minWidth = newWidth + "px";
    }
    function onUp() { document.removeEventListener("mousemove", onMove); document.removeEventListener("mouseup", onUp); }
    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseup", onUp);
  });

  // ── Update center (from V2) ──
  var updateCheckDone = false;
  var updateData = null;

  function openUpdateModal() {
    updateModal.classList.remove("hidden");
    updateSpinner.classList.remove("hidden");
    updateResult.innerHTML = "";
    updateDlArea.classList.add("hidden");
    updateFeatures.classList.add("hidden");
    updateFooter.style.display = "none";
    updateDlBtn.classList.add("hidden");
    updateInstallBtn.classList.add("hidden");
    updateCheckDone = false;

    if (window.electronAPI && window.electronAPI.checkForUpdates) {
      window.electronAPI.checkForUpdates().then(function (result) {
        updateCheckDone = true;
        updateSpinner.classList.add("hidden");
        if (result.error) {
          if (result.error.toLowerCase().indexOf("no published updates") !== -1) {
            updateResult.innerHTML = '<div class="version-row"><span class="v-label">Current:</span><span class="v-current">v' + escapeHtml(result.currentVersion) + "</span></div>" + '<div class="up-to-date">You\'re up to date!</div>';
          } else {
            updateResult.innerHTML = '<div class="check-error">' + escapeHtml(result.error) + "</div>";
          }
          return;
        }
        updateData = result;
        var html = '<div class="version-row"><span class="v-label">Current:</span><span class="v-current">v' + escapeHtml(result.currentVersion) + "</span></div>";
        if (result.updateAvailable) {
          html += '<div class="version-row"><span class="v-label">Latest:</span><span class="v-latest dl">v' + escapeHtml(result.latestVersion) + "</span></div>";
          html += '<div class="update-prompt">A new version is available!</div>';
          updateResult.innerHTML = html;
          if (result.features && result.features.length > 0) {
            updateFeatures.classList.remove("hidden");
            updateFeaturesList.innerHTML = result.features.map(function (f) { return "<li>" + escapeHtml(f) + "</li>"; }).join("");
          }
          updateFooter.style.display = "flex";
          updateDlBtn.classList.remove("hidden");
          updateDlBtn.disabled = false;
          updateDlBtn.textContent = "Download Update";
        } else {
          html += '<div class="up-to-date">You\'re up to date!</div>';
          updateResult.innerHTML = html;
        }
      }).catch(function (err) {
        updateCheckDone = true;
        updateSpinner.classList.add("hidden");
        updateResult.innerHTML = '<div class="check-error">' + escapeHtml(err.message) + "</div>";
      });
    } else {
      updateSpinner.classList.add("hidden");
      updateResult.innerHTML = '<div class="check-error">Update checker not available</div>';
    }
  }

  function closeUpdateModal() { updateModal.classList.add("hidden"); }
  updateBtn.addEventListener("click", openUpdateModal);
  updateModalClose.addEventListener("click", closeUpdateModal);
  updateBackdrop.addEventListener("click", closeUpdateModal);

  updateDlBtn.addEventListener("click", function () {
    if (!updateData || !updateData.downloadUrl) return;
    updateDlBtn.disabled = true;
    updateDlBtn.textContent = "Downloading...";
    updateDlArea.classList.remove("hidden");
    updateDlFill.style.width = "0%";
    updateDlText.textContent = "Starting download...";
    if (window.electronAPI && window.electronAPI.downloadUpdate) {
      window.electronAPI.downloadUpdate().then(function (dlResult) {
        if (dlResult.error) {
          updateDlText.textContent = "Download failed: " + dlResult.error;
          updateDlBtn.disabled = false;
          updateDlBtn.textContent = "Retry Download";
          return;
        }
        updateDlFill.style.width = "100%";
        updateDlText.textContent = "Download complete!";
        updateDlBtn.classList.add("hidden");
        updateInstallBtn.classList.remove("hidden");
      }).catch(function (err) {
        updateDlText.textContent = "Download failed: " + err.message;
        updateDlBtn.disabled = false;
        updateDlBtn.textContent = "Retry Download";
      });
    }
  });

  updateInstallBtn.addEventListener("click", function () {
    if (window.electronAPI && window.electronAPI.applyUpdate) {
      updateInstallBtn.disabled = true;
      updateInstallBtn.textContent = "Restarting...";
      window.electronAPI.applyUpdate().catch(function () {});
    }
  });

  if (window.electronAPI && window.electronAPI.onDownloadProgress) {
    window.electronAPI.onDownloadProgress(function (pct) {
      updateDlFill.style.width = pct + "%";
      updateDlText.textContent = "Downloading... " + pct + "%";
    });
  }

  // ── Interactive Tutorial: sample data hook ──
  // Loads fully rendered "sample" tabs + logs so the tour can demo the UI
  // without ever running the real engine. Nothing is written to disk.
  function sampleLoad(assets) {
    tabs = [];
    activeTabId = null;
    stepElements = {};
    tabList.innerHTML = "";
    for (var si = 0; si < (assets || []).length; si++) {
      tabs.push({
        id: "sample-" + si,
        assetId: assets[si].assetId,
        columns: assets[si].columns,
        rows: assets[si].rows,
        rendered: true,
        status: "done",
      });
    }
    if (tabs.length) activeTabId = tabs[0].id;
    emptyState.classList.add("hidden");
    tableWrap.classList.remove("hidden");
    tabBar.classList.remove("hidden");
    searchBar.classList.add("hidden");
    skeletonOverlay.classList.add("hidden");
    hideWaiting();
    updateTabs();
    renderActiveTab();
  }

  function sampleLog(events) {
    logOutput.innerHTML = "";
    stepElements = {};
    (events || []).forEach(function (evt) { dispatchEngineEvent(evt); });
    applyLogFilter();
  }

  function sampleRestore(saved) {
    tabs = (saved && saved.tabs) ? saved.tabs.slice() : [];
    activeTabId = (saved && saved.activeTabId) || (tabs.length ? tabs[0].id : null);
    tabList.innerHTML = "";
    if (tabs.length) {
      emptyState.classList.add("hidden");
      tableWrap.classList.remove("hidden");
      tabBar.classList.remove("hidden");
      updateTabs();
      renderActiveTab();
    } else {
      tabBar.classList.add("hidden");
      tableWrap.classList.add("hidden");
      emptyState.classList.remove("hidden");
    }
  }

  window.MetaX.sample = {
    load: sampleLoad,
    log: sampleLog,
    restore: sampleRestore,
  };

  // ── Init ──
  loadState();
  dateText.textContent = formatDate(selectedDate);
  createScrollBtn();
})();
