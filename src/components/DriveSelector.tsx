import React from 'react';
import { HardDrive, CheckCircle2, ChevronDown } from 'lucide-react';
import { useAppContext } from '@/context/AppContext';
import { cn } from '@/lib/utils';

export function DriveSelector() {
  const { availableDrives, selectedDrive, setSelectedDrive } = useAppContext();

  if (!availableDrives || availableDrives.length === 0) {
    return (
      <div className="flex items-center gap-3 text-sm text-muted-foreground border border-white/10 rounded-xl p-4 bg-muted/10 w-full max-w-2xl">
        <HardDrive className="w-5 h-5 animate-pulse text-primary" />
        <span>Detecting local storage drives…</span>
      </div>
    );
  }

  const formatSize = (bytes: number) => {
    return (bytes / 1073741824).toFixed(1) + ' GB';
  };

  return (
    <div className="space-y-4 w-full max-w-2xl">
      {/* Interactive Drive Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {availableDrives.map(drive => {
          const isSelected = drive.root === selectedDrive;
          const usedPct = Math.min(100, Math.max(0, (drive.used / drive.total) * 100));

          return (
            <div
              key={drive.letter}
              onClick={() => setSelectedDrive(drive.root)}
              className={cn(
                "group relative p-4 rounded-xl border transition-all cursor-pointer flex flex-col justify-between space-y-3",
                isSelected 
                  ? "bg-primary/10 border-primary/60 ring-1 ring-primary/40 shadow-lg shadow-primary/10" 
                  : "bg-muted/10 border-white/10 hover:bg-muted/20 hover:border-white/20"
              )}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "p-2.5 rounded-lg transition-colors",
                    isSelected ? "bg-primary text-white" : "bg-muted/30 text-muted-foreground group-hover:text-foreground"
                  )}>
                    <HardDrive className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="font-semibold text-sm text-foreground flex items-center gap-2">
                      {drive.label}
                    </div>
                    <div className="text-xs text-muted-foreground font-mono mt-0.5">
                      {formatSize(drive.free)} free of {formatSize(drive.total)}
                    </div>
                  </div>
                </div>

                {isSelected && (
                  <CheckCircle2 className="w-5 h-5 text-primary shrink-0 animate-in zoom-in-50 duration-200" />
                )}
              </div>

              {/* Drive Storage Progress Bar */}
              <div className="space-y-1">
                <div className="flex justify-between text-[11px] font-mono text-muted-foreground">
                  <span>Used: {formatSize(drive.used)}</span>
                  <span>{usedPct.toFixed(0)}%</span>
                </div>
                <div className="h-2 w-full bg-muted/30 rounded-full overflow-hidden">
                  <div 
                    className={cn(
                      "h-full transition-all duration-500 rounded-full",
                      usedPct > 90 ? "bg-red-500" : usedPct > 75 ? "bg-amber-500" : "bg-primary"
                    )}
                    style={{ width: `${usedPct}%` }}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Styled Long Dropdown for quick access */}
      <div className="relative w-full">
        <select
          value={selectedDrive}
          onChange={(e) => setSelectedDrive(e.target.value)}
          className="w-full bg-muted/20 border border-white/10 text-foreground rounded-xl pl-11 pr-10 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 appearance-none cursor-pointer font-medium hover:bg-muted/30 transition-colors"
        >
          {availableDrives.map(drive => (
            <option key={drive.letter} value={drive.root} className="bg-[#12121A] text-foreground">
              {drive.label} — {formatSize(drive.free)} free / {formatSize(drive.total)} total
            </option>
          ))}
        </select>
        <HardDrive className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-primary pointer-events-none" />
        <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
      </div>
    </div>
  );
}
