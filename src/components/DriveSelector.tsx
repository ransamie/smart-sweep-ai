import React, { useState, useRef, useEffect } from 'react';
import { HardDrive, Check, ChevronDown } from 'lucide-react';
import { useAppContext } from '@/context/AppContext';
import { cn } from '@/lib/utils';

export function DriveSelector() {
  const { availableDrives, selectedDrive, setSelectedDrive } = useAppContext();
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!availableDrives || availableDrives.length === 0) {
    return (
      <div className="flex items-center gap-3 text-sm text-muted-foreground border border-white/10 rounded-xl px-4 py-3.5 bg-muted/10 w-full max-w-xl">
        <HardDrive className="w-5 h-5 animate-pulse text-primary" />
        <span>Detecting local storage drives…</span>
      </div>
    );
  }

  const formatSize = (bytes: number) => {
    return (bytes / 1073741824).toFixed(1) + ' GB';
  };

  const currentDrive = availableDrives.find(d => d.root === selectedDrive) || availableDrives[0];

  return (
    <div className="relative w-full max-w-xl" ref={containerRef}>
      {/* Custom Dropdown Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "w-full flex items-center justify-between px-4 py-3.5 rounded-xl border transition-all text-left bg-card/90 hover:bg-card cursor-pointer shadow-md focus:outline-none focus:ring-2 focus:ring-primary/50",
          isOpen ? "border-primary ring-2 ring-primary/30" : "border-white/15 hover:border-white/30"
        )}
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className="p-2 rounded-lg bg-primary/10 text-primary shrink-0">
            <HardDrive className="w-5 h-5" />
          </div>
          <div className="truncate">
            <span className="font-semibold text-sm text-foreground block">
              {currentDrive.label}
            </span>
            <span className="text-xs text-muted-foreground font-mono">
              {formatSize(currentDrive.free)} free / {formatSize(currentDrive.total)} total
            </span>
          </div>
        </div>

        <ChevronDown className={cn("w-5 h-5 text-muted-foreground shrink-0 transition-transform duration-200", isOpen && "rotate-180 text-primary")} />
      </button>

      {/* Spacious Custom Dropdown Options Menu */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 z-50 rounded-xl bg-[#12121A] border border-primary/30 shadow-2xl backdrop-blur-xl overflow-hidden py-1.5 animate-in fade-in zoom-in-95 duration-150">
          {availableDrives.map((drive) => {
            const isSelected = drive.root === selectedDrive;

            return (
              <div
                key={drive.letter}
                onClick={() => {
                  setSelectedDrive(drive.root);
                  setIsOpen(false);
                }}
                className={cn(
                  "flex items-center justify-between px-4 py-3.5 cursor-pointer transition-colors border-b last:border-b-0 border-white/5 min-h-[54px]",
                  isSelected
                    ? "bg-primary/20 text-white font-medium"
                    : "hover:bg-primary/10 text-muted-foreground hover:text-foreground"
                )}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <HardDrive className={cn("w-5 h-5 shrink-0", isSelected ? "text-primary" : "text-muted-foreground")} />
                  <div className="truncate">
                    <span className="font-semibold text-sm block text-foreground">
                      {drive.label}
                    </span>
                    <span className="text-xs font-mono opacity-80">
                      {formatSize(drive.free)} free / {formatSize(drive.total)} total
                    </span>
                  </div>
                </div>

                {isSelected && (
                  <Check className="w-5 h-5 text-primary shrink-0 ml-2" />
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
