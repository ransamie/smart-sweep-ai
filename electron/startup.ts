import * as os from 'os';
import * as path from 'path';
import { readdir, rename } from 'fs/promises';
import { execFile } from 'child_process';
import { promisify } from 'util';

const execFileAsync = promisify(execFile);

export interface StartupItem {
  name: string;
  path: string;
  location: string;
  enabled: boolean;
}

/**
 * Get startup items for the current platform.
 * - Windows: Registry Run keys + Startup Folder
 * - macOS: ~/Library/LaunchAgents plist files
 * - Linux: ~/.config/autostart .desktop files
 */
export async function getStartupItems(): Promise<StartupItem[]> {
  const platform = os.platform();

  if (platform === 'darwin') {
    return getMacStartupItems();
  }

  if (platform === 'linux') {
    return getLinuxStartupItems();
  }

  // Windows (default)
  return getWindowsStartupItems();
}

/**
 * Toggle a startup item on/off.
 */
export async function toggleStartupItem(
  name: string,
  location: string,
  enable: boolean,
  itemPath: string = '',
): Promise<void> {
  const platform = os.platform();

  if (platform === 'darwin') {
    return toggleMacStartupItem(name, location, enable, itemPath);
  }

  if (platform === 'linux') {
    return toggleLinuxStartupItem(name, location, enable, itemPath);
  }

  // Windows (default)
  return toggleWindowsStartupItem(name, location, enable, itemPath);
}

// ─── Windows ─────────────────────────────────────────────────────

async function getWindowsStartupItems(): Promise<StartupItem[]> {
  const items: StartupItem[] = [];

  // Dynamic import for registry-js (Windows-only package)
  let registryJs: any;
  try {
    registryJs = await import('registry-js');
  } catch {
    console.warn('registry-js not available — skipping Registry startup scan');
    return items;
  }

  const { enumerateValues, HKEY } = registryJs;

  const registryLocations = [
    { hive: HKEY.HKEY_CURRENT_USER, key: '\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Run', locationName: 'HKCU' },
    { hive: HKEY.HKEY_LOCAL_MACHINE, key: '\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Run', locationName: 'HKLM' },
  ];

  for (const loc of registryLocations) {
    try {
      const values = enumerateValues(loc.hive, loc.key);
      for (const val of values) {
        if (val.type === 'REG_SZ' || val.type === 'REG_EXPAND_SZ') {
          items.push({
            name: val.name,
            path: val.data,
            location: loc.locationName,
            enabled: true,
          });
        }
      }
    } catch (e) {
      console.warn(`Failed to read registry key: ${loc.key}`, e);
    }
  }

  // Startup folder
  try {
    const { app } = await import('electron');
    const startupFolderPath = path.join(
      app.getPath('appData'),
      'Microsoft',
      'Windows',
      'Start Menu',
      'Programs',
      'Startup',
    );
    const files = await readdir(startupFolderPath, { withFileTypes: true });
    for (const file of files) {
      if (file.isFile()) {
        const isDisabled = file.name.endsWith('.disabled');
        const displayName = isDisabled ? file.name.slice(0, -9) : file.name;
        items.push({
          name: displayName,
          path: path.join(startupFolderPath, file.name),
          location: 'Folder',
          enabled: !isDisabled,
        });
      }
    }
  } catch (e) {
    console.warn('Failed to read startup folder', e);
  }

  return items;
}

async function toggleWindowsStartupItem(
  name: string,
  location: string,
  enable: boolean,
  itemPath: string = '',
): Promise<void> {
  if (location === 'Folder') {
    if (!enable) {
      if (!itemPath.endsWith('.disabled')) {
        await rename(itemPath, `${itemPath}.disabled`);
      }
    } else {
      if (itemPath.endsWith('.disabled')) {
        const newPath = itemPath.replace(/\.disabled$/, '');
        await rename(itemPath, newPath);
      }
    }
    return;
  }

  const regKey =
    location === 'HKLM'
      ? 'HKLM\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Run'
      : 'HKCU\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Run';

  if (location === 'HKLM' || location === 'HKCU') {
    if (enable) {
      if (!itemPath) throw new Error('Path is required to enable a registry startup item.');
      let registryJs: any;
      try {
        registryJs = await import('registry-js');
      } catch {
        throw new Error('registry-js not available');
      }
      const { setValue, RegistryValueType, HKEY } = registryJs;
      const hive = location === 'HKLM' ? HKEY.HKEY_LOCAL_MACHINE : HKEY.HKEY_CURRENT_USER;
      setValue(
        hive,
        '\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Run',
        name,
        RegistryValueType.REG_SZ,
        itemPath,
      );
    } else {
      await execFileAsync('reg', ['delete', regKey, '/v', name, '/f']);
    }
  }
}

// ─── macOS ───────────────────────────────────────────────────────

async function getMacStartupItems(): Promise<StartupItem[]> {
  const items: StartupItem[] = [];
  const launchAgentsDir = path.join(os.homedir(), 'Library', 'LaunchAgents');

  try {
    const files = await readdir(launchAgentsDir, { withFileTypes: true });
    for (const file of files) {
      if (file.name.endsWith('.plist')) {
        const name = file.name.replace(/\.plist$/, '');
        items.push({
          name,
          path: path.join(launchAgentsDir, file.name),
          location: 'LaunchAgents',
          enabled: true,
        });
      }
    }
  } catch {
    // Directory may not exist
  }

  return items;
}

async function toggleMacStartupItem(
  name: string,
  location: string,
  enable: boolean,
  itemPath: string = '',
): Promise<void> {
  if (!itemPath) return;
  if (enable) {
    // Re-enable: rename .disabled.plist back to .plist
    if (itemPath.endsWith('.disabled.plist')) {
      const newPath = itemPath.replace(/\.disabled\.plist$/, '.plist');
      await rename(itemPath, newPath);
    }
  } else {
    // Disable: rename .plist to .disabled.plist
    if (itemPath.endsWith('.plist') && !itemPath.endsWith('.disabled.plist')) {
      await rename(itemPath, `${itemPath}.disabled`);
    }
  }
}

// ─── Linux ───────────────────────────────────────────────────────

async function getLinuxStartupItems(): Promise<StartupItem[]> {
  const items: StartupItem[] = [];
  const autostartDir = path.join(os.homedir(), '.config', 'autostart');

  try {
    const files = await readdir(autostartDir, { withFileTypes: true });
    for (const file of files) {
      if (file.name.endsWith('.desktop')) {
        const name = file.name.replace(/\.desktop$/, '');
        items.push({
          name,
          path: path.join(autostartDir, file.name),
          location: 'Autostart',
          enabled: true,
        });
      }
    }
  } catch {
    // Directory may not exist
  }

  return items;
}

async function toggleLinuxStartupItem(
  name: string,
  location: string,
  enable: boolean,
  itemPath: string = '',
): Promise<void> {
  if (!itemPath) return;
  if (enable) {
    if (itemPath.endsWith('.disabled.desktop')) {
      const newPath = itemPath.replace(/\.disabled\.desktop$/, '.desktop');
      await rename(itemPath, newPath);
    }
  } else {
    if (itemPath.endsWith('.desktop') && !itemPath.endsWith('.disabled.desktop')) {
      await rename(itemPath, `${itemPath}.disabled`);
    }
  }
}