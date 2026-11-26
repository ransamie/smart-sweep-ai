import React, { useEffect, useState } from 'react';
import {
  History,
  Trash2,
  CalendarDays,
  Loader2,
  Download,
  RotateCcw,
  ShieldCheck,
  ChevronDown,
  ChevronRight,
  Folder,
  File,
  RefreshCw,
  AlertTriangle,
  HardDrive
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAppContext } from '@/context/AppContext';
import type { HistoryEntry, QuarantinedItem } from '@/types/electron';

function escapeCsvCell(value: string | number | undefined | null): string {
  const str = value === undefined || value === null ? '' : String(value);
  if (/[",\r\n]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export function HistoryView() {
  const { refreshDiskSpace } = useAppContext();
  const [activeTab, setActiveTab] = useState<'logs' | 'quarantine'>('logs');

  // Activity Logs state
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [clearing, setClearing] = useState(false);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  // Quarantine state
  const [quarantineItems, setQuarantineItems] = useState<QuarantinedItem[]>([]);
  const [loadingQuarantine, setLoadingQuarantine] = useState(true);
  const [busyPath, setBusyPath] = useState<string | null>(null);
  const [confirmEmpty, setConfirmEmpty] = useState(false);
  const [emptying, setEmptying] = useState(false);
  const [quarantineBanner, setQuarantineBanner] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  useEffect(() => {
    void loadHistory();
    void loadQuarantine();
  }, []);

  const loadHistory = async () => {
    setLoadingHistory(true);
    try {
      if (window.electronAPI?.getHistory) {
        const data = await window.electronAPI.getHistory();
        setHistory(data || []);
      }
    } catch (e) {
      console.error('Failed to load history', e);
    } finally {
      setLoadingHistory(false);
    }
  };

  const loadQuarantine = async () => {
    setLoadingQuarantine(true);
    try {
      if (window.electronAPI?.listQuarantine) {
        const items = await window.electronAPI.listQuarantine();
        setQuarantineItems(items || []);
      }
    } catch (e) {
      console.error('Failed to load quarantined files', e);
    } finally {
      setLoadingQuarantine(false);
    }
  };

  const handleClearHistory = async () => {
    setClearing(true);
    try {
      if (window.electronAPI?.clearHistory) {
        await window.electronAPI.clearHistory();
        setHistory([]);
      }
    } catch (e) {
      console.error('Failed to clear history', e);
    } finally {
      setClearing(false);
    }
  };

  const formatBytes = (bytes: number) => {
    if (!bytes || bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const toggleExpand = (id: string) => {
    setExpandedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const triggerDownload = (content: string, filename: string, mimeType: string) => {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleExportCsv = () => {
    const headers = ['ID', 'Date', 'Timestamp', 'Action Type', 'Bytes Cleaned', 'Formatted Size', 'Details', 'Items'];
    const rows = history.map(entry => [
      entry.id,
      new Date(entry.timestamp).toISOString(),
      entry.timestamp,
      entry.scanType,
      entry.bytesCleaned,
      formatBytes(entry.bytesCleaned),
      entry.details,
      (entry.items || []).join('; '),
    ]);

    const csv = [headers, ...rows]
      .map(row => row.map(cell => escapeCsvCell(cell)).join(','))
      .join('\r\n');

    const dateTag = new Date().toISOString().slice(0, 10);
    triggerDownload(csv, `smartsweep-history-${dateTag}.csv`, 'text/csv;charset=utf-8;');
  };

  const handleExportJson = () => {
    const dateTag = new Date().toISOString().slice(0, 10);
    triggerDownload(JSON.stringify(history, null, 2), `smartsweep-history-${dateTag}.json`, 'application/json');
  };

  const handleRestoreItem = async (item: QuarantinedItem) => {
    setBusyPath(item.originalPath);
    setQuarantineBanner(null);
    try {
      if (window.electronAPI?.restoreFile) {
        const res = await window.electronAPI.restoreFile(item.originalPath);
        if (res?.success) {
          setQuarantineItems(prev => prev.filter(q => q.originalPath !== item.originalPath));
          setQuarantineBanner({
            type: 'success',
            message: `Restored "${item.fileName}" to ${item.originalPath}`,
          });
          await refreshDiskSpace();
        } else {
          setQuarantineBanner({
            type: 'error',
            message: res?.error || `Could not restore "${item.fileName}".`,
          });
        }
      }
    } catch (e: any) {
      setQuarantineBanner({
        type: 'error',
        message: e?.message || 'Restore failed.',
      });
    } finally {
      setBusyPath(null);
    }
  };

  const handleDeleteQuarantineItem = async (item: QuarantinedItem) => {
    setBusyPath(item.originalPath);
    setQuarantineBanner(null);
    try {
      if (window.electronAPI?.deleteQuarantineItem) {
        const res = await window.electronAPI.deleteQuarantineItem(item.originalPath);
        if (res?.success) {
          setQuarantineItems(prev => prev.filter(q => q.originalPath !== item.originalPath));
          setQuarantineBanner({
            type: 'success',
            message: `Permanently deleted "${item.fileName}".`,
          });
          await refreshDiskSpace();
        } else {
          setQuarantineBanner({
            type: 'error',
            message: res?.error || `Failed to delete "${item.fileName}".`,
          });
        }
      }
    } catch (e: any) {
      setQuarantineBanner({
        type: 'error',
        message: e?.message || 'Delete failed.',
      });
    } finally {
      setBusyPath(null);
    }
  };

  const handleEmptyQuarantine = async () => {
    setEmptying(true);
    setQuarantineBanner(null);
    try {
      if (window.electronAPI?.emptyQuarantine) {
        const res = await window.electronAPI.emptyQuarantine();
        if (res?.success) {
          setQuarantineItems([]);
          setConfirmEmpty(false);
          setQuarantineBanner({
            type: 'success',
            message: `Permanently emptied quarantine (${res.deletedCount} item(s) removed).`,
          });
          await refreshDiskSpace();
        } else {
          setQuarantineBanner({
            type: 'error',
            message: res?.error || 'Failed to empty quarantine.',
          });
        }
      }
    } catch (e: any) {
      setQuarantineBanner({
        type: 'error',
        message: e?.message || 'Failed to empty quarantine.',
      });
    } finally {
      setEmptying(false);
    }
  };

  const lifetimeSavedBytes = history.reduce((acc, entry) => acc + (entry.bytesCleaned || 0), 0);
  const cleanupCount = history.filter(h => !h.scanType.toLowerCase().includes('scan')).length;
  const totalQuarantineSize = quarantineItems.reduce((acc, item) => acc + item.size, 0);

  return (
    <div className="flex flex-col h-[calc(100vh-120px)] space-y-5 animate-in fade-in duration-500 overflow-hidden">
      {/* Pinned Top Header */}
      <div className="flex items-center justify-between gap-4 shrink-0 flex-wrap">
        <div>
          <h2 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <History className="w-8 h-8 text-primary" /> Activity Logs & Quarantine
          </h2>
          <p className="text-muted-foreground mt-1">
            Export cleanup history or recover quarantined files within the 14-day safety window.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-1 p-1 rounded-xl bg-white/5 border border-white/10">
          <button
            onClick={() => setActiveTab('logs')}
            className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all flex items-center gap-2 ${
              activeTab === 'logs'
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            Activity Logs
          </button>
          <button
            onClick={() => setActiveTab('quarantine')}
            className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all flex items-center gap-2 ${
              activeTab === 'quarantine'
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            Quarantine Recovery
            {quarantineItems.length > 0 && (
              <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                activeTab === 'quarantine' ? 'bg-black/20 text-white' : 'bg-primary/20 text-primary'
              }`}>
                {quarantineItems.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {activeTab === 'logs' ? (
        <>
          {/* Summary + Export Bar */}
          <div className="flex items-center justify-between gap-4 shrink-0 flex-wrap">
            <div className="flex items-center gap-4 px-4 py-2.5 rounded-xl border border-green-500/20 bg-green-500/5">
              <HardDrive className="w-5 h-5 text-green-400 shrink-0" />
              <div>
                <div className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">Lifetime Space Saved</div>
                <div className="text-lg font-bold text-green-400 font-mono">
                  {formatBytes(lifetimeSavedBytes)} <span className="text-xs font-normal text-muted-foreground">({cleanupCount} cleanups)</span>
                </div>
              </div>
            </div>

            {history.length > 0 && (
              <div className="flex items-center gap-2 flex-wrap">
                <Button variant="outline" size="sm" onClick={handleExportCsv} className="gap-2">
                  <Download className="w-4 h-4" /> Export CSV
                </Button>
                <Button variant="outline" size="sm" onClick={handleExportJson} className="gap-2">
                  <Download className="w-4 h-4" /> Export JSON
                </Button>
                <Button variant="destructive" size="sm" onClick={handleClearHistory} disabled={clearing} className="gap-2">
                  {clearing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                  Clear Logs
                </Button>
              </div>
            )}
          </div>

          <Card className="flex-1 flex flex-col min-h-0 overflow-hidden">
            <CardHeader className="shrink-0 pb-4">
              <CardTitle>Cleanup History</CardTitle>
              <CardDescription>Click entries with itemized records to inspect cleaned paths or categories.</CardDescription>
            </CardHeader>

            <CardContent className="flex-1 min-h-0 overflow-hidden p-6 pt-0 flex flex-col">
              {loadingHistory ? (
                <div className="flex justify-center items-center py-12 flex-1">
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
              ) : history.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center flex-1">
                  <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                    <CalendarDays className="w-8 h-8 text-primary/60" />
                  </div>
                  <h3 className="text-lg font-medium">No History Found</h3>
                  <p className="text-sm text-muted-foreground mt-1 max-w-sm">
                    You haven't run any cleanups yet. Once you scan or clean your system, detailed logs will appear here.
                  </p>
                </div>
              ) : (
                <div className="flex-1 min-h-0 overflow-y-auto rounded-lg border border-white/5 bg-black/20 custom-scrollbar">
                  <table className="w-full text-sm text-left border-collapse">
                    <thead className="sticky top-0 z-20 text-xs uppercase bg-[#13141C] text-muted-foreground border-b border-white/10 shadow-sm">
                      <tr>
                        <th className="px-6 py-3.5 font-semibold bg-[#13141C]">Date & Time</th>
                        <th className="px-6 py-3.5 font-semibold bg-[#13141C]">Action Type</th>
                        <th className="px-6 py-3.5 font-semibold bg-[#13141C]">Space Freed</th>
                        <th className="px-6 py-3.5 font-semibold bg-[#13141C]">Details</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {history.map((entry) => {
                        const hasItems = Array.isArray(entry.items) && entry.items.length > 0;
                        const isExpanded = expandedIds.has(entry.id);
                        return (
                          <React.Fragment key={entry.id}>
                            <tr
                              className={`hover:bg-white/[0.03] transition-colors ${hasItems ? 'cursor-pointer' : ''}`}
                              onClick={() => hasItems && toggleExpand(entry.id)}
                            >
                              <td className="px-6 py-4 whitespace-nowrap text-muted-foreground font-mono text-xs">
                                {new Date(entry.timestamp).toLocaleString()}
                              </td>
                              <td className="px-6 py-4 font-medium text-foreground">
                                {entry.scanType}
                              </td>
                              <td className={`px-6 py-4 font-semibold whitespace-nowrap ${entry.scanType.toLowerCase().includes('clean') ? 'text-green-400' : 'text-blue-400'}`}>
                                {entry.scanType.toLowerCase().includes('scan') ? '-' : formatBytes(entry.bytesCleaned)}
                              </td>
                              <td className="px-6 py-4 text-muted-foreground text-xs leading-relaxed">
                                <div className="flex items-center justify-between gap-2">
                                  <span>{entry.details}</span>
                                  {hasItems && (
                                    <span className="inline-flex items-center gap-1 text-[11px] text-primary font-medium shrink-0">
                                      {isExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                                      {entry.items!.length} item{entry.items!.length === 1 ? '' : 's'}
                                    </span>
                                  )}
                                </div>
                              </td>
                            </tr>
                            {hasItems && isExpanded && (
                              <tr className="bg-black/30">
                                <td colSpan={4} className="px-6 py-3">
                                  <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
                                    Cleaned Items
                                  </div>
                                  <ul className="space-y-1 max-h-40 overflow-y-auto font-mono text-xs text-foreground/80">
                                    {entry.items!.map((item, idx) => (
                                      <li key={idx} className="truncate" title={item}>• {item}</li>
                                    ))}
                                  </ul>
                                </td>
                              </tr>
                            )}
                          </React.Fragment>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      ) : (
        <>
          {/* Quarantine Actions & Retention Banner */}
          <div className="flex items-center justify-between gap-4 shrink-0 flex-wrap">
            <div className="flex items-center gap-3 px-4 py-2.5 rounded-xl border border-primary/20 bg-primary/5 text-xs">
              <ShieldCheck className="w-4 h-4 text-primary shrink-0" />
              <span className="text-muted-foreground">
                Items in <code className="text-foreground">.smartsweep_quarantine</code> ({formatBytes(totalQuarantineSize)}) are auto-purged after <strong>14 days</strong>.
              </span>
            </div>

            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={loadQuarantine} disabled={loadingQuarantine} className="gap-2">
                <RefreshCw className={`w-4 h-4 ${loadingQuarantine ? 'animate-spin' : ''}`} /> Refresh
              </Button>
              {quarantineItems.length > 0 && !confirmEmpty && (
                <Button variant="destructive" size="sm" onClick={() => setConfirmEmpty(true)} className="gap-2">
                  <Trash2 className="w-4 h-4" /> Empty Quarantine
                </Button>
              )}
              {confirmEmpty && (
                <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/30 px-3 py-1.5 rounded-lg">
                  <AlertTriangle className="w-3.5 h-3.5 text-red-400" />
                  <span className="text-xs text-red-300">Permanently delete all?</span>
                  <Button size="sm" variant="destructive" onClick={handleEmptyQuarantine} disabled={emptying} className="h-6 px-2 text-xs">
                    {emptying ? 'Deleting…' : 'Confirm'}
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setConfirmEmpty(false)} className="h-6 px-2 text-xs">
                    Cancel
                  </Button>
                </div>
              )}
            </div>
          </div>

          {quarantineBanner && (
            <div className={`p-3 rounded-lg border text-xs shrink-0 ${
              quarantineBanner.type === 'success'
                ? 'bg-green-500/10 border-green-500/30 text-green-300'
                : 'bg-red-500/10 border-red-500/30 text-red-300'
            }`}>
              {quarantineBanner.message}
            </div>
          )}

          <Card className="flex-1 flex flex-col min-h-0 overflow-hidden">
            <CardHeader className="shrink-0 pb-4">
              <CardTitle>Quarantined Files & Folders</CardTitle>
              <CardDescription>Restore items back to their original location or permanently delete them to free space immediately.</CardDescription>
            </CardHeader>

            <CardContent className="flex-1 min-h-0 overflow-hidden p-6 pt-0 flex flex-col">
              {loadingQuarantine ? (
                <div className="flex justify-center items-center py-12 flex-1">
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
              ) : quarantineItems.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center flex-1">
                  <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                    <ShieldCheck className="w-8 h-8 text-primary/60" />
                  </div>
                  <h3 className="text-lg font-medium">Quarantine is Empty</h3>
                  <p className="text-sm text-muted-foreground mt-1 max-w-sm">
                    Files and app debris folders removed from Space Analyzer or App Debris will appear here for 14 days before permanent deletion.
                  </p>
                </div>
              ) : (
                <div className="flex-1 min-h-0 overflow-y-auto rounded-lg border border-white/5 bg-black/20 custom-scrollbar">
                  <table className="w-full text-sm text-left border-collapse">
                    <thead className="sticky top-0 z-20 text-xs uppercase bg-[#13141C] text-muted-foreground border-b border-white/10 shadow-sm">
                      <tr>
                        <th className="px-5 py-3.5 font-semibold bg-[#13141C]">Item</th>
                        <th className="px-5 py-3.5 font-semibold bg-[#13141C]">Original Path</th>
                        <th className="px-5 py-3.5 font-semibold bg-[#13141C]">Size</th>
                        <th className="px-5 py-3.5 font-semibold bg-[#13141C]">Retention</th>
                        <th className="px-5 py-3.5 font-semibold bg-[#13141C] text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {quarantineItems.map((item) => {
                        const isBusy = busyPath === item.originalPath;
                        return (
                          <tr key={item.id} className="hover:bg-white/[0.03] transition-colors">
                            <td className="px-5 py-4 font-medium text-foreground">
                              <div className="flex items-center gap-2">
                                {item.isDirectory
                                  ? <Folder className="w-4 h-4 text-amber-400 shrink-0" />
                                  : <File className="w-4 h-4 text-blue-400 shrink-0" />}
                                <span className="truncate max-w-[180px]" title={item.fileName}>{item.fileName}</span>
                              </div>
                            </td>
                            <td className="px-5 py-4 text-xs text-muted-foreground font-mono">
                              <div className="truncate max-w-[260px]" title={item.originalPath}>
                                {item.originalPath}
                              </div>
                            </td>
                            <td className="px-5 py-4 whitespace-nowrap font-mono text-xs text-foreground">
                              {formatBytes(item.size)}
                            </td>
                            <td className="px-5 py-4 whitespace-nowrap text-xs">
                              <span className={`px-2 py-0.5 rounded-full font-medium ${
                                item.daysRemaining <= 3
                                  ? 'bg-red-500/15 text-red-400 border border-red-500/30'
                                  : 'bg-primary/15 text-primary border border-primary/20'
                              }`}>
                                {item.daysRemaining}d remaining
                              </span>
                            </td>
                            <td className="px-5 py-4 whitespace-nowrap text-right">
                              <div className="inline-flex items-center gap-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-7 text-xs gap-1.5 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10"
                                  onClick={() => handleRestoreItem(item)}
                                  disabled={isBusy}
                                >
                                  {isBusy ? <Loader2 className="w-3 h-3 animate-spin" /> : <RotateCcw className="w-3 h-3" />}
                                  Restore
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-7 text-xs gap-1 text-red-400 hover:bg-red-500/10 hover:text-red-300"
                                  onClick={() => handleDeleteQuarantineItem(item)}
                                  disabled={isBusy}
                                  title="Delete Permanently"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </Button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
