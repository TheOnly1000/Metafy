(function () {
  var logoBtn = document.getElementById("logo-btn");
  var menu = document.getElementById("view-menu");
  var open = false;

  function toggle() {
    if (open) close(); else openMenu();
  }

  function openMenu() {
    menu.classList.remove("hidden");
    open = true;
  }

  function close() {
    menu.classList.add("hidden");
    open = false;
  }

  logoBtn.addEventListener("click", function (e) {
    e.stopPropagation();
    toggle();
  });

  document.addEventListener("click", function (e) {
    if (open && !menu.contains(e.target) && e.target !== logoBtn) {
      close();
    }
  });

  // Menu action dispatch
  menu.addEventListener("click", function (e) {
    var item = e.target.closest(".menu-item");
    if (!item) return;
    var action = item.dataset.action;
    close();

    switch (action) {
      case "toggle-theme":
        if (window.MetaX && window.MetaX.theme) window.MetaX.theme.toggle();
        break;
      case "toggle-queue":
        if (window.MetaX && window.MetaX.queue) window.MetaX.queue.toggle();
        break;
      case "toggle-statusbar":
        var sb = document.getElementById("statusbar");
        sb.style.display = sb.style.display === "none" ? "" : "none";
        break;
      case "fullscreen":
        if (document.documentElement.requestFullscreen) {
          if (document.fullscreenElement) document.exitFullscreen();
          else document.documentElement.requestFullscreen();
        }
        break;
      case "export-all":
        exportAllTabs();
        break;
      case "settings":
        openSettings();
        break;
      case "tutorial":
        if (window.MetaX && window.MetaX.tutorial) {
          if (window.MetaX.tutorial.isActive()) window.MetaX.tutorial.end();
          else window.MetaX.tutorial.start();
        }
        break;
      case "about":
        if (window.MetaX && window.MetaX.toast) {
          window.MetaX.toast.info("MetaX V3 — Built for Amagi's Creative Team", 5000);
        }
        break;
    }
  });

  function exportAllTabs() {
    if (!window.MetaX || !window.MetaX.tabs || window.MetaX.tabs.length === 0) {
      if (window.MetaX && window.MetaX.toast) window.MetaX.toast.warning("No tabs to export");
      return;
    }
    // Dispatch a custom event that app.js listens to
    document.dispatchEvent(new CustomEvent("metax:export-all"));
  }

  function openSettings() {
    if (window.MetaX && window.MetaX.openSettings) {
      window.MetaX.openSettings();
    } else {
      var modal = document.getElementById("settings-modal");
      if (modal) modal.classList.remove("hidden");
    }
  }

  window.MetaX = window.MetaX || {};
  window.MetaX.viewMenu = { open: openMenu, close: close, toggle: toggle };
})();
