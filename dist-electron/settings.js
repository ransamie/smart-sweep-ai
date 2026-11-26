import * as fs from 'fs/promises';
import * as path from 'path';
import { app, safeStorage } from 'electron';
const DEFAULT_SETTINGS = {
    scheduledCleanupEnabled: true,
    scheduledCleanupTime: '18:00',
    launchAtStartup: true,
    hasCompletedOnboarding: false,
};
let settingsPath = '';
let secretsPath = '';
function getSettingsPath() {
    if (!settingsPath) {
        settingsPath = path.join(app.getPath('userData'), 'smartsweep_settings.json');
    }
    return settingsPath;
}
function getSecretsPath() {
    if (!secretsPath) {
        secretsPath = path.join(app.getPath('userData'), 'smartsweep_secrets.json');
    }
    return secretsPath;
}
export async function getSettings() {
    try {
        const data = await fs.readFile(getSettingsPath(), 'utf-8');
        const parsed = JSON.parse(data);
        return { ...DEFAULT_SETTINGS, ...parsed };
    }
    catch {
        // If file doesn't exist or is corrupted, return defaults
        return DEFAULT_SETTINGS;
    }
}
export async function updateSettings(newSettings) {
    const currentSettings = await getSettings();
    const updated = { ...currentSettings, ...newSettings };
    try {
        await fs.mkdir(path.dirname(getSettingsPath()), { recursive: true });
        await fs.writeFile(getSettingsPath(), JSON.stringify(updated, null, 2), 'utf-8');
    }
    catch (error) {
        console.error('Failed to save settings:', error);
    }
    return updated;
}
export async function getStoredApiKey() {
    try {
        const raw = await fs.readFile(getSecretsPath(), 'utf-8');
        const parsed = JSON.parse(raw);
        if (!parsed.data || typeof parsed.data !== 'string') {
            return null;
        }
        if (parsed.encrypted) {
            if (!safeStorage.isEncryptionAvailable()) {
                console.warn('safeStorage encryption is unavailable; cannot decrypt stored API key.');
                return null;
            }
            const decrypted = safeStorage.decryptString(Buffer.from(parsed.data, 'base64'));
            return decrypted || null;
        }
        return Buffer.from(parsed.data, 'base64').toString('utf-8') || null;
    }
    catch {
        return null;
    }
}
export async function setStoredApiKey(key) {
    const targetPath = getSecretsPath();
    const trimmed = typeof key === 'string' ? key.trim() : '';
    if (!trimmed) {
        try {
            await fs.unlink(targetPath);
        }
        catch {
            // Ignore if file does not exist
        }
        return { success: true, encrypted: safeStorage.isEncryptionAvailable() };
    }
    try {
        await fs.mkdir(path.dirname(targetPath), { recursive: true });
        const encryptionAvailable = safeStorage.isEncryptionAvailable();
        const payload = encryptionAvailable
            ? {
                encrypted: true,
                data: safeStorage.encryptString(trimmed).toString('base64'),
                updatedAt: Date.now(),
            }
            : {
                encrypted: false,
                data: Buffer.from(trimmed, 'utf-8').toString('base64'),
                updatedAt: Date.now(),
            };
        await fs.writeFile(targetPath, JSON.stringify(payload, null, 2), { encoding: 'utf-8', mode: 0o600 });
        return { success: true, encrypted: encryptionAvailable };
    }
    catch (error) {
        console.error('Failed to store API key securely:', error);
        return { success: false, encrypted: false };
    }
}
