(function () {
  var themeBtn = document.getElementById("theme-btn");
  var themeIcon = document.getElementById("theme-icon");
  var html = document.documentElement;

  var sunPath = '<circle cx="8" cy="8" r="3"/><path d="M8 1v2M8 13v2M1 8h2M13 8h2M3.05 3.05l1.41 1.41M11.54 11.54l1.41 1.41M3.05 12.95l1.41-1.41M11.54 4.46l1.41-1.41"/>';
  var moonPath = '<path d="M13.5 9.5A6 6 0 016.5 2.5 6 6 0 1014 10.5a4 4 0 01-.5-1z"/>';

  function getTheme() { return html.getAttribute("data-theme") || "dark"; }
  function setTheme(t) {
    html.setAttribute("data-theme", t);
    themeIcon.innerHTML = t === "dark" ? sunPath : moonPath;
    try { localStorage.setItem("metax_theme", t); } catch (e) {}
  }
  function toggle() {
    setTheme(getTheme() === "dark" ? "light" : "dark");
    var mx = window.MetaX;
    if (mx && mx.toast) mx.toast.info("Switched to " + getTheme() + " theme");
  }

  // Load saved
  try {
    var saved = localStorage.getItem("metax_theme");
    if (saved === "light" || saved === "dark") setTheme(saved);
  } catch (e) {}

  themeBtn.addEventListener("click", toggle);

  // Register keyboard shortcut
  if (window.MetaX && window.MetaX.keyboard) {
    window.MetaX.keyboard.register("Ctrl+T", function () { toggle(); });
  }

  window.MetaX = window.MetaX || {};
  window.MetaX.theme = { get: getTheme, set: setTheme, toggle: toggle };
})();
