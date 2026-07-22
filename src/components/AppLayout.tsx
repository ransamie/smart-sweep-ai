import React, { useEffect } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { TitleBar } from './TitleBar';

export function AppLayout() {
  const navigate = useNavigate();

  useEffect(() => {
    // @ts-ignore
    if (window.electronAPI?.onNavigate) {
      // @ts-ignore
      window.electronAPI.onNavigate((route: string) => {
        navigate(route);
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
    </div>
  );
}
