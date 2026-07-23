import React from 'react';
import { Minus, Square, X } from 'lucide-react';

export function TitleBar() {
  const handleMinimize = () => {
    // @ts-ignore
    if (window.electronAPI?.minimizeWindow) {
      // @ts-ignore
      window.electronAPI.minimizeWindow();
    }
  };

  const handleMaximize = () => {
    // @ts-ignore
    if (window.electronAPI?.maximizeWindow) {
      // @ts-ignore
      window.electronAPI.maximizeWindow();
    }
  };

  const handleClose = () => {
    // @ts-ignore
    if (window.electronAPI?.closeWindow) {
      // @ts-ignore
      window.electronAPI.closeWindow();
    }
  };

  // @ts-ignore
  const isLinux = window.electronAPI?.platform === 'linux';

  return (
    <div 
      className="h-9 bg-card border-b border-border flex items-center justify-between px-3 select-none shrink-0"
      style={{ WebkitAppRegion: 'drag' } as React.CSSProperties}
    >
      <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
        <img src="./logo.png" alt="SmartSweep" className="w-4 h-4 object-contain" />
        <span>SmartSweep AI</span>
      </div>

      {isLinux && (
        <div 
          className="flex items-center space-x-1"
          style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
        >
          <button
            onClick={handleMinimize}
            className="w-8 h-6 flex items-center justify-center rounded text-muted-foreground hover:bg-white/10 hover:text-foreground transition-colors"
            title="Minimize"
          >
            <Minus className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={handleMaximize}
            className="w-8 h-6 flex items-center justify-center rounded text-muted-foreground hover:bg-white/10 hover:text-foreground transition-colors"
            title="Maximize"
          >
            <Square className="w-3 h-3" />
          </button>
          <button
            onClick={handleClose}
            className="w-8 h-6 flex items-center justify-center rounded text-muted-foreground hover:bg-red-500 hover:text-white transition-colors"
            title="Close"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}
