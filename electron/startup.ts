import * as os from 'os';
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

/**
 * Get startup items for the current platform.
 * - Windows: Registry Run keys + Startup Folder, using PowerShell
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

// ─── Windows ──────────────────────────────────────────────────────────────────

/**
 * Get the enabled/disabled state of startup items from the StartupApproved registry keys.
 * This is the exact same source Task Manager reads from.
 * 
 * The REG_BINARY value format is:
 *   - Byte 0 = 0x02 → ENABLED
 *   - Byte 0 = 0x03 → DISABLED
 */
async function getStartupApprovedState(): Promise<Map<string, boolean>> {
  const stateMap = new Map<string, boolean>();

  // PowerShell script to read all StartupApproved keys and return JSON
  const psScript = `
$result = @{}
$approvalPaths = @(
  @{Hive='HKCU'; Path='Software\\Microsoft\\Windows\\CurrentVersion\\Explorer\\StartupApproved\\Run'},
  @{Hive='HKCU'; Path='Software\\Microsoft\\Windows\\CurrentVersion\\Explorer\\StartupApproved\\Run32'},
  @{Hive='HKCU'; Path='Software\\Microsoft\\Windows\\CurrentVersion\\Explorer\\StartupApproved\\StartupFolder'},
  @{Hive='HKLM'; Path='SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Explorer\\StartupApproved\\Run'},
  @{Hive='HKLM'; Path='SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Explorer\\StartupApproved\\Run32'},
  @{Hive='HKLM'; Path='SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Explorer\\StartupApproved\\StartupFolder'}
)
foreach ($entry in $approvalPaths) {
  $regPath = "$($entry.Hive):\\$($entry.Path)"
  try {
    $props = Get-ItemProperty -Path $regPath -ErrorAction Stop
    $props.PSObject.Properties | Where-Object { $_.Name -notlike 'PS*' } | ForEach-Object {
      $bytes = $_.Value
      if ($bytes -is [byte[]]) {
        $isEnabled = ($bytes[0] -eq 0x02)
        $result[$_.Name.ToLower()] = $isEnabled
      }
    }
  } catch {}
}
$result | ConvertTo-Json -Compress
`;

  try {
    const { stdout } = await execFileAsync('powershell', [
      '-NoProfile', '-NonInteractive', '-Command', psScript
    ]);
    if (stdout.trim() && stdout.trim() !== 'null') {
      const parsed = JSON.parse(stdout.trim());
      for (const [key, val] of Object.entries(parsed)) {
        stateMap.set(key.toLowerCase(), val as boolean);
      }
    }
  } catch (e) {
    console.warn('Failed to read StartupApproved state via PowerShell', e);
  }

  return stateMap;
}

async function getWindowsStartupItems(): Promise<StartupItem[]> {
  const items: StartupItem[] = [];
  const seenNames = new Set<string>();

  // Get the definitive enabled/disabled state from StartupApproved keys
  const approvedState = await getStartupApprovedState();

  // Helper to determine enabled state: check StartupApproved first, default to true
  const isEnabled = (name: string): boolean => {
    const state = approvedState.get(name.toLowerCase());
    // If not in StartupApproved at all, the item is enabled by default
    return state === undefined ? true : state;
  };

  // Primary source: PowerShell Win32_StartupCommand (mirrors Task Manager Startup tab)
  try {
    const { stdout } = await execFileAsync('powershell', [
      '-NoProfile', '-NonInteractive', '-Command',
      'Get-CimInstance Win32_StartupCommand | Select-Object Name, Command, Location | ConvertTo-Json -Compress'
    ]);
    if (stdout.trim()) {
      const parsed = JSON.parse(stdout.trim());
      const rawList = Array.isArray(parsed) ? parsed : [parsed];
      for (const entry of rawList) {
        if (!entry.Name || seenNames.has(entry.Name)) continue;

        const locStr = (entry.Location || '').toUpperCase();
        // Skip startup folder items - handled below with actual file paths
        if (locStr.includes('STARTUP')) continue;

        let mappedLocation = 'HKCU';
        if (locStr.includes('HKLM') || locStr.includes('LOCAL_MACHINE')) {
          mappedLocation = 'HKLM';
        }

        seenNames.add(entry.Name);
        items.push({
          name: entry.Name,
          path: entry.Command || '',
          location: mappedLocation,
          enabled: isEnabled(entry.Name),
        });
      }
    }
  } catch (e) {
    console.warn('Win32_StartupCommand failed, falling through to registry fallback', e);
  }

  // Supplementary: direct registry scan (catches items Win32_StartupCommand may miss)
  try {
    const registryJs = await import('registry-js');
    const { enumerateValues, HKEY } = registryJs;
    const registryLocations = [
      { hive: HKEY.HKEY_CURRENT_USER, key: 'SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Run', locationName: 'HKCU' },
      { hive: HKEY.HKEY_LOCAL_MACHINE, key: 'SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Run', locationName: 'HKLM' },
      { hive: HKEY.HKEY_LOCAL_MACHINE, key: 'SOFTWARE\\WOW6432Node\\Microsoft\\Windows\\CurrentVersion\\Run', locationName: 'HKLM64' },
    ];
    for (const loc of registryLocations) {
      try {
        const values = enumerateValues(loc.hive, loc.key);
        for (const val of values) {
          if ((val.type === 'REG_SZ' || val.type === 'REG_EXPAND_SZ') && !seenNames.has(val.name)) {
            seenNames.add(val.name);
            items.push({
              name: val.name,
              path: val.data,
              location: loc.locationName,
              enabled: isEnabled(val.name),
            });
          }
        }
      } catch {}
    }
  } catch {}

  // Startup folder scan
  try {
    const { app } = await import('electron');
    const userStartupDir = path.join(
      app.getPath('appData'), 'Microsoft', 'Windows', 'Start Menu', 'Programs', 'Startup'
    );
    const commonStartupDir = 'C:\\ProgramData\\Microsoft\\Windows\\Start Menu\\Programs\\Startup';

    for (const dir of [userStartupDir, commonStartupDir]) {
      try {
        const files = await readdir(dir, { withFileTypes: true });
        for (const file of files) {
          if (file.isFile() && !seenNames.has(file.name)) {
            seenNames.add(file.name);
            items.push({
              name: file.name,
              path: path.join(dir, file.name),
              location: 'Folder',
              enabled: isEnabled(file.name),
            });
          }
        }
      } catch {}
    }
  } catch (e) {
    console.warn('Failed to read startup folder', e);
  }

  return items;
}

/**
 * Toggle a Windows startup item using PowerShell Set-ItemProperty.
 * This exactly replicates what Windows Task Manager does internally.
 *
 * ENABLED  → Set binary value to 0x02, 0x00, 0x00, 0x00 (12 bytes, rest zero)
 * DISABLED → Set binary value to 0x03, 0x00, 0x00, 0x00 (12 bytes, rest zero)
 */
async function toggleWindowsStartupItem(
  name: string,
  location: string,
  enable: boolean,
  itemPath: string = '',
): Promise<void> {
  const isHKLM = location === 'HKLM' || location === 'HKLM64' ||
    (location === 'Folder' && itemPath.toLowerCase().includes('programdata'));

  let subKeyType = 'Run';
  if (location === 'Folder') {
    subKeyType = 'StartupFolder';
  }

  const hive = isHKLM ? 'HKLM' : 'HKCU';
  const regPath = `${hive}:\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Explorer\\StartupApproved\\${subKeyType}`;

  // For folder items the value name is the filename, for registry items it's the name
  const valueName = location === 'Folder' ? path.basename(itemPath) : name;

  // Task Manager exact byte values:
  // Enable  = [0x02, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00]
  // Disable = [0x03, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00]
  const byteValue = enable
    ? '[byte[]](0x02,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00)'
    : '[byte[]](0x03,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00)';

  const psScript = `
$path = '${regPath.replace(/'/g, "''")}';
$name = '${valueName.replace(/'/g, "''")}';
$val = ${byteValue};
if (-not (Test-Path $path)) {
  New-Item -Path $path -Force | Out-Null
}
Set-ItemProperty -Path $path -Name $name -Value $val -Type Binary -Force;
Write-Output 'OK'
`;

  try {
    const { stdout } = await execFileAsync('powershell', [
      '-NoProfile', '-NonInteractive', '-Command', psScript
    ]);
    if (!stdout.includes('OK')) {
      throw new Error(`PowerShell did not confirm success. Output: ${stdout}`);
    }
    console.log(`Startup item "${valueName}" ${enable ? 'enabled' : 'disabled'} successfully.`);
  } catch (e) {
    console.error(`Failed to toggle startup item "${valueName}"`, e);
    throw e;
  }
}

// ─── macOS ───────────────────────────────────────────────────────────────────

async function getMacStartupItems(): Promise<StartupItem[]> {
  const items: StartupItem[] = [];
  const launchAgentsDir = path.join(os.homedir(), 'Library', 'LaunchAgents');

  try {
    const files = await readdir(launchAgentsDir, { withFileTypes: true });
    for (const file of files) {
      if (file.name.endsWith('.plist')) {
        const plistPath = path.join(launchAgentsDir, file.name);
        let enabled = true;
        try {
          const { stdout } = await execFileAsync('plutil', ['-extract', 'Disabled', 'xml1', '-o', '-', plistPath]);
          if (stdout.includes('<true/>')) enabled = false;
        } catch {}

        const name = file.name.replace(/\.plist$/, '');
        items.push({ name, path: plistPath, location: 'LaunchAgents', enabled });
      }
    }
  } catch {}

  return items;
}

async function toggleMacStartupItem(
  name: string,
  location: string,
  enable: boolean,
  itemPath: string = '',
): Promise<void> {
  if (!itemPath) return;
  try {
    if (enable) {
      await execFileAsync('launchctl', ['load', '-w', itemPath]);
    } else {
      await execFileAsync('launchctl', ['unload', '-w', itemPath]);
    }
  } catch (e) {
    console.warn(`launchctl toggle failed for ${itemPath}`, e);
  }
}

// ─── Linux ───────────────────────────────────────────────────────────────────

async function getLinuxStartupItems(): Promise<StartupItem[]> {
  const items: StartupItem[] = [];
  const autostartDir = path.join(os.homedir(), '.config', 'autostart');

  try {
    const files = await readdir(autostartDir, { withFileTypes: true });
    for (const file of files) {
      if (file.name.endsWith('.desktop')) {
        const desktopPath = path.join(autostartDir, file.name);
        let enabled = true;
        try {
          const { readFile } = await import('fs/promises');
          const content = await readFile(desktopPath, 'utf8');
          if (content.includes('Hidden=true') || content.includes('X-GNOME-Autostart-enabled=false')) {
            enabled = false;
          }
        } catch {}

        const name = file.name.replace(/\.desktop$/, '');
        items.push({ name, path: desktopPath, location: 'Autostart', enabled });
      }
    }
  } catch {}

  return items;
}

async function toggleLinuxStartupItem(
  name: string,
  location: string,
  enable: boolean,
  itemPath: string = '',
): Promise<void> {
  if (!itemPath) return;
  try {
    const { readFile, writeFile } = await import('fs/promises');
    let content = await readFile(itemPath, 'utf8');
    if (enable) {
      content = content.replace(/Hidden=true/g, 'Hidden=false');
      content = content.replace(/X-GNOME-Autostart-enabled=false/g, 'X-GNOME-Autostart-enabled=true');
    } else {
      if (content.includes('Hidden=')) {
        content = content.replace(/Hidden=false/g, 'Hidden=true');
      } else {
        content += '\nHidden=true\n';
      }
      content = content.replace(/X-GNOME-Autostart-enabled=true/g, 'X-GNOME-Autostart-enabled=false');
    }
    await writeFile(itemPath, content, 'utf8');
  } catch (e) {
    console.warn(`Failed to toggle linux desktop file ${itemPath}`, e);
  }
}