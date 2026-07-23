import * as os from 'os';
import * as path from 'path';
import { readdir, rename } from 'fs/promises';
import { execFile } from 'child_process';
import { promisify } from 'util';
const execFileAsync = promisify(execFile);
/**
 * Get startup items for the current platform.
 * - Windows: Registry Run keys + Startup Folder
 * - macOS: ~/Library/LaunchAgents plist files
 * - Linux: ~/.config/autostart .desktop files
 */
export async function getStartupItems() {
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
export async function toggleStartupItem(name, location, enable, itemPath = '') {
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
async function getWindowsStartupItems() {
    const items = [];
    const seenNames = new Set();
    // Primary: Use PowerShell Win32_StartupCommand (Matches Windows Task Manager Startup tab)
    try {
        const { stdout } = await execFileAsync('powershell', [
            '-NoProfile',
            '-Command',
            'Get-CimInstance Win32_StartupCommand | Select-Object Name, Command, Location | ConvertTo-Json'
        ]);
        if (stdout.trim()) {
            const parsed = JSON.parse(stdout);
            const rawList = Array.isArray(parsed) ? parsed : [parsed];
            for (const entry of rawList) {
                if (entry.Name && !seenNames.has(entry.Name)) {
                    const locStr = (entry.Location || '').toUpperCase();
                    if (locStr.includes('STARTUP')) {
                        // Skip folder items in PowerShell so the fallback folder scan catches them
                        // and provides absolute file paths instead of relative names.
                        continue;
                    }
                    let mappedLocation = 'HKCU';
                    if (locStr.includes('HKLM') || locStr.includes('LOCAL_MACHINE')) {
                        mappedLocation = 'HKLM';
                    }
                    seenNames.add(entry.Name);
                    items.push({
                        name: entry.Name,
                        path: entry.Command || '',
                        location: mappedLocation,
                        enabled: true
                    });
                }
            }
        }
    }
    catch (e) {
        console.warn('Win32_StartupCommand PowerShell query failed, using registry fallback', e);
    }
    // Fallback / Supplementary scan via registry-js & folders
    let registryJs;
    try {
        registryJs = await import('registry-js');
        const { enumerateValues, HKEY } = registryJs;
        const registryLocations = [
            { hive: HKEY.HKEY_CURRENT_USER, key: '\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Run', locationName: 'HKCU' },
            { hive: HKEY.HKEY_LOCAL_MACHINE, key: '\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Run', locationName: 'HKLM' },
            { hive: HKEY.HKEY_LOCAL_MACHINE, key: '\\SOFTWARE\\WOW6432Node\\Microsoft\\Windows\\CurrentVersion\\Run', locationName: 'HKLM64' },
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
                            enabled: true,
                        });
                    }
                }
            }
            catch (e) {
                // Skip inaccessible key
            }
        }
    }
    catch {
        // Registry-js fallback ignored
    }
    // Startup folder scan
    try {
        const { app } = await import('electron');
        const userStartupDir = path.join(app.getPath('appData'), 'Microsoft', 'Windows', 'Start Menu', 'Programs', 'Startup');
        const commonStartupDir = 'C:\\ProgramData\\Microsoft\\Windows\\Start Menu\\Programs\\Startup';
        for (const dir of [userStartupDir, commonStartupDir]) {
            try {
                const files = await readdir(dir, { withFileTypes: true });
                for (const file of files) {
                    if (file.isFile() && !seenNames.has(file.name)) {
                        const isDisabled = file.name.endsWith('.disabled');
                        const displayName = isDisabled ? file.name.slice(0, -9) : file.name;
                        seenNames.add(displayName);
                        items.push({
                            name: displayName,
                            path: path.join(dir, file.name),
                            location: 'Folder',
                            enabled: !isDisabled,
                        });
                    }
                }
            }
            catch { }
        }
    }
    catch (e) {
        console.warn('Failed to read startup folder', e);
    }
    return items;
}
async function toggleWindowsStartupItem(name, location, enable, itemPath = '') {
    if (location === 'Folder') {
        if (!enable) {
            if (!itemPath.endsWith('.disabled')) {
                await rename(itemPath, `${itemPath}.disabled`);
            }
        }
        else {
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
            if (!itemPath)
                throw new Error('Path is required to enable a registry startup item.');
            let registryJs;
            try {
                registryJs = await import('registry-js');
            }
            catch {
                throw new Error('registry-js not available');
            }
            const { setValue, RegistryValueType, HKEY } = registryJs;
            const hive = location === 'HKLM' ? HKEY.HKEY_LOCAL_MACHINE : HKEY.HKEY_CURRENT_USER;
            setValue(hive, '\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Run', name, RegistryValueType.REG_SZ, itemPath);
        }
        else {
            await execFileAsync('reg', ['delete', regKey, '/v', name, '/f']);
        }
    }
}
// ─── macOS ───────────────────────────────────────────────────────
async function getMacStartupItems() {
    const items = [];
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
    }
    catch {
        // Directory may not exist
    }
    return items;
}
async function toggleMacStartupItem(name, location, enable, itemPath = '') {
    if (!itemPath)
        return;
    if (enable) {
        // Re-enable: rename .disabled.plist back to .plist
        if (itemPath.endsWith('.disabled.plist')) {
            const newPath = itemPath.replace(/\.disabled\.plist$/, '.plist');
            await rename(itemPath, newPath);
        }
    }
    else {
        // Disable: rename .plist to .disabled.plist
        if (itemPath.endsWith('.plist') && !itemPath.endsWith('.disabled.plist')) {
            await rename(itemPath, `${itemPath}.disabled`);
        }
    }
}
// ─── Linux ───────────────────────────────────────────────────────
async function getLinuxStartupItems() {
    const items = [];
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
    }
    catch {
        // Directory may not exist
    }
    return items;
}
async function toggleLinuxStartupItem(name, location, enable, itemPath = '') {
    if (!itemPath)
        return;
    if (enable) {
        if (itemPath.endsWith('.disabled.desktop')) {
            const newPath = itemPath.replace(/\.disabled\.desktop$/, '.desktop');
            await rename(itemPath, newPath);
        }
    }
    else {
        if (itemPath.endsWith('.desktop') && !itemPath.endsWith('.disabled.desktop')) {
            await rename(itemPath, `${itemPath}.disabled`);
        }
    }
}
