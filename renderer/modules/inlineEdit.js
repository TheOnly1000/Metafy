(function () {
  var editBtn = document.getElementById("edit-mode-btn");
  var editing = false;
  var applyToColumn = false;
  var activeEditor = null;
  var overlay = document.getElementById("edit-ripple");
  var banner = document.getElementById("edit-banner");
  var saveCellBtn = document.getElementById("edit-save-cell-btn");
  var saveColBtn = document.getElementById("edit-save-col-btn");
  var exitBtn = document.getElementById("edit-exit-btn");
  var rippleX = "50%";
  var rippleY = "50%";
  var lastCol = "";
  var lastVal = "";

  function getPencilPos() {
    var rect = editBtn.getBoundingClientRect();
    rippleX = (rect.left + rect.width / 2) + "px";
    rippleY = (rect.top + rect.height / 2) + "px";
  }

  function startRipple(color) {
    overlay.style.setProperty("--rx", rippleX);
    overlay.style.setProperty("--ry", rippleY);
    overlay.style.setProperty("--ripple-color", color);
    overlay.classList.remove("exit");
    overlay.style.display = "block";
    void overlay.offsetWidth;
    overlay.classList.add("open");
  }

  function endRipple(color) {
    overlay.style.setProperty("--rx", rippleX);
    overlay.style.setProperty("--ry", rippleY);
    overlay.style.setProperty("--ripple-color", color);
    overlay.classList.remove("open");
    void overlay.offsetWidth;
    overlay.classList.add("exit");
    setTimeout(function () {
      overlay.classList.remove("exit");
      overlay.style.display = "none";
    }, 550);
  }

  function toggle() {
    getPencilPos();
    if (editing) disable(); else enable();
  }

  function enable() {
    if (editing) return;
    startRipple("rgba(34,197,94,0.18)");
    setTimeout(function () {
      document.body.classList.add("edit-mode");
      document.body.classList.add("edit-mode-green");
      banner.classList.remove("hidden");
      editing = true;
      editBtn.classList.add("active");
      if (window.MetaX && window.MetaX.toast) window.MetaX.toast.info("Edit mode enabled");
    }, 500);
  }

  function disable() {
    if (!editing) return;
    commitActiveEditor();
    document.body.classList.remove("edit-mode");
    document.body.classList.remove("edit-mode-green");
    banner.classList.add("hidden");
    editing = false;
    editBtn.classList.remove("active");
    endRipple("rgba(59,130,246,0.18)");
  }

  function toggleApplyMode() {
    applyToColumn = !applyToColumn;
    updateIndicator();
    if (window.MetaX && window.MetaX.toast) {
      window.MetaX.toast.info(applyToColumn ? "Apply to column: ON" : "Apply to cell: ON");
    }
  }

  function updateIndicator() {
    var ind = document.getElementById("edit-mode-indicator");
    if (!ind) return;
    ind.style.display = editing ? "flex" : "none";
    var typeEl = document.getElementById("edit-mode-type");
    if (typeEl) typeEl.textContent = applyToColumn ? "Column" : "Cell";
  }

  function commitActiveEditor() {
    if (activeEditor) {
      activeEditor.input.blur();
      activeEditor = null;
    }
  }

  // ── Save all tabs to CSV files ──
  function saveTabs() {
    if (!window.electronAPI || !window.electronAPI.saveEditedCsv) {
      if (window.MetaX && window.MetaX.toast) window.MetaX.toast.error("Save not available");
      return;
    }
    var tabs = window.MetaX && window.MetaX.tabs;
    if (!tabs || tabs.length === 0) {
      if (window.MetaX && window.MetaX.toast) window.MetaX.toast.warning("No tabs to save");
      return;
    }
    var outputDir = document.getElementById("dir-path").textContent;
    if (!outputDir) {
      if (window.MetaX && window.MetaX.toast) window.MetaX.toast.error("No output directory set");
      return;
    }
    commitActiveEditor();
    var promises = [];
    for (var i = 0; i < tabs.length; i++) {
      var tab = tabs[i];
      promises.push(window.electronAPI.saveEditedCsv({
        assetId: tab.assetId,
        columns: tab.columns,
        rows: tab.rows,
        outputDir: outputDir,
      }));
    }
    Promise.all(promises).then(function (results) {
      var ok = results.filter(function (r) { return r.success; }).length;
      var fail = results.filter(function (r) { return !r.success; }).length;
      if (fail === 0) {
        if (window.MetaX && window.MetaX.toast) window.MetaX.toast.success("Saved " + ok + " file(s)");
      } else {
        if (window.MetaX && window.MetaX.toast) window.MetaX.toast.warning("Saved " + ok + ", " + fail + " failed");
      }
    }).catch(function (err) {
      if (window.MetaX && window.MetaX.toast) window.MetaX.toast.error("Save error: " + err.message);
    });
  }

  // ── Save Cell: commit active editor and persist all tabs ──
  function saveCell() {
    saveTabs();
  }

  // ── Save Column: apply active/last cell value to entire column, then save ──
  function saveColumn() {
    var col, val;
    if (activeEditor) {
      col = activeEditor.td.dataset.col;
      val = activeEditor.input.value;
    } else if (lastCol && lastVal !== "") {
      col = lastCol;
      val = lastVal;
    } else {
      if (window.MetaX && window.MetaX.toast) window.MetaX.toast.warning("Edit a cell first, then click Save Column");
      return;
    }
    if (!col) {
      if (window.MetaX && window.MetaX.toast) window.MetaX.toast.error("Cannot determine column");
      return;
    }
    var tab = null;
    if (window.MetaX && window.MetaX.tabs) {
      for (var i = 0; i < window.MetaX.tabs.length; i++) {
        if (window.MetaX.tabs[i].id === window.MetaX.activeTabId) { tab = window.MetaX.tabs[i]; break; }
      }
    }
    if (!tab) {
      if (window.MetaX && window.MetaX.toast) window.MetaX.toast.error("No active tab");
      return;
    }
    var allTds = document.querySelectorAll("#results-body td[data-col='" + col + "']");
    allTds.forEach(function (otherTd) {
      otherTd.textContent = val;
      otherTd.dataset.fulltext = val;
    });
    tab.rows.forEach(function (r) {
      r[col] = val;
    });
    commitActiveEditor();
    saveTabs();
    if (window.MetaX && window.MetaX.toast) window.MetaX.toast.success("Column updated to \"" + val + "\"");
  }

  // ── Cell click handler (capture phase) ──
  document.addEventListener("click", function (e) {
    if (!editing) return;
    var td = e.target.closest("td");
    if (!td) return;
    if (td.classList.contains("editing")) return;

    e.preventDefault();
    e.stopPropagation();

    commitActiveEditor();

    var text = td.dataset.fulltext || td.textContent;
    td.classList.add("editing");
    td.innerHTML = "";

    var input = document.createElement("input");
    input.type = "text";
    input.value = text;
    input.spellcheck = false;
    td.appendChild(input);
    input.focus();
    input.select();

    activeEditor = { td: td, input: input, oldValue: text };

    function finish() {
      var newVal = input.value;
      var col = td.dataset.col;
      td.classList.remove("editing");
      td.textContent = newVal;
      td.dataset.fulltext = newVal;

      if (window.MetaX && window.MetaX.tabs) {
        var tab = null;
        for (var i = 0; i < window.MetaX.tabs.length; i++) {
          if (window.MetaX.tabs[i].id === window.MetaX.activeTabId) { tab = window.MetaX.tabs[i]; break; }
        }
        if (tab) {
          var tr = td.parentNode;
          var rowIndex = Array.prototype.indexOf.call(tr.parentNode.children, tr);
          if (tab.rows[rowIndex]) {
            tab.rows[rowIndex][col] = newVal;
          }
          if (applyToColumn && col) {
            var allTds = document.querySelectorAll("#results-body td[data-col='" + col + "']");
            allTds.forEach(function (otherTd) {
              if (otherTd !== td) {
                otherTd.textContent = newVal;
                otherTd.dataset.fulltext = newVal;
              }
            });
            tab.rows.forEach(function (r) {
              r[col] = newVal;
            });
          }
        }
      }
      lastCol = col;
      lastVal = newVal;
      if (activeEditor && activeEditor.td === td) activeEditor = null;
    }

    input.addEventListener("blur", finish);
    input.addEventListener("keydown", function (ke) {
      if (ke.key === "Enter") { input.blur(); }
      if (ke.key === "Escape") {
        var oldText = activeEditor ? activeEditor.oldValue : text;
        input.value = oldText;
        input.blur();
        lastCol = td.dataset.col;
        lastVal = oldText;
      }
    });
  }, true);

  // ── Event wiring ──
  editBtn.addEventListener("click", toggle);
  if (saveCellBtn) saveCellBtn.addEventListener("click", saveCell);
  if (saveColBtn) saveColBtn.addEventListener("click", saveColumn);
  if (exitBtn) exitBtn.addEventListener("click", function () { getPencilPos(); disable(); });

  // ── Keyboard ──
  if (window.MetaX && window.MetaX.keyboard) {
    window.MetaX.keyboard.register("Ctrl+E", function () { toggle(); });
    window.MetaX.keyboard.register("Ctrl+Shift+A", function () { if (editing) toggleApplyMode(); });
  }

  window.MetaX = window.MetaX || {};
  window.MetaX.inlineEdit = {
    enable: enable,
    disable: disable,
    toggle: toggle,
    isActive: function () { return editing; },
    setApplyToColumn: function (v) { applyToColumn = !!v; updateIndicator(); },
    getApplyToColumn: function () { return applyToColumn; },
  };
})();
