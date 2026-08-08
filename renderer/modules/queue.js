(function () {
  var panel = document.getElementById("queue-panel");
  var queueBtn = document.getElementById("queue-btn");
  var queueClose = document.getElementById("queue-close");
  var queueList = document.getElementById("queue-list");
  var queueCount = document.getElementById("queue-count");
  var dateInput = document.getElementById("queue-date-input");
  var addBtn = document.getElementById("queue-add-btn");
  var runBtn = document.getElementById("queue-run-btn");
  var autoCheck = document.getElementById("queue-auto");
  var progressFill = document.getElementById("queue-progress-fill");
  var progressText = document.getElementById("queue-progress-text");
  var queueProgress = document.getElementById("queue-progress");
  var queueStatus = document.getElementById("queue-status");

  var dates = [];
  var running = false;

  function init() {
    // Set default date to today
    var d = new Date();
    dateInput.value = d.getFullYear() + "-" +
      String(d.getMonth() + 1).padStart(2, "0") + "-" +
      String(d.getDate()).padStart(2, "0");

    // Load saved
    try {
      var saved = JSON.parse(localStorage.getItem("metax_queue") || "[]");
      if (Array.isArray(saved)) dates = saved;
      var auto = localStorage.getItem("metax_queue_auto");
      if (auto === "true") autoCheck.checked = true;
    } catch (e) {}

    render();
  }

  function save() {
    try {
      localStorage.setItem("metax_queue", JSON.stringify(dates));
      localStorage.setItem("metax_queue_auto", autoCheck.checked);
    } catch (e) {}
  }

  function toggle() {
    if (panel.classList.contains("hidden")) show(); else hide();
  }

  function show() {
    panel.classList.remove("hidden");
    queueBtn.classList.add("active");
  }

  function hide() {
    panel.classList.add("hidden");
    queueBtn.classList.remove("active");
  }

  function addDate() {
    var val = dateInput.value;
    if (!val) return;
    if (dates.indexOf(val) !== -1) {
      if (window.MetaX && window.MetaX.toast) window.MetaX.toast.warning("Date already in queue");
      return;
    }
    dates.push(val);
    save();
    render();
    if (window.MetaX && window.MetaX.toast) window.MetaX.toast.success("Added " + val + " to queue");
  }

  function removeDate(d) {
    dates = dates.filter(function (x) { return x !== d; });
    save();
    render();
  }

  function render() {
    queueList.innerHTML = "";
    dates.forEach(function (d) {
      var el = document.createElement("span");
      el.className = "queue-date-item";
      el.innerHTML =
        '<span>' + d + '</span>' +
        '<button class="queue-date-del">&times;</button>';
      el.querySelector(".queue-date-del").addEventListener("click", function () {
        removeDate(d);
      });
      queueList.appendChild(el);
    });
    queueCount.textContent = dates.length + " date" + (dates.length !== 1 ? "s" : "");
    runBtn.disabled = dates.length === 0 || running;
  }

  function setProgress(pct, text) {
    if (pct >= 0) {
      queueProgress.classList.remove("hidden");
      progressFill.style.width = pct + "%";
    } else {
      queueProgress.classList.add("hidden");
    }
    if (text) progressText.textContent = text;
  }

  function runQueue() {
    if (running || dates.length === 0) return;
    running = true;
    runBtn.disabled = true;

    // Show queue status in status bar
    queueStatus.classList.remove("hidden");
    queueStatus.textContent = "Queue running...";

    if (window.MetaX && window.MetaX.toast) window.MetaX.toast.info("Queue started: " + dates.length + " date(s)");

    // Process dates sequentially
    var idx = 0;
    var total = dates.length;
    setProgress(0, "0 / " + total);

    function processNext() {
      if (idx >= total) {
        running = false;
        runBtn.disabled = false;
        queueStatus.classList.add("hidden");
        setProgress(100, "Done!");
        if (window.MetaX && window.MetaX.toast) window.MetaX.toast.success("Queue completed: " + total + " date(s)");

        // Mark all done
        var items = queueList.querySelectorAll(".queue-date-item");
        items.forEach(function (el) { el.classList.add("done"); });
        return;
      }

      var date = dates[idx];
      setProgress(Math.round((idx / total) * 100), (idx + 1) + " / " + total + " — " + date);

      // Listen for engine done to advance
      function onEngineDone(e) {
        if (e.detail && e.detail.date === date) {
          document.removeEventListener("metax:engine-done", onEngineDone);
          var items = queueList.querySelectorAll(".queue-date-item");
          if (items[idx]) items[idx].classList.add("done");
          idx++;
          processNext();
        }
      }
      document.addEventListener("metax:engine-done", onEngineDone);

      // Dispatch event to run engine for this date
      document.dispatchEvent(new CustomEvent("metax:run-date", { detail: { date: date } }));
    }

    processNext();
  }

  // Check midnight auto-run
  function checkMidnight() {
    if (!autoCheck.checked) return;
    if (running) return;

    var now = new Date();
    if (now.getHours() === 0 && now.getMinutes() === 0) {
      var today = now.getFullYear() + "-" +
        String(now.getMonth() + 1).padStart(2, "0") + "-" +
        String(now.getDate()).padStart(2, "0");

      // Only add if not already in queue
      if (dates.indexOf(today) === -1) {
        dates.push(today);
        save();
        render();
        if (window.MetaX && window.MetaX.toast) {
          window.MetaX.toast.info("Auto-added today's date to queue (12 AM trigger)");
        }
      }

      if (!running && dates.length > 0) {
        runQueue();
      }
    }
  }

  // Check every 30 seconds
  setInterval(checkMidnight, 30000);

  // Events
  queueBtn.addEventListener("click", toggle);
  queueClose.addEventListener("click", hide);
  addBtn.addEventListener("click", addDate);
  dateInput.addEventListener("keydown", function (e) {
    if (e.key === "Enter") addDate();
  });
  runBtn.addEventListener("click", runQueue);

  // Register keyboard shortcut
  if (window.MetaX && window.MetaX.keyboard) {
    window.MetaX.keyboard.register("Ctrl+Shift+Q", function () { toggle(); });
  }

  init();

  window.MetaX = window.MetaX || {};
  window.MetaX.queue = { addDate: addDate, removeDate: removeDate, toggle: toggle, show: show, hide: hide, run: runQueue, getDates: function () { return dates.slice(); }, isRunning: function () { return running; } };
})();
