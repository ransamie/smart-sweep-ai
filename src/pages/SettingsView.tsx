import React, { useState } from 'react';
import { Settings, Key, ShieldCheck, HardDrive, Clock } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAppContext } from '@/context/AppContext';
import { DriveSelector } from '@/components/DriveSelector';

export function SettingsView() {
  const { apiKey, setApiKey, automationSettings, setAutomationSettings } = useAppContext();
  const [localKey, setLocalKey] = useState(apiKey || '');

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
          <CardDescription>Configure your connection to the OpenAI API.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">OpenAI API Key</label>
            <div className="flex gap-4">
              <Input 
                type="password" 
                value={localKey} 
                onChange={(e) => setLocalKey(e.target.value)} 
                className="max-w-md font-mono"
              />
              <Button onClick={() => setApiKey(localKey)}>Save Key</Button>
            </div>
            <p className="text-xs text-muted-foreground">Used exclusively for generating cleanup advice.</p>
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
    </div>
  );
}
