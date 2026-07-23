import React, { useEffect, useState } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { TitleBar } from './TitleBar';
import { CheckCircle2, X } from 'lucide-react';
import { Button } from './ui/button';

export function AppLayout() {
  const navigate = useNavigate();
  const [autoCleanupResult, setAutoCleanupResult] = useState<{ totalBytes: number; cleanedStr: string; scanResults: any } | null>(null);

  useEffect(() => {
    // @ts-ignore
    if (window.electronAPI?.onNavigate) {
      // @ts-ignore
      window.electronAPI.onNavigate((route: string) => {
        navigate(route);
      });
    }

    // @ts-ignore
    if (window.electronAPI?.onAutoCleanupCompleted) {
      // @ts-ignore
      window.electronAPI.onAutoCleanupCompleted((data: any) => {
        setAutoCleanupResult(data);
      });
    }
  }, [navigate]);

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-[#0A0A0F] text-foreground relative selection:bg-primary/30">
      {/* Background Orbs for Premium Mesh Gradient Effect */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-primary/20 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-blue-600/10 blur-[120px] pointer-events-none" />
      
      <div className="z-10 flex flex-col h-full w-full">
        <TitleBar />
        <div className="flex flex-1 min-h-0">
          <Sidebar />
          <main className="flex-1 overflow-y-auto relative">
            <div className="p-8 pb-8 flex justify-center">
              <div className="w-full max-w-6xl">
                <Outlet />
              </div>
            </div>
          </main>
        </div>
      </div>

      {autoCleanupResult && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-[#13141C] border border-white/10 rounded-2xl p-6 shadow-2xl max-w-sm w-full mx-4 space-y-4 animate-in zoom-in-95 duration-300">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-green-400">
                <CheckCircle2 className="w-6 h-6" />
                <h3 className="text-lg font-semibold text-foreground">Auto-Cleanup Complete</h3>
              </div>
              <button onClick={() => setAutoCleanupResult(null)} className="text-muted-foreground hover:text-foreground">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <p className="text-sm text-muted-foreground leading-relaxed">
              Your scheduled daily cleanup ran successfully in the background. We freed up <span className="font-semibold text-white">{autoCleanupResult.cleanedStr}</span> of space.
            </p>

            <div className="pt-2">
              <Button onClick={() => setAutoCleanupResult(null)} className="w-full">
                Awesome, thanks!
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
