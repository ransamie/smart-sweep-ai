export interface DriveInfo {
  letter: string;
  root: string;
  label: string;
  total: number;
  free: number;
  used: number;
}

export interface DiskSpaceInfo {
  total: number;
  free: number;
  used: number;
  error?: string;
}

export interface SystemPathsInfo {
  home: string;
  appData: string;
  temp: string;
  downloads: string;
}

export interface AppSettings {
  scheduledCleanupEnabled: boolean;
  scheduledCleanupTime: string;
  launchAtStartup: boolean;
  hasCompletedOnboarding: boolean;
}

export interface HistoryEntry {
  id: string;
  timestamp: number;
  scanType: string;
  bytesCleaned: number;
  details: string;
  items?: string[];
}

export interface QuarantinedItem {
  id: string;
  originalPath: string;
  fileName: string;
  size: number;
  isDirectory: boolean;
  quarantinedAt: number;
  expiresAt: number;
  daysRemaining: number;
}

export interface AppDebrisItem {
  id: string;
  folderName: string;
  folderPath: string;
  locationLabel: string;
  size: number;
  fileCount: number;
  lastModified: number;
}

export interface BrowserScanResult {
  browser: string;
  cacheSize: number;
  cookiesSize: number;
  totalSize: number;
  fileCount?: number;
}

export interface StartupItem {
  name: string;
  path: string;
  location: string;
  enabled: boolean;
}

export interface ElectronAPI {
  scanDirectory: (dirPath: string) => Promise<any>;
  getInstalledApps: () => Promise<any>;
  getAIRecommendation: (apiKey: string | null, scanData: any) => Promise<string | { error?: string }>;
  getSystemPaths: () => Promise<SystemPathsInfo>;
  getDiskSpace: (drivePath?: string) => Promise<DiskSpaceInfo>;
  getOrphanedData: () => Promise<AppDebrisItem[] | { error: string }>;
  getDrives: () => Promise<DriveInfo[]>;
  validateApiKey: (apiKey: string) => Promise<boolean>;
  clearAiCache: () => Promise<{ success: boolean }>;
  explainPath: (apiKey: string | null, targetPath: string) => Promise<string | { error?: string }>;
  scanSystemJunk: () => Promise<any>;
  cleanSystemJunk: (categoryIds: string[]) => Promise<any>;
  deleteFiles: (paths: string[]) => Promise<{
    quarantined: number;
    failed: number;
    errors: Array<{ path: string; error: string }>;
  }>;
  restoreFile: (originalPath: string) => Promise<{ success: boolean; error?: string }>;
  listQuarantine: () => Promise<QuarantinedItem[]>;
  deleteQuarantineItem: (originalPath: string) => Promise<{ success: boolean; error?: string }>;
  emptyQuarantine: () => Promise<{ success: boolean; deletedCount: number; error?: string }>;
  scanBrowserPrivacy: () => Promise<BrowserScanResult[]>;
  cleanBrowserPrivacy: (browsers: string[]) => Promise<{
    totalDeleted: number;
    totalFailed: number;
    openBrowsers: string[];
    bytesDeleted: number;
  }>;
  closeRunningBrowsers: (browsers: string[]) => Promise<boolean>;
  getStartupItems: () => Promise<StartupItem[]>;
  toggleStartupItem: (name: string, location: string, enable: boolean, itemPath: string) => Promise<void>;
  analyzeStartup: (apiKey: string | null, items: StartupItem[]) => Promise<string>;
  showInFolder: (path: string) => Promise<void>;
  sendNotification: (title: string, body: string) => Promise<void>;
  minimizeWindow: () => Promise<void>;
  maximizeWindow: () => Promise<void>;
  closeWindow: () => Promise<void>;
  checkForUpdates: () => Promise<{ available?: boolean; version?: string; error?: string }>;
  getSettings: () => Promise<AppSettings>;
  updateSettings: (settings: Partial<AppSettings>) => Promise<AppSettings>;
  getApiKey: () => Promise<string | null>;
  setApiKey: (key: string | null) => Promise<{ success: boolean; encrypted: boolean }>;
  onNavigate: (callback: (route: string) => void) => void;
  onAutoCleanupCompleted: (callback: (data: { totalBytes: number; cleanedStr: string; scanResults: any }) => void) => void;
  onUpdateDownloaded: (callback: (version: string) => void) => void;
  restartAndInstall: () => Promise<void>;
  getHistory: () => Promise<HistoryEntry[]>;
  clearHistory: () => Promise<void>;
  addHistoryEntry: (entry: Omit<HistoryEntry, 'id'>) => Promise<HistoryEntry>;
  platform: string;
}

declare global {
  interface Window {
    electronAPI?: ElectronAPI;
  }
}
