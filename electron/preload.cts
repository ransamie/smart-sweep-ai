const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  scanDirectory: (dirPath: string) => ipcRenderer.invoke('scan-directory', dirPath),
  getInstalledApps: () => ipcRenderer.invoke('get-installed-apps'),
  getAIRecommendation: (apiKey: string, scanData: any) => ipcRenderer.invoke('get-ai-recommendation', apiKey, scanData),
  getSystemPaths: () => ipcRenderer.invoke('get-system-paths'),
  getDiskSpace: (drivePath?: string) => ipcRenderer.invoke('get-disk-space', drivePath),
  getOrphanedData: () => ipcRenderer.invoke('get-orphaned-data'),
  getDrives: () => ipcRenderer.invoke('get-drives'),
  validateApiKey: (apiKey: string) => ipcRenderer.invoke('validate-api-key', apiKey),
  clearAiCache: () => ipcRenderer.invoke('clear-ai-cache'),
  explainPath: (apiKey: string, targetPath: string) => ipcRenderer.invoke('explain-path', apiKey, targetPath),
  scanSystemJunk: () => ipcRenderer.invoke('scan-system-junk'),
  cleanSystemJunk: (categoryIds: string[]) => ipcRenderer.invoke('clean-system-junk', categoryIds),
  deleteFiles: (paths: string[]) => ipcRenderer.invoke('delete-files', paths),
  restoreFile: (originalPath: string) => ipcRenderer.invoke('restore-file', originalPath),
  scanBrowserPrivacy: () => ipcRenderer.invoke('scan-browser-privacy'),
  cleanBrowserPrivacy: (browsers: string[]) => ipcRenderer.invoke('clean-browser-privacy', browsers),
  getStartupItems: () => ipcRenderer.invoke('get-startup-items'),
  toggleStartupItem: (name: string, location: string, enable: boolean, itemPath: string) => ipcRenderer.invoke('toggle-startup-item', name, location, enable, itemPath),
  analyzeStartup: (apiKey: string, items: any[]) => ipcRenderer.invoke('analyze-startup', apiKey, items),
  showInFolder: (path: string) => ipcRenderer.invoke('show-in-folder', path),
  sendNotification: (title: string, body: string) => ipcRenderer.invoke('send-notification', title, body),
  minimizeWindow: () => ipcRenderer.invoke('window-minimize'),
  maximizeWindow: () => ipcRenderer.invoke('window-maximize'),
  closeWindow: () => ipcRenderer.invoke('window-close'),
  getSettings: () => ipcRenderer.invoke('get-settings'),
  updateSettings: (settings: any) => ipcRenderer.invoke('update-settings', settings),
  onNavigate: (callback: (route: string) => void) => {
    ipcRenderer.on('navigate-to', (_event: Electron.IpcRendererEvent, route: string) => callback(route));
  },
  platform: process.platform
});
