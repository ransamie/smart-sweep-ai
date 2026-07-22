import { enumerateValues, HKEY, RegistryValueType, setValue } from 'registry-js';
import { app } from 'electron';
import * as path from 'path';
import { readdir } from 'fs/promises';
import { execFile } from 'child_process';
import { promisify } from 'util';

const execFileAsync = promisify(execFile);

export interface StartupItem {
  name: string;
  path: string;
  location: string;
  enabled: boolean;
}

export async function getStartupItems(): Promise<StartupItem[]> {
  const items: StartupItem[] = [];

  const registryLocations = [
    { hive: HKEY.HKEY_CURRENT_USER, key: '\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Run', locationName: 'HKCU' },
    { hive: HKEY.HKEY_LOCAL_MACHINE, key: '\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Run', locationName: 'HKLM' }
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
            enabled: true
          });
        }
      }
    } catch (e) {
      console.warn(`Failed to read registry key: ${loc.key}`, e);
    }
  }

  try {
    const startupFolderPath = path.join(app.getPath('appData'), 'Microsoft', 'Windows', 'Start Menu', 'Programs', 'Startup');
    const files = await readdir(startupFolderPath, { withFileTypes: true });
    for (const file of files) {
      if (file.isFile()) {
        const isDisabled = file.name.endsWith('.disabled');
        const displayName = isDisabled ? file.name.slice(0, -9) : file.name;
        items.push({
          name: displayName,
          path: path.join(startupFolderPath, file.name),
          location: 'Folder',
          enabled: !isDisabled
        });
      }
    }
  } catch (e) {
    console.warn('Failed to read startup folder', e);
  }

  return items;
}

export async function toggleStartupItem(name: string, location: string, enable: boolean, itemPath: string = ''): Promise<void> {
  if (location === 'Folder') {
    const { rename } = await import('fs/promises');
    if (!enable) {
      // Disable: rename file to add .disabled extension
      if (!itemPath.endsWith('.disabled')) {
        await rename(itemPath, `${itemPath}.disabled`);
      }
    } else {
      // Enable: strip .disabled extension
      if (itemPath.endsWith('.disabled')) {
        const newPath = itemPath.replace(/\.disabled$/, '');
        await rename(itemPath, newPath);
      }
    }
    return;
  }

  const regKey = location === 'HKLM' 
    ? 'HKLM\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Run'
    : 'HKCU\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Run';

  if (location === 'HKLM' || location === 'HKCU') {
    if (enable) {
      if (!itemPath) throw new Error('Path is required to enable a registry startup item.');
      const hive = location === 'HKLM' ? HKEY.HKEY_LOCAL_MACHINE : HKEY.HKEY_CURRENT_USER;
      setValue(hive, '\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Run', name, RegistryValueType.REG_SZ, itemPath);
    } else {
      // Use reg.exe to delete the value since registry-js doesn't expose deleteValue
      await execFileAsync('reg', ['delete', regKey, '/v', name, '/f']);
    }
  }
}
