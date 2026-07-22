import * as path from 'path';
import * as fs from 'fs/promises';
import * as os from 'os';
async function getDirSize(dirPath) {
    let totalSize = 0;
    try {
        const entries = await fs.readdir(dirPath, { withFileTypes: true });
        for (const entry of entries) {
            const fullPath = path.join(dirPath, entry.name);
            if (entry.isDirectory()) {
                totalSize += await getDirSize(fullPath);
            }
            else {
                const stats = await fs.stat(fullPath);
                totalSize += stats.size;
            }
        }
    }
    catch (e) {
        // Ignore errors for unreadable directories/files
    }
    return totalSize;
}
// Explicitly preserve these files as requested, added as a fail-safe
const PRESERVED_FILES = new Set(['Login Data', 'Login Data-journal', 'Bookmarks', 'Bookmarks.bak']);
async function deleteContents(dirPath) {
    try {
        const entries = await fs.readdir(dirPath, { withFileTypes: true });
        for (const entry of entries) {
            if (PRESERVED_FILES.has(entry.name)) {
                continue;
            }
            const fullPath = path.join(dirPath, entry.name);
            try {
                if (entry.isDirectory()) {
                    await fs.rm(fullPath, { recursive: true, force: true });
                }
                else {
                    await fs.unlink(fullPath);
                }
            }
            catch (e) {
                // Ignore deletion errors
            }
        }
    }
    catch (e) {
        // Ignore if directory doesn't exist
    }
}
const localAppData = process.env.LOCALAPPDATA || path.join(os.homedir(), 'AppData', 'Local');
const roamingAppData = process.env.APPDATA || path.join(os.homedir(), 'AppData', 'Roaming');
const BROWSERS = {
    chrome: {
        cache: [
            path.join(localAppData, 'Google', 'Chrome', 'User Data', 'Default', 'Cache'),
            path.join(localAppData, 'Google', 'Chrome', 'User Data', 'Default', 'Code Cache'),
            path.join(localAppData, 'Google', 'Chrome', 'User Data', 'Default', 'GPUCache')
        ]
    },
    edge: {
        cache: [
            path.join(localAppData, 'Microsoft', 'Edge', 'User Data', 'Default', 'Cache'),
            path.join(localAppData, 'Microsoft', 'Edge', 'User Data', 'Default', 'Code Cache'),
            path.join(localAppData, 'Microsoft', 'Edge', 'User Data', 'Default', 'GPUCache')
        ]
    },
    firefox: {
        profilesDir: path.join(roamingAppData, 'Mozilla', 'Firefox', 'Profiles'),
        localProfilesDir: path.join(localAppData, 'Mozilla', 'Firefox', 'Profiles')
    }
};
async function getFileSize(filePath) {
    try {
        const stat = await fs.stat(filePath);
        return stat.size;
    }
    catch (e) {
        return 0;
    }
}
export async function scanBrowserPrivacy() {
    const results = [];
    // Chrome
    let chromeCache = 0;
    for (const cPath of BROWSERS.chrome.cache)
        chromeCache += await getDirSize(cPath);
    results.push({ browser: 'chrome', cacheSize: chromeCache, cookiesSize: 0, totalSize: chromeCache });
    // Edge
    let edgeCache = 0;
    for (const cPath of BROWSERS.edge.cache)
        edgeCache += await getDirSize(cPath);
    results.push({ browser: 'edge', cacheSize: edgeCache, cookiesSize: 0, totalSize: edgeCache });
    // Firefox
    let firefoxCacheSize = 0;
    try {
        const localProfiles = await fs.readdir(BROWSERS.firefox.localProfilesDir, { withFileTypes: true });
        for (const profile of localProfiles) {
            if (profile.isDirectory()) {
                firefoxCacheSize += await getDirSize(path.join(BROWSERS.firefox.localProfilesDir, profile.name, 'cache2'));
            }
        }
    }
    catch (e) { }
    results.push({ browser: 'firefox', cacheSize: firefoxCacheSize, cookiesSize: 0, totalSize: firefoxCacheSize });
    return results;
}
export async function cleanBrowserPrivacy(browsers) {
    for (const browser of browsers) {
        const b = browser.toLowerCase();
        if (b === 'chrome') {
            for (const cPath of BROWSERS.chrome.cache)
                await deleteContents(cPath);
        }
        else if (b === 'edge') {
            for (const cPath of BROWSERS.edge.cache)
                await deleteContents(cPath);
        }
        else if (b === 'firefox') {
            try {
                const localProfiles = await fs.readdir(BROWSERS.firefox.localProfilesDir, { withFileTypes: true });
                for (const profile of localProfiles) {
                    if (profile.isDirectory()) {
                        await deleteContents(path.join(BROWSERS.firefox.localProfilesDir, profile.name, 'cache2'));
                    }
                }
            }
            catch (e) { }
        }
    }
}
