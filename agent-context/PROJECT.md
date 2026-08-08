# MetaX V4 — PROJECT.md

Identity: Electron-based CSV generator for Amagi's Creative Team.
Tech stack: Electron 43, vanilla JS renderer (no framework), Python 3.12 engine (engine.py), @aws-sdk/client-s3, electron-builder (NSIS).

Constraints:
- Renderer uses contextIsolation + sandbox. Renderer NEVER sees decrypted secrets.
- configPath() shared: `../config.json` relative to __dirname (dev) / process.resourcesPath (packaged).
- Two supported upload targets: AWS S3 (`s3_type: "aws"`) and local MinIO (`s3_type: "minio"`).
- Minimum Python; if absent the app bootstraps an embedded 3.12.8 runtime from python.org into userData/pykeep.
- Updates come from GitHub Releases (`config.update_repo` = "TheOnly1000/MetaFy"). No releases yet => "You're up to date".