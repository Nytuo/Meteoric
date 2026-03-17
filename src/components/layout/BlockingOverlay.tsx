import { useAppStore } from '@/stores/appStore';
import { Loader2 } from 'lucide-react';

export function BlockingOverlay() {
  const { blockUI } = useAppStore();

  if (!blockUI) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Loading...</p>
      </div>
    </div>
  );
}
