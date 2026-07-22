import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Sparkles, HardDrive, RefreshCw, Search } from 'lucide-react';
import { useAppContext } from '@/context/AppContext';
import { useNavigate } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';

export function DashboardView() {
  const { 
    apiKey, 
    systemPaths, 
    diskSpace, 
    dashboardSummary: aiSummary, 
    setDashboardSummary: setAiSummary, 
    deepScanResults,
    smartScanning,
    setSmartScanning,
    smartMetrics,
    setSmartMetrics
  } = useAppContext();
  const navigate = useNavigate();
  const [loadingAI, setLoadingAI] = useState(false);

  const runSmartScan = async (showNotification = false) => {
    setSmartScanning(true);
    try {
      // @ts-ignore
      if (window.electronAPI) {
        const [sysJunk, privData] = await Promise.all([
          // @ts-ignore
          window.electronAPI.scanSystemJunk(),
          // @ts-ignore
          window.electronAPI.scanBrowserPrivacy()
        ]);
        
        let junkCount = 0;
        if (sysJunk && !sysJunk.error) {
          junkCount = (sysJunk as any[]).reduce((acc: number, r: any) => acc + (r.fileCount || 0), 0);
        }
        
        let privacyCount = 0;
        if (privData && !privData.error) {
          // Count each browser with tracks/cache as 1 risk
          privacyCount = (privData as any[]).filter(b => b.totalSize > 0).length;
        }
        
        setSmartMetrics({ junk: junkCount, privacy: privacyCount });

        // Send desktop notification
        // @ts-ignore
        if (showNotification && window.electronAPI.sendNotification) {
          // @ts-ignore
          window.electronAPI.sendNotification(
            'Smart Scan Finished',
            `Smart Scan finished! PC Health Score updated.`
          );
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSmartScanning(false);
    }
  };

  const fetchSummary = async () => {
    setLoadingAI(true);
    try {
      // @ts-ignore
      if (window.electronAPI) {
        const topFiles = deepScanResults
          ? [...deepScanResults]
              .sort((a, b) => b.size - a.size)
              .slice(0, 10)
              .map(f => ({ path: f.path, sizeMB: (f.size / (1024*1024)).toFixed(1) }))
          : [];

        // @ts-ignore
        const summary = await window.electronAPI.getAIRecommendation(apiKey, { 
          totalSpace: diskSpace?.total,
          usedSpace: diskSpace?.used,
          freeSpace: diskSpace?.free,
          topFiles: topFiles.length > 0 ? topFiles : 'No space analyzer results yet. Run the Space Analyzer to get specific file advice.'
        });
        if (typeof summary === 'object' && summary.error) {
          setAiSummary(`AI Error: ${summary.error}`);
        } else {
          setAiSummary(summary);
        }
      }
    } catch (e) {
      console.error(e);
      setAiSummary("Failed to fetch AI summary. Ensure your API key is valid.");
    } finally {
      setLoadingAI(false);
    }
  };

  useEffect(() => {
    // Automatically run scan on mount
    runSmartScan();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="flex flex-col h-full animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header row */}
      <div className="flex items-center justify-between mb-6 shrink-0">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
          <p className="text-muted-foreground mt-1">Overview of your system health and storage.</p>
        </div>
        <Button onClick={() => runSmartScan(false)} disabled={smartScanning || !diskSpace} variant="outline" className="gap-2">
          <RefreshCw className={`w-4 h-4 ${smartScanning ? 'animate-spin' : ''}`} /> Refresh
        </Button>
      </div>

      {/* Cards container with flex-wrap for fluid responsiveness */}
      <div className="flex flex-wrap gap-6 items-start">
        <Card className="w-full sm:w-72 flex-grow-0 shrink-0 flex flex-col min-w-[280px]">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base font-semibold whitespace-nowrap">
              <HardDrive className="w-5 h-5 text-primary shrink-0"/> Storage Health
            </CardTitle>
            <CardDescription className="text-xs">PC Health Score</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-start py-4 space-y-4">
            {diskSpace ? (
              (() => {
                const freePercentage = (diskSpace.free / diskSpace.total) * 100;
                
                // Calculate dynamic penalties
                let privacyPenalty = 0;
                let junkFilesPenalty = 0;
                
                if (smartMetrics) {
                  privacyPenalty = Math.min(15, Math.floor(smartMetrics.privacy / 10)); // up to 15 points
                  junkFilesPenalty = Math.min(25, Math.floor(smartMetrics.junk / 50)); // up to 25 points
                }
                
                const score = smartMetrics 
                  ? Math.max(0, Math.min(100, Math.round(freePercentage - privacyPenalty - junkFilesPenalty)))
                  : 0; // Show 0 or a placeholder if no smart scan yet
                
                let color = 'hsl(var(--primary))';
                if (score === 0 && !smartMetrics) color = '#888'; // Grey out if not scanned
                else if (score < 50) color = '#ef4444';
                else if (score <= 80) color = '#eab308';
                else color = '#22c55e';

                return (
                  <>
                    <div className="relative w-32 h-32 flex items-center justify-center rounded-full border-6 border-muted overflow-hidden shrink-0">
                      <div 
                        className="absolute inset-0 transition-all duration-1000" 
                        style={{ background: `conic-gradient(${color} ${score}%, transparent 0)` }}
                      />
                      <div className="absolute inset-2 bg-card rounded-full flex flex-col items-center justify-center z-10">
                        <span className="text-2xl font-bold" style={{ color }}>{smartMetrics ? score : '?'}</span>
                        <span className="block text-[10px] text-muted-foreground mt-0.5">Health Score</span>
                      </div>
                    </div>
                    
                    <div className="w-full space-y-3 pt-4">
                      <div className="space-y-1.5 text-xs">
                        <div className="flex items-center justify-between py-1 border-b border-border/40 gap-2">
                          <span className="text-muted-foreground whitespace-nowrap">Free Space</span>
                          <span className="font-semibold text-foreground font-mono shrink-0">{(diskSpace.free / 1073741824).toFixed(1)} GB</span>
                        </div>
                        <div className="flex items-center justify-between py-1 border-b border-border/40 gap-2">
                          <span className="text-muted-foreground whitespace-nowrap">Privacy Risks</span>
                          <span className={smartMetrics ? "text-red-400 font-semibold font-mono shrink-0" : "text-muted-foreground shrink-0"}>
                            {smartMetrics ? `${smartMetrics.privacy} risks` : 'Not Scanned'}
                          </span>
                        </div>
                        <div className="flex items-center justify-between py-1 gap-2">
                          <span className="text-muted-foreground whitespace-nowrap">Junk Files</span>
                          <span className={smartMetrics ? "text-red-400 font-semibold font-mono shrink-0" : "text-muted-foreground shrink-0"}>
                            {smartMetrics ? `${smartMetrics.junk} files` : 'Not Scanned'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </>
                );
              })()
            ) : (
              <div className="flex items-center justify-center h-32">
                <RefreshCw className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="flex-1 w-full min-w-[320px] max-w-full border-primary/20 bg-primary/5 flex flex-col max-h-[calc(100vh-220px)] min-h-[480px]">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2 text-primary">
                  <Sparkles className="w-5 h-5" /> AI System Summary
                </CardTitle>
                <CardDescription>Personalized recommendations based on your system state.</CardDescription>
              </div>
              {aiSummary && (
                <Button onClick={fetchSummary} disabled={loadingAI || !diskSpace} variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary shrink-0">
                  <RefreshCw className={`w-4 h-4 ${loadingAI ? 'animate-spin' : ''}`} />
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="flex-1 overflow-y-auto pr-2">
            {aiSummary ? (
              <div className={`leading-relaxed ${aiSummary.startsWith('AI Error') ? 'text-red-400 font-medium' : 'text-foreground prose prose-sm dark:prose-invert max-w-none'}`}>
                <ReactMarkdown>{aiSummary}</ReactMarkdown>
                {(!deepScanResults || deepScanResults.length === 0) && (
                  <div className="mt-6">
                    <Button variant="secondary" onClick={() => navigate('/scan?autoStart=true')} className="gap-2">
                      <Search className="w-4 h-4" /> Run Space Analyzer for Personalized Advice
                    </Button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-32 space-y-4 text-muted-foreground">
                <p>Get personalized storage advice using Gemini AI.</p>
                <Button onClick={fetchSummary} disabled={loadingAI || !diskSpace} className="gap-2 bg-primary/20 hover:bg-primary/30 text-primary border border-primary/20">
                  {loadingAI ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                  {loadingAI ? 'Analyzing...' : 'Generate AI Advice'}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
