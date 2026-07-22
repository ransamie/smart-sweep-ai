import { enumerateValues, enumerateKeys, HKEY } from 'registry-js';
export async function getInstalledApps() {
    const apps = [];
    const uninstallKeys = [
        { hive: HKEY.HKEY_LOCAL_MACHINE, key: '\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Uninstall' },
        { hive: HKEY.HKEY_LOCAL_MACHINE, key: '\\SOFTWARE\\WOW6432Node\\Microsoft\\Windows\\CurrentVersion\\Uninstall' },
        { hive: HKEY.HKEY_CURRENT_USER, key: '\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Uninstall' }
    ];
    for (const root of uninstallKeys) {
        try {
            const subkeys = enumerateKeys(root.hive, root.key);
            for (const subkey of subkeys) {
                const fullKey = `${root.key}\\${subkey}`;
                const values = enumerateValues(root.hive, fullKey);
                const appInfo = {};
                for (const val of values) {
                    if (val.name === 'DisplayName' && val.type === 'REG_SZ')
                        appInfo.displayName = val.data;
                    if (val.name === 'DisplayVersion' && val.type === 'REG_SZ')
                        appInfo.displayVersion = val.data;
                    if (val.name === 'Publisher' && val.type === 'REG_SZ')
                        appInfo.publisher = val.data;
                    if (val.name === 'InstallLocation' && val.type === 'REG_SZ')
                        appInfo.installLocation = val.data;
                }
                if (appInfo.displayName) {
                    apps.push(appInfo);
                }
            }
        }
        catch (error) {
            console.warn(`Failed to read registry key: ${root.key}`, error);
        }
    }
    return apps;
}
