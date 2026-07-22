import React from 'react';
import { ChevronDown, HardDrive } from 'lucide-react';
import { useAppContext } from '@/context/AppContext';

export function DriveSelector() {
  const { availableDrives, selectedDrive, setSelectedDrive } = useAppContext();

  if (!availableDrives || availableDrives.length === 0) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground border border-white/10 rounded-lg px-3 py-2 bg-card w-full max-w-sm">
        <HardDrive className="w-4 h-4" />
        Loading drives...
      </div>
    );
  }

  const formatSize = (bytes: number) => {
    return (bytes / 1073741824).toFixed(1) + ' GB';
  };

  const selectedDriveStats = availableDrives.find(d => d.root === selectedDrive);

  return (
    <div className="space-y-4">
      <div className="relative inline-block w-full max-w-sm">
        <select
          value={selectedDrive}
          onChange={(e) => setSelectedDrive(e.target.value)}
          className="w-full bg-card border border-white/10 text-white rounded-lg pl-10 pr-8 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary appearance-none cursor-pointer"
        >
          {availableDrives.map(drive => (
            <option key={drive.letter} value={drive.root}>
              {drive.label} — {formatSize(drive.free)} free
            </option>
          ))}
        </select>
        <HardDrive className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
      </div>

      {selectedDriveStats && (
        <div className="space-y-2 max-w-sm">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Used: {formatSize(selectedDriveStats.used)}</span>
            <span>Total: {formatSize(selectedDriveStats.total)}</span>
          </div>
          <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
            <div 
              className="h-full bg-primary transition-all duration-500" 
              style={{ width: `${(selectedDriveStats.used / selectedDriveStats.total) * 100}%` }} 
            />
          </div>
        </div>
      )}
    </div>
  );
}
