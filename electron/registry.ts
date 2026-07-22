import * as os from 'os';
import * as path from 'path';
import { readdir } from 'fs/promises';

export interface InstalledApp {
  displayName: string;
  displayVersion: string;
  publisher: string;
  installLocation: string;
}

/**
 * Get installed applications for the current platform.
 * - Windows: Reads the Windows Registry
 * - macOS: Scans /Applications for .app bundles
 * - Linux: Scans /usr/share/applications for .desktop files
 */
export async function getInstalledApps(): Promise<InstalledApp[]> {
  const platform = os.platform();

  if (platform === 'darwin') {
    return getMacApps();
  }

  if (platform === 'linux') {
    return getLinuxApps();
  }

  // Windows (default)
  return getWindowsApps();
}

/**
 * Windows: Read installed apps from the Registry.
 */
async function getWindowsApps(): Promise<InstalledApp[]> {
  // Dynamic import so the app doesn't crash on non-Windows platforms
  let registryJs: any;
  try {
    registryJs = await import('registry-js');
  } catch {
    console.warn('registry-js not available — skipping Windows Registry scan');
    return [];
  }

  const { enumerateValues, enumerateKeys, HKEY } = registryJs;
  const apps: InstalledApp[] = [];
  const uninstallKeys = [
    { hive: HKEY.HKEY_LOCAL_MACHINE, key: '\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Uninstall' },
    { hive: HKEY.HKEY_LOCAL_MACHINE, key: '\\SOFTWARE\\WOW6432Node\\Microsoft\\Windows\\CurrentVersion\\Uninstall' },
    { hive: HKEY.HKEY_CURRENT_USER, key: '\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Uninstall' },
  ];

  for (const root of uninstallKeys) {
    try {
      const subkeys = enumerateKeys(root.hive, root.key);
      for (const subkey of subkeys) {
        const fullKey = `${root.key}\\${subkey}`;
        const values = enumerateValues(root.hive, fullKey);

        const appInfo: Partial<InstalledApp> = {};
        for (const val of values) {
          if (val.name === 'DisplayName' && val.type === 'REG_SZ') appInfo.displayName = val.data;
          if (val.name === 'DisplayVersion' && val.type === 'REG_SZ') appInfo.displayVersion = val.data;
          if (val.name === 'Publisher' && val.type === 'REG_SZ') appInfo.publisher = val.data;
          if (val.name === 'InstallLocation' && val.type === 'REG_SZ') appInfo.installLocation = val.data;
        }

        if (appInfo.displayName) {
          apps.push(appInfo as InstalledApp);
        }
      }
    } catch (error) {
      console.warn(`Failed to read registry key: ${root.key}`, error);
    }
  }

  return apps;
}

/**
 * macOS: Scan /Applications and ~/Applications for .app bundles.
 */
async function getMacApps(): Promise<InstalledApp[]> {
  const apps: InstalledApp[] = [];
  const appDirs = [
    '/Applications',
    '/Applications/Utilities',
    path.join(os.homedir(), 'Applications'),
  ];

  for (const dir of appDirs) {
    try {
      const entries = await readdir(dir, { withFileTypes: true });
      for (const entry of entries) {
        if (entry.name.endsWith('.app')) {
          const appName = entry.name.replace(/\.app$/, '');
          apps.push({
            displayName: appName,
            displayVersion: '',
            publisher: '',
            installLocation: path.join(dir, entry.name),
          });
        }
      }
    } catch {
      // Directory may not exist
    }
  }

  return apps;
}

/**
 * Linux: Scan /usr/share/applications and ~/.local/share/applications for .desktop files.
 */
async function getLinuxApps(): Promise<InstalledApp[]> {
  const apps: InstalledApp[] = [];
  const appDirs = [
    '/usr/share/applications',
    '/usr/local/share/applications',
    path.join(os.homedir(), '.local', 'share', 'applications'),
  ];

  for (const dir of appDirs) {
    try {
      const entries = await readdir(dir, { withFileTypes: true });
      for (const entry of entries) {
        if (entry.name.endsWith('.desktop')) {
          const appName = entry.name.replace(/\.desktop$/, '');
          apps.push({
            displayName: appName,
            displayVersion: '',
            publisher: '',
            installLocation: path.join(dir, entry.name),
          });
        }
      }
    } catch {
      // Directory may not exist
    }
  }

  return apps;
}