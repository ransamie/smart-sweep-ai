import React, { useState } from 'react';
import { Loader2, Trash2, CheckCircle2, AlertTriangle, ShieldCheck, Search } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { SelectionFooter } from '@/components/SelectionFooter';

export interface CleanerCategory {
  id: string;
  name: string;
  description: string;
  paths: string[];
}

export interface CleanerResult {
  categoryId: string;
  fileCount: number;
  totalSize: number;
}

type ScanState = 'idle' | 'scanning' | 'done';

interface CategoryResult {
  category: CleanerCategory;
  result: CleanerResult;
}

import { useAppContext } from '@/context/AppContext';

export function SystemCleanerView() {
  const {
    systemCleanerState: scanState,
    setSystemCleanerState: setScanState,
    systemCleanerCategories: categories,
    setSystemCleanerCategories: setCategories,
    setSmartMetrics
  } = useAppContext();

  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [cleaning, setCleaning] = useState(false);
  const [cleaned, setCleaned] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const runScan = async () => {
    setScanState('scanning');
    setSelected(new Set());
    setError(null);
    setCleaned(false);
    
    try {
      // @ts-ignore
      if (window.electronAPI) {
        // @ts-ignore
        const response = await window.electronAPI.scanSystemJunk();
        if (response.error) {
          setError(response.error);
          setCategories([]);
        } else {
          const catMap = new Map(response.categories.map((c: any) => [c.id, c]));
          const combined = response.results.map((r: any) => ({
            category: catMap.get(r.categoryId),
            result: r
          })).filter((c: any) => c.category);
          
          setCategories(combined);
          // Auto-select all by default
          setSelected(new Set(combined.map((c: any) => c.category.id)));

          // @ts-ignore
          if (window.electronAPI.addHistoryEntry) {
            // @ts-ignore
            await window.electronAPI.addHistoryEntry({
              timestamp: Date.now(),
              scanType: 'System Scan',
              bytesCleaned: 0,
              details: `Found ${combined.length} categories of system junk.`
            });
          }

          // Send desktop notification
          // @ts-ignore
          if (window.electronAPI.sendNotification) {
            // @ts-ignore
            window.electronAPI.sendNotification(
              'System Scan Complete',
              `System Scan complete! Found ${combined.length} categories of junk files.`
            );
          }
        }
      } else {
        setError('Electron API not available.');
      }
    } catch (e: any) {
      setError(e?.message ?? 'Unknown error during scan.');
    } finally {
      setScanState('done');
    }
  };

  const [lockedNotice, setLockedNotice] = useState<string | null>(null);

  const runClean = async () => {
    if (selected.size === 0) return;
    setCleaning(true);
    setLockedNotice(null);
    
    try {
      // @ts-ignore
      if (window.electronAPI) {
        // @ts-ignore
        const res = await window.electronAPI.cleanSystemJunk(Array.from(selected));
        if (res?.error) {
          setError(res.error);
        } else {
          setCleaned(true);
          
          const bytesCleaned = res.bytesDeleted || 0;
          
          // Invalidate global dashboard metrics so it rescans on next visit
          // @ts-ignore
          if (window.electronAPI.setSmartMetrics) {
            setSmartMetrics(null);
          } else {
            // Fallback for context
            try { setSmartMetrics(null); } catch(e) {}
          }

          // @ts-ignore
          if (window.electronAPI.addHistoryEntry) {
            // @ts-ignore
            await window.electronAPI.addHistoryEntry({
              timestamp: Date.now(),
              scanType: 'System Clean',
              bytesCleaned,
              details: `Cleaned ${selected.size} categories.`
            });
          }

          if (res && res.totalFailed > 0) {
            setLockedNotice(`Notice: System files cleaned! Note: ${res.totalFailed} temporary files are currently locked by active background applications and were safely skipped.`);
          }
        }
      }
    } catch (e: any) {
      setError(e?.message ?? 'Unknown error during clean.');
    } finally {
      setCleaning(false);
    }
  };

  const toggleSelect = (id: string) => {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelected(next);
  };

  const toggleAll = () => {
    const visibleCategoryIds = categories
      .filter(c => c.result && c.result.fileCount > 0)
      .map(c => c.category.id);

    const allVisibleSelected = visibleCategoryIds.every(id => selected.has(id));

    if (allVisibleSelected && visibleCategoryIds.length > 0) {
      setSelected(new Set());
    } else {
      setSelected(new Set(visibleCategoryIds));
    }
  };

  const formatSize = (bytes: number) => {
    if (bytes >= 1073741824) return (bytes / 1073741824).toFixed(2) + ' GB';
    if (bytes >= 1048576) return (bytes / 1048576).toFixed(2) + ' MB';
    return (bytes / 1024).toFixed(2) + ' KB';
  };

  const getTotalSelectedSize = () => {
    let total = 0;
    for (const c of categories) {
      if (selected.has(c.category.id)) {
        total += c.result.totalSize;
      }
    }
    return formatSize(total);
  };

  const hasJunk = categories.some(c => c.result.fileCount > 0);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">System Cleaner</h2>
          <p className="text-muted-foreground mt-1">
            Safely remove temporary system files and free up space.
          </p>
        </div>
        <Button
          onClick={runScan}
          disabled={scanState === 'scanning' || cleaning}
          className="gap-2"
        >
          {scanState === 'scanning' ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Search className="w-4 h-4" />
          )}
          {scanState === 'scanning' ? 'Scanning…' : 'Scan System'}
        </Button>
      </div>

      {scanState === 'idle' && !cleaned && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-muted-foreground">
              <ShieldCheck className="w-5 h-5" /> Ready to Scan
            </CardTitle>
            <CardDescription>
              The System Cleaner securely removes leftover temporary files from your system and applications.
              Click <strong>Scan System</strong> to begin.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center gap-3 py-10 text-muted-foreground">
              <Trash2 className="w-12 h-12 opacity-20" />
              <p className="text-sm">No scan has been run yet.</p>
            </div>
          </CardContent>
        </Card>
      )}

      {scanState === 'scanning' && (
        <Card>
          <CardContent>
            <div className="flex flex-col items-center gap-4 py-14 text-muted-foreground">
              <Loader2 className="w-10 h-10 animate-spin text-primary" />
              <p>Analyzing system directories and temporary folders…</p>
            </div>
          </CardContent>
        </Card>
      )}

      {error && (
        <Card className="border-red-500/30">
          <CardHeader>
            <CardTitle className="text-red-500">Error</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
        </Card>
      )}

      {lockedNotice && (
        <div className="p-3 rounded-lg border border-amber-500/30 bg-amber-500/10 text-amber-300 text-xs leading-relaxed">
          {lockedNotice}
        </div>
      )}

      {cleaned && (
        <Card className="border-green-500/30 bg-green-500/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-500">
              <CheckCircle2 className="w-5 h-5" /> Clean Complete!
            </CardTitle>
            <CardDescription>
              Selected junk files have been permanently removed from your system.
            </CardDescription>
          </CardHeader>
        </Card>
      )}

      {scanState === 'done' && !error && !hasJunk && !cleaned && (
        <Card className="border-green-500/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-500">
              <ShieldCheck className="w-5 h-5" /> System is Clean
            </CardTitle>
            <CardDescription>
              We didn't find any significant junk files in the targeted locations.
            </CardDescription>
          </CardHeader>
        </Card>
      )}

      {scanState === 'done' && !error && hasJunk && !cleaned && (
        <Card className="border-primary/20">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-yellow-500" /> Junk Found
                </CardTitle>
                <CardDescription>
                  Review the categories below and choose what to clean.
                </CardDescription>
              </div>
              <Button variant="ghost" size="sm" onClick={toggleAll} className="text-xs shrink-0">
                {selected.size === categories.length ? 'Deselect All' : 'Select All'}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="border rounded-md divide-y">
              {categories.map((c) => {
                const { category, result } = c;
                if (result.fileCount === 0) return null;

                const isLarge = result.totalSize > 500 * 1024 * 1024; // > 500MB

                return (
                  <div
                    key={category.id}
                    className="flex items-center p-4 hover:bg-muted/50 transition-colors cursor-pointer"
                    onClick={() => toggleSelect(category.id)}
                  >
                    <div className="flex items-center h-5">
                      <input
                        type="checkbox"
                        className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary cursor-pointer"
                        checked={selected.has(category.id)}
                        onChange={() => toggleSelect(category.id)}
                        onClick={e => e.stopPropagation()}
                      />
                    </div>
                    
                    <div className="ml-4 flex items-center justify-center w-10 h-10 rounded-full bg-background border shrink-0">
                      {isLarge ? (
                        <div className="w-full h-full rounded-full border-[3px] border-red-500 flex items-center justify-center bg-red-500/10">
                           <AlertTriangle className="w-4 h-4 text-red-500" />
                        </div>
                      ) : (
                        <div className="w-full h-full rounded-full border-[3px] border-primary flex items-center justify-center bg-primary/10">
                           <div className="w-3 h-3 rounded-full bg-primary" />
                        </div>
                      )}
                    </div>
                    
                    <div className="ml-4 flex-1 min-w-0">
                      <p className="text-sm font-semibold leading-none text-foreground">
                        {category.name}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {category.description}
                      </p>
                    </div>
                    <div className="ml-4 text-right shrink-0">
                      <p className={`font-mono text-sm font-semibold ${isLarge ? 'text-red-400' : 'text-foreground'}`}>
                        {formatSize(result.totalSize)}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {result.fileCount} files
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {scanState === 'done' && hasJunk && !cleaned && (
        <SelectionFooter
          selectedCount={Array.from(selected).filter(id => {
            const c = categories.find(cat => cat.category.id === id);
            return c && c.result.fileCount > 0;
          }).length}
          totalSize={getTotalSelectedSize()}
          onClean={runClean}
          isCleaning={cleaning}
        />
      )}
    </div>
  );
}
