import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Search, Loader2, CheckCircle2, FolderOpen, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAppContext } from '@/context/AppContext';
import { SelectionFooter } from '@/components/SelectionFooter';
import { useSearchParams } from 'react-router-dom';
import { Treemap, ResponsiveContainer, Tooltip as RechartsTooltip } from 'recharts';
import ReactMarkdown from 'react-markdown';

const FALLBACK_PATH = '/tmp';
const SIMULATE_DURATION_MS = 3500;

export function DeepScanView() {
  const { 
    systemPaths, 
    selectedDrive, 
    apiKey,
    deepScanResults: results,
    setDeepScanResults: setResults,
    deepScanExplanation: aiExplanation,
    setDeepScanExplanation: setAiExplanation,
    spaceAnalyzerScanning: scanning,
    setSpaceAnalyzerScanning: setScanning,
    spaceAnalyzerProgress: progress,
    setSpaceAnalyzerProgress: setProgress
  } = useAppContext();
  const [searchParams] = useSearchParams();

  const [selected, setSelected]     = useState<Set<number>>(new Set());
  const [minSizeMB, setMinSizeMB]   = useState(100);

  const [explainingPath, setExplainingPath] = useState<string | null>(null);

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const clearProgressTimer = () => {
    if (intervalRef.current !== null) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  const startProgressSimulation = () => {
    setProgress(0);
    const tickMs   = 50;
    const steps    = SIMULATE_DURATION_MS / tickMs;
    const perTick  = 85 / steps;
    let current    = 0;

    intervalRef.current = setInterval(() => {
      current += perTick;
      if (current >= 85) {
        current = 85;
        clearProgressTimer();
      }
      setProgress(Math.round(current));
    }, tickMs);
  };

  const formatSize = (bytes: number) => {
    if (bytes >= 1073741824) return (bytes / 1073741824).toFixed(2) + ' GB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  };

  const handleScan = useCallback(async () => {
    setScanning(true);
    setResults([]);
    setSelected(new Set());
    setAiExplanation(null);
    startProgressSimulation();

    try {
      // @ts-ignore
      if (window.electronAPI) {
        // @ts-ignore
        const files: any[] = await window.electronAPI.scanDirectory(selectedDrive);
        const largeFiles = files
          .filter((f: any) => f.size >= minSizeMB * 1024 * 1024)
          .map((f: any, i: number) => ({ ...f, id: i }));

        clearProgressTimer();
        setProgress(100);
        setResults(largeFiles);

        // @ts-ignore
        if (window.electronAPI.addHistoryEntry) {
          // @ts-ignore
          await window.electronAPI.addHistoryEntry({
            timestamp: Date.now(),
            scanType: 'Space Analyzer Scan',
            bytesCleaned: 0,
            details: `Found ${largeFiles.length} large files on ${selectedDrive}.`
          });
        }

        // Send desktop notification if completed
        // @ts-ignore
        if (window.electronAPI.sendNotification) {
          // @ts-ignore
          window.electronAPI.sendNotification(
            'Space Analyzer Complete',
            `Found ${largeFiles.length} large files on ${selectedDrive}`
          );
        }
      }
    } catch (e) {
      console.error('Deep scan error:', e);
      clearProgressTimer();
      setProgress(0);
    } finally {
      setScanning(false);
    }
  }, [systemPaths, selectedDrive, minSizeMB]);

  useEffect(() => {
    if (searchParams.get('autoStart') === 'true') {
      handleScan();
    }
    return () => clearProgressTimer();
  }, [handleScan, searchParams]);

  const toggleSelect = (id: number) => {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelected(next);
  };

  const totalSize = results.reduce((acc, f) => acc + (f.size || 0), 0);
  const totalSelectedSize = Array.from(selected).reduce((acc, id) => {
    const file = results.find(f => f.id === id);
    return acc + (file?.size || 0);
  }, 0);

  const handleClean = async () => {
    const pathsToDelete = Array.from(selected)
      .map(id => results.find(f => f.id === id)?.path)
      .filter(Boolean) as string[];

    if (pathsToDelete.length > 0) {
      try {
        // @ts-ignore
        if (window.electronAPI) {
          // @ts-ignore
          await window.electronAPI.deleteFiles(pathsToDelete);
          
          // @ts-ignore
          if (window.electronAPI.addHistoryEntry) {
            // @ts-ignore
            await window.electronAPI.addHistoryEntry({
              timestamp: Date.now(),
              scanType: 'Large Files Clean',
              bytesCleaned: totalSelectedSize,
              details: `Deleted ${pathsToDelete.length} files.`
            });
          }

          setResults(results.filter(f => !selected.has(f.id)));
          setSelected(new Set());
        }
      } catch (e) {
        console.error(e);
      }
    }
  };

  const handleSelectAll = () => {
    if (selected.size === results.length && results.length > 0) {
      setSelected(new Set());
    } else {
      setSelected(new Set(results.map(f => f.id)));
    }
  };

  const getTreemapData = () => {
    const folders: Record<string, number> = {};
    results.forEach(f => {
      if (!f.path) return;
      const parts = f.path.split('\\');
      const dir = parts.slice(0, -1).join('\\') || "Unknown";
      folders[dir] = (folders[dir] || 0) + (f.size || 0);
    });

    const data = Object.keys(folders).map(dir => {
      const parts = dir.split('\\');
      const name = parts.length >= 2 ? parts.slice(-2).join('\\') : parts[0] || dir;
      return {
        name,
        path: dir,
        size: folders[dir]
      };
    });

    return data.sort((a, b) => b.size - a.size).slice(0, 50);
  };

  const handleBlockClick = async (e: any) => {
    if (!e || !e.path) return;
    setExplainingPath(e.path);
    setAiExplanation(null);
    try {
      // @ts-ignore
      if (window.electronAPI && window.electronAPI.explainPath) {
        // @ts-ignore
        const explanation = await window.electronAPI.explainPath(apiKey, e.path);
        setAiExplanation(explanation);
      } else {
        setAiExplanation("AI explanation feature not available.");
      }
    } catch (err) {
      console.error(err);
      setAiExplanation("Error generating explanation.");
    } finally {
      setExplainingPath(null);
    }
  };

  const [fileExplanations, setFileExplanations] = useState<Record<string, string>>({});
  const [explainingFilePath, setExplainingFilePath] = useState<string | null>(null);

  const handleExplainFile = async (filePath: string) => {
    if (fileExplanations[filePath]) {
      setFileExplanations(prev => {
        const copy = { ...prev };
        delete copy[filePath];
        return copy;
      });
      return;
    }
    setExplainingFilePath(filePath);
    try {
      // @ts-ignore
      if (window.electronAPI && window.electronAPI.explainPath) {
        // @ts-ignore
        const res = await window.electronAPI.explainPath(apiKey, filePath);
        setFileExplanations(prev => ({
          ...prev,
          [filePath]: typeof res === 'string' ? res : ((res as any)?.error || 'Could not explain file.')
        }));
      }
    } catch (e: any) {
      console.error(e);
    } finally {
      setExplainingFilePath(null);
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

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-black/80 backdrop-blur-md text-white border border-white/20 shadow-xl p-3 rounded-lg text-xs z-50">
          <p className="font-semibold mb-1">{payload[0].payload.path}</p>
          <p className="text-white/80">{formatSize(payload[0].value)}</p>
        </div>
      );
    }
    return null;
  };

  const CustomizedContent = (props: any) => {
    const { x, y, width, height, index, name } = props;
    
    // Heatmap colors based on size rank
    let color = '#22c55e'; // green (smallest)
    if (index === 0) color = '#ef4444'; // red (danger, largest)
    else if (index < 3) color = '#f97316'; // orange
    else if (index < 8) color = '#eab308'; // yellow
    else if (index < 15) color = '#3b82f6'; // blue
    else color = '#8b5cf6'; // purple

    return (
      <g>
        <rect
          x={x}
          y={y}
          width={width}
          height={height}
          style={{
            fill: color,
            stroke: 'hsl(var(--background))',
            strokeWidth: 2,
          }}
        />
        {width > 60 && height > 30 && (
          <text
            x={x + 6}
            y={y + 20}
            fill="#fff"
            fontSize={12}
            className="font-medium truncate"
          >
            {name.length > Math.floor(width / 7) ? name.substring(0, Math.floor(width / 7)) + '...' : name}
          </text>
        )}
      </g>
    );
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Space Analyzer</h2>
          <p className="text-muted-foreground mt-1">Locate large files taking up space on {selectedDrive}.</p>
        </div>
        <div className="flex items-center gap-4">
          <select 
            value={minSizeMB}
            onChange={(e) => setMinSizeMB(Number(e.target.value))}
            className="h-10 px-3 rounded-md border border-input bg-background text-sm ring-offset-background"
            disabled={scanning}
          >
            <option value={50}>&gt; 50 MB</option>
            <option value={100}>&gt; 100 MB</option>
            <option value={500}>&gt; 500 MB</option>
            <option value={1024}>&gt; 1 GB</option>
            <option value={5120}>&gt; 5 GB</option>
          </select>
          <Button onClick={handleScan} disabled={scanning} className="gap-2">
            {scanning ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
            {scanning ? 'Scanning…' : 'Start Scan'}
          </Button>
        </div>
      </div>

      {scanning && (
        <div className="space-y-2">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Analyzing file system…</span>
            <span>{progress}%</span>
          </div>
          <div className="w-full h-2 rounded-full bg-muted overflow-hidden">
            <div
              className="h-full bg-primary rounded-full transition-all duration-75 ease-linear"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}



      <Card>
        <CardHeader>
          <CardTitle>Scan Results</CardTitle>
          <CardDescription>
            {scanning
              ? 'Scanning…'
              : results.length > 0
              ? `Found ${results.length} files · Total: ${formatSize(totalSize)}`
              : 'Ready to scan.'}
          </CardDescription>
        </CardHeader>

        <CardContent>
          {scanning && (
            <div className="flex flex-col items-center py-12 text-muted-foreground">
              <Loader2 className="w-8 h-8 animate-spin mb-4 text-primary" />
              <p>Please wait…</p>
            </div>
          )}

          {!scanning && results.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              No files found. Run a scan to locate junk files.
            </div>
          )}

          {!scanning && results.length > 0 && (
            <>
              <div style={{ height: 300, width: '100%', marginBottom: '2rem' }}>
                <ResponsiveContainer>
                  <Treemap
                    data={getTreemapData()}
                    dataKey="size"
                    aspectRatio={4 / 3}
                    content={<CustomizedContent />}
                    onClick={handleBlockClick}
                    className="cursor-pointer"
                  >
                    <RechartsTooltip content={<CustomTooltip />} />
                  </Treemap>
                </ResponsiveContainer>
              </div>

              {(explainingPath || aiExplanation) && (
                <div className="mb-6 p-4 border rounded-md bg-muted/20">
                  <h3 className="font-semibold mb-2 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-primary" /> AI Folder Explanation
                  </h3>
                  {explainingPath ? (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Loader2 className="w-4 h-4 animate-spin" /> Analyzing {explainingPath}...
                    </div>
                  ) : (
                    <div className="prose prose-sm dark:prose-invert max-w-none text-foreground">
                      <ReactMarkdown>{aiExplanation || ''}</ReactMarkdown>
                    </div>
                  )}
                </div>
              )}

              <div className="mb-3 flex items-center justify-between rounded-md bg-muted/50 px-4 py-2 text-sm text-muted-foreground">
                <div className="flex items-center gap-4">
                  <span className="font-medium text-foreground">{results.length} files found</span>
                  <Button variant="outline" size="sm" onClick={handleSelectAll} className="h-7 text-xs">
                    {selected.size === results.length ? 'Deselect All' : 'Select All'}
                  </Button>
                </div>
                <span className="font-mono">{formatSize(totalSize)} total</span>
              </div>

              <div className="border rounded-md divide-y">
                {results.map((file) => (
                  <div key={file.id} className="p-4 hover:bg-muted/50 transition-colors">
                    <div className="flex items-center">
                      <div className="flex items-center h-5">
                        <input
                          type="checkbox"
                          id={`file-${file.id}`}
                          className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary cursor-pointer"
                          checked={selected.has(file.id)}
                          onChange={() => toggleSelect(file.id)}
                        />
                      </div>
                      <label htmlFor={`file-${file.id}`} className="ml-4 flex-1 cursor-pointer min-w-0">
                        <p className="text-sm font-medium leading-none text-foreground">{file.name}</p>
                        <p className="text-sm text-muted-foreground mt-1 truncate" title={file.path}>
                          {file.path}
                        </p>
                      </label>
                      <div className="ml-4 flex items-center gap-2 shrink-0">
                        <span className="text-sm text-muted-foreground font-mono mr-2">
                          {formatSize(file.size)}
                        </span>
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 gap-1.5 text-xs border-primary/30 text-primary hover:bg-primary/10"
                          onClick={() => handleExplainFile(file.path)}
                          disabled={explainingFilePath === file.path}
                        >
                          {explainingFilePath === file.path ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Sparkles className="w-3.5 h-3.5 text-primary" />
                          )}
                          {explainingFilePath === file.path ? 'Analyzing…' : (fileExplanations[file.path] ? 'Hide Info' : 'AI Info')}
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-primary"
                          onClick={() => handleOpenFolder(file.path)}
                          title="Open in File Explorer"
                        >
                          <FolderOpen className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>

                    {fileExplanations[file.path] && (
                      <div className="mt-3 ml-8 p-3 rounded-lg border border-primary/20 bg-primary/5 text-xs text-foreground leading-relaxed animate-in fade-in">
                        <div className="flex items-center gap-1.5 font-semibold text-primary mb-1">
                          <Sparkles className="w-3.5 h-3.5" /> AI File Explanation ({file.name}):
                        </div>
                        <div className="prose prose-sm dark:prose-invert max-w-none text-muted-foreground">
                          <ReactMarkdown>{fileExplanations[file.path]}</ReactMarkdown>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <SelectionFooter
        selectedCount={selected.size}
        totalSize={formatSize(totalSelectedSize)}
        onClean={handleClean}
      />
    </div>
  );
}
