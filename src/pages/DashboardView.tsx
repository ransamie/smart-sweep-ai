import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Sparkles, HardDrive, RefreshCw, Search, Activity, Trash2, Shield, Zap, ChevronRight } from 'lucide-react';
import { useAppContext } from '@/context/AppContext';
import { useLocation, useNavigate } from 'react-router-dom';
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
  const location = useLocation();
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

        const sysResults = Array.isArray(sysJunk?.results) ? sysJunk.results : [];
        const junkCount = sysResults.reduce((acc: number, r: any) => acc + (r.fileCount || 0), 0);

        let privacyCount = 0;
        if (Array.isArray(privData)) {
          // Count each browser with tracks/cache as 1 risk
          privacyCount = privData.filter((b: any) => b.totalSize > 0).length;
        }
        
        setSmartMetrics({ junk: junkCount, privacy: privacyCount });

        // Send desktop notification
        // @ts-ignore
        if (showNotification && window.electronAPI.sendNotification) {
          // @ts-ignore
          window.electronAPI.sendNotification(
            'Smart Scan Finished',
            `Smart Scan finished! System Health Score updated.`
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
        const aiResult = summary as { error?: string } | null;
        if (aiResult?.error) {
          setAiSummary(aiResult.error);
        } else {
          setAiSummary(typeof summary === 'string' ? summary : 'Failed to fetch AI summary. Ensure your API key is valid.');
        }
      }
    } catch (error) {
      console.error('Failed to get AI summary:', error);
      setAiSummary('Failed to connect to the AI service.');
    } finally {
      setLoadingAI(false);
    }
  };

  useEffect(() => {
    if (location.pathname !== '/') {
      return;
    }

    void runSmartScan(false);
    void fetchSummary();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);

  return (
    <div className="flex flex-col h-full space-y-6 overflow-hidden animate-fade-in p-2">
      <div className="flex items-center justify-between shrink-0">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Dashboard</h1>
          <p className="text-muted-foreground mt-1">Overview of your system health and storage.</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => runSmartScan(false)} disabled={smartScanning} className="gap-2">
          <RefreshCw className={`w-4 h-4 ${smartScanning ? 'animate-spin' : ''}`} /> Refresh
        </Button>
      </div>

      {/* Cards container with flex-wrap for fluid responsiveness */}
      <div className="flex flex-wrap gap-6 items-stretch">
        <Card className="w-full sm:w-72 flex-grow-0 shrink-0 flex flex-col min-w-[280px]">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base font-semibold whitespace-nowrap">
              <HardDrive className="w-5 h-5 text-primary shrink-0"/> Storage Health
            </CardTitle>
            <CardDescription className="text-xs">System Health Score</CardDescription>
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
                    <div className="relative w-32 h-32 flex items-center justify-center rounded-full border-6 border-muted overflow-hidden shrink-0 shadow-inner">
                      <div 
                        className="absolute inset-0 transition-all duration-1000" 
                        style={{ background: `conic-gradient(${color} ${score}%, transparent 0)` }}
                      />
                      <div className="absolute inset-2 bg-card rounded-full flex flex-col items-center justify-center z-10 shadow-sm">
                        <span className="text-3xl font-bold" style={{ color }}>{smartMetrics ? score : '?'}</span>
                        <span className="block text-[10px] text-muted-foreground mt-0.5 font-medium tracking-wide uppercase">Health</span>
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
                          <span className={smartMetrics ? (smartMetrics.privacy > 0 ? "text-red-400 font-semibold font-mono shrink-0" : "text-green-500 font-semibold font-mono shrink-0") : "text-muted-foreground shrink-0"}>
                            {smartMetrics ? `${smartMetrics.privacy} risks` : 'Not Scanned'}
                          </span>
                        </div>
                        <div className="flex items-center justify-between py-1 gap-2">
                          <span className="text-muted-foreground whitespace-nowrap">Junk Files</span>
                          <span className={smartMetrics ? (smartMetrics.junk > 0 ? "text-red-400 font-semibold font-mono shrink-0" : "text-green-500 font-semibold font-mono shrink-0") : "text-muted-foreground shrink-0"}>
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

        <Card className="flex-1 w-full min-w-[320px] max-w-full border-primary/20 bg-gradient-to-br from-primary/5 to-transparent flex flex-col shadow-lg">
          <CardHeader className="border-b border-primary/10 pb-4 bg-primary/5">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2 text-primary text-lg">
                  <Sparkles className="w-5 h-5" /> AI System Summary
                </CardTitle>
                <CardDescription className="text-primary/70">Personalized recommendations based on your system state.</CardDescription>
              </div>
              {aiSummary && (
                <Button onClick={fetchSummary} disabled={loadingAI || !diskSpace} variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary shrink-0 bg-background/50 backdrop-blur-sm rounded-full">
                  <RefreshCw className={`w-4 h-4 ${loadingAI ? 'animate-spin' : ''}`} />
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="flex-1 overflow-y-auto p-6">
            {aiSummary ? (
              <div className={`p-5 rounded-xl border ${aiSummary.startsWith('AI Error') ? 'bg-red-500/10 border-red-500/20 text-red-400' : 'bg-background/60 backdrop-blur-md border-primary/10 shadow-sm'}`}>
                <div className={`leading-relaxed ${aiSummary.startsWith('AI Error') ? 'font-medium' : 'text-foreground/90 prose prose-p:leading-relaxed prose-headings:text-primary prose-headings:font-semibold prose-strong:text-primary dark:prose-invert max-w-none text-[15px]'}`}>
                  <ReactMarkdown>{aiSummary}</ReactMarkdown>
                  {(!deepScanResults || deepScanResults.length === 0) && (
                    <div className="mt-6 pt-4 border-t border-border/50">
                      <Button variant="outline" onClick={() => navigate('/scan?autoStart=true')} className="gap-2 bg-background hover:bg-primary/10 hover:text-primary w-full sm:w-auto">
                        <Search className="w-4 h-4" /> Run Space Analyzer for Personalized Advice
                      </Button>
                    </div>
                  )}
                </div>
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

      {/* Bottom Full-Width Card */}
      <Card className="w-full bg-card shrink-0">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Activity className="w-5 h-5 text-primary" /> Quick Actions & Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center justify-between p-4 rounded-lg border border-border/50 bg-background/50 hover:bg-accent transition-colors cursor-pointer" onClick={() => navigate('/cleaner')}>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-md bg-blue-500/10 text-blue-500"><Trash2 className="w-5 h-5" /></div>
                <div>
                  <div className="font-medium text-sm">System Cleaner</div>
                  <div className="text-xs text-muted-foreground">Reclaim storage space</div>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            </div>
            
            <div className="flex items-center justify-between p-4 rounded-lg border border-border/50 bg-background/50 hover:bg-accent transition-colors cursor-pointer" onClick={() => navigate('/privacy')}>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-md bg-purple-500/10 text-purple-500"><Shield className="w-5 h-5" /></div>
                <div>
                  <div className="font-medium text-sm">Privacy Shield</div>
                  <div className="text-xs text-muted-foreground">Clear browser traces</div>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            </div>

            <div className="flex items-center justify-between p-4 rounded-lg border border-border/50 bg-background/50 hover:bg-accent transition-colors cursor-pointer" onClick={() => navigate('/startup')}>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-md bg-green-500/10 text-green-500"><Zap className="w-5 h-5" /></div>
                <div>
                  <div className="font-medium text-sm">Startup Optimizer</div>
                  <div className="text-xs text-muted-foreground">Improve boot time</div>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
