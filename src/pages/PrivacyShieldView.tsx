import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Shield, Chrome, Search, RefreshCw } from 'lucide-react';
import { useAppContext } from '@/context/AppContext';

export function PrivacyShieldView() {
  const { 
    privacyResults: results, 
    setPrivacyResults: setResults,
    privacyScanning: scanning,
    setPrivacyScanning: setScanning
  } = useAppContext();
  const [cleaning, setCleaning] = useState(false);
  const [options, setOptions] = useState({
    chrome: true,
    edge: true,
    firefox: true,
  });

  const handleScan = async () => {
    setScanning(true);
    try {
      // @ts-ignore
      if (window.electronAPI) {
        // @ts-ignore
        const scanResults = await window.electronAPI.scanBrowserPrivacy();
        setResults(scanResults);

        // Send desktop notification
        // @ts-ignore
        if (window.electronAPI.sendNotification) {
          // @ts-ignore
          window.electronAPI.sendNotification(
            'Privacy Scan Complete',
            'Browser tracks, cache, and cookies scan finished.'
          );
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setScanning(false);
    }
  };

  const [lockedWarning, setLockedWarning] = useState<string | null>(null);

  const handleClean = async () => {
    setCleaning(true);
    setLockedWarning(null);
    try {
      if (window.electronAPI) {
        const browsersToClean = Object.keys(options).filter(k => options[k as keyof typeof options]);
        // @ts-ignore
        const res = await window.electronAPI.cleanBrowserPrivacy(browsersToClean);
        if (res && res.totalFailed > 0) {
          setLockedWarning("⚠️ Notice: Some cache files could not be cleared because your web browser (Chrome, Edge, or Firefox) is currently open. Please close your web browser and click 'Clean Selected' again.");
        }
        await handleScan();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setCleaning(false);
    }
  };

  const toggleOption = (browser: keyof typeof options) => {
    setOptions(prev => ({ ...prev, [browser]: !prev[browser] }));
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div>
        <h2 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          <Shield className="w-8 h-8 text-primary" /> Privacy Shield
        </h2>
        <p className="text-muted-foreground mt-1">Premium feature: Clean your browser cache and tracks to free up space.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Browser Privacy Options</CardTitle>
          <CardDescription>Select which browsers to clean</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-4">
            <input type="checkbox" id="chrome" checked={options.chrome} onChange={() => toggleOption('chrome')} className="w-5 h-5 cursor-pointer accent-primary" />
            <label htmlFor="chrome" className="flex items-center gap-2 cursor-pointer font-medium"><Chrome className="w-5 h-5"/> Google Chrome</label>
          </div>
          <div className="flex items-center space-x-4">
            <input type="checkbox" id="edge" checked={options.edge} onChange={() => toggleOption('edge')} className="w-5 h-5 cursor-pointer accent-primary" />
            <label htmlFor="edge" className="flex items-center gap-2 cursor-pointer font-medium">Microsoft Edge</label>
          </div>
          <div className="flex items-center space-x-4">
            <input type="checkbox" id="firefox" checked={options.firefox} onChange={() => toggleOption('firefox')} className="w-5 h-5 cursor-pointer accent-primary" />
            <label htmlFor="firefox" className="flex items-center gap-2 cursor-pointer font-medium">Mozilla Firefox</label>
          </div>
          
          <div className="flex gap-4 mt-6">
            <Button onClick={handleScan} disabled={scanning || cleaning} variant="outline" className="gap-2">
              {scanning ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
              {scanning ? 'Scanning...' : 'Scan Browsers'}
            </Button>
            <Button onClick={handleClean} disabled={scanning || cleaning} className="gap-2">
              {cleaning ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Shield className="w-4 h-4" />}
              {cleaning ? 'Clean Selected' : 'Clean Selected'}
            </Button>
          </div>

          {lockedWarning && (
            <div className="mt-4 p-3 rounded-lg border border-amber-500/30 bg-amber-500/10 text-amber-300 text-xs leading-relaxed">
              {lockedWarning}
            </div>
          )}

          {results && (
            <div className="mt-8 space-y-4">
              <h3 className="text-xl font-semibold mb-4">Scan Results</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {results.map((r: any, i: number) => (
                  <Card key={i} className="bg-muted/10 border-primary/20">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg capitalize flex items-center gap-2">
                        {r.browser === 'chrome' && <Chrome className="w-5 h-5 text-blue-500" />}
                        {r.browser === 'firefox' && <Shield className="w-5 h-5 text-orange-500" />}
                        {r.browser === 'edge' && <Search className="w-5 h-5 text-blue-400" />}
                        {r.browser}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-1 text-sm text-muted-foreground">
                      <div className="flex justify-between">
                        <span>Cache:</span>
                        <span className="font-medium text-foreground">{(r.cacheSize / (1024 * 1024)).toFixed(2)} MB</span>
                      </div>
                      <div className="flex justify-between border-t pt-1 mt-1">
                        <span>Total:</span>
                        <span className="font-medium text-foreground">{(r.totalSize / (1024 * 1024)).toFixed(2)} MB</span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
