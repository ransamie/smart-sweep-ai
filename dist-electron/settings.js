import * as fs from 'fs/promises';
import * as path from 'path';
import { app } from 'electron';
const DEFAULT_SETTINGS = {
    scheduledCleanupEnabled: true,
    scheduledCleanupTime: '18:00',
};
let settingsPath = '';
function getSettingsPath() {
    if (!settingsPath) {
        settingsPath = path.join(app.getPath('userData'), 'smartsweep_settings.json');
    }
    return settingsPath;
}
export async function getSettings() {
    try {
        const data = await fs.readFile(getSettingsPath(), 'utf-8');
        const parsed = JSON.parse(data);
        return { ...DEFAULT_SETTINGS, ...parsed };
    }
    catch (error) {
        // If file doesn't exist or is corrupted, return defaults
        return DEFAULT_SETTINGS;
    }
}
export async function updateSettings(newSettings) {
    const currentSettings = await getSettings();
    const updated = { ...currentSettings, ...newSettings };
    try {
        await fs.writeFile(getSettingsPath(), JSON.stringify(updated, null, 2), 'utf-8');
    }
    catch (error) {
        console.error('Failed to save settings:', error);
    }
    return updated;
}
