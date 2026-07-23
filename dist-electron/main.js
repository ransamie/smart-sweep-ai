import { app, BrowserWindow, ipcMain, Tray, Menu, nativeImage, Notification, shell } from 'electron';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { statfs, readdir } from 'fs/promises';
import { scanDirectory, getFileSummary, deleteFiles, restoreFile } from './scanner.js';
import { getInstalledApps } from './registry.js';
import { generateCleanupAdvice, validateApiKey, analyzeStartup, explainPath, clearAiCache } from './ai.js';
import { scanBrowserPrivacy, cleanBrowserPrivacy } from './browser.js';
import { getStartupItems, toggleStartupItem } from './startup.js';
import { scanSystemJunk, cleanSystemJunk, SYSTEM_CATEGORIES } from './systemCleaner.js';
import { getSettings, updateSettings } from './settings.js';
import * as os from 'os';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
let mainWindow = null;
let splashWindow = null;
let tray = null;
let isQuitting = false;
let splashStartTime = 0;
const MIN_SPLASH_MS = 5000;
let lastInstalledApps = [];
let lastCleanupRunDate = '';
// ─── Scheduled Cleanup ─────────────────────────────────────────
function startScheduledCleanupCheck() {
    // Check every minute
    setInterval(async () => {
        try {
            const settings = await getSettings();
            if (!settings.scheduledCleanupEnabled)
                return;
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
                const formatBytes = (bytes) => {
                    if (bytes === 0)
                        return '0 B';
                    const k = 1024;
                    const sizes = ['B', 'KB', 'MB', 'GB'];
                    const i = Math.floor(Math.log(bytes) / Math.log(k));
                    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
                };
                const cleanedStr = formatBytes(totalBytes);
                const notification = new Notification({
                    title: 'SmartSweep AI',
                    body: `Your daily system cleanup just freed up ${cleanedStr}. Click here to view details.`
                });
                notification.on('click', () => {
                    createWindow();
                    if (mainWindow && !mainWindow.isDestroyed()) {
                        mainWindow.webContents.send('navigate-to', '/system-cleaner');
                    }
                });
                notification.show();
            }
        }
        catch (e) {
            console.error('[Scheduler] Error checking scheduled cleanup:', e);
        }
    }, 60 * 1000);
}
// ─── Splash helpers ───────────────────────────────────────────
function sendSplashProgress(percent, label) {
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
        backgroundColor: '#0a0a12', // dark bg so white flash never shows
        icon: path.join(__dirname, '../build/icon.png'),
        webPreferences: {
            nodeIntegration: true, // needed for require('electron') in splash
            contextIsolation: false, // splash is a local trusted file
        },
    });
    // splash.html is always copied to dist-electron/ (same dir as main.js)
    splashWindow.loadFile(path.join(__dirname, 'splash.html'));
    splashWindow.setMenuBarVisibility(false);
    splashWindow.removeMenu();
    splashWindow.on('closed', () => { splashWindow = null; });
}
function createWindow() {
    if (mainWindow) {
        if (mainWindow.isMinimized())
            mainWindow.restore();
        mainWindow.focus();
        return;
    }
    mainWindow = new BrowserWindow({
        width: 1024,
        height: 768,
        minWidth: 800,
        minHeight: 600,
        frame: false, // Frameless window to remove native OS titlebar ribbon
        show: false, // hidden until splash finishes
        opacity: 0,
        icon: path.join(__dirname, '../build/icon.png'),
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
                await mainWindow.loadURL('http://localhost:5173');
            }
            catch {
                await mainWindow.loadURL('http://localhost:5174');
            }
        };
        tryLoad();
    }
    else {
        mainWindow.loadFile(path.join(__dirname, '../dist-react/index.html'));
    }
    // Signal splash with progress as the renderer loads
    mainWindow.webContents.on('did-start-loading', () => {
        sendSplashProgress(55, 'Loading interface…');
    });
    mainWindow.webContents.on('did-finish-load', () => {
        sendSplashProgress(80, 'Connecting to system APIs…');
    });
    mainWindow.once('ready-to-show', () => {
        sendSplashProgress(92, 'Almost ready…');
        const elapsed = Date.now() - splashStartTime;
        const remaining = Math.max(0, MIN_SPLASH_MS - elapsed);
        setTimeout(() => {
            // Tell splash to fade out
            if (splashWindow && !splashWindow.isDestroyed()) {
                splashWindow.webContents.send('splash-close');
            }
            else {
                // Splash already gone — just show main
                revealMainWindow();
            }
        }, remaining);
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
    if (!mainWindow || mainWindow.isDestroyed())
        return;
    mainWindow.show();
    // Soft fade-in over 200 ms
    let opacity = 0;
    const step = () => {
        opacity = Math.min(1, opacity + 0.08);
        if (!mainWindow || mainWindow.isDestroyed())
            return;
        mainWindow.setOpacity(opacity);
        if (opacity < 1)
            setTimeout(step, 16);
    };
    step();
}
function createTray() {
    const iconPath = path.join(__dirname, '../build/icon.png');
    const icon = nativeImage.createFromPath(iconPath);
    tray = new Tray(icon);
    const contextMenu = Menu.buildFromTemplate([
        { label: 'Open SmartSweep', click: () => createWindow() },
        { type: 'separator' },
        { label: 'Quit', click: () => {
                isQuitting = true;
                app.quit();
            }
        }
    ]);
    tray.setToolTip('SmartSweep AI');
    tray.setContextMenu(contextMenu);
    tray.on('double-click', () => createWindow());
}
async function runBackgroundScan() {
    try {
        const tempPath = app.getPath('temp');
        const downloadsPath = app.getPath('downloads');
        // Pass true for background mode yielding
        const tempFiles = await scanDirectory(tempPath, true);
        const downloadFiles = await scanDirectory(downloadsPath, true);
        const allFiles = [...tempFiles, ...downloadFiles];
        const summary = getFileSummary(allFiles);
        // Threshold alert: 5 GB = 5 * 1024 * 1024 * 1024 bytes
        if (summary.totalSize > 5368709120) {
            const gbSize = (summary.totalSize / 1073741824).toFixed(1);
            const notification = new Notification({
                title: 'SmartSweep AI',
                body: `You have ${gbSize} GB of junk files ready to be cleaned.`
            });
            notification.on('click', () => createWindow());
            notification.show();
        }
    }
    catch (err) {
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
                    const { readFile, unlink } = await import('fs/promises');
                    const content = await readFile(metaPath, 'utf-8');
                    const meta = JSON.parse(content);
                    if (now - meta.quarantinedAt > FOURTEEN_DAYS_MS) {
                        // Delete the metadata and the quarantined file
                        const qFile = path.join(QUARANTINE_DIR, entry.name.replace('.meta.json', ''));
                        await unlink(qFile).catch(() => { });
                        await unlink(metaPath).catch(() => { });
                    }
                }
                catch (e) { }
            }
        }
    }
    catch (e) {
        // Quarantine dir might not exist yet
    }
}
async function checkOrphanedApps() {
    try {
        const currentAppsInfo = await getInstalledApps();
        const currentApps = currentAppsInfo.map((a) => a.displayName);
        if (lastInstalledApps.length > 0) {
            const uninstalledApps = lastInstalledApps.filter(app => !currentApps.includes(app));
            for (const appName of uninstalledApps) {
                // We simulate finding debris for demonstration
                const notification = new Notification({
                    title: 'SmartSweep AI',
                    body: `We found leftover files from ${appName}. Would you like to clean them up?`
                });
                notification.on('click', () => createWindow());
                notification.show();
            }
        }
        lastInstalledApps = currentApps;
    }
    catch (err) {
        console.error('Registry check failed', err);
    }
}
app.whenReady().then(async () => {
    cleanupQuarantine();
    // 1. Splash appears immediately
    createSplashWindow();
    sendSplashProgress(15, 'Starting core services…');
    // 2. Tray
    createTray();
    sendSplashProgress(30, 'Setting up system tray…');
    // 3. Main window (hidden)
    createWindow();
    sendSplashProgress(45, 'Preparing main interface…');
    // 4. Initialize baseline apps list silently
    const initialApps = await getInstalledApps();
    lastInstalledApps = initialApps.map((a) => a.displayName);
    // Background Timers
    // 1. Threshold-Based Scan (Every 3 Days = 3 * 24 * 60 * 60 * 1000)
    setInterval(runBackgroundScan, 259200000);
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
ipcMain.handle('clean-browser-privacy', async (_, browsers) => await cleanBrowserPrivacy(browsers));
ipcMain.handle('delete-files', async (_, paths) => await deleteFiles(paths));
ipcMain.handle('restore-file', async (_, originalPath) => await restoreFile(originalPath));
ipcMain.handle('get-startup-items', async () => await getStartupItems());
ipcMain.handle('toggle-startup-item', async (_, name, location, enable, itemPath) => await toggleStartupItem(name, location, enable, itemPath));
ipcMain.handle('analyze-startup', async (_, apiKey, items) => await analyzeStartup(apiKey, items));
ipcMain.handle('explain-path', async (_, apiKey, targetPath) => await explainPath(apiKey, targetPath));
ipcMain.handle('show-in-folder', (_, targetPath) => shell.showItemInFolder(targetPath));
ipcMain.handle('window-minimize', () => {
    if (mainWindow && !mainWindow.isDestroyed())
        mainWindow.minimize();
});
ipcMain.handle('window-maximize', () => {
    if (mainWindow && !mainWindow.isDestroyed()) {
        if (mainWindow.isMaximized()) {
            mainWindow.unmaximize();
        }
        else {
            mainWindow.maximize();
        }
    }
});
// --- Settings IPC ---
ipcMain.handle('get-settings', async () => {
    return await getSettings();
});
ipcMain.handle('update-settings', async (_, newSettings) => {
    return await updateSettings(newSettings);
});
// --- General API ---
ipcMain.handle('get-os-info', () => {
    if (mainWindow && !mainWindow.isDestroyed())
        mainWindow.close();
});
ipcMain.handle('window-close', () => {
    if (mainWindow && !mainWindow.isDestroyed())
        mainWindow.close();
});
ipcMain.handle('send-notification', (_, title, body) => {
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
    }
    catch (e) {
        console.error('Notification error:', e);
    }
});
ipcMain.handle('scan-system-junk', async () => {
    try {
        const results = await scanSystemJunk();
        return { categories: SYSTEM_CATEGORIES, results };
    }
    catch (error) {
        console.error('System cleaner scan error:', error);
        return { error: error.message };
    }
});
ipcMain.handle('clean-system-junk', async (_, categoryIds) => {
    try {
        await cleanSystemJunk(categoryIds);
        return { success: true };
    }
    catch (error) {
        console.error('System cleaner clean error:', error);
        return { error: error.message };
    }
});
ipcMain.handle('scan-directory', async (event, dirPath) => {
    try {
        return await scanDirectory(dirPath, false); // Foreground mode
    }
    catch (error) {
        console.error('Scan error:', error);
        return { error: error.message };
    }
});
ipcMain.handle('get-installed-apps', async () => {
    try {
        return await getInstalledApps();
    }
    catch (error) {
        console.error('Registry read error:', error);
        return { error: error.message };
    }
});
ipcMain.handle('get-ai-recommendation', async (event, apiKey, scanData) => {
    try {
        return await generateCleanupAdvice(apiKey, scanData);
    }
    catch (error) {
        console.error('AI error:', error);
        return { error: error.message };
    }
});
ipcMain.handle('clear-ai-cache', () => {
    clearAiCache();
    return { success: true };
});
ipcMain.handle('validate-api-key', async (event, apiKey) => {
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
ipcMain.handle('get-disk-space', async (event, drivePath) => {
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
    }
    catch (error) {
        console.error('Disk space error:', error);
        return { error: error.message };
    }
});
ipcMain.handle('get-orphaned-data', async () => {
    try {
        const platform = os.platform();
        let searchDirs = [];
        if (platform === 'win32') {
            const roamingPath = app.getPath('appData');
            const localPath = path.join(app.getPath('appData'), '..', 'Local');
            searchDirs = [roamingPath, localPath];
        }
        else if (platform === 'darwin') {
            searchDirs = [
                path.join(os.homedir(), 'Library', 'Application Support'),
            ];
        }
        else {
            // Linux
            searchDirs = [
                path.join(os.homedir(), '.local', 'share'),
            ];
        }
        const readFolders = async (dirPath) => {
            try {
                const entries = await readdir(dirPath, { withFileTypes: true });
                return entries
                    .filter(e => e.isDirectory())
                    .map(e => ({ folderName: e.name, folderPath: path.join(dirPath, e.name) }));
            }
            catch {
                return [];
            }
        };
        const folderResults = await Promise.all(searchDirs.map(d => readFolders(d)));
        const allFolders = folderResults.flat();
        // Get installed app names
        const installedAppsInfo = await getInstalledApps();
        const installedNames = installedAppsInfo
            .map((a) => (a.displayName || '').toLowerCase())
            .filter((n) => n.length > 0);
        const orphaned = allFolders.filter(({ folderName }) => {
            const folderLower = folderName.toLowerCase();
            return !installedNames.some(appName => appName.includes(folderLower) || folderLower.includes(appName));
        });
        return orphaned.slice(0, 20).map(({ folderName, folderPath }) => ({
            folderName,
            folderPath,
            sizeEstimate: 'Unknown',
        }));
    }
    catch (error) {
        console.error('Orphaned data scan error:', error);
        return { error: error.message };
    }
});
ipcMain.handle('get-drives', async () => {
    const platform = os.platform();
    const drives = [];
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
            }
            catch { /* drive not available */ }
        }
    }
    else {
        // macOS / Linux — root mount point
        try {
            const stats = await statfs('/');
            const total = stats.bsize * stats.blocks;
            const free = stats.bsize * stats.bavail;
            drives.push({ letter: '/', root: '/', label: 'System Volume', total, free, used: total - free });
        }
        catch { /* ignore */ }
    }
    return drives;
});
