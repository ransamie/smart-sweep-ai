import React from 'react';
import { Button } from '@/components/ui/button';
import { Loader2, Trash2 } from 'lucide-react';

export function SelectionFooter({ selectedCount, totalSize, onClean, isCleaning = false }: { selectedCount: number; totalSize: string; onClean: () => void; isCleaning?: boolean; }) {
  if (selectedCount === 0) return null;

  return (
    <div className="fixed bottom-0 left-64 right-0 p-4 bg-card/80 backdrop-blur border-t shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.3)] z-50 animate-in slide-in-from-bottom-10">
      <div className="flex items-center justify-between max-w-5xl mx-auto">
        <div className="space-y-0.5">
          <p className="font-medium text-foreground">Selected: {selectedCount} categories</p>
          <p className="text-sm text-muted-foreground">You are about to free up {totalSize} of disk space.</p>
        </div>
        <Button variant="destructive" onClick={onClean} disabled={isCleaning} className="gap-2 shadow-lg shadow-red-500/20">
          {isCleaning ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
          {isCleaning ? 'Cleaning...' : 'Clean Recommended'}
        </Button>
      </div>
    </div>
  );
}
