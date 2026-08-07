import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Shield, Chrome, Search, RefreshCw, Layers, Globe } from 'lucide-react';
import { useAppContext } from '@/context/AppContext';

export function PrivacyShieldView() {
  const { 
    privacyResults: results, 
    setPrivacyResults: setResults,
    privacyScanning: scanning,
    setPrivacyScanning: setScanning,
    setSmartMetrics
  } = useAppContext();
  const [cleaning, setCleaning] = useState(false);
  const [options, setOptions] = useState({
    chrome: true,
    edge: true,
    firefox: true,
    brave: true,
    opera: true,
    app_caches: true,
  });

  const handleScan = async () => {
    setScanning(true);
    try {
      // @ts-ignore
      if (window.electronAPI) {
        // @ts-ignore
        const scanResults = await window.electronAPI.scanBrowserPrivacy();
        setResults(scanResults);

        // @ts-ignore
        if (window.electronAPI.addHistoryEntry) {
          const categoriesFound = Object.keys(scanResults).filter(k => scanResults[k]?.totalSize > 0);
          // @ts-ignore
          await window.electronAPI.addHistoryEntry({
            timestamp: Date.now(),
            scanType: 'Privacy Scan',
            bytesCleaned: 0,
            details: `Found privacy tracks & caches across ${categoriesFound.length} application groups.`
          });
        }

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
        const categoriesToClean = Object.keys(options).filter(k => options[k as keyof typeof options]);
        // @ts-ignore
        const res = await window.electronAPI.cleanBrowserPrivacy(categoriesToClean);
        if (res) {
          const bytesCleaned = res.bytesDeleted || 0;
          
          // Invalidate global dashboard metrics so it rescans on next visit
          // @ts-ignore
          if (window.electronAPI.setSmartMetrics) {
            setSmartMetrics(null);
          } else {
            try { setSmartMetrics(null); } catch(e) {}
          }
          
          // @ts-ignore
          if (window.electronAPI.addHistoryEntry) {
            // @ts-ignore
            await window.electronAPI.addHistoryEntry({
              timestamp: Date.now(),
              scanType: 'Privacy Clean',
              bytesCleaned,
              details: `Cleaned ${categoriesToClean.join(', ')}.`
            });
          }

          if (res.openBrowsers && res.openBrowsers.length > 0) {
            const browserList = res.openBrowsers.join(', ');
            const verb = res.openBrowsers.length > 1 ? 'are' : 'is';
            const pronoun = res.openBrowsers.length > 1 ? 'their windows' : 'its window';
            setLockedWarning(`⚠️ Notice: ${browserList} ${verb} currently running in the background. Even if you closed ${pronoun}, background processes often remain active. Please fully close them via the System Tray (near the clock) or Task Manager, then click 'Clean Selected' again.`);
          } else if (res.totalFailed > 0) {
            setLockedWarning(`⚠️ Notice: ${res.totalFailed} cache files were locked by active system processes and safely skipped.`);
          }
        }
        await handleScan();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setCleaning(false);
    }
  };

  const toggleOption = (category: keyof typeof options) => {
    setOptions(prev => ({ ...prev, [category]: !prev[category] }));
  };

  const formatSize = (bytes: number) => {
    if (!bytes || bytes === 0) return '0 B';
    if (bytes >= 1024 * 1024 * 1024) {
      return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
    }
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const getCategoryLabel = (key: string) => {
    switch (key.toLowerCase()) {
      case 'chrome': return 'Google Chrome';
      case 'edge': return 'Microsoft Edge';
      case 'firefox': return 'Mozilla Firefox';
      case 'brave': return 'Brave Browser';
      case 'opera': return 'Opera & Opera GX';
      case 'app_caches': return 'App Caches (Discord, Spotify, VS Code, Teams)';
      default: return key;
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div>
        <h2 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          <Shield className="w-8 h-8 text-primary" /> Privacy Shield & App Caches
        </h2>
        <p className="text-muted-foreground mt-1">Clean your browser tracks, multi-profile cache, site storage, and Electron app caches to reclaim storage space.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Privacy & Cache Options</CardTitle>
          <CardDescription>Select which browser profiles and app caches to clean</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="flex items-center space-x-3 p-3 rounded-lg border border-white/5 bg-background/50">
              <input type="checkbox" id="chrome" checked={options.chrome} onChange={() => toggleOption('chrome')} className="w-5 h-5 cursor-pointer accent-primary" />
              <label htmlFor="chrome" className="flex items-center gap-2 cursor-pointer font-medium text-sm"><Chrome className="w-4 h-4 text-blue-500"/> Google Chrome</label>
            </div>
            <div className="flex items-center space-x-3 p-3 rounded-lg border border-white/5 bg-background/50">
              <input type="checkbox" id="edge" checked={options.edge} onChange={() => toggleOption('edge')} className="w-5 h-5 cursor-pointer accent-primary" />
              <label htmlFor="edge" className="flex items-center gap-2 cursor-pointer font-medium text-sm"><Search className="w-4 h-4 text-cyan-400"/> Microsoft Edge</label>
            </div>
            <div className="flex items-center space-x-3 p-3 rounded-lg border border-white/5 bg-background/50">
              <input type="checkbox" id="firefox" checked={options.firefox} onChange={() => toggleOption('firefox')} className="w-5 h-5 cursor-pointer accent-primary" />
              <label htmlFor="firefox" className="flex items-center gap-2 cursor-pointer font-medium text-sm"><Shield className="w-4 h-4 text-orange-500"/> Mozilla Firefox</label>
            </div>
            <div className="flex items-center space-x-3 p-3 rounded-lg border border-white/5 bg-background/50">
              <input type="checkbox" id="brave" checked={options.brave} onChange={() => toggleOption('brave')} className="w-5 h-5 cursor-pointer accent-primary" />
              <label htmlFor="brave" className="flex items-center gap-2 cursor-pointer font-medium text-sm"><Globe className="w-4 h-4 text-orange-400"/> Brave Browser</label>
            </div>
            <div className="flex items-center space-x-3 p-3 rounded-lg border border-white/5 bg-background/50">
              <input type="checkbox" id="opera" checked={options.opera} onChange={() => toggleOption('opera')} className="w-5 h-5 cursor-pointer accent-primary" />
              <label htmlFor="opera" className="flex items-center gap-2 cursor-pointer font-medium text-sm"><Globe className="w-4 h-4 text-red-500"/> Opera & Opera GX</label>
            </div>
            <div className="flex items-center space-x-3 p-3 rounded-lg border border-white/5 bg-background/50">
              <input type="checkbox" id="app_caches" checked={options.app_caches} onChange={() => toggleOption('app_caches')} className="w-5 h-5 cursor-pointer accent-primary" />
              <label htmlFor="app_caches" className="flex items-center gap-2 cursor-pointer font-medium text-sm"><Layers className="w-4 h-4 text-purple-400"/> Desktop App Caches</label>
            </div>
          </div>
          
          {(() => {
            const selectedCategories = Object.keys(options).filter(k => options[k as keyof typeof options]);
            const totalSelectedCacheBytes = results
              ? results
                  .filter((r: any) => selectedCategories.includes(r.browser.toLowerCase()))
                  .reduce((sum: number, r: any) => sum + r.totalSize, 0)
              : 0;
            const isCleanDisabled = scanning || cleaning || !results || totalSelectedCacheBytes === 0;

            const visibleResults = results 
              ? results.filter((r: any) => options[r.browser.toLowerCase() as keyof typeof options] && r.totalSize > 0)
              : null;

            return (
              <>
                <div className="flex gap-4 mt-6">
                  <Button onClick={handleScan} disabled={scanning || cleaning} variant="outline" className="gap-2">
                    {scanning ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                    {scanning ? 'Scanning...' : 'Scan Privacy & Caches'}
                  </Button>
                  <Button onClick={handleClean} disabled={isCleanDisabled} className="gap-2">
                    {cleaning ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Shield className="w-4 h-4" />}
                    {cleaning ? 'Cleaning...' : `Clean Selected (${formatSize(totalSelectedCacheBytes)})`}
                  </Button>
                </div>

                {lockedWarning && (
                  <div className="mt-4 p-3 rounded-lg border border-amber-500/30 bg-amber-500/10 text-amber-300 text-xs leading-relaxed">
                    {lockedWarning}
                  </div>
                )}

                {visibleResults && visibleResults.length > 0 && (
                  <div className="mt-8 space-y-4">
                    <h3 className="text-xl font-semibold mb-4">Scan Results</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {visibleResults.map((r: any, i: number) => (
                        <Card key={i} className="bg-muted/10 border-primary/20">
                          <CardHeader className="pb-2">
                            <CardTitle className="text-lg capitalize flex items-center gap-2">
                              {r.browser === 'chrome' && <Chrome className="w-5 h-5 text-blue-500" />}
                              {r.browser === 'firefox' && <Shield className="w-5 h-5 text-orange-500" />}
                              {r.browser === 'edge' && <Search className="w-5 h-5 text-cyan-400" />}
                              {r.browser === 'brave' && <Globe className="w-5 h-5 text-orange-400" />}
                              {r.browser === 'opera' && <Globe className="w-5 h-5 text-red-500" />}
                              {r.browser === 'app_caches' && <Layers className="w-5 h-5 text-purple-400" />}
                              {getCategoryLabel(r.browser)}
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="space-y-1 text-sm text-muted-foreground">
                            <div className="flex justify-between gap-2">
                              <span>Cache & Site Storage:</span>
                              <span className="font-medium text-foreground whitespace-nowrap text-right">{formatSize(r.cacheSize)}</span>
                            </div>
                            <div className="flex justify-between border-t pt-1 mt-1 gap-2">
                              <span>Total Junk Size:</span>
                              <span className="font-medium text-foreground whitespace-nowrap text-right">{formatSize(r.totalSize)}</span>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}
              </>
            );
          })()}
        </CardContent>
      </Card>
    </div>
  );
}
