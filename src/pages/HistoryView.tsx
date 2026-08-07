import React, { useEffect, useState } from 'react';
import { History, Trash2, CalendarDays, Loader2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface HistoryEntry {
  id: string;
  timestamp: number;
  scanType: string;
  bytesCleaned: number;
  details: string;
}

export function HistoryView() {
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [clearing, setClearing] = useState(false);

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    try {
      // @ts-ignore
      if (window.electronAPI?.getHistory) {
        // @ts-ignore
        const data = await window.electronAPI.getHistory();
        setHistory(data || []);
      }
    } catch (e) {
      console.error('Failed to load history', e);
    } finally {
      setLoading(false);
    }
  };

  const handleClearHistory = async () => {
    setClearing(true);
    try {
      // @ts-ignore
      if (window.electronAPI?.clearHistory) {
        // @ts-ignore
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
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="flex flex-col h-[calc(100vh-120px)] space-y-6 animate-in fade-in duration-500 overflow-hidden">
      {/* Pinned Top Header */}
      <div className="flex items-center justify-between shrink-0">
        <div>
          <h2 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <History className="w-8 h-8 text-primary" /> Activity Logs
          </h2>
          <p className="text-muted-foreground mt-1">Review the history of your system cleanups and space optimization.</p>
        </div>
        {history.length > 0 && (
          <Button variant="destructive" onClick={handleClearHistory} disabled={clearing} className="gap-2">
            {clearing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
            Clear Logs
          </Button>
        )}
      </div>

      {/* Card Container for Logs */}
      <Card className="flex-1 flex flex-col min-h-0 overflow-hidden">
        <CardHeader className="shrink-0 pb-4">
          <CardTitle>Cleanup History</CardTitle>
          <CardDescription>A chronological record of automated and manual storage cleanups.</CardDescription>
        </CardHeader>
        
        <CardContent className="flex-1 min-h-0 overflow-hidden p-6 pt-0 flex flex-col">
          {loading ? (
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
                You haven't run any cleanups yet. Once you clean your system or files, the logs will appear here.
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
                  {history.map((entry) => (
                    <tr key={entry.id} className="hover:bg-white/[0.03] transition-colors">
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
                        {entry.details}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
