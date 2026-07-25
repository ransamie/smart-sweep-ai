import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Rocket, Sparkles, RefreshCw, Power, FolderOpen, CheckCircle, XCircle } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { useAppContext } from '@/context/AppContext';

export function StartupOptimizerView() {
  const { 
    apiKey,
    startupItems: items,
    setStartupItems: setItems,
    startupAnalysis: aiRecommendation,
    setStartupAnalysis: setAiRecommendation
  } = useAppContext();
  
  const [loading, setLoading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [togglingNames, setTogglingNames] = useState<Set<string>>(new Set());
  const [toast, setToast] = useState<{ name: string; enabled: boolean } | null>(null);

  const fetchItems = useCallback(async () => {
    setLoading(true);
    try {
      // @ts-ignore
      if (window.electronAPI) {
        // @ts-ignore
        const startupItems = await window.electronAPI.getStartupItems();
        setItems(startupItems || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [setItems]);

  useEffect(() => {
    fetchItems();
  }, []);

  const handleAnalyze = async () => {
    setAnalyzing(true);
    try {
      // @ts-ignore
      if (window.electronAPI) {
        // @ts-ignore
        const analysis = await window.electronAPI.analyzeStartup(apiKey, items);
        setAiRecommendation(analysis);
      }
    } catch (e) {
      console.error(e);
      setAiRecommendation('Failed to analyze startup items.');
    } finally {
      setAnalyzing(false);
    }
  };

  const toggleItem = async (item: any) => {
    const newEnabled = !item.enabled;

    // Optimistically update UI immediately
    const optimisticItems = items.map((i: any) =>
      i.name === item.name ? { ...i, enabled: newEnabled } : i
    );
    setItems(optimisticItems);
    setTogglingNames(prev => new Set(prev).add(item.name));

    try {
      // @ts-ignore
      if (window.electronAPI) {
        // @ts-ignore
        await window.electronAPI.toggleStartupItem(item.name, item.location, newEnabled, item.path);
        // Show success toast
        setToast({ name: item.name, enabled: newEnabled });
        setTimeout(() => setToast(null), 3000);
        // Re-fetch to confirm the actual registry state
        await fetchItems();
      }
    } catch (e) {
      console.error(e);
      // Revert optimistic update on failure
      const revertedItems = items.map((i: any) =>
        i.name === item.name ? { ...i, enabled: item.enabled } : i
      );
      setItems(revertedItems);
    } finally {
      setTogglingNames(prev => {
        const next = new Set(prev);
        next.delete(item.name);
        return next;
      });
    }
  };

  const handleOpenFolder = async (filePath: string) => {
    try {
      // @ts-ignore
      if (window.electronAPI?.showInFolder) {
        // @ts-ignore
        await window.electronAPI.showInFolder(filePath);
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Toast notification */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 animate-in slide-in-from-bottom-4 fade-in duration-300">
          <div className={`flex items-center gap-3 px-4 py-3 rounded-lg shadow-xl border text-sm font-medium ${
            toast.enabled 
              ? 'bg-green-500/10 border-green-500/30 text-green-400'
              : 'bg-orange-500/10 border-orange-500/30 text-orange-400'
          }`}>
            {toast.enabled 
              ? <CheckCircle className="w-4 h-4 shrink-0" /> 
              : <XCircle className="w-4 h-4 shrink-0" />
            }
            <span>
              <strong>{toast.name}</strong> {toast.enabled ? 'enabled' : 'disabled'} at startup
            </span>
          </div>
        </div>
      )}

      <div>
        <h2 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          <Rocket className="w-8 h-8 text-primary" /> Startup Optimizer
        </h2>
        <p className="text-muted-foreground mt-1">Manage apps that start with your system to speed up boot time.</p>
      </div>

      <Card className="border-primary/20 bg-primary/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-primary">
            <Sparkles className="w-5 h-5" /> AI Recommendation
          </CardTitle>
          <CardDescription>Get personalized advice on what to disable safely.</CardDescription>
        </CardHeader>
        <CardContent>
          {aiRecommendation ? (
            <div className="prose prose-sm dark:prose-invert max-w-none text-foreground break-words [overflow-wrap:anywhere]">
              <ReactMarkdown>{aiRecommendation}</ReactMarkdown>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center space-y-4 text-muted-foreground">
              <Button onClick={handleAnalyze} disabled={analyzing || items.length === 0} className="gap-2 bg-primary/20 hover:bg-primary/30 text-primary border border-primary/20">
                {analyzing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                {analyzing ? 'Analyzing...' : 'Analyze Startup Items'}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Startup Items</CardTitle>
            <CardDescription>{items.length} items found — changes sync with Task Manager.</CardDescription>
          </div>
          <Button onClick={fetchItems} disabled={loading} variant="outline" size="sm" className="gap-2">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
          </Button>
        </CardHeader>
        <CardContent>
          {items.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {loading ? 'Loading startup items...' : 'No startup items found.'}
            </div>
          ) : (
            <div className="border rounded-md divide-y">
              {items.map((item, index) => {
                const isToggling = togglingNames.has(item.name);
                return (
                  <div key={index} className="flex items-center justify-between p-4 hover:bg-muted/50 transition-colors gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full shrink-0 ${item.enabled ? 'bg-green-400' : 'bg-muted-foreground'}`} />
                        <p className="text-sm font-medium leading-none text-foreground truncate" title={item.name}>
                          {item.name || 'Unknown'}
                        </p>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1.5 ml-4 truncate" title={item.path}>
                        {item.path || 'No path'} 
                        <span className="ml-2 font-mono text-[10px] opacity-60">[{item.location}]</span>
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {item.path && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-primary"
                          onClick={() => handleOpenFolder(item.path)}
                          title="Open in File Explorer"
                        >
                          <FolderOpen className="w-4 h-4" />
                        </Button>
                      )}
                      <Button
                        variant={item.enabled ? 'default' : 'secondary'}
                        size="sm"
                        disabled={isToggling}
                        className={`gap-2 min-w-[100px] transition-all active:scale-95 ${
                          item.enabled 
                            ? 'hover:bg-destructive hover:text-destructive-foreground' 
                            : 'hover:bg-primary hover:text-primary-foreground'
                        }`}
                        onClick={() => toggleItem(item)}
                      >
                        {isToggling 
                          ? <RefreshCw className="w-4 h-4 animate-spin" />
                          : <Power className="w-4 h-4" />
                        }
                        {isToggling ? 'Applying...' : (item.enabled ? 'Enabled' : 'Disabled')}
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
