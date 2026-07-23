import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, HardDrive, Trash2, Settings, Shield, Zap, Loader2, History } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAppContext } from '@/context/AppContext';

export function Sidebar() {
  const { 
    diskSpace, 
    selectedDrive, 
    availableDrives,
    spaceAnalyzerScanning,
    systemCleanerState,
    privacyScanning,
    smartScanning
  } = useAppContext();
  const selectedDriveObj = availableDrives?.find(d => d.root === selectedDrive);
  const driveLabel = selectedDriveObj ? selectedDriveObj.label : 'C: Drive';

  const navItems = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard, isScanning: smartScanning },
    { name: 'Space Analyzer', path: '/scan', icon: HardDrive, isScanning: spaceAnalyzerScanning },
    { name: 'System Cleaner', path: '/system-cleaner', icon: Trash2, isScanning: systemCleanerState === 'scanning' },
    { name: 'Privacy Shield', path: '/privacy', icon: Shield, isScanning: privacyScanning },
    { name: 'Startup Optimizer', path: '/startup', icon: Zap, isScanning: false },
    { name: 'Activity Logs', path: '/history', icon: History, isScanning: false },
    { name: 'Settings', path: '/settings', icon: Settings, isScanning: false },
  ];

  return (
    <div className="w-64 min-w-[256px] max-w-[256px] shrink-0 border-r border-white/5 bg-black/20 backdrop-blur-xl h-full flex flex-col">
      <div className="p-6">
        <h1 className="text-xl font-bold flex items-center gap-3">
          <img src="./logo.png" alt="SmartSweep Logo" className="w-10 h-10 object-contain shrink-0 drop-shadow-md" />
          <span>SmartSweep AI</span>
        </h1>
      </div>
      
      <nav className="flex-1 px-4 space-y-1">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) => cn(
              "flex items-center gap-3 px-3 py-2.5 rounded-md transition-colors text-sm font-medium relative",
              isActive ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
            )}
          >
            <item.icon className="w-4 h-4" />
            <span className="flex-1">{item.name}</span>
            {item.isScanning && (
              <Loader2 className="w-4 h-4 animate-spin text-primary shrink-0" />
            )}
          </NavLink>
        ))}
      </nav>

      <div className="p-4 border-t bg-background/50">
        <div className="space-y-2">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{driveLabel}</span>
            <span>{diskSpace ? `Used: ${(diskSpace.used / 1073741824).toFixed(1)} GB` : "Loading..."}</span>
          </div>
          <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
            <div 
              className="h-full bg-primary transition-all duration-1000" 
              style={{ width: diskSpace ? `${(diskSpace.used / diskSpace.total) * 100}%` : '0%' }} 
            />
          </div>
        </div>
      </div>
    </div>
  );
}
