# MetaX V4 — MAP.md

- main.js — main process: splash, dependency bootstrapping, engine spawn, S3/MinIO upload, settings IPC (encrypted secrets), GitHub update IPC, apply-update.
- engine.py — standalone Python CLI emitting JSON events to stdout; bundles python_libs via sys.path.
- preload.js / preload-splash.js — contextBridge API surface.
- splash.html — pre-flight check UI (python, openpyxl, requests, config).
- renderer/index.html — main app DOM incl. settings modal (S3/MinIO) + update modal.
- renderer/app.js — main renderer logic (tabs, table, search, edit, S3 trigger, update center UI, sample hook for tutorial).
- renderer/style.css — all styling incl. tutorial overlay (test-suite).
- renderer/modules/ toasts (tutorial.js, queue.js, keyboard.js, theme.js, viewMenu.js, toast.js, inlineEdit.js) — feature modules using `window.MetaX` namespace.
- python_libs/ — bundled pure-Python deps (openpyxl, requests, etc.).
- agent-context/ — this memory system.