import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

interface AppState {
  apiKey: string | null;
  setApiKey: (key: string | null) => void;
  isScanning: boolean;
  setIsScanning: (scanning: boolean) => void;
  scanResults: any;
  setScanResults: (results: any) => void;
  systemPaths: any;
  diskSpace: { total: number; free: number; used: number } | null;
  selectedDrive: string;
  setSelectedDrive: (drive: string) => void;
  availableDrives: Array<{ letter: string; root: string; label: string; total: number; free: number; used: number }>;
  refreshDiskSpace: () => Promise<void>;
  
  dashboardSummary: string | null;
  setDashboardSummary: (s: string | null) => void;
  
  deepScanResults: any[];
  setDeepScanResults: (r: any[]) => void;
  deepScanExplanation: string | null;
  setDeepScanExplanation: (e: string | null) => void;
  spaceAnalyzerScanning: boolean;
  setSpaceAnalyzerScanning: (b: boolean) => void;
  spaceAnalyzerProgress: number;
  setSpaceAnalyzerProgress: (p: number) => void;

  systemCleanerState: 'idle' | 'scanning' | 'done';
  setSystemCleanerState: (s: 'idle' | 'scanning' | 'done') => void;
  systemCleanerCategories: any[];
  setSystemCleanerCategories: (c: any[]) => void;

  privacyResults: any;
  setPrivacyResults: (r: any) => void;
  privacyScanning: boolean;
  setPrivacyScanning: (b: boolean) => void;

  smartScanning: boolean;
  setSmartScanning: (b: boolean) => void;
  smartMetrics: { junk: number; privacy: number } | null;
  setSmartMetrics: (m: { junk: number; privacy: number } | null) => void;

  startupItems: any[];
  setStartupItems: (i: any[]) => void;
  startupAnalysis: string | null;
  setStartupAnalysis: (a: string | null) => void;

  automationSettings: { scheduledCleanupEnabled: boolean; scheduledCleanupTime: string } | null;
  setAutomationSettings: (settings: { scheduledCleanupEnabled: boolean; scheduledCleanupTime: string }) => void;
}

const AppContext = createContext<AppState | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [apiKey, setApiKey] = useState<string | null>(localStorage.getItem('gemini_api_key'));
  const [isScanning, setIsScanning] = useState(false);
  const [scanResults, setScanResults] = useState(null);
  const [systemPaths, setSystemPaths] = useState<any>(null);
  const [diskSpace, setDiskSpace] = useState<{ total: number; free: number; used: number } | null>(null);
  const [selectedDrive, setSelectedDrive] = useState<string>('C:\\');
  const [availableDrives, setAvailableDrives] = useState<Array<{ letter: string; root: string; label: string; total: number; free: number; used: number }>>([]);

  const [dashboardSummary, setDashboardSummary] = useState<string | null>(null);
  const [deepScanResults, setDeepScanResults] = useState<any[]>([]);
  const [deepScanExplanation, setDeepScanExplanation] = useState<string | null>(null);
  const [spaceAnalyzerScanning, setSpaceAnalyzerScanning] = useState(false);
  const [spaceAnalyzerProgress, setSpaceAnalyzerProgress] = useState(0);

  const [systemCleanerState, setSystemCleanerState] = useState<'idle' | 'scanning' | 'done'>('idle');
  const [systemCleanerCategories, setSystemCleanerCategories] = useState<any[]>([]);

  const [privacyResults, setPrivacyResults] = useState<any>(null);
  const [privacyScanning, setPrivacyScanning] = useState(false);

  const [smartScanning, setSmartScanning] = useState(false);
  const [smartMetrics, setSmartMetrics] = useState<{ junk: number; privacy: number } | null>(null);

  const [startupItems, setStartupItems] = useState<any[]>([]);
  const [startupAnalysis, setStartupAnalysis] = useState<string | null>(null);

  const [automationSettings, setAutomationSettingsState] = useState<{ scheduledCleanupEnabled: boolean; scheduledCleanupTime: string } | null>(null);

  const refreshDiskSpace = useCallback(async () => {
    // @ts-ignore
    if (window.electronAPI) {
      try {
        // @ts-ignore
        if (window.electronAPI.getDrives) {
          // @ts-ignore
          const drives = await window.electronAPI.getDrives();
          if (Array.isArray(drives)) setAvailableDrives(drives);
        }
        // @ts-ignore
        if (window.electronAPI.getDiskSpace) {
          // @ts-ignore
          const space = await window.electronAPI.getDiskSpace(selectedDrive);
          if (space && !space.error) {
            setDiskSpace(space);
          }
        }
      } catch (e) {
        console.error('Failed to refresh disk space:', e);
      }
    }
  }, [selectedDrive]);

  const setAutomationSettings = (settings: { scheduledCleanupEnabled: boolean; scheduledCleanupTime: string }) => {
    setAutomationSettingsState(settings);
    // @ts-ignore
    if (window.electronAPI?.updateSettings) {
      // @ts-ignore
      window.electronAPI.updateSettings(settings).catch(console.error);
    }
  };

  useEffect(() => {
    if (apiKey) {
      localStorage.setItem('gemini_api_key', apiKey);
    } else {
      localStorage.removeItem('gemini_api_key');
    }
    // Clear old AI cached summary and advice whenever API key changes
    setDashboardSummary(null);
    setStartupAnalysis(null);
    setDeepScanExplanation(null);
    // @ts-ignore
    if (window.electronAPI?.clearAiCache) {
      // @ts-ignore
      window.electronAPI.clearAiCache();
    }
  }, [apiKey]);

  useEffect(() => {
    // @ts-ignore
    if (window.electronAPI) {
      // @ts-ignore
      window.electronAPI.getSystemPaths().then(setSystemPaths);

      // Fetch automation settings
      // @ts-ignore
      if (window.electronAPI.getSettings) {
        // @ts-ignore
        window.electronAPI.getSettings().then(setAutomationSettingsState).catch(console.error);
      }
    }
  }, []);

  useEffect(() => {
    refreshDiskSpace();
    // Poll disk space every 30 seconds to keep stats fresh
    const interval = setInterval(() => {
      refreshDiskSpace();
    }, 30000);
    return () => clearInterval(interval);
  }, [selectedDrive, refreshDiskSpace]);

  return (
    <AppContext.Provider value={{
      apiKey, setApiKey,
      isScanning, setIsScanning,
      scanResults, setScanResults,
      systemPaths, diskSpace,
      selectedDrive, setSelectedDrive,
      availableDrives, refreshDiskSpace,
      dashboardSummary, setDashboardSummary,
      deepScanResults, setDeepScanResults,
      deepScanExplanation, setDeepScanExplanation,
      spaceAnalyzerScanning, setSpaceAnalyzerScanning,
      spaceAnalyzerProgress, setSpaceAnalyzerProgress,
      systemCleanerState, setSystemCleanerState,
      systemCleanerCategories, setSystemCleanerCategories,
      privacyResults, setPrivacyResults,
      privacyScanning, setPrivacyScanning,
      smartScanning, setSmartScanning,
      smartMetrics, setSmartMetrics,
      startupItems, setStartupItems,
      startupAnalysis, setStartupAnalysis,
      automationSettings,
      setAutomationSettings
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useAppContext() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
}
