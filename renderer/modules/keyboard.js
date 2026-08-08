(function () {
  var keys = {};

  function register(combo, fn, desc) {
    keys[combo] = { fn: fn, desc: desc };
  }

  function unregister(combo) {
    delete keys[combo];
  }

  document.addEventListener("keydown", function (e) {
    // Don't intercept when typing in inputs
    var tag = document.activeElement && document.activeElement.tagName;
    if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") {
      // Allow Escape and Ctrl+Enter even when focused on input
      if (e.key !== "Escape" && !(e.key === "Enter" && (e.ctrlKey || e.metaKey)) && !(e.key === "f" && (e.ctrlKey || e.metaKey))) {
        return;
      }
    }

    var parts = [];
    if (e.ctrlKey || e.metaKey) parts.push("Ctrl");
    if (e.shiftKey) parts.push("Shift");
    if (e.altKey) parts.push("Alt");
    var key = e.key;
    if (key === " ") key = "Space";
    if (key.length === 1) key = key.toUpperCase();
    parts.push(key);
    var combo = parts.join("+");

    var handler = keys[combo];
    if (handler) {
      e.preventDefault();
      handler.fn(e);
    }
  });

  // Register default shortcuts (handlers set up later by other modules)
  function setupDefaults() {
    var mx = window.MetaX;

    // Ctrl+Enter — Run
    register("Ctrl+Enter", function () {
      var runBtn = document.getElementById("run-btn");
      if (runBtn && !runBtn.disabled) {
        document.dispatchEvent(new CustomEvent("metax:run"));
      }
    });

    // Ctrl+F — Search
    register("Ctrl+F", function () {
      if (mx && mx.tabs && mx.tabs.length > 0) {
        document.dispatchEvent(new CustomEvent("metax:toggle-search"));
      }
    });

    // Ctrl+W — Close tab
    register("Ctrl+W", function () {
      document.dispatchEvent(new CustomEvent("metax:close-active-tab"));
    });

    // Ctrl+Tab — Next tab
    register("Ctrl+Tab", function () {
      document.dispatchEvent(new CustomEvent("metax:next-tab"));
    });

    // Ctrl+Shift+Tab — Prev tab
    register("Ctrl+Shift+Tab", function () {
      document.dispatchEvent(new CustomEvent("metax:prev-tab"));
    });

    // Ctrl+, — Settings
    register("Ctrl+,", function () {
      if (window.MetaX && window.MetaX.openSettings) {
        window.MetaX.openSettings();
      } else {
        var modal = document.getElementById("settings-modal");
        if (modal) modal.classList.remove("hidden");
      }
    });

    // Ctrl+Shift+E — Export all tabs
    register("Ctrl+Shift+E", function () {
      document.dispatchEvent(new CustomEvent("metax:export-all"));
    });

    // F11 — Fullscreen
    register("F11", function () {
      if (document.documentElement.requestFullscreen) {
        if (document.fullscreenElement) document.exitFullscreen();
        else document.documentElement.requestFullscreen();
      }
    });

    // Ctrl+/ — Shortcuts overlay
    register("Ctrl+/", function () {
      var overlay = document.getElementById("shortcuts-overlay");
      if (overlay) overlay.classList.toggle("hidden");
    });
  }

  setupDefaults();

  window.MetaX = window.MetaX || {};
  window.MetaX.keyboard = { register: register, unregister: unregister };
})();
