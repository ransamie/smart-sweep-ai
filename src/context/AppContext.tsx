import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { AppDebrisItem, AppSettings, DriveInfo } from '@/types/electron';

const ONBOARDING_STORAGE_KEY = 'smartsweep_onboarding_completed';
const LEGACY_API_STORAGE_KEY = 'gemini_api_key';

export interface SmartMetrics {
  junk: number;
  junkBytes?: number;
  privacy: number;
  privacyBytes?: number;
}

interface AppState {
  apiKey: string | null;
  setApiKey: (key: string | null) => void;
  hasCompletedOnboarding: boolean;
  completeOnboarding: () => void;
  isAuthInitialized: boolean;

  isScanning: boolean;
  setIsScanning: (scanning: boolean) => void;
  scanResults: any;
  setScanResults: (results: any) => void;
  systemPaths: any;
  diskSpace: { total: number; free: number; used: number } | null;
  selectedDrive: string;
  setSelectedDrive: (drive: string) => void;
  availableDrives: DriveInfo[];
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

  appDebrisResults: AppDebrisItem[];
  setAppDebrisResults: (items: AppDebrisItem[]) => void;
  appDebrisScanning: boolean;
  setAppDebrisScanning: (b: boolean) => void;

  privacyResults: any;
  setPrivacyResults: (r: any) => void;
  privacyScanning: boolean;
  setPrivacyScanning: (b: boolean) => void;

  smartScanning: boolean;
  setSmartScanning: (b: boolean) => void;
  smartMetrics: SmartMetrics | null;
  setSmartMetrics: (m: SmartMetrics | null) => void;

  startupItems: any[];
  setStartupItems: (i: any[]) => void;
  startupAnalysis: string | null;
  setStartupAnalysis: (a: string | null) => void;

  automationSettings: AppSettings | null;
  setAutomationSettings: (settings: Partial<AppSettings>) => void;
}

const AppContext = createContext<AppState | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [apiKey, setApiKeyState] = useState<string | null>(null);
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState<boolean>(() => {
    return (
      localStorage.getItem(ONBOARDING_STORAGE_KEY) === 'true' ||
      Boolean(localStorage.getItem(LEGACY_API_STORAGE_KEY))
    );
  });
  const [isAuthInitialized, setIsAuthInitialized] = useState<boolean>(() => {
    return typeof window === 'undefined' || !window.electronAPI?.getApiKey;
  });

  const [isScanning, setIsScanning] = useState(false);
  const [scanResults, setScanResults] = useState(null);
  const [systemPaths, setSystemPaths] = useState<any>(null);
  const [diskSpace, setDiskSpace] = useState<{ total: number; free: number; used: number } | null>(null);
  const [selectedDrive, setSelectedDrive] = useState<string>('C:\\');
  const [availableDrives, setAvailableDrives] = useState<DriveInfo[]>([]);

  const [dashboardSummary, setDashboardSummary] = useState<string | null>(null);
  const [deepScanResults, setDeepScanResults] = useState<any[]>([]);
  const [deepScanExplanation, setDeepScanExplanation] = useState<string | null>(null);
  const [spaceAnalyzerScanning, setSpaceAnalyzerScanning] = useState(false);
  const [spaceAnalyzerProgress, setSpaceAnalyzerProgress] = useState(0);

  const [systemCleanerState, setSystemCleanerState] = useState<'idle' | 'scanning' | 'done'>('idle');
  const [systemCleanerCategories, setSystemCleanerCategories] = useState<any[]>([]);

  const [appDebrisResults, setAppDebrisResults] = useState<AppDebrisItem[]>([]);
  const [appDebrisScanning, setAppDebrisScanning] = useState(false);

  const [privacyResults, setPrivacyResults] = useState<any>(null);
  const [privacyScanning, setPrivacyScanning] = useState(false);

  const [smartScanning, setSmartScanning] = useState(false);
  const [smartMetrics, setSmartMetrics] = useState<SmartMetrics | null>(null);

  const [startupItems, setStartupItems] = useState<any[]>([]);
  const [startupAnalysis, setStartupAnalysis] = useState<string | null>(null);

  const [automationSettings, setAutomationSettingsState] = useState<AppSettings | null>(null);

  const completeOnboarding = useCallback(() => {
    setHasCompletedOnboarding(true);
    localStorage.setItem(ONBOARDING_STORAGE_KEY, 'true');
    if (window.electronAPI?.updateSettings) {
      window.electronAPI.updateSettings({ hasCompletedOnboarding: true }).catch(console.error);
    }
  }, []);

  const setApiKey = useCallback((key: string | null) => {
    const normalized = key && key.trim() ? key.trim() : null;
    setApiKeyState(normalized);

    // Never persist plaintext API keys in localStorage
    localStorage.removeItem(LEGACY_API_STORAGE_KEY);

    if (normalized) {
      setHasCompletedOnboarding(true);
      localStorage.setItem(ONBOARDING_STORAGE_KEY, 'true');
      if (window.electronAPI?.updateSettings) {
        window.electronAPI.updateSettings({ hasCompletedOnboarding: true }).catch(console.error);
      }
    }

    if (window.electronAPI?.setApiKey) {
      window.electronAPI.setApiKey(normalized).catch(console.error);
    }

    // Clear old AI cached summary and advice whenever API key changes
    setDashboardSummary(null);
    setStartupAnalysis(null);
    setDeepScanExplanation(null);
    if (window.electronAPI?.clearAiCache) {
      window.electronAPI.clearAiCache().catch(console.error);
    }
  }, []);

  const refreshDiskSpace = useCallback(async () => {
    if (window.electronAPI) {
      try {
        if (window.electronAPI.getDrives) {
          const drives = await window.electronAPI.getDrives();
          if (Array.isArray(drives)) setAvailableDrives(drives);
        }
        if (window.electronAPI.getDiskSpace) {
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

  const setAutomationSettings = useCallback((settings: Partial<AppSettings>) => {
    setAutomationSettingsState(prev => ({
      scheduledCleanupEnabled: prev?.scheduledCleanupEnabled ?? true,
      scheduledCleanupTime: prev?.scheduledCleanupTime ?? '18:00',
      launchAtStartup: prev?.launchAtStartup ?? true,
      hasCompletedOnboarding: prev?.hasCompletedOnboarding ?? hasCompletedOnboarding,
      ...settings,
    }));
    if (window.electronAPI?.updateSettings) {
      window.electronAPI.updateSettings(settings).catch(console.error);
    }
  }, [hasCompletedOnboarding]);

  useEffect(() => {
    let active = true;

    async function initElectronState() {
      if (!window.electronAPI) {
        setIsAuthInitialized(true);
        return;
      }

      try {
        // 1. Load system paths and settings
        const [pathsRes, settingsRes] = await Promise.all([
          window.electronAPI.getSystemPaths?.().catch(() => null),
          window.electronAPI.getSettings?.().catch(() => null),
        ]);

        if (!active) return;

        if (pathsRes) setSystemPaths(pathsRes);
        if (settingsRes) {
          setAutomationSettingsState(settingsRes);
          if (settingsRes.hasCompletedOnboarding) {
            setHasCompletedOnboarding(true);
            localStorage.setItem(ONBOARDING_STORAGE_KEY, 'true');
          }
        }

        // 2. Load encrypted API key and migrate any legacy plaintext localStorage key
        const legacyKey = localStorage.getItem(LEGACY_API_STORAGE_KEY);
        const storedKey = window.electronAPI.getApiKey
          ? await window.electronAPI.getApiKey().catch(() => null)
          : null;

        if (!active) return;

        if (storedKey) {
          setApiKeyState(storedKey);
          setHasCompletedOnboarding(true);
          localStorage.setItem(ONBOARDING_STORAGE_KEY, 'true');
          if (legacyKey) {
            localStorage.removeItem(LEGACY_API_STORAGE_KEY);
          }
        } else if (legacyKey && legacyKey.trim()) {
          const migratedKey = legacyKey.trim();
          if (window.electronAPI.setApiKey) {
            await window.electronAPI.setApiKey(migratedKey).catch(console.error);
          }
          localStorage.removeItem(LEGACY_API_STORAGE_KEY);
          setApiKeyState(migratedKey);
          setHasCompletedOnboarding(true);
          localStorage.setItem(ONBOARDING_STORAGE_KEY, 'true');
          window.electronAPI.updateSettings?.({ hasCompletedOnboarding: true }).catch(console.error);
        } else if (legacyKey !== null) {
          localStorage.removeItem(LEGACY_API_STORAGE_KEY);
        }
      } catch (e) {
        console.error('Failed to initialize app state:', e);
      } finally {
        if (active) {
          setIsAuthInitialized(true);
        }
      }
    }

    initElectronState();

    return () => {
      active = false;
    };
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
      hasCompletedOnboarding, completeOnboarding, isAuthInitialized,
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
      appDebrisResults, setAppDebrisResults,
      appDebrisScanning, setAppDebrisScanning,
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
