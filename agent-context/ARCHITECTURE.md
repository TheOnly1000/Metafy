# MetaX V4 — ARCHITECTURE.md

Patterns:
- Renderer communicates with main only through preload-exposed `window.electronAPI` (contextBridge).
- All credential handling lives in main via `safeStorage` (DPAPI). Never send decrypted secrets to renderer.
- Settings persisted in CONFIG_PATH config.json atomically (atomicWriteFileSync).
- Upload logic: uploadToS3(outputDir, s3Config) — MinIO uses endpoint + forcePathStyle:true.
- Bootstrapping: discoverPython() tries py/python/python3; if none, ensureEmbeddedPython() downloads python-3.12.8-embed-amd64.zip, extracts via PowerShell, patches `python312._pth` to mount bundled libs.
- Update flow: checkForUpdates → queryGitHubForUpdates(repo) reads /releases/latest → compares versions → download asset exe/msi → applyUpdate launches the exe and quits.
- Tutorial (tutorial.js) uses `window.MetaX.sample` hooks from app.js; overlay blocks nothing visible during tour.
- Naming: IDs kebab-case, `window.MetaX.<mod>` namespace, ES5-style functions.

Conventions:
- No comments unless explaining tricky logic (kept minimal in this project).
- CSS uses `[data-theme=light]` overrides + CSS variables.
- Version bumps: package.json version + productName/appId suffix in build config.