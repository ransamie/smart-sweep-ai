import React, { useState } from 'react';
import { Settings, Key, ShieldCheck, HardDrive, Clock, CheckCircle2, XCircle, Loader2, Download } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAppContext } from '@/context/AppContext';
import { DriveSelector } from '@/components/DriveSelector';

export function SettingsView() {
  const { apiKey, setApiKey, automationSettings, setAutomationSettings } = useAppContext();
  const [localKey, setLocalKey] = useState(apiKey || '');
  const [validating, setValidating] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const [checkingUpdate, setCheckingUpdate] = useState(false);
  const [updateStatus, setUpdateStatus] = useState<string | null>(null);

  const handleCheckUpdates = async () => {
    setCheckingUpdate(true);
    setUpdateStatus(null);
    try {
      // @ts-ignore
      if (window.electronAPI?.checkForUpdates) {
        // @ts-ignore
        const result = await window.electronAPI.checkForUpdates();
        if (result.error) {
          setUpdateStatus(`Error: ${result.error}`);
        } else if (result.available) {
          setUpdateStatus(`Version ${result.version} is available. It will be downloaded in the background.`);
        } else {
          setUpdateStatus('You are up to date!');
        }
      } else {
        setUpdateStatus('Update check is not available in browser mode.');
      }
    } catch (e: any) {
      setUpdateStatus(`Error: ${e.message}`);
    } finally {
      setCheckingUpdate(false);
    }
  };

  const handleSaveKey = async () => {
    if (!localKey.trim()) {
      setStatus({ type: 'error', message: 'Please enter an API Key.' });
      return;
    }

    setValidating(true);
    setStatus(null);

    try {
      // @ts-ignore
      if (window.electronAPI?.validateApiKey) {
        // @ts-ignore
        const isValid = await window.electronAPI.validateApiKey(localKey.trim());
        if (isValid) {
          setApiKey(localKey.trim());
          setStatus({ type: 'success', message: 'Validated & Saved!' });
        } else {
          setStatus({ type: 'error', message: 'Invalid API Key. Please verify key.' });
        }
      } else {
        setApiKey(localKey.trim());
        setStatus({ type: 'success', message: 'Saved!' });
      }
    } catch (e: any) {
      setStatus({ type: 'error', message: e?.message || 'Key validation failed.' });
    } finally {
      setValidating(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Settings</h2>
        <p className="text-muted-foreground mt-1">Manage your application preferences and AI configuration.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="w-5 h-5 text-primary" /> API Configuration
          </CardTitle>
          <CardDescription>Configure and test your connection to the Gemini API.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Gemini API Key</label>
            <div className="flex gap-3 items-center flex-wrap">
              <Input 
                type="password" 
                value={localKey} 
                onChange={(e) => {
                  setLocalKey(e.target.value);
                  setStatus(null);
                }} 
                placeholder="AIzaSy..."
                className="max-w-md font-mono"
              />
              <Button onClick={handleSaveKey} disabled={validating} className="gap-2">
                {validating ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
                {validating ? 'Validating…' : 'Save Key'}
              </Button>

              {status?.type === 'success' && (
                <div className="flex items-center gap-1.5 text-xs text-green-400 font-semibold bg-green-500/10 border border-green-500/30 px-3 py-1.5 rounded-lg animate-in fade-in">
                  <CheckCircle2 className="w-4 h-4 text-green-400 shrink-0" />
                  <span>{status.message}</span>
                </div>
              )}

              {status?.type === 'error' && (
                <div className="flex items-center gap-1.5 text-xs text-red-400 font-semibold bg-red-500/10 border border-red-500/30 px-3 py-1.5 rounded-lg animate-in fade-in">
                  <XCircle className="w-4 h-4 text-red-400 shrink-0" />
                  <span>{status.message}</span>
                </div>
              )}
            </div>
            <p className="text-xs text-muted-foreground">Used exclusively for generating system cleanup advice.</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <HardDrive className="w-5 h-5 text-blue-500" /> Target Drive
          </CardTitle>
          <CardDescription>Select which drive SmartSweep AI will scan and clean.</CardDescription>
        </CardHeader>
        <CardContent>
          <DriveSelector />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-purple-500" /> Automation
          </CardTitle>
          <CardDescription>Configure automatic system cleanup schedules.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-sm">Daily System Cleanup</p>
              <p className="text-xs text-muted-foreground mt-1">Automatically remove temporary system junk in the background.</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input 
                type="checkbox" 
                className="sr-only peer"
                checked={automationSettings?.scheduledCleanupEnabled ?? true}
                onChange={(e) => {
                  if (automationSettings) {
                    setAutomationSettings({
                      ...automationSettings,
                      scheduledCleanupEnabled: e.target.checked
                    });
                  }
                }}
              />
              <div className="w-11 h-6 bg-muted peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
            </label>
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium opacity-90">Cleanup Time</label>
            <div className="flex gap-4">
              <Input 
                type="time" 
                className="max-w-[150px]"
                disabled={!automationSettings?.scheduledCleanupEnabled}
                value={automationSettings?.scheduledCleanupTime ?? '18:00'}
                onChange={(e) => {
                  if (automationSettings) {
                    setAutomationSettings({
                      ...automationSettings,
                      scheduledCleanupTime: e.target.value
                    });
                  }
                }}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-green-500" /> Privacy & Security
          </CardTitle>
          <CardDescription>Your data privacy settings.</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground leading-relaxed max-w-2xl">
            SmartSweep AI uses strict local filters. When sending data to OpenAI, we only send directory sizes, 
            file extensions, and application vendor names. Personal file names, document contents, and deep paths 
            are never transmitted over the network.
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="w-5 h-5 text-orange-500" /> Software Updates
          </CardTitle>
          <CardDescription>Check for the latest version of SmartSweep AI.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-3 items-start">
            <Button onClick={handleCheckUpdates} disabled={checkingUpdate} className="gap-2" variant="outline">
              {checkingUpdate ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
              {checkingUpdate ? 'Checking...' : 'Check for Updates'}
            </Button>
            {updateStatus && (
              <p className={`text-sm ${updateStatus.includes('up to date') ? 'text-green-500' : updateStatus.includes('Error') ? 'text-red-500' : 'text-blue-500'}`}>
                {updateStatus}
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
