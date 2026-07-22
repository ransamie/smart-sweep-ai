const { contextBridge, ipcRenderer } = require('electron');
contextBridge.exposeInMainWorld('electronAPI', {
    scanDirectory: (dirPath) => ipcRenderer.invoke('scan-directory', dirPath),
    getInstalledApps: () => ipcRenderer.invoke('get-installed-apps'),
    getAIRecommendation: (apiKey, scanData) => ipcRenderer.invoke('get-ai-recommendation', apiKey, scanData),
    getSystemPaths: () => ipcRenderer.invoke('get-system-paths'),
    getDiskSpace: (drivePath) => ipcRenderer.invoke('get-disk-space', drivePath),
    getOrphanedData: () => ipcRenderer.invoke('get-orphaned-data'),
    getDrives: () => ipcRenderer.invoke('get-drives'),
});
export {};
