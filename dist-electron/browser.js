import * as path from 'path';
import * as fs from 'fs/promises';
import * as os from 'os';
async function getDirStats(dirPath) {
    let size = 0;
    let count = 0;
    try {
        const entries = await fs.readdir(dirPath, { withFileTypes: true });
        for (const entry of entries) {
            const fullPath = path.join(dirPath, entry.name);
            try {
                if (entry.isDirectory()) {
                    const sub = await getDirStats(fullPath);
                    size += sub.size;
                    count += sub.count;
                }
                else {
                    const stats = await fs.stat(fullPath);
                    size += stats.size;
                    count += 1;
                }
            }
            catch (e) {
                // Skip inaccessible items
            }
        }
    }
    catch (e) {
        // Ignore errors for unreadable directories
    }
    return { size, count };
}
// Explicitly preserve these critical files so user logins and bookmarks are NEVER lost
const PRESERVED_FILES = new Set([
    'Login Data',
    'Login Data-journal',
    'Bookmarks',
    'Bookmarks.bak',
    'Preferences',
    'Secure Preferences',
    'History',
    'History-journal',
    'Favicons',
    'Favicons-journal',
]);
async function deleteContents(dirPath) {
    let deleted = 0;
    let failed = 0;
    async function recursiveDelete(currentPath) {
        try {
            const entries = await fs.readdir(currentPath, { withFileTypes: true });
            for (const entry of entries) {
                if (PRESERVED_FILES.has(entry.name)) {
                    continue;
                }
                const fullPath = path.join(currentPath, entry.name);
                try {
                    if (entry.isDirectory()) {
                        await recursiveDelete(fullPath);
                        try {
                            await fs.rm(fullPath, { recursive: true, force: true });
                        }
                        catch (e) { }
                    }
                    else {
                        await fs.chmod(fullPath, 0o666).catch(() => { });
                        await fs.unlink(fullPath);
                        deleted++;
                    }
                }
                catch (e) {
                    failed++;
                }
            }
        }
        catch (e) {
            // Ignore if directory doesn't exist
        }
    }
    await recursiveDelete(dirPath);
    return { deleted, failed };
}
/**
 * Dynamically discovers Chromium user profile directories (e.g. Default, Profile 1, Profile 2, System Profile)
 */
async function discoverChromiumProfiles(userDataPath) {
    const profiles = [];
    try {
        const entries = await fs.readdir(userDataPath, { withFileTypes: true });
        for (const entry of entries) {
            if (entry.isDirectory() && (entry.name === 'Default' || entry.name.startsWith('Profile '))) {
                profiles.push(path.join(userDataPath, entry.name));
            }
        }
    }
    catch (e) { }
    return profiles;
}
/**
 * Returns cache & storage targets for a specific Chromium profile
 */
function getChromiumProfileTargets(profilePath) {
    return [
        path.join(profilePath, 'Cache'),
        path.join(profilePath, 'Code Cache'),
        path.join(profilePath, 'GPUCache'),
        path.join(profilePath, 'Service Worker', 'CacheStorage'),
        path.join(profilePath, 'Service Worker', 'ScriptCache'),
        path.join(profilePath, 'IndexedDB'),
        path.join(profilePath, 'Blob_storage'),
        path.join(profilePath, 'Local Storage', 'leveldb'),
        path.join(profilePath, 'Session Storage'),
        path.join(profilePath, 'Site Characteristics Database'),
        path.join(profilePath, 'File System'),
        path.join(profilePath, 'Application Cache'),
    ];
}
/**
 * Discovers and returns all scan target directories for browsers and app caches on the system.
 */
async function getAllBrowserScanTargets() {
    const platform = os.platform();
    const home = os.homedir();
    const targets = {
        chrome: [],
        edge: [],
        brave: [],
        opera: [],
        firefox: [],
        app_caches: [],
    };
    if (platform === 'win32') {
        const localAppData = process.env.LOCALAPPDATA || path.join(home, 'AppData', 'Local');
        const appData = process.env.APPDATA || path.join(home, 'AppData', 'Roaming');
        // 1. Google Chrome
        const chromeUserData = path.join(localAppData, 'Google', 'Chrome', 'User Data');
        const chromeProfiles = await discoverChromiumProfiles(chromeUserData);
        for (const p of chromeProfiles) {
            targets.chrome.push(...getChromiumProfileTargets(p));
        }
        // 2. Microsoft Edge
        const edgeUserData = path.join(localAppData, 'Microsoft', 'Edge', 'User Data');
        const edgeProfiles = await discoverChromiumProfiles(edgeUserData);
        for (const p of edgeProfiles) {
            targets.edge.push(...getChromiumProfileTargets(p));
        }
        // 3. Brave Browser
        const braveUserData = path.join(localAppData, 'BraveSoftware', 'Brave-Browser', 'User Data');
        const braveProfiles = await discoverChromiumProfiles(braveUserData);
        for (const p of braveProfiles) {
            targets.brave.push(...getChromiumProfileTargets(p));
        }
        // 4. Opera & Opera GX
        const operaPaths = [
            path.join(appData, 'Opera Software', 'Opera Stable'),
            path.join(appData, 'Opera Software', 'Opera GX Stable'),
            path.join(localAppData, 'Opera Software', 'Opera Stable', 'Cache'),
            path.join(localAppData, 'Opera Software', 'Opera GX Stable', 'Cache'),
        ];
        for (const op of operaPaths) {
            targets.opera.push(...getChromiumProfileTargets(op));
        }
        // 5. Mozilla Firefox
        const firefoxProfilesDirLocal = path.join(localAppData, 'Mozilla', 'Firefox', 'Profiles');
        const firefoxProfilesDirRoaming = path.join(appData, 'Mozilla', 'Firefox', 'Profiles');
        for (const dir of [firefoxProfilesDirLocal, firefoxProfilesDirRoaming]) {
            try {
                const entries = await fs.readdir(dir, { withFileTypes: true });
                for (const entry of entries) {
                    if (entry.isDirectory()) {
                        const pPath = path.join(dir, entry.name);
                        targets.firefox.push(path.join(pPath, 'cache2'), path.join(pPath, 'startupCache'), path.join(pPath, 'jumpListCache'), path.join(pPath, 'shader-cache'), path.join(pPath, 'storage', 'default'));
                    }
                }
            }
            catch (e) { }
        }
        // 6. Popular Electron / Web-based App Caches
        targets.app_caches.push(path.join(appData, 'discord', 'Cache'), path.join(appData, 'discord', 'Code Cache'), path.join(appData, 'discord', 'GPUCache'), path.join(appData, 'discord', 'Service Worker', 'CacheStorage'), path.join(localAppData, 'Spotify', 'Data'), path.join(localAppData, 'Spotify', 'Storage'), path.join(appData, 'Code', 'Cache'), path.join(appData, 'Code', 'CachedData'), path.join(appData, 'Code', 'User', 'workspaceStorage'), path.join(appData, 'Microsoft', 'Teams', 'Cache'), path.join(appData, 'Microsoft', 'Teams', 'GPUCache'), path.join(appData, 'Slack', 'Cache'), path.join(appData, 'Slack', 'Service Worker', 'CacheStorage'));
    }
    else if (platform === 'darwin') {
        // macOS
        const chromeUserData = path.join(home, 'Library', 'Application Support', 'Google', 'Chrome');
        const chromeProfiles = await discoverChromiumProfiles(chromeUserData);
        for (const p of chromeProfiles) {
            targets.chrome.push(...getChromiumProfileTargets(p));
        }
        targets.chrome.push(path.join(home, 'Library', 'Caches', 'Google', 'Chrome'));
        const edgeUserData = path.join(home, 'Library', 'Application Support', 'Microsoft Edge');
        const edgeProfiles = await discoverChromiumProfiles(edgeUserData);
        for (const p of edgeProfiles) {
            targets.edge.push(...getChromiumProfileTargets(p));
        }
        targets.edge.push(path.join(home, 'Library', 'Caches', 'Microsoft Edge'));
        targets.firefox.push(path.join(home, 'Library', 'Caches', 'Firefox'));
    }
    else {
        // Linux
        targets.chrome.push(path.join(home, '.cache', 'google-chrome'), path.join(home, '.config', 'google-chrome', 'Default', 'Cache'));
        targets.edge.push(path.join(home, '.cache', 'microsoft-edge'));
        targets.firefox.push(path.join(home, '.cache', 'mozilla', 'firefox'));
    }
    return targets;
}
export async function scanBrowserPrivacy() {
    const results = [];
    const targetsMap = await getAllBrowserScanTargets();
    for (const [browserKey, paths] of Object.entries(targetsMap)) {
        let totalSize = 0;
        let fileCount = 0;
        for (const p of paths) {
            const stats = await getDirStats(p);
            totalSize += stats.size;
            fileCount += stats.count;
        }
        results.push({
            browser: browserKey,
            cacheSize: totalSize,
            cookiesSize: 0,
            totalSize: totalSize,
            fileCount: fileCount,
        });
    }
    return results;
}
import { execFile } from 'child_process';
import { promisify } from 'util';
const execFileAsync = promisify(execFile);
export async function getRunningBrowsers() {
    const running = [];
    const platform = os.platform();
    try {
        if (platform === 'win32') {
            const { stdout } = await execFileAsync('powershell', [
                '-NoProfile',
                '-Command',
                'Get-Process chrome, msedge, msedgewebview2, brave, opera, firefox -ErrorAction SilentlyContinue | Select-Object -Unique ProcessName | ConvertTo-Json; exit 0'
            ]);
            if (stdout.trim()) {
                const parsed = JSON.parse(stdout);
                const list = Array.isArray(parsed) ? parsed : [parsed];
                const names = list.map((p) => (p.ProcessName || '').toLowerCase());
                if (names.includes('chrome'))
                    running.push('Google Chrome');
                if (names.includes('msedge') || names.includes('msedgewebview2'))
                    running.push('Microsoft Edge');
                if (names.includes('brave'))
                    running.push('Brave Browser');
                if (names.includes('opera'))
                    running.push('Opera Browser');
                if (names.includes('firefox'))
                    running.push('Mozilla Firefox');
            }
        }
        else {
            const { stdout } = await execFileAsync('ps', ['aux']);
            const lower = stdout.toLowerCase();
            if (lower.includes('chrome'))
                running.push('Google Chrome');
            if (lower.includes('msedge') || lower.includes('msedgewebview2'))
                running.push('Microsoft Edge');
            if (lower.includes('brave'))
                running.push('Brave Browser');
            if (lower.includes('opera'))
                running.push('Opera Browser');
            if (lower.includes('firefox'))
                running.push('Mozilla Firefox');
        }
    }
    catch (e) {
        // Process check fallback
    }
    return running;
}
export async function cleanBrowserPrivacy(browsers) {
    const runningBrowsers = await getRunningBrowsers();
    const selectedRunning = runningBrowsers.filter(rb => browsers.some(b => rb.toLowerCase().includes(b.toLowerCase())));
    const targetsMap = await getAllBrowserScanTargets();
    let totalDeleted = 0;
    let totalFailed = 0;
    for (const browserKey of browsers) {
        const key = browserKey.toLowerCase();
        const paths = targetsMap[key] || [];
        if (key === 'chrome' && selectedRunning.includes('Google Chrome'))
            continue;
        if (key === 'edge' && selectedRunning.includes('Microsoft Edge'))
            continue;
        if (key === 'brave' && selectedRunning.includes('Brave Browser'))
            continue;
        if (key === 'opera' && selectedRunning.includes('Opera Browser'))
            continue;
        if (key === 'firefox' && selectedRunning.includes('Mozilla Firefox'))
            continue;
        for (const pPath of paths) {
            const res = await deleteContents(pPath);
            totalDeleted += res.deleted;
            totalFailed += res.failed;
        }
    }
    return { totalDeleted, totalFailed, openBrowsers: selectedRunning };
}
export async function closeRunningBrowsers(browsers) {
    const platform = os.platform();
    const targets = [];
    for (const b of browsers) {
        const lower = b.toLowerCase();
        if (lower.includes('chrome'))
            targets.push('chrome');
        if (lower.includes('edge'))
            targets.push('msedge', 'msedgewebview2');
        if (lower.includes('firefox'))
            targets.push('firefox');
        if (lower.includes('brave'))
            targets.push('brave');
        if (lower.includes('opera'))
            targets.push('opera');
    }
    if (targets.length === 0)
        return true;
    try {
        if (platform === 'win32') {
            const command = `Stop-Process -Name ${targets.join(',')} -Force -ErrorAction SilentlyContinue; exit 0`;
            await execFileAsync('powershell', ['-NoProfile', '-Command', command]);
        }
        else {
            for (const t of targets) {
                await execFileAsync('pkill', ['-f', t]).catch(() => { });
            }
        }
        await new Promise(res => setTimeout(res, 500));
        return true;
    }
    catch (e) {
        return false;
    }
}
