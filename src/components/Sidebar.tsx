import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  HardDrive, 
  Trash2, 
  Settings, 
  Shield, 
  Zap, 
  Loader2, 
  History,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAppContext } from '@/context/AppContext';
import packageJson from '../../package.json';

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

  const [collapsed, setCollapsed] = useState<boolean>(() => {
    return localStorage.getItem('smartsweep_sidebar_collapsed') === 'true';
  });

  const toggleCollapsed = () => {
    setCollapsed(prev => {
      const next = !prev;
      localStorage.setItem('smartsweep_sidebar_collapsed', String(next));
      return next;
    });
  };

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

  const usedPercentage = diskSpace ? Math.round((diskSpace.used / diskSpace.total) * 100) : 0;
  const usedGbStr = diskSpace ? (diskSpace.used / 1073741824).toFixed(1) : '0';

  return (
    <div 
      className={cn(
        "h-full flex flex-col border-r border-white/5 bg-black/20 backdrop-blur-xl transition-all duration-300 relative select-none shrink-0",
        collapsed ? "w-16 min-w-[64px] max-w-[64px]" : "w-64 min-w-[256px] max-w-[256px]"
      )}
    >
      {/* Header with App Logo & Collapse Toggle */}
      <div className={cn("p-4 flex items-center justify-between", collapsed ? "justify-center" : "px-5 py-5")}>
        <div className="flex items-center gap-3 min-w-0 overflow-hidden">
          <img src="./logo.png" alt="SmartSweep Logo" className="w-8 h-8 object-contain shrink-0 drop-shadow-md" />
          {!collapsed && (
            <div className="flex flex-col min-w-0">
              <span className="font-bold text-sm leading-tight truncate">SmartSweep AI</span>
              <span className="text-[10px] text-muted-foreground font-normal leading-none mt-0.5">v{packageJson.version}</span>
            </div>
          )}
        </div>

        <button
          onClick={toggleCollapsed}
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          className={cn(
            "p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-white/10 transition-colors shrink-0",
            collapsed && "mt-1"
          )}
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>
      
      {/* Navigation Items */}
      <nav className="flex-1 px-3 space-y-1.5 mt-2">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            title={collapsed ? item.name : undefined}
            className={({ isActive }) => cn(
              "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all text-sm font-medium relative group",
              collapsed ? "justify-center px-0" : "",
              isActive ? "bg-primary/15 text-primary border border-primary/20 shadow-sm" : "text-muted-foreground hover:bg-white/5 hover:text-foreground"
            )}
          >
            <item.icon className="w-4 h-4 shrink-0" />
            
            {!collapsed && (
              <span className="flex-1 truncate">{item.name}</span>
            )}

            {item.isScanning && (
              <Loader2 className={cn("w-4 h-4 animate-spin text-primary shrink-0", collapsed && "absolute right-1 top-1 w-2 h-2")} />
            )}
          </NavLink>
        ))}
      </nav>

      {/* Drive Capacity Meter Footer */}
      <div className={cn("p-4 border-t border-white/5 bg-background/30", collapsed && "p-2.5 flex flex-col items-center justify-center")}>
        {!collapsed ? (
          <div className="space-y-2">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span className="truncate">{driveLabel}</span>
              <span className="font-medium text-foreground">{diskSpace ? `Used: ${usedGbStr} GB` : "Loading..."}</span>
            </div>
            <div className="h-2 w-full bg-muted/60 rounded-full overflow-hidden">
              <div 
                className="h-full bg-primary transition-all duration-1000" 
                style={{ width: diskSpace ? `${usedPercentage}%` : '0%' }} 
              />
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-1 py-1" title={`${driveLabel} - Used: ${usedGbStr} GB (${usedPercentage}%)`}>
            <div className="w-8 h-1.5 bg-muted/60 rounded-full overflow-hidden">
              <div 
                className="h-full bg-primary transition-all duration-1000" 
                style={{ width: diskSpace ? `${usedPercentage}%` : '0%' }} 
              />
            </div>
            <span className="text-[9px] font-bold text-muted-foreground">{usedPercentage}%</span>
          </div>
        )}
      </div>
    </div>
  );
}
