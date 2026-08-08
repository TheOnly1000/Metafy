(function () {
  var container = document.getElementById("toast-container");
  if (!container) return;

  var icons = {
    success: '<span class="toast-icon" style="background:var(--green-dim);color:var(--green)">&#10003;</span>',
    error:   '<span class="toast-icon" style="background:var(--red-dim);color:var(--red)">&#10007;</span>',
    info:    '<span class="toast-icon" style="background:var(--blue-dim);color:var(--blue)">i</span>',
    warning: '<span class="toast-icon" style="background:var(--orange-dim);color:var(--orange)">!</span>',
  };

  function show(msg, type, duration) {
    type = type || "info";
    duration = duration || 4000;
    var el = document.createElement("div");
    el.className = "toast " + type;
    el.innerHTML =
      (icons[type] || icons.info) +
      '<span class="toast-msg">' + escapeHtml(msg) + '</span>' +
      '<button class="toast-close">&times;</button>';

    el.querySelector(".toast-close").addEventListener("click", function () {
      dismiss(el);
    });

    container.appendChild(el);

    if (duration > 0) {
      setTimeout(function () { dismiss(el); }, duration);
    }

    return el;
  }

  function dismiss(el) {
    if (el.classList.contains("removing")) return;
    el.classList.add("removing");
    setTimeout(function () {
      if (el.parentNode) el.parentNode.removeChild(el);
    }, 200);
  }

  function escapeHtml(s) {
    var d = document.createElement("div");
    d.textContent = s;
    return d.innerHTML;
  }

  window.MetaX = window.MetaX || {};
  window.MetaX.toast = { show: show, success: function (m, d) { return show(m, "success", d); }, error: function (m, d) { return show(m, "error", d || 6000); }, info: function (m, d) { return show(m, "info", d); }, warning: function (m, d) { return show(m, "warning", d); }, dismiss: dismiss };
})();
