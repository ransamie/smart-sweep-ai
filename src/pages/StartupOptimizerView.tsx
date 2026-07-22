import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Rocket, Sparkles, RefreshCw, Power, FolderOpen } from 'lucide-react';
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

  const fetchItems = async () => {
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
  };

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
    try {
      // @ts-ignore
      if (window.electronAPI) {
        // @ts-ignore
        await window.electronAPI.toggleStartupItem(item.name, item.location, !item.enabled, item.path);
        fetchItems();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleOpenFolder = async (filePath: string) => {
    try {
      // @ts-ignore
      if (window.electronAPI && window.electronAPI.showInFolder) {
        // @ts-ignore
        await window.electronAPI.showInFolder(filePath);
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div>
        <h2 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          <Rocket className="w-8 h-8 text-primary" /> Startup Optimizer
        </h2>
        <p className="text-muted-foreground mt-1">Premium feature: Manage apps that start with your system to speed up boot time.</p>
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
            <div className="prose prose-sm dark:prose-invert max-w-none text-foreground">
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
            <CardDescription>{items.length} items found.</CardDescription>
          </div>
          <Button onClick={fetchItems} disabled={loading} variant="outline" size="sm" className="gap-2">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
          </Button>
        </CardHeader>
        <CardContent>
          {items.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No startup items found or loading...
            </div>
          ) : (
            <div className="border rounded-md divide-y">
              {items.map((item, index) => (
                <div key={index} className="flex items-center justify-between p-4 hover:bg-muted/50 transition-colors gap-4">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium leading-none text-foreground">{item.name || 'Unknown'}</p>
                    <p className="text-sm text-muted-foreground mt-1 truncate" title={item.path || item.command}>{item.path || item.command || 'No path'}</p>
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
                      variant={item.enabled !== false ? 'default' : 'secondary'}
                      size="sm"
                      className="gap-2"
                      onClick={() => toggleItem(item)}
                    >
                      <Power className="w-4 h-4" />
                      {item.enabled !== false ? 'Enabled' : 'Disabled'}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
