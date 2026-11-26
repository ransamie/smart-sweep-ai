import React from 'react';
import { MemoryRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider, useAppContext } from './context/AppContext';
import { AppLayout } from './components/AppLayout';
import { OnboardingView } from './pages/OnboardingView';
import { DashboardView } from './pages/DashboardView';
import { DeepScanView } from './pages/DeepScanView';
import { SystemCleanerView } from './pages/SystemCleanerView';
import { AppDebrisView } from './pages/AppDebrisView';
import { PrivacyShieldView } from './pages/PrivacyShieldView';
import { StartupOptimizerView } from './pages/StartupOptimizerView';
import { HistoryView } from './pages/HistoryView';
import { SettingsView } from './pages/SettingsView';

function AppRoot() {
  const { hasCompletedOnboarding, isAuthInitialized } = useAppContext();

  if (!isAuthInitialized) {
    return <div className="h-screen w-full bg-[#0A0A0F]" />;
  }

  if (!hasCompletedOnboarding) {
    return <OnboardingView />;
  }

  return (
    <MemoryRouter>
      <Routes>
        <Route element={<AppLayout />}>
          <Route path="/" element={<DashboardView />} />
          <Route path="/scan" element={<DeepScanView />} />
          <Route path="/system-cleaner" element={<SystemCleanerView />} />
          <Route path="/debris" element={<AppDebrisView />} />
          <Route path="/privacy" element={<PrivacyShieldView />} />
          <Route path="/startup" element={<StartupOptimizerView />} />
          <Route path="/history" element={<HistoryView />} />
          <Route path="/settings" element={<SettingsView />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </MemoryRouter>
  );
}

export default function App() {
  return (
    <AppProvider>
      <AppRoot />
    </AppProvider>
  );
}
