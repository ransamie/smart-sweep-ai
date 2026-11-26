import React, { useState } from 'react';
import { PackageX, Search, Loader2, FolderOpen, Sparkles, ShieldAlert, CheckCircle2, Key } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { SelectionFooter } from '@/components/SelectionFooter';
import { useAppContext } from '@/context/AppContext';
import { useNavigate } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import type { AppDebrisItem } from '@/types/electron';

export function AppDebrisView() {
  const {
    apiKey,
    appDebrisResults: results,
    setAppDebrisResults: setResults,
    appDebrisScanning: scanning,
    setAppDebrisScanning: setScanning,
    refreshDiskSpace,
  } = useAppContext();
  const navigate = useNavigate();

  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [cleaning, setCleaning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cleanNotice, setCleanNotice] = useState<string | null>(null);
  const [hasScanned, setHasScanned] = useState(results.length > 0);
  const [explanations, setExplanations] = useState<Record<string, string>>({});
  const [explainingPath, setExplainingPath] = useState<string | null>(null);

  const formatSize = (bytes: number) => {
    if (!bytes || bytes === 0) return '0 B';
    if (bytes >= 1073741824) return `${(bytes / 1073741824).toFixed(2)} GB`;
    if (bytes >= 1048576) return `${(bytes / 1048576).toFixed(2)} MB`;
    return `${(bytes / 1024).toFixed(1)} KB`;
  };

  const handleScan = async () => {
    setScanning(true);
    setError(null);
    setCleanNotice(null);
    setSelected(new Set());

    try {
      if (window.electronAPI?.getOrphanedData) {
        const res = await window.electronAPI.getOrphanedData();
        if (Array.isArray(res)) {
          setResults(res);
          setHasScanned(true);

          if (window.electronAPI.addHistoryEntry) {
            await window.electronAPI.addHistoryEntry({
              timestamp: Date.now(),
              scanType: 'App Debris Scan',
              bytesCleaned: 0,
              details: `Detected ${res.length} potential leftover application folders.`,
            });
          }
        } else if (res && 'error' in res) {
          setError(res.error);
        }
      } else {
        setError('Electron API not available.');
      }
    } catch (e: any) {
      setError(e?.message || 'Failed to scan for orphaned app debris.');
    } finally {
      setScanning(false);
    }
  };

  const filteredResults = results.filter(item =>
    !searchQuery.trim() ||
    item.folderName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.locationLabel.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.folderPath.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const toggleSelect = (folderPath: string) => {
    const next = new Set(selected);
    if (next.has(folderPath)) next.delete(folderPath);
    else next.add(folderPath);
    setSelected(next);
  };

  const handleSelectAll = () => {
    const visibleIds = filteredResults.map(r => r.folderPath);
    const allSelected = visibleIds.length > 0 && visibleIds.every(id => selected.has(id));
    const next = new Set(selected);
    if (allSelected) {
      visibleIds.forEach(id => next.delete(id));
    } else {
      visibleIds.forEach(id => next.add(id));
    }
    setSelected(next);
  };

  const selectedItems: AppDebrisItem[] = results.filter(r => selected.has(r.folderPath));
  const totalSelectedSize = selectedItems.reduce((acc, item) => acc + item.size, 0);
  const totalReclaimable = results.reduce((acc, item) => acc + item.size, 0);

  const handleClean = async () => {
    if (selectedItems.length === 0) return;
    setCleaning(true);
    setError(null);
    setCleanNotice(null);

    try {
      if (window.electronAPI?.deleteFiles) {
        const paths = selectedItems.map(i => i.folderPath);
        const res = await window.electronAPI.deleteFiles(paths);

        const failedPaths = new Set((res?.errors || []).map(err => err.path));
        const succeededItems = selectedItems.filter(i => !failedPaths.has(i.folderPath));
        const freedBytes = succeededItems.reduce((acc, i) => acc + i.size, 0);

        if (succeededItems.length > 0) {
          const succeededPathSet = new Set(succeededItems.map(i => i.folderPath));
          setResults(results.filter(r => !succeededPathSet.has(r.folderPath)));
          setSelected(new Set());
          await refreshDiskSpace();

          if (window.electronAPI.addHistoryEntry) {
            await window.electronAPI.addHistoryEntry({
              timestamp: Date.now(),
              scanType: 'App Debris Clean',
              bytesCleaned: freedBytes,
              details: `Moved ${succeededItems.length} leftover app folder(s) to 14-day Quarantine.`,
              items: succeededItems.map(i => `${i.folderName} (${i.folderPath})`),
            });
          }
        }

        if (res && res.failed > 0) {
          setCleanNotice(
            `Quarantined ${res.quarantined} folder(s). ${res.failed} folder(s) could not be moved (permission denied or currently in use).`
          );
        } else {
          setCleanNotice(
            `Moved ${succeededItems.length} folder(s) (${formatSize(freedBytes)}) to Quarantine. You can restore them anytime within 14 days from Activity Logs → Quarantine Recovery.`
          );
        }
      }
    } catch (e: any) {
      setError(e?.message || 'Failed to clean selected debris.');
    } finally {
      setCleaning(false);
    }
  };

  const handleExplain = async (folderPath: string) => {
    if (!apiKey) return;
    if (explanations[folderPath]) {
      setExplanations(prev => {
        const copy = { ...prev };
        delete copy[folderPath];
        return copy;
      });
      return;
    }

    setExplainingPath(folderPath);
    try {
      if (window.electronAPI?.explainPath) {
        const res = await window.electronAPI.explainPath(apiKey, folderPath);
        setExplanations(prev => ({
          ...prev,
          [folderPath]: typeof res === 'string' ? res : (res?.error || 'Could not analyze folder.'),
        }));
      }
    } catch {
      setExplanations(prev => ({
        ...prev,
        [folderPath]: 'Failed to get AI explanation for this folder.',
      }));
    } finally {
      setExplainingPath(null);
    }
  };

  const handleOpenFolder = async (folderPath: string) => {
    try {
      if (window.electronAPI?.showInFolder) {
        await window.electronAPI.showInFolder(folderPath);
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-20">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <PackageX className="w-8 h-8 text-primary" /> App Debris Detector
          </h2>
          <p className="text-muted-foreground mt-1">
            Cross-reference application directories against installed programs to locate leftover folders from uninstalled software.
          </p>
        </div>
        <Button onClick={handleScan} disabled={scanning || cleaning} className="gap-2">
          {scanning ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
          {scanning ? 'Scanning App Directories…' : 'Scan App Debris'}
        </Button>
      </div>

      {/* Safety & Optional AI Banners */}
      <div className="p-3.5 rounded-xl border border-amber-500/20 bg-amber-500/5 text-xs text-amber-200/90 flex items-start gap-2.5">
        <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
        <span>
          <strong>Review before cleaning:</strong> Portable apps or tools installed outside the standard installer registry may appear here.
          Core OS, driver, and runtime folders are strictly protected, and removed items stay recoverable in <strong>Quarantine</strong> for 14 days.
        </span>
      </div>

      {!apiKey && (
        <div className="flex items-center justify-between gap-4 p-3.5 rounded-xl border border-primary/20 bg-primary/5 text-xs">
          <span className="text-muted-foreground">
            <strong className="text-foreground">Local Mode:</strong> Connect a Gemini API key in Settings to inspect unfamiliar vendor folders with AI.
          </span>
          <Button size="sm" variant="outline" onClick={() => navigate('/settings')} className="h-7 text-xs gap-1.5 shrink-0 border-primary/30 text-primary hover:bg-primary/10">
            <Key className="w-3.5 h-3.5" /> Configure AI
          </Button>
        </div>
      )}

      {error && (
        <Card className="border-red-500/30 bg-red-500/5">
          <CardHeader>
            <CardTitle className="text-red-400 text-base">Scan Error</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
        </Card>
      )}

      {cleanNotice && (
        <div className="p-3.5 rounded-xl border border-green-500/30 bg-green-500/10 text-green-300 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{cleanNotice}</span>
        </div>
      )}

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div>
              <CardTitle>Detected Leftover Folders</CardTitle>
              <CardDescription>
                {scanning
                  ? 'Scanning AppData, ProgramData, and Program Files…'
                  : hasScanned
                  ? `Found ${results.length} candidate folder(s) · Total size: ${formatSize(totalReclaimable)}`
                  : 'Run a scan to cross-check application folders against installed programs.'}
              </CardDescription>
            </div>
            {results.length > 0 && !scanning && (
              <div className="flex items-center gap-2">
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Filter folders..."
                  className="h-8 w-52 text-xs"
                />
                <Button variant="outline" size="sm" onClick={handleSelectAll} className="h-8 text-xs">
                  {filteredResults.length > 0 && filteredResults.every(r => selected.has(r.folderPath))
                    ? 'Deselect All'
                    : 'Select All'}
                </Button>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {scanning ? (
            <div className="flex flex-col items-center py-12 text-muted-foreground gap-3">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
              <p className="text-sm">Cross-referencing installed apps and calculating folder sizes…</p>
            </div>
          ) : !hasScanned ? (
            <div className="text-center py-12 text-muted-foreground text-sm">
              Click <strong>Scan App Debris</strong> to inspect leftover application directories.
            </div>
          ) : filteredResults.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground text-sm">
              {results.length === 0
                ? 'No orphaned application debris detected.'
                : 'No folders match your filter.'}
            </div>
          ) : (
            <div className="border rounded-md divide-y">
              {filteredResults.map((item) => (
                <div key={item.folderPath} className="p-4 hover:bg-muted/50 transition-colors">
                  <div className="flex items-center gap-4">
                    <input
                      type="checkbox"
                      id={`debris-${item.folderPath}`}
                      className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary cursor-pointer shrink-0"
                      checked={selected.has(item.folderPath)}
                      onChange={() => toggleSelect(item.folderPath)}
                    />
                    <label htmlFor={`debris-${item.folderPath}`} className="flex-1 min-w-0 cursor-pointer">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-medium text-foreground">{item.folderName}</span>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/5 border border-white/10 text-muted-foreground">
                          {item.locationLabel}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1 truncate" title={item.folderPath}>
                        {item.folderPath}
                      </p>
                    </label>
                    <div className="flex items-center gap-2 shrink-0">
                      <div className="text-right mr-2">
                        <div className="text-sm font-mono font-semibold text-foreground">{formatSize(item.size)}</div>
                        <div className="text-[11px] text-muted-foreground">{item.fileCount} files</div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 gap-1.5 text-xs border-primary/30 text-primary hover:bg-primary/10"
                        onClick={() => handleExplain(item.folderPath)}
                        disabled={!apiKey || explainingPath === item.folderPath}
                        title={!apiKey ? 'Connect a Gemini API key in Settings to use AI Info' : 'Ask AI about this folder'}
                      >
                        {explainingPath === item.folderPath ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Sparkles className="w-3.5 h-3.5 text-primary" />
                        )}
                        {explainingPath === item.folderPath ? 'Analyzing…' : (explanations[item.folderPath] ? 'Hide Info' : 'AI Info')}
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-primary"
                        onClick={() => handleOpenFolder(item.folderPath)}
                        title="Open in File Explorer"
                      >
                        <FolderOpen className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  {explanations[item.folderPath] && (
                    <div className="mt-3 ml-8 p-3 rounded-lg border border-primary/20 bg-primary/5 text-xs text-foreground leading-relaxed animate-in fade-in">
                      <div className="flex items-center gap-1.5 font-semibold text-primary mb-1">
                        <Sparkles className="w-3.5 h-3.5" /> AI Folder Explanation ({item.folderName}):
                      </div>
                      <div className="prose prose-sm dark:prose-invert max-w-none text-muted-foreground">
                        <ReactMarkdown>{explanations[item.folderPath]}</ReactMarkdown>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <SelectionFooter
        selectedCount={selectedItems.length}
        totalSize={formatSize(totalSelectedSize)}
        onClean={handleClean}
        isCleaning={cleaning}
        unitLabel="folders"
        actionLabel="Move to Quarantine"
      />
    </div>
  );
}
