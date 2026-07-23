"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const { contextBridge, ipcRenderer } = require('electron');
contextBridge.exposeInMainWorld('electronAPI', {
    scanDirectory: (dirPath) => ipcRenderer.invoke('scan-directory', dirPath),
    getInstalledApps: () => ipcRenderer.invoke('get-installed-apps'),
    getAIRecommendation: (apiKey, scanData) => ipcRenderer.invoke('get-ai-recommendation', apiKey, scanData),
    getSystemPaths: () => ipcRenderer.invoke('get-system-paths'),
    getDiskSpace: (drivePath) => ipcRenderer.invoke('get-disk-space', drivePath),
    getOrphanedData: () => ipcRenderer.invoke('get-orphaned-data'),
    getDrives: () => ipcRenderer.invoke('get-drives'),
    validateApiKey: (apiKey) => ipcRenderer.invoke('validate-api-key', apiKey),
    clearAiCache: () => ipcRenderer.invoke('clear-ai-cache'),
    explainPath: (apiKey, targetPath) => ipcRenderer.invoke('explain-path', apiKey, targetPath),
    scanSystemJunk: () => ipcRenderer.invoke('scan-system-junk'),
    cleanSystemJunk: (categoryIds) => ipcRenderer.invoke('clean-system-junk', categoryIds),
    deleteFiles: (paths) => ipcRenderer.invoke('delete-files', paths),
    restoreFile: (originalPath) => ipcRenderer.invoke('restore-file', originalPath),
    scanBrowserPrivacy: () => ipcRenderer.invoke('scan-browser-privacy'),
    cleanBrowserPrivacy: (browsers) => ipcRenderer.invoke('clean-browser-privacy', browsers),
    getStartupItems: () => ipcRenderer.invoke('get-startup-items'),
    toggleStartupItem: (name, location, enable, itemPath) => ipcRenderer.invoke('toggle-startup-item', name, location, enable, itemPath),
    analyzeStartup: (apiKey, items) => ipcRenderer.invoke('analyze-startup', apiKey, items),
    showInFolder: (path) => ipcRenderer.invoke('show-in-folder', path),
    sendNotification: (title, body) => ipcRenderer.invoke('send-notification', title, body),
    minimizeWindow: () => ipcRenderer.invoke('window-minimize'),
    maximizeWindow: () => ipcRenderer.invoke('window-maximize'),
    closeWindow: () => ipcRenderer.invoke('window-close'),
    getSettings: () => ipcRenderer.invoke('get-settings'),
    updateSettings: (settings) => ipcRenderer.invoke('update-settings', settings),
    onNavigate: (callback) => {
        ipcRenderer.on('navigate-to', (_event, route) => callback(route));
    }
});
