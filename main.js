const { app, BrowserWindow, ipcMain, dialog, Menu, safeStorage, clipboard } = require("electron");
const path = require("path");
const fs = require("fs");
const crypto = require("crypto");
const { spawn } = require("child_process");
const https = require("https");
const http = require("http");
const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");

let mainWindow;
let splashWindow;

const PYTHON_CMDS = process.platform === "win32" ? ["py", "python", "python3"] : ["python3", "python"];
let pythonCmd = PYTHON_CMDS[0];

// Bundled pure-Python deps (openpyxl, requests) shipped with the app
const EMERGE_LIBS = "python_libs";

// Resolve paths in dev (__dirname) and packaged (process.resourcesPath)
function resPath(filename) {
  if (process.resourcesPath) {
    const p = path.join(process.resourcesPath, filename);
    if (fs.existsSync(p)) return p;
  }
  return path.join(__dirname, filename);
}

function configPath() {
  // In dev: ../config.json; in packaged: process.resourcesPath/config.json
  if (process.resourcesPath) {
    const p = path.join(process.resourcesPath, "config.json");
    if (fs.existsSync(p)) return p;
  }
  return path.join(__dirname, "..", "config.json");
}

const CONFIG_PATH = configPath();
const PACKAGE_PATH = path.join(__dirname, "package.json");

// Atomic file write: write to tmp then rename (prevents partial write on crash)
function atomicWriteFileSync(filePath, data) {
  const tmpPath = filePath + ".tmp." + Date.now();
  fs.writeFileSync(tmpPath, data, "utf-8");
  try {
    const fd = fs.openSync(tmpPath, "r+");
    try { fs.fsyncSync(fd); } finally { fs.closeSync(fd); }
  } catch (e) {
    // fsync may fail on some Windows configurations — best-effort
  }
  fs.renameSync(tmpPath, filePath);
}

// ── Utility ──

function httpGet(url) {
  return new Promise((resolve, reject) => {
    const driver = url.startsWith("https") ? https : http;
    driver.get(url, { headers: { "User-Agent": "MetaX/2.0" } }, (res) => {
      let data = "";
      res.on("data", (c) => { data += c; });
      res.on("end", () => resolve(data));
    }).on("error", reject);
  });
}

function downloadFile(url, dest, onProgress) {
  return new Promise((resolve, reject) => {
    const driver = url.startsWith("https") ? https : http;
    driver.get(url, { headers: { "User-Agent": "MetaX/2.0" } }, (res) => {
      const total = parseInt(res.headers["content-length"], 10) || 0;
      let received = 0;
      const file = fs.createWriteStream(dest);
      res.on("data", (chunk) => {
        received += chunk.length;
        file.write(chunk);
        if (total && onProgress) onProgress(Math.round((received / total) * 100));
      });
      res.on("end", () => {
        file.end();
        resolve(dest);
      });
      res.on("error", (e) => { file.close(); fs.unlinkSync(dest); reject(e); });
    }).on("error", reject);
  });
}

function parseVersion(str) {
  const m = String(str).match(/(\d+)\.(\d+)\.(\d+)/);
  if (!m) return null;
  return { major: parseInt(m[1],10), minor: parseInt(m[2],10), patch: parseInt(m[3],10), raw: m[0] };
}

function isNewer(a, b) {
  if (!a) return false;
  if (!b) return true;
  if (a.major !== b.major) return a.major > b.major;
  if (a.minor !== b.minor) return a.minor > b.minor;
  return a.patch > b.patch;
}

function loadJSON(p) {
  return JSON.parse(fs.readFileSync(p, "utf-8"));
}

// ── Secure credential helpers (safeStorage + DPAPI) ──

function encryptSecret(plaintext) {
  if (!plaintext || !safeStorage.isEncryptionAvailable()) return null;
  try {
    const buf = safeStorage.encryptString(String(plaintext));
    return buf.toString("base64");
  } catch (e) {
    console.error("Encryption failed:", e);
    return null;
  }
}

function decryptSecret(encoded) {
  if (!encoded || !safeStorage.isEncryptionAvailable()) return null;
  try {
    const buf = Buffer.from(encoded, "base64");
    return safeStorage.decryptString(buf);
  } catch (e) {
    console.error("Decryption failed:", e);
    return null;
  }
}

// ── S3 Upload ──

async function uploadToS3(outputDir, s3Config) {
  if (!s3Config || !s3Config.s3_enabled || !s3Config.s3_bucket) {
    return { success: false, error: "S3 not configured" };
  }

  const secretKey = decryptSecret(s3Config._secret_key);
  const accessKey = decryptSecret(s3Config._access_key);

  if (!secretKey || !accessKey) {
    return { success: false, error: "S3 credentials not available or corrupted" };
  }

  // Validate bucket exists and list CSV files
  const csvFiles = [];
  try {
    const items = fs.readdirSync(outputDir, { withFileTypes: true });
    for (const item of items) {
      if (item.isFile() && item.name.endsWith(".csv")) {
        csvFiles.push(path.join(outputDir, item.name));
      }
    }
  } catch (e) {
    return { success: false, error: "Cannot read output directory: " + e.message };
  }

  if (csvFiles.length === 0) {
    return { success: false, error: "No CSV files found to upload" };
  }

  const isMinio = s3Config.s3_type === "minio";
  const client = new S3Client({
    region: s3Config.s3_region || "us-east-1",
    credentials: {
      accessKeyId: accessKey,
      secretAccessKey: secretKey,
    },
    // MinIO (or any S3-compatible local store) needs a custom endpoint + path-style addressing
    ...(isMinio ? {
      endpoint: s3Config.s3_endpoint || "http://localhost:9000",
      forcePathStyle: true,
    } : {}),
  });

  const prefix = (s3Config.s3_prefix || "").replace(/\/?$/, "/");
  const bucket = s3Config.s3_bucket;
  const results = { uploaded: [], failed: [] };

  for (const filePath of csvFiles) {
    const fileName = path.basename(filePath);
    const key = prefix + fileName;

    try {
      const fileContent = fs.readFileSync(filePath);
      await client.send(new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        Body: fileContent,
        ContentType: "text/csv",
      }));
      results.uploaded.push(fileName);
    } catch (e) {
      results.failed.push({ file: fileName, error: e.message });
    }
  }

  client.destroy();

  return {
    success: results.failed.length === 0,
    uploaded: results.uploaded.length,
    failed: results.failed.length,
    errors: results.failed,
    bucket,
    prefix,
  };
}

// ── Splash window ──

function createSplash() {
  splashWindow = new BrowserWindow({
    width: 400,
    height: 440,
    frame: false,
    transparent: true,
    hasShadow: false,
    resizable: false,
    center: true,
    show: false,
    title: "MetaX",
    webPreferences: {
      preload: path.join(__dirname, "preload-splash.js"),
      contextIsolation: true,
      nodeIntegration: false,
      // Splash uses inline <script> blocks — cannot sandbox
    },
  });

  splashWindow.loadFile(path.join(__dirname, "splash.html"));

  splashWindow.once("ready-to-show", () => {
    splashWindow.show();
  });
}

ipcMain.on("splash-close", () => {
  if (splashWindow) {
    splashWindow.close();
    splashWindow = null;
  }
});

// ── Dependency checks ──

function runCheck(command, args, timeout = 30000, env) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { windowsHide: true, timeout, env });
    let stderr = "";
    child.stderr.on("data", (d) => { stderr += d.toString(); });
    child.on("close", (code) => {
      if (code === 0) resolve(true);
      else reject(new Error(stderr.trim() || `exit code ${code}`));
    });
    child.on("error", (e) => reject(e));
  });
}

function pythonEnv() {
  // Point PYTHONPATH at the bundled pure-Python libs so even a bare installer
  // python.exe can import openpyxl/requests without pip.
  const libs = path.join(process.resourcesPath || __dirname, EMERGE_LIBS);
  const old = process.env.PYTHONPATH || "";
  return {
    ...process.env,
    PYTHONIOENCODING: "utf-8",
    PYTHONPATH: fs.existsSync(libs) ? ((old ? old + path.delimiter : "") + libs) : old,
  };
}

let embeddedPythonDir = null;

async function ensureEmbeddedPython() {
  // Downloads Python's embeddable zip into userData and points pythonCmd at it.
  // This lets the app run even when the machine has no Python at all.
  const ver = "3.12.8";
  const baseDir = path.join(app.getPath("userData"), "pykeep");
  const exe = path.join(baseDir, "python.exe");
  if (fs.existsSync(exe)) {
    patchEmbeddedPth(baseDir, exe);
    pythonCmd = exe;
    return exe;
  }
  const url = `https://www.python.org/ftp/python/${ver}/python-${ver}-embed-amd64.zip`;
  const zip = path.join(baseDir, "python-embed.zip");
  fs.mkdirSync(baseDir, { recursive: true });
  await downloadFile(url, zip);
  const { execFileSync } = require("child_process");
  execFileSync("powershell.exe", ["-NoProfile", "-ExecutionPolicy", "Bypass", "-Command",
    `Expand-Archive -LiteralPath '${zip}' -DestinationPath '${baseDir}' -Force`],
    { windowsHide: true, timeout: 120000 });
  fs.unlinkSync(zip);
  if (!fs.existsSync(exe)) throw new Error("Embedded Python extraction failed");
  patchEmbeddedPth(baseDir, exe);
  pythonCmd = exe;
  return exe;
}

function patchEmbeddedPth(baseDir, exe) {
  // The embeddable dist uses a "python3xx._pth" file that overrides PYTHONPATH.
  // Append our bundled libs dir + the stdlib so pip imports and openpyxl/requests resolve.
  try {
    const files = fs.readdirSync(baseDir).filter((f) => /^python\d+\._pth$/.test(f));
    if (!files.length) return;
    const pthFile = path.join(baseDir, files[0]);
    let content = fs.readFileSync(pthFile, "utf-8");
    const libsAbs = path.join(process.resourcesPath || __dirname, EMERGE_LIBS);
    if (fs.existsSync(libsAbs) && content.indexOf(libsAbs) === -1) {
      const lines = content.split(/\r?\n/);
      // embeddable zip keeps "python312.zip" + "." + maybe "import site"
      const importSite = lines.some((l) => /^import site/.test(l));
      content = lines.join("\n") + "\n" + libsAbs + "\n" + (importSite ? "" : "import site\n");
      fs.writeFileSync(pthFile, content, "utf-8");
    }
  } catch (e) {
    console.error("patchEmbeddedPth:", e);
  }
}

async function discoverPython() {
  for (const cmd of PYTHON_CMDS) {
    try {
      await runCheck(cmd, ["--version"]);
      pythonCmd = cmd;
      return;
    } catch (_) {}
  }
  // No Python found on PATH — leave pythonCmd as the first candidate; the
  // check loop will bootstrap an embedded runtime automatically.
  pythonCmd = PYTHON_CMDS[0];
}

function checkPython() {
  return runCheck(pythonCmd, ["--version"], 30000, pythonEnv());
}

function checkOpenpyxl() {
  return runCheck(pythonCmd, ["-c", "import openpyxl"], 30000, pythonEnv());
}

function checkRequests() {
  return runCheck(pythonCmd, ["-c", "import requests"], 30000, pythonEnv());
}

function checkConfig() {
  return new Promise((resolve, reject) => {
    if (!fs.existsSync(CONFIG_PATH)) {
      return reject(new Error("Configuration file not found"));
    }
    try {
      const cfg = JSON.parse(fs.readFileSync(CONFIG_PATH, "utf-8"));
      if (!cfg.sheet_url) {
        return reject(new Error('config.json missing "sheet_url"'));
      }
      resolve(true);
    } catch (e) {
      reject(new Error("Invalid config.json: " + e.message));
    }
  });
}

const CHECKS = [
  { id: "python",    label: "Python runtime",          run: checkPython,     canInstall: true,  pkg: "runtime" },
  { id: "openpyxl",  label: "openpyxl library",        run: checkOpenpyxl,   canInstall: true,  pkg: "openpyxl" },
  { id: "requests",  label: "requests library",        run: checkRequests,   canInstall: true,  pkg: "requests" },
  { id: "config",    label: "Configuration file",      run: checkConfig,     canInstall: false },
];

function sendProgress(data) {
  if (splashWindow && !splashWindow.isDestroyed()) {
    splashWindow.webContents.send("splash-progress", data);
  }
}

function delay(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function installDependency(check) {
  return new Promise((resolve, reject) => {
if (check.pkg === "runtime") {
      // No Python at all → download the embedded Python and point pythonCmd at it.
      ensureEmbeddedPython().then(resolve, reject);
      return;
    }
    const args = ["-m", "pip", "install", check.pkg, "--quiet"];
    const child = spawn(pythonCmd, args, { windowsHide: true, timeout: 120000, env: pythonEnv() });
    let stderr = "";
    child.stderr.on("data", (d) => { stderr += d.toString(); });
    child.on("close", (code) => {
      if (code === 0) resolve(true);
      else reject(new Error(stderr.trim() || `pip install exit code ${code}`));
    });
    child.on("error", (e) => reject(e));
  });
}

async function runAllChecks() {
  for (const check of CHECKS) {
    sendProgress({ type: "advance", id: check.id });
    await delay(1400); // wait for typewriter animation in splash
    try {
      await check.run();
      sendProgress({ type: "done", id: check.id });
    } catch (err) {
      if (check.canInstall) {
        sendProgress({ type: "installing", id: check.id, detail: `Installing ${check.pkg}...` });
        try {
          await installDependency(check);
          await delay(300);
          await check.run(); // re-check after install
          sendProgress({ type: "done", id: check.id });
        } catch (installErr) {
          sendProgress({ type: "fail", id: check.id, detail: installErr.message });
          await delay(400);
          return false;
        }
      } else {
        sendProgress({ type: "fail", id: check.id, detail: err.message });
        return false;
      }
    }
    await delay(400);
  }
  return true;
}

// ── Update helpers ──

let downloadedExePath = null;
let pendingUpdateUrl = null;
let pendingUpdateSha256 = null;

function httpGet(url) {
  return new Promise((resolve, reject) => {
    const driver = url.startsWith("https") ? https : http;
    driver.get(url, { headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36" } }, (r) => {
      if (r.statusCode >= 300 && r.statusCode < 400 && r.headers.location) {
        httpGet(r.headers.location).then(resolve, reject);
        return;
      }
      let d = "";
      r.on("data", (c) => { d += c; });
      r.on("end", () => resolve(d));
    }).on("error", reject);
  });
}

// Simple update channel: the repo's Releases page lists "MetaX-Setup-VERSION.exe".
// If that release's version number is higher than the installed one, offer it.
async function queryGitHubForUpdates(repo) {
  const apiUrl = `https://api.github.com/repos/${repo}/releases/latest`;
  const raw = await httpGet(apiUrl);
  const data = JSON.parse(raw);
  if (data.message && data.documentation_url) {
    // 404 — repo has no published releases yet (or is private/empty)
    throw new Error("No published updates yet");
  }
  const tag = data.tag_name || "";
  const verMatch = tag.match(/(\d+)\.(\d+)\.(\d+)/);
  if (!verMatch) {
    throw new Error("Invalid release version tag: " + tag);
  }
  const asset = (data.assets || []).find((a) => /\.(exe|msi)$/i.test(a.name || ""));
  if (!asset) {
    throw new Error("No installer (exe/msi) attached to the latest release");
  }
  return { versionName: tag, downloadUrl: asset.browser_download_url || asset.url, sha256: null };
}

async function checkForUpdates() {
  const pkg = loadJSON(PACKAGE_PATH);
  const cfg = loadJSON(CONFIG_PATH);
  const currentVersion = pkg.version || "0.0.0";
  const repo = cfg.update_repo;

  if (!repo) {
    return { error: "No update source configured in config.json (update_repo)", currentVersion, updateAvailable: false };
  }

  try {
    const { versionName, downloadUrl, sha256 } = await queryGitHubForUpdates(repo);
    const latestVer = parseVersion(versionName);
    const currentVer = parseVersion(currentVersion);

    if (!latestVer) {
      return { error: `Invalid version format: ${versionName}`, currentVersion, updateAvailable: false };
    }

    const available = isNewer(latestVer, currentVer);

    pendingUpdateUrl = downloadUrl;
    pendingUpdateSha256 = sha256 || null;

    return {
      currentVersion,
      latestVersion: versionName.replace(/^[Vv]/, ""),
      updateAvailable: available,
      downloadUrl: pendingUpdateUrl,
      features: [],
      sha256: pendingUpdateSha256,
    };
  } catch (e) {
    return { error: e.message, currentVersion, updateAvailable: false };
  }
}

// ── Main window ──

function createMainWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      devTools: false,
      webSecurity: true,
      allowRunningInsecureContent: false,
      allowDisplayingInsecureContent: false,
    },
    titleBarStyle: "hiddenInset",
    show: false,
    title: "MetaX",
    backgroundColor: "#08080e",
  });

  mainWindow.loadFile(path.join(__dirname, "renderer", "index.html"));

  // Block all popup windows
  mainWindow.webContents.setWindowOpenHandler(() => ({ action: "deny" }));

  mainWindow.once("ready-to-show", () => {
    mainWindow.show();
    if (splashWindow) {
      splashWindow.close();
      splashWindow = null;
    }
  });

  mainWindow.webContents.on("before-input-event", (event, input) => {
    if (
      (input.control && input.shift && (input.key === "I" || input.key === "J")) ||
      (input.control && input.shift && input.key === "C") ||
      input.key === "F12"
    ) {
      event.preventDefault();
    }
  });
}

// ── Security: abort if debugging/inspection flags detected ──
const SECURITY_FLAGS = ["remote-debugging-port", "inspect", "inspect-brk", "inspect-publish-uid"];
for (const arg of process.argv) {
  for (const flag of SECURITY_FLAGS) {
    if (arg.includes(flag)) {
      console.error(`SECURITY BLOCKED: Debug flag "${flag}" detected in arguments. Aborting.`);
      process.exit(1);
    }
  }
}
// Clear NODE_OPTIONS to prevent code injection via env var
delete process.env.NODE_OPTIONS;

// ── App lifecycle ──

app.whenReady().then(async () => {
  Menu.setApplicationMenu(null);

  await new Promise((resolve) => {
    createSplash();
    splashWindow.once("ready-to-show", () => {
      splashWindow.show();
      resolve();
    });
  });

  // Let logo animation play for a moment before starting checks
  await delay(600);

  await discoverPython();
  const ok = await runAllChecks();
  if (ok) {
    sendProgress({ type: "complete" });
    await delay(600);
    createMainWindow();
  }
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

app.on("activate", () => {});

// ── IPC handlers ──

ipcMain.handle("write-debug-log", async (event, logName, content) => {
  try {
    const logDir = path.join(app.getPath("userData"), "logs");
    fs.mkdirSync(logDir, { recursive: true });
    // Only allow alphanumeric filenames — prevents path traversal
    const safeName = path.basename(logName).replace(/[^a-zA-Z0-9_\-\.]/g, "");
    if (!safeName) return false;
    const safePath = path.join(logDir, safeName);
    if (!safePath.startsWith(logDir)) return false;
    atomicWriteFileSync(safePath, content);
    return true;
  } catch (e) {
    console.error("Failed to write debug log:", e);
    return false;
  }
});

ipcMain.handle("select-dir", async () => {
  if (!mainWindow) return null;
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ["openDirectory"],
  });
  return result.canceled ? null : result.filePaths[0];
});

// Track last engine output dir in main process (set from engine-event "done")
let lastEngineOutputDir = null;

ipcMain.handle("open-path", async (event, p) => {
  if (!p) return false;
  try {
    const { shell } = require("electron");
    // Only allow opening the known last output directory
    const resolved = path.resolve(p);
    if (lastEngineOutputDir && resolved === path.resolve(lastEngineOutputDir)) {
      shell.openPath(resolved);
      return true;
    }
    return false;
  } catch (e) { return false; }
});

// Engine spawn lock — prevents concurrent runs (even from compromised renderer)
let engineRunning = false;

ipcMain.handle("run-engine", async (event, { date, outputDir, extraSegments, subSegments }) => {
  if (!mainWindow) return;
  if (engineRunning) {
    mainWindow.webContents.send("engine-event", { type: "error", data: "Engine already running" });
    return;
  }
  engineRunning = true;
  const enginePath = resPath("engine.py");

  // Validate date strictly: YYYY-MM-DD only
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    engineRunning = false;
    mainWindow.webContents.send("engine-event", { type: "error", data: "Invalid date format" });
    return;
  }

  // Resolve and normalize outputDir to prevent path traversal
  const resolvedDir = path.resolve(outputDir);
  if (!resolvedDir || resolvedDir.length < 3) {
    engineRunning = false;
    mainWindow.webContents.send("engine-event", { type: "error", data: "Invalid output directory" });
    return;
  }

  const child = spawn(pythonCmd, [
    enginePath, "--date", date, "--output-dir", resolvedDir,
    "--extra-segments", String(Math.min(Math.max(parseInt(extraSegments) || 4, 1), 20)),
    "--subsegments", String(Math.min(Math.max(parseInt(subSegments) || 2, 1), 20)),
    "--config-path", CONFIG_PATH,
  ], {
    cwd: __dirname,
    windowsHide: true,
    env: pythonEnv(),
  });

  let buffer = "";

  child.stdout.on("data", (data) => {
    buffer += data.toString();
    const lines = buffer.split("\n");
    buffer = lines.pop();
    for (const line of lines) {
      if (!line.trim()) continue;
      try {
        const parsed = JSON.parse(line);
        // Track the last output dir from engine's "done" event
        if (parsed.type === "done" && parsed.data && parsed.data.output_dir) {
          lastEngineOutputDir = parsed.data.output_dir;
        }
        mainWindow.webContents.send("engine-event", parsed);
      } catch {
        mainWindow.webContents.send("engine-event", { type: "log", data: line });
      }
    }
  });

  child.stderr.on("data", (data) => {
    mainWindow.webContents.send("engine-event", {
      type: "log",
      data: "[stderr] " + data.toString(),
    });
  });

  child.on("close", (code) => {
    engineRunning = false;
    mainWindow.webContents.send("engine-event", {
      type: "exit",
      data: { code },
    });
  });
});

ipcMain.handle("set-title", async (event, title) => {
  if (mainWindow) mainWindow.setTitle(title);
});

// ── Settings IPC (secrets encrypted via safeStorage/DPAPI) ──

ipcMain.handle("get-settings", async () => {
  try {
    if (fs.existsSync(CONFIG_PATH)) {
      const cfg = JSON.parse(fs.readFileSync(CONFIG_PATH, "utf-8"));
      const s3 = cfg.s3 || {};
      // Only return status flags — decrypted credentials NEVER leave main process
      const hasAccess = !!(decryptSecret(s3._access_key) && decryptSecret(s3._secret_key));
      return {
        s3_enabled: !!s3.s3_enabled,
        s3_configured: hasAccess,
        s3_type: s3.s3_type || "aws",
        s3_bucket: s3.s3_bucket || "",
        s3_region: s3.s3_region || "",
        s3_prefix: s3.s3_prefix || "",
        s3_endpoint: s3.s3_endpoint || "",
        // NEVER send _access_key or _secret_key to renderer
      };
    }
    return {};
  } catch (e) {
    console.error("get-settings error:", e);
    return {};
  }
});

ipcMain.handle("save-settings", async (event, settings) => {
  try {
    let cfg = {};
    if (fs.existsSync(CONFIG_PATH)) {
      cfg = JSON.parse(fs.readFileSync(CONFIG_PATH, "utf-8"));
    }
    const existingS3 = cfg.s3 || {};
    // Preserve existing encrypted credentials if not being changed
    const oldAk = existingS3._access_key || "";
    const oldSk = existingS3._secret_key || "";
    const encrypted = {
      s3_enabled: !!settings.s3_enabled,
      s3_type: settings.s3_type === "minio" ? "minio" : "aws",
      s3_bucket: (settings.s3_bucket || "").trim(),
      s3_region: (settings.s3_region || "").trim(),
      s3_prefix: (settings.s3_prefix || "").trim(),
      s3_endpoint: (settings.s3_endpoint || "").trim(),
      _access_key: settings._access_key ? encryptSecret(settings._access_key) || oldAk : oldAk,
      _secret_key: settings._secret_key ? encryptSecret(settings._secret_key) || oldSk : oldSk,
    };
    cfg.s3 = encrypted;
    atomicWriteFileSync(CONFIG_PATH, JSON.stringify(cfg, null, 4));
    return true;
  } catch (e) {
    console.error("save-settings error:", e);
    return false;
  }
});

// ── S3 upload IPC ──

ipcMain.handle("s3-upload", async () => {
  if (!lastEngineOutputDir) return { success: false, error: "No output from last engine run" };
  try {
    const cfg = loadJSON(CONFIG_PATH);
    const s3Config = cfg.s3 || {};

    // Check if enabled — silently skip if not
    if (!s3Config.s3_enabled || !s3Config.s3_bucket) {
      return { _skipped: true };
    }

    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send("s3-progress", { _status: "uploading", bucket: s3Config.s3_bucket });
    }

    const result = await uploadToS3(lastEngineOutputDir, s3Config);

    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send("s3-progress", result);
    }
    return result;
  } catch (e) {
    return { success: false, error: e.message };
  }
});

// ── Save edited CSV (from edit mode) ──
ipcMain.handle("save-edited-csv", async (event, { assetId, columns, rows, outputDir }) => {
  try {
    const resolvedDir = path.resolve(outputDir);
    if (!resolvedDir || resolvedDir.length < 3) return { success: false, error: "Invalid directory" };
    fs.mkdirSync(resolvedDir, { recursive: true });
    const safeName = assetId.replace(/[^\w\-]/g, "") + ".csv";
    const csvLines = [];
    csvLines.push(columns.map(c => '"' + String(c).replace(/"/g, '""') + '"').join(","));
    for (const row of rows) {
      csvLines.push(columns.map(c => '"' + String(row[c] || "").replace(/"/g, '""') + '"').join(","));
    }
    atomicWriteFileSync(path.join(resolvedDir, safeName), csvLines.join("\n"));
    return { success: true, file: safeName };
  } catch (e) {
    return { success: false, error: e.message };
  }
});

// ── Clipboard ──
ipcMain.handle("copy-to-clipboard", async (event, text) => {
  try {
    clipboard.writeText(String(text));
    return { success: true };
  } catch (e) {
    return { success: false, error: e.message };
  }
});

// ── Update IPC handlers ──

ipcMain.handle("check-for-updates", async () => {
  try {
    return await checkForUpdates();
  } catch (e) {
    return { error: e.message };
  }
});

ipcMain.handle("download-update", async () => {
  if (!pendingUpdateUrl) return { error: "No update URL available. Check for updates first." };
  try {
    const tmpDir = app.getPath("temp");
    const dest = path.join(tmpDir, "MetaX-Update.exe");
    downloadedExePath = dest;

    await downloadFile(pendingUpdateUrl, dest, (pct) => {
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send("dl-progress", pct);
      }
    });

    // SHA-256 verification if manifest provided a checksum
    if (pendingUpdateSha256) {
      const fileBuffer = fs.readFileSync(dest);
      const hash = crypto.createHash("sha256").update(fileBuffer).digest("hex");
      if (hash.toLowerCase() !== pendingUpdateSha256.toLowerCase()) {
        fs.unlinkSync(dest); // remove tampered file
        pendingUpdateUrl = null;
        pendingUpdateSha256 = null;
        return { error: "Update integrity check failed — file hash mismatch" };
      }
    }

    pendingUpdateUrl = null; // clear after use
    pendingUpdateSha256 = null;
    return { success: true, path: dest };
  } catch (e) {
    pendingUpdateUrl = null;
    pendingUpdateSha256 = null;
    return { error: e.message };
  }
});

ipcMain.handle("apply-update", async () => {
  if (!downloadedExePath || !fs.existsSync(downloadedExePath)) {
    return { error: "No downloaded update found" };
  }

  try {
    // Simply launch the downloaded installer/app and quit — the release exe does the rest.
    spawn(downloadedExePath, [], {
      detached: true,
      stdio: "ignore",
      windowsHide: true,
    }).unref();
    app.quit();
    return { success: true };
  } catch (e) {
    return { error: e.message };
  }
});
