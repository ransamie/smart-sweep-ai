export interface ElectronAPI {
  scanDirectory: (dirPath: string) => Promise<any>;
  getInstalledApps: () => Promise<any>;
  getAIRecommendation: (apiKey: string, scanData: any) => Promise<string>;
  getSystemPaths: () => Promise<any>;
  getDiskSpace: (drivePath?: string) => Promise<any>;
  getOrphanedData: () => Promise<any>;
  getDrives: () => Promise<any>;
  validateApiKey: (apiKey: string) => Promise<boolean>;
  explainPath: (apiKey: string, targetPath: string) => Promise<string>;
  scanSystemJunk: () => Promise<any>;
  cleanSystemJunk: (categoryIds: string[]) => Promise<any>;
  deleteFiles: (paths: string[]) => Promise<any>;
  restoreFile: (originalPath: string) => Promise<any>;
  scanBrowserPrivacy: () => Promise<any>;
  cleanBrowserPrivacy: (browsers: string[]) => Promise<any>;
  getStartupItems: () => Promise<any>;
  toggleStartupItem: (name: string, location: string, enable: boolean, itemPath: string) => Promise<any>;
  analyzeStartup: (apiKey: string, items: any[]) => Promise<string>;
  showInFolder: (path: string) => Promise<any>;
  sendNotification: (title: string, body: string) => Promise<any>;
  minimizeWindow: () => Promise<any>;
  maximizeWindow: () => Promise<any>;
  closeWindow: () => Promise<any>;
  getSettings: () => Promise<any>;
  updateSettings: (settings: any) => Promise<any>;
  onNavigate: (callback: (route: string) => void) => void;
}

declare global {
  interface Window {
    electronAPI?: ElectronAPI;
  }
}

export {};
