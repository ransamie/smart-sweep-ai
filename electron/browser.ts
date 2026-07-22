import * as path from 'path';
import * as fs from 'fs/promises';
import * as os from 'os';

async function getDirSize(dirPath: string): Promise<number> {
  let totalSize = 0;
  try {
    const entries = await fs.readdir(dirPath, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dirPath, entry.name);
      if (entry.isDirectory()) {
        totalSize += await getDirSize(fullPath);
      } else {
        const stats = await fs.stat(fullPath);
        totalSize += stats.size;
      }
    }
  } catch (e) {
    // Ignore errors for unreadable directories/files
  }
  return totalSize;
}

// Explicitly preserve these critical files
const PRESERVED_FILES = new Set(['Login Data', 'Login Data-journal', 'Bookmarks', 'Bookmarks.bak', 'Preferences', 'Secure Preferences']);

async function deleteContents(dirPath: string): Promise<{ deleted: number; failed: number }> {
  let deleted = 0;
  let failed = 0;
  try {
    const entries = await fs.readdir(dirPath, { withFileTypes: true });
    for (const entry of entries) {
      if (PRESERVED_FILES.has(entry.name)) {
        continue;
      }
      const fullPath = path.join(dirPath, entry.name);
      try {
        await fs.chmod(fullPath, 0o666).catch(() => {});
        if (entry.isDirectory()) {
          await fs.rm(fullPath, { recursive: true, force: true, maxRetries: 3, retryDelay: 50 });
        } else {
          await fs.unlink(fullPath);
        }
        deleted++;
      } catch (e) {
        try {
          await fs.rm(fullPath, { recursive: true, force: true });
          deleted++;
        } catch (err) {
          failed++;
        }
      }
    }
  } catch (e) {
    // Ignore if directory doesn't exist
  }
  return { deleted, failed };
}

export interface BrowserScanResult {
  browser: string;
  cacheSize: number;
  cookiesSize: number;
  totalSize: number;
}

/**
 * Returns browser cache directories based on the current platform.
 */
function getBrowserPaths(): Record<string, { cache: string[] }> {
  const platform = os.platform();
  const home = os.homedir();

  if (platform === 'darwin') {
    return {
      chrome: {
        cache: [
          path.join(home, 'Library', 'Caches', 'Google', 'Chrome', 'Default', 'Cache'),
          path.join(home, 'Library', 'Caches', 'Google', 'Chrome', 'Default', 'Code Cache'),
          path.join(home, 'Library', 'Caches', 'Google', 'Chrome', 'Default', 'GPUCache'),
        ],
      },
      edge: {
        cache: [
          path.join(home, 'Library', 'Caches', 'Microsoft Edge', 'Default', 'Cache'),
          path.join(home, 'Library', 'Caches', 'Microsoft Edge', 'Default', 'Code Cache'),
          path.join(home, 'Library', 'Caches', 'Microsoft Edge', 'Default', 'GPUCache'),
        ],
      },
      firefox: {
        cache: [
          path.join(home, 'Library', 'Caches', 'Firefox', 'Profiles'),
        ],
      },
    };
  }

  if (platform === 'linux') {
    return {
      chrome: {
        cache: [
          path.join(home, '.cache', 'google-chrome', 'Default', 'Cache'),
          path.join(home, '.cache', 'google-chrome', 'Default', 'Code Cache'),
          path.join(home, '.cache', 'google-chrome', 'Default', 'GPUCache'),
        ],
      },
      edge: {
        cache: [
          path.join(home, '.cache', 'microsoft-edge', 'Default', 'Cache'),
          path.join(home, '.cache', 'microsoft-edge', 'Default', 'Code Cache'),
          path.join(home, '.cache', 'microsoft-edge', 'Default', 'GPUCache'),
        ],
      },
      firefox: {
        cache: [
          path.join(home, '.cache', 'mozilla', 'firefox'),
        ],
      },
    };
  }

  // Windows (default)
  const localAppData = process.env.LOCALAPPDATA || path.join(home, 'AppData', 'Local');
  return {
    chrome: {
      cache: [
        path.join(localAppData, 'Google', 'Chrome', 'User Data', 'Default', 'Cache'),
        path.join(localAppData, 'Google', 'Chrome', 'User Data', 'Default', 'Code Cache'),
        path.join(localAppData, 'Google', 'Chrome', 'User Data', 'Default', 'GPUCache'),
        path.join(localAppData, 'Google', 'Chrome', 'User Data', 'Default', 'Service Worker', 'CacheStorage'),
        path.join(localAppData, 'Google', 'Chrome', 'User Data', 'Default', 'Service Worker', 'ScriptCache'),
      ],
    },
    edge: {
      cache: [
        path.join(localAppData, 'Microsoft', 'Edge', 'User Data', 'Default', 'Cache'),
        path.join(localAppData, 'Microsoft', 'Edge', 'User Data', 'Default', 'Code Cache'),
        path.join(localAppData, 'Microsoft', 'Edge', 'User Data', 'Default', 'GPUCache'),
        path.join(localAppData, 'Microsoft', 'Edge', 'User Data', 'Default', 'Service Worker', 'CacheStorage'),
        path.join(localAppData, 'Microsoft', 'Edge', 'User Data', 'Default', 'Service Worker', 'ScriptCache'),
      ],
    },
    firefox: {
      cache: [
        path.join(localAppData, 'Mozilla', 'Firefox', 'Profiles'),
      ],
    },
  };
}

export async function scanBrowserPrivacy(): Promise<BrowserScanResult[]> {
  const results: BrowserScanResult[] = [];
  const browsers = getBrowserPaths();

  // Chrome
  let chromeCache = 0;
  for (const cPath of browsers.chrome.cache) chromeCache += await getDirSize(cPath);
  results.push({ browser: 'chrome', cacheSize: chromeCache, cookiesSize: 0, totalSize: chromeCache });

  // Edge
  let edgeCache = 0;
  for (const cPath of browsers.edge.cache) edgeCache += await getDirSize(cPath);
  results.push({ browser: 'edge', cacheSize: edgeCache, cookiesSize: 0, totalSize: edgeCache });

  // Firefox
  let firefoxCacheSize = 0;
  for (const basePath of browsers.firefox.cache) {
    try {
      const entries = await fs.readdir(basePath, { withFileTypes: true });
      for (const entry of entries) {
        if (entry.isDirectory()) {
          firefoxCacheSize += await getDirSize(path.join(basePath, entry.name, 'cache2'));
        }
      }
    } catch (e) {
      // Directory may not exist
    }
  }
  results.push({ browser: 'firefox', cacheSize: firefoxCacheSize, cookiesSize: 0, totalSize: firefoxCacheSize });

  return results;
}

export async function cleanBrowserPrivacy(browsers: string[]): Promise<{ totalDeleted: number; totalFailed: number }> {
  const browserPaths = getBrowserPaths();
  let totalDeleted = 0;
  let totalFailed = 0;

  for (const browser of browsers) {
    const b = browser.toLowerCase();
    if (b === 'chrome') {
      for (const cPath of browserPaths.chrome.cache) {
        const res = await deleteContents(cPath);
        totalDeleted += res.deleted;
        totalFailed += res.failed;
      }
    } else if (b === 'edge') {
      for (const cPath of browserPaths.edge.cache) {
        const res = await deleteContents(cPath);
        totalDeleted += res.deleted;
        totalFailed += res.failed;
      }
    } else if (b === 'firefox') {
      for (const basePath of browserPaths.firefox.cache) {
        try {
          const entries = await fs.readdir(basePath, { withFileTypes: true });
          for (const entry of entries) {
            if (entry.isDirectory()) {
              const res = await deleteContents(path.join(basePath, entry.name, 'cache2'));
              totalDeleted += res.deleted;
              totalFailed += res.failed;
            }
          }
        } catch (e) {
          // Directory may not exist
        }
      }
    }
  }

  return { totalDeleted, totalFailed };
}
