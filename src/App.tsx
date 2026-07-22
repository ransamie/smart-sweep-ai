import React from 'react';
import { MemoryRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider, useAppContext } from './context/AppContext';
import { AppLayout } from './components/AppLayout';
import { OnboardingView } from './pages/OnboardingView';
import { DashboardView } from './pages/DashboardView';
import { DeepScanView } from './pages/DeepScanView';
import { SystemCleanerView } from './pages/SystemCleanerView';
import { PrivacyShieldView } from './pages/PrivacyShieldView';
import { StartupOptimizerView } from './pages/StartupOptimizerView';
import { SettingsView } from './pages/SettingsView';

function AppRoot() {
  const { apiKey } = useAppContext();

  // Conditionally render the onboarding if no API key is present
  if (!apiKey) {
    return <OnboardingView />;
  }

  return (
    <MemoryRouter>
      <Routes>
        <Route element={<AppLayout />}>
          <Route path="/" element={<DashboardView />} />
          <Route path="/scan" element={<DeepScanView />} />
          <Route path="/system-cleaner" element={<SystemCleanerView />} />
          <Route path="/privacy" element={<PrivacyShieldView />} />
          <Route path="/startup" element={<StartupOptimizerView />} />
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
