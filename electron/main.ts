import { app, BrowserWindow, ipcMain, Tray, Menu, nativeImage, Notification, shell } from 'electron';
import electronUpdaterPkg from 'electron-updater';
const { autoUpdater } = electronUpdaterPkg;
import * as path from 'path';
import { fileURLToPath } from 'url';
import { statfs, readdir, rm, readFile, unlink } from 'fs/promises';
import {
  scanDirectory,
  deleteFiles,
  restoreFile,
  listQuarantinedFiles,
  deleteQuarantinedFile,
  emptyQuarantine,
} from './scanner.js';
import { getInstalledApps } from './registry.js';
import { scanAppDebris, findDebrisForAppNames } from './appDebris.js';
import { generateCleanupAdvice, validateApiKey, analyzeStartup, explainPath, clearAiCache } from './ai.js';
import { scanBrowserPrivacy, cleanBrowserPrivacy, closeRunningBrowsers } from './browser.js';
import { getStartupItems, toggleStartupItem } from './startup.js';
import { scanSystemJunk, cleanSystemJunk, SYSTEM_CATEGORIES } from './systemCleaner.js';
import { getSettings, updateSettings, getStoredApiKey, setStoredApiKey } from './settings.js';
import { getHistory, clearHistory, addHistoryEntry } from './history.js';
import * as os from 'os';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let mainWindow: BrowserWindow | null = null;
let splashWindow: BrowserWindow | null = null;
let tray: Tray | null = null;
let isQuitting = false;
let splashStartTime = 0;
const MIN_SPLASH_MS = 5000;

let lastInstalledApps: string[] = [];
let lastCleanupRunDate: string = '';

function syncLoginItemSettings(enabled: boolean) {
  try {
    app.setLoginItemSettings({
      openAtLogin: enabled,
      args: enabled ? ['--hidden'] : [],
    });
  } catch (err) {
    console.warn('Failed to update login item settings:', err);
  }
}

// ─── Scheduled Cleanup ─────────────────────────────────────────
function startScheduledCleanupCheck() {
  // Check every minute
  setInterval(async () => {
    try {
      const settings = await getSettings();
      if (!settings.scheduledCleanupEnabled) return;

      const now = new Date();
      const currentHour = now.getHours().toString().padStart(2, '0');
      const currentMinute = now.getMinutes().toString().padStart(2, '0');
      const currentTimeStr = `${currentHour}:${currentMinute}`;

      const currentDateStr = now.toDateString();

      if (currentTimeStr === settings.scheduledCleanupTime && lastCleanupRunDate !== currentDateStr) {
        lastCleanupRunDate = currentDateStr;
        console.log(`[Scheduler] Triggering scheduled cleanup at ${currentTimeStr}`);

        // Scan to get size before deleting
        const scanResults = await scanSystemJunk();
        const totalBytes = scanResults.reduce((acc, cat) => acc + cat.totalSize, 0);

        const categoryIds = SYSTEM_CATEGORIES.map(c => c.id);
        await cleanSystemJunk(categoryIds);

        const formatBytes = (bytes: number) => {
          if (bytes === 0) return '0 B';
          const k = 1024;
          const sizes = ['B', 'KB', 'MB', 'GB'];
          const i = Math.floor(Math.log(bytes) / Math.log(k));
          return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
        };

        const cleanedStr = formatBytes(totalBytes);
        const catMap = new Map(SYSTEM_CATEGORIES.map(c => [c.id, c.name]));
        const cleanedItems = scanResults
          .filter(r => r.fileCount > 0)
          .map(r => `${catMap.get(r.categoryId) || r.categoryId} (${r.fileCount} files)`);

        await addHistoryEntry({
          timestamp: Date.now(),
          scanType: 'Auto System Cleanup',
          bytesCleaned: totalBytes,
          details: 'Scheduled background cleanup.',
          items: cleanedItems,
        });

        if (mainWindow && !mainWindow.isDestroyed()) {
          mainWindow.webContents.send('auto-cleanup-completed', {
            totalBytes,
            cleanedStr,
            scanResults
          });
        }

        const notification = new Notification({
          title: 'SmartSweep AI',
          body: `Your daily system cleanup just freed up ${cleanedStr}. Click here to view details.`
        });

        notification.on('click', () => {
          triggerNavigation('/system-cleaner');
        });
        notification.show();
      }
    } catch (e) {
      console.error('[Scheduler] Error checking scheduled cleanup:', e);
    }
  }, 60 * 1000);
}

// ─── Splash helpers ───────────────────────────────────────────
function sendSplashProgress(percent: number, label: string) {
  if (splashWindow && !splashWindow.isDestroyed()) {
    splashWindow.webContents.send('splash-progress', { percent, label });
  }
}

function createSplashWindow() {
  splashStartTime = Date.now();
  splashWindow = new BrowserWindow({
    width: 800,
    height: 450,
    center: true,
    frame: false,
    resizable: false,
    transparent: false,
    alwaysOnTop: false,
    skipTaskbar: true,
    backgroundColor: '#0a0a12',   // dark bg so white flash never shows
    icon: path.join(__dirname, '../build/icon.png'),
    webPreferences: {
      nodeIntegration: true,       // needed for require('electron') in splash
      contextIsolation: false,     // splash is a local trusted file
    },
  });
  // splash.html is always copied to dist-electron/ (same dir as main.js)
  splashWindow.loadFile(path.join(__dirname, 'splash.html'));
  splashWindow.setMenuBarVisibility(false);
  splashWindow.removeMenu();

  splashWindow.on('closed', () => { splashWindow = null; });
}

function createWindow() {
  if (mainWindow && !mainWindow.isDestroyed()) {
    if (mainWindow.isMinimized()) mainWindow.restore();
    if (!mainWindow.isVisible()) revealMainWindow();
    mainWindow.focus();
    return;
  }

  mainWindow = new BrowserWindow({
    width: 1024,
    height: 768,
    minWidth: 800,
    minHeight: 600,
    title: 'SmartSweep AI',
    titleBarStyle: 'hidden',
    titleBarOverlay: {
      color: '#0d0d12',
      symbolColor: '#a1a1aa',
      height: 38
    },
    show: false,  // hidden until splash finishes
    opacity: 0,
    icon: path.join(__dirname, '../build/icon.ico'),
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  Menu.setApplicationMenu(null);
  mainWindow.setMenuBarVisibility(false);
  mainWindow.removeMenu();

  if (process.env.NODE_ENV === 'development' || !app.isPackaged) {
    // Vite may start on 5174 if 5173 is occupied; try both ports
    const tryLoad = async () => {
      try {
        await mainWindow!.loadURL('http://localhost:5173');
      } catch {
        await mainWindow!.loadURL('http://localhost:5174');
      }
    };
    tryLoad();
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist-react/index.html'));
  }

  // Signal splash with progress as the renderer loads
  mainWindow.webContents.on('did-start-loading', () => {
    sendSplashProgress(55, 'Loading interface…');
  });

  let splashClosed = false;
  const finishSplash = () => {
    if (splashClosed) return;
    splashClosed = true;

    sendSplashProgress(100, 'Ready!');
    const elapsed = Date.now() - splashStartTime;
    const remaining = splashStartTime > 0 ? Math.max(0, MIN_SPLASH_MS - elapsed) : 0;

    setTimeout(() => {
      if (splashWindow && !splashWindow.isDestroyed()) {
        splashWindow.webContents.send('splash-close');
      } else {
        revealMainWindow();
      }
    }, remaining);
  };

  mainWindow.webContents.on('did-finish-load', () => {
    sendSplashProgress(85, 'Connecting to system APIs…');
    // Fallback: trigger splash close 400ms after load finishes in case ready-to-show doesn't fire
    setTimeout(finishSplash, 400);
  });

  mainWindow.once('ready-to-show', () => {
    finishSplash();
  });

  mainWindow.on('close', (event) => {
    if (!isQuitting) {
      event.preventDefault();
      mainWindow?.destroy();
      mainWindow = null;
    }
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

function revealMainWindow() {
  if (!mainWindow || mainWindow.isDestroyed()) {
    createWindow();
    return;
  }
  mainWindow.show();
  mainWindow.focus();
  // Soft fade-in over 200 ms
  let opacity = 0;
  const step = () => {
    opacity = Math.min(1, opacity + 0.08);
    if (!mainWindow || mainWindow.isDestroyed()) return;
    mainWindow.setOpacity(opacity);
    if (opacity < 1) setTimeout(step, 16);
  };
  step();
}

function triggerNavigation(route: string) {
  if (!mainWindow || mainWindow.isDestroyed()) {
    createWindow();
    mainWindow?.webContents.once('did-finish-load', () => {
      mainWindow?.webContents.send('navigate-to', route);
    });
  } else {
    revealMainWindow();
    mainWindow.webContents.send('navigate-to', route);
  }
}

function createTray() {
  const iconPath = app.isPackaged ? path.join(__dirname, '../dist-react/icon.png') : path.join(__dirname, '../public/icon.png');
  const icon = nativeImage.createFromPath(iconPath).resize({ width: 16, height: 16 });
  tray = new Tray(icon);
  const contextMenu = Menu.buildFromTemplate([
    { label: 'Open SmartSweep', click: () => triggerNavigation('/') },
    { type: 'separator' },
    { label: 'Space Analyzer', click: () => triggerNavigation('/scan') },
    { label: 'System Cleaner', click: () => triggerNavigation('/system-cleaner') },
    { label: 'App Debris', click: () => triggerNavigation('/debris') },
    { label: 'Privacy Shield', click: () => triggerNavigation('/privacy') },
    { type: 'separator' },
    { label: 'Quit', click: () => {
        isQuitting = true;
        app.quit();
      }
    }
  ]);
  tray.setToolTip('SmartSweep AI');
  tray.setContextMenu(contextMenu);
  tray.on('double-click', () => triggerNavigation('/'));
}

async function runBackgroundScan() {
  try {
    const junkCategories = await scanSystemJunk();
    const totalJunkSize = junkCategories.reduce((acc, cat) => acc + cat.totalSize, 0);

    // Threshold alert: 1 GB = 1 * 1024 * 1024 * 1024 bytes
    if (totalJunkSize > 1073741824) {
      const gbSize = (totalJunkSize / 1073741824).toFixed(1);
      const notification = new Notification({
        title: 'SmartSweep AI',
        body: `You have ${gbSize} GB of system junk ready to be cleaned.`
      });
      notification.on('click', () => triggerNavigation('/system-cleaner'));
      notification.show();
    }
  } catch (err) {
    console.error('Background scan failed', err);
  }
}

async function cleanupQuarantine() {
  const QUARANTINE_DIR = path.join(os.homedir(), '.smartsweep_quarantine');
  const FOURTEEN_DAYS_MS = 14 * 24 * 60 * 60 * 1000;
  const now = Date.now();

  try {
    const entries = await readdir(QUARANTINE_DIR, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.name.endsWith('.meta.json')) {
        const metaPath = path.join(QUARANTINE_DIR, entry.name);
        try {
          const content = await readFile(metaPath, 'utf-8');
          const meta = JSON.parse(content);
          if (now - meta.quarantinedAt > FOURTEEN_DAYS_MS) {
            // Delete the metadata and the quarantined file or folder
            const qFile = path.join(QUARANTINE_DIR, entry.name.replace('.meta.json', ''));
            await rm(qFile, { recursive: true, force: true }).catch(() => {});
            await unlink(metaPath).catch(() => {});
          }
        } catch {}
      }
    }
  } catch {
    // Quarantine dir might not exist yet
  }
}

async function checkOrphanedApps() {
  try {
    const currentAppsInfo = await getInstalledApps();
    const currentApps = currentAppsInfo.map((a) => a.displayName).filter(Boolean);

    if (lastInstalledApps.length > 0) {
      const uninstalledApps = lastInstalledApps.filter(appName => !currentApps.includes(appName));
      if (uninstalledApps.length > 0) {
        const matchedDebris = await findDebrisForAppNames(uninstalledApps);
        if (matchedDebris.length > 0) {
          const totalBytes = matchedDebris.reduce((acc, item) => acc + item.size, 0);
          const mb = (totalBytes / (1024 * 1024)).toFixed(1);
          const notification = new Notification({
            title: 'SmartSweep AI — App Debris Detected',
            body: `Found ${matchedDebris.length} leftover folder(s) (${mb} MB) from recently uninstalled apps. Click to review.`
          });
          notification.on('click', () => triggerNavigation('/debris'));
          notification.show();
        }
      }
    }

    lastInstalledApps = currentApps;
  } catch (err) {
    console.error('Orphaned app debris check failed', err);
  }
}

app.whenReady().then(async () => {
  if (process.platform === 'win32') {
    app.setAppUserModelId('com.ransamietechnologies.smartsweepai');
  }

  autoUpdater.checkForUpdatesAndNotify();
  cleanupQuarantine();

  const settings = await getSettings();
  syncLoginItemSettings(settings.launchAtStartup);

  const isHiddenLaunch = process.argv.includes('--hidden');

  // Always create Tray so background monitoring & silent launch remain accessible
  createTray();

  if (!isHiddenLaunch) {
    // 1. Splash appears immediately
    createSplashWindow();
    sendSplashProgress(15, 'Starting core services…');
    sendSplashProgress(30, 'Setting up system tray…');

    // 2. Main window (hidden until splash finishes)
    createWindow();
    sendSplashProgress(45, 'Preparing main interface…');
  }

  // Initialize baseline apps list silently
  const initialApps = await getInstalledApps();
  lastInstalledApps = initialApps.map((a) => a.displayName).filter(Boolean);

  // Background Timers
  // 1. Threshold-Based Scan (Every 3 Hours = 3 * 60 * 60 * 1000)
  setInterval(runBackgroundScan, 10800000);
  // Also trigger a silent initial check 5 minutes after startup
  setTimeout(runBackgroundScan, 300000);

  // 2. Uninstall-Based Check (Every 1 Day = 24 * 60 * 60 * 1000)
  setInterval(checkOrphanedApps, 86400000);

  // 3. Daily Scheduled Cleanup check (runs every minute)
  startScheduledCleanupCheck();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

// Splash signals it has finished fading out — reveal main window
ipcMain.on('splash-done', () => {
  if (splashWindow && !splashWindow.isDestroyed()) {
    splashWindow.close();
  }
  revealMainWindow();
});

app.on('window-all-closed', () => {
  // Prevent quitting when all windows are closed
  // Application stays alive in the tray
});

app.on('before-quit', () => {
  isQuitting = true;
});

// --- IPC Handlers ---

ipcMain.handle('scan-browser-privacy', async () => await scanBrowserPrivacy());
ipcMain.handle('close-running-browsers', async (_, browsers: string[]) => await closeRunningBrowsers(browsers));
ipcMain.handle('clean-browser-privacy', async (_, browsers: string[]) => {
  const beforeScan = await scanBrowserPrivacy();
  const beforeSize = browsers.reduce((acc, b) => {
    const found = beforeScan.find(s => s.browser.toLowerCase() === b.toLowerCase());
    return acc + (found?.totalSize || 0);
  }, 0);

  const res = await cleanBrowserPrivacy(browsers);

  const afterScan = await scanBrowserPrivacy();
  const afterSize = browsers.reduce((acc, b) => {
    const found = afterScan.find(s => s.browser.toLowerCase() === b.toLowerCase());
    return acc + (found?.totalSize || 0);
  }, 0);

  const bytesDeleted = Math.max(0, beforeSize - afterSize);

  return { ...res, bytesDeleted };
});
ipcMain.handle('delete-files', async (_, paths: string[]) => await deleteFiles(paths));
ipcMain.handle('restore-file', async (_, originalPath: string) => await restoreFile(originalPath));
ipcMain.handle('list-quarantine', async () => await listQuarantinedFiles());
ipcMain.handle('delete-quarantine-item', async (_, originalPath: string) => await deleteQuarantinedFile(originalPath));
ipcMain.handle('empty-quarantine', async () => await emptyQuarantine());
ipcMain.handle('get-startup-items', async () => await getStartupItems());
ipcMain.handle('toggle-startup-item', async (_, name, location, enable, itemPath) => await toggleStartupItem(name, location, enable, itemPath));
ipcMain.handle('analyze-startup', async (_, apiKey, items) => await analyzeStartup(apiKey, items));
ipcMain.handle('explain-path', async (_, apiKey, targetPath) => await explainPath(apiKey, targetPath));
ipcMain.handle('show-in-folder', (_, targetPath) => shell.showItemInFolder(targetPath));
ipcMain.handle('window-minimize', () => {
  if (mainWindow && !mainWindow.isDestroyed()) mainWindow.minimize();
});
ipcMain.handle('window-maximize', () => {
  if (mainWindow && !mainWindow.isDestroyed()) {
    if (mainWindow.isMaximized()) {
      mainWindow.unmaximize();
    } else {
      mainWindow.maximize();
    }
  }
});

ipcMain.handle('check-for-updates', () => {
  return new Promise((resolve) => {
    const onAvailable = (info: any) => {
      cleanup();
      resolve({ available: true, version: info.version });
    };
    const onNotAvailable = () => {
      cleanup();
      resolve({ available: false });
    };
    const onError = (err: Error) => {
      cleanup();
      resolve({ error: err.message });
    };
    const cleanup = () => {
      autoUpdater.removeListener('update-available', onAvailable);
      autoUpdater.removeListener('update-not-available', onNotAvailable);
      autoUpdater.removeListener('error', onError);
    };

    autoUpdater.once('update-available', onAvailable);
    autoUpdater.once('update-not-available', onNotAvailable);
    autoUpdater.once('error', onError);

    autoUpdater.checkForUpdates().catch(onError);
  });
});

autoUpdater.on('update-downloaded', (info) => {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send('update-downloaded', info.version);
  }
});

ipcMain.handle('restart-and-install', () => {
  autoUpdater.quitAndInstall(false, true);
});

// --- Settings & Secure Secrets IPC ---
ipcMain.handle('get-settings', async () => {
  return await getSettings();
});

ipcMain.handle('update-settings', async (_, newSettings) => {
  const updated = await updateSettings(newSettings);
  if (newSettings && typeof newSettings.launchAtStartup === 'boolean') {
    syncLoginItemSettings(updated.launchAtStartup);
  }
  return updated;
});

ipcMain.handle('get-api-key', async () => {
  return await getStoredApiKey();
});

ipcMain.handle('set-api-key', async (_, key: string | null) => {
  return await setStoredApiKey(key);
});

// --- General API ---
ipcMain.handle('window-close', () => {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.hide();
  }
});

ipcMain.handle('get-history', async () => await getHistory());
ipcMain.handle('clear-history', async () => await clearHistory());
ipcMain.handle('add-history-entry', async (_, entry) => await addHistoryEntry(entry));

ipcMain.handle('send-notification', (_, title: string, body: string) => {
  try {
    // Only send desktop notifications if the user is NOT actively focusing the app window (e.g. minimized or in background)
    if (mainWindow && !mainWindow.isDestroyed() && mainWindow.isFocused()) {
      return;
    }

    if (Notification.isSupported()) {
      const notification = new Notification({ title, body, icon: path.join(__dirname, '../build/icon.png') });
      notification.on('click', () => revealMainWindow());
      notification.show();
    }
  } catch (e) {
    console.error('Notification error:', e);
  }
});

ipcMain.handle('scan-system-junk', async () => {
  try {
    const results = await scanSystemJunk();
    return { categories: SYSTEM_CATEGORIES, results };
  } catch (error: any) {
    console.error('System cleaner scan error:', error);
    return { error: error.message };
  }
});

ipcMain.handle('clean-system-junk', async (_, categoryIds: string[]) => {
  try {
    const beforeScan = await scanSystemJunk();
    const beforeSize = beforeScan.filter(c => categoryIds.includes(c.categoryId)).reduce((acc, c) => acc + c.totalSize, 0);

    const cleanRes = await cleanSystemJunk(categoryIds);

    const afterScan = await scanSystemJunk();
    const afterSize = afterScan.filter(c => categoryIds.includes(c.categoryId)).reduce((acc, c) => acc + c.totalSize, 0);

    const bytesDeleted = Math.max(0, beforeSize - afterSize);

    return { ...cleanRes, bytesDeleted };
  } catch (error: any) {
    console.error('System cleaner clean error:', error);
    return { error: error.message };
  }
});

ipcMain.handle('scan-directory', async (_event, dirPath) => {
  try {
    return await scanDirectory(dirPath, false); // Foreground mode
  } catch (error: any) {
    console.error('Scan error:', error);
    return { error: error.message };
  }
});

ipcMain.handle('get-installed-apps', async () => {
  try {
    return await getInstalledApps();
  } catch (error: any) {
    console.error('Registry read error:', error);
    return { error: error.message };
  }
});

ipcMain.handle('get-ai-recommendation', async (_event, apiKey, scanData) => {
  try {
    return await generateCleanupAdvice(apiKey, scanData);
  } catch (error: any) {
    console.error('AI error:', error);
    return { error: error.message };
  }
});

ipcMain.handle('clear-ai-cache', () => {
  clearAiCache();
  return { success: true };
});

ipcMain.handle('validate-api-key', async (_event, apiKey) => {
  return await validateApiKey(apiKey);
});

ipcMain.handle('get-system-paths', () => {
  return {
    home: app.getPath('home'),
    appData: app.getPath('appData'),
    temp: app.getPath('temp'),
    downloads: app.getPath('downloads'),
  };
});

ipcMain.handle('get-disk-space', async (_event, drivePath?: string) => {
  try {
    const targetPath = drivePath || (os.platform() === 'win32' ? 'C:\\' : '/');
    const stats = await statfs(targetPath);
    const total = stats.bsize * stats.blocks;
    const free = stats.bsize * stats.bavail;
    return {
      total,
      free,
      used: total - free
    };
  } catch (error: any) {
    console.error('Disk space error:', error);
    return { error: error.message };
  }
});

ipcMain.handle('get-orphaned-data', async () => {
  try {
    return await scanAppDebris();
  } catch (error: any) {
    console.error('Orphaned data scan error:', error);
    return { error: error.message };
  }
});

ipcMain.handle('get-drives', async () => {
  const platform = os.platform();
  const drives: Array<{ letter: string; root: string; label: string; total: number; free: number; used: number }> = [];

  if (platform === 'win32') {
    const { access, constants } = await import('fs/promises');
    for (const letter of 'CDEFGHIJKLMNOPQRSTUVWXYZ') {
      const root = `${letter}:\\`;
      try {
        await access(root, constants.F_OK);
        const stats = await statfs(root);
        const total = stats.bsize * stats.blocks;
        const free = stats.bsize * stats.bavail;
        drives.push({ letter, root, label: `${letter}: Drive`, total, free, used: total - free });
      } catch { /* drive not available */ }
    }
  } else {
    // macOS / Linux — root mount point
    try {
      const stats = await statfs('/');
      const total = stats.bsize * stats.blocks;
      const free = stats.bsize * stats.bavail;
      drives.push({ letter: '/', root: '/', label: 'System Volume', total, free, used: total - free });
    } catch { /* ignore */ }
  }

  return drives;
});
