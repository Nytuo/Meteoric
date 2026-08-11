import { useState } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { useTranslation } from 'react-i18next';
import { Loader2, Download, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import { useGameStore } from '@/stores/gameStore';
import { useImportProgressStore } from '@/stores/importProgressStore';

export function SteamImporter() {
  const { t } = useTranslation();
  const { fetchGames, enrichMissingMetadataFromIGDB } = useGameStore();
  const [steamId, setSteamId] = useState('');
  const [loading, setLoading] = useState(false);
  const progress = useImportProgressStore((s) => s.progress.steam);
  const clearProgress = useImportProgressStore((s) => s.clear);

  const handleImport = async () => {
    if (!steamId.trim()) return;
    setLoading(true);
    try {
      await invoke('import_library', {
        pluginName: 'steam_importer',
        creds: [steamId.trim()],
      });
      await fetchGames();
      toast.success(t('import') + ' Steam OK');
      await enrichMissingMetadataFromIGDB('steam');
    } catch (e: any) {
      toast.error(String(e));
    } finally {
      setLoading(false);
      clearProgress('steam');
    }
  };

  return (
    <div>
      <h2 className="mb-1 flex items-center gap-2 text-xl font-semibold">
        Steam {t('importer') || 'Library Importer'}
      </h2>
      <p className="mb-3 max-w-2xl text-sm text-muted-foreground">
        {t('steamLibraryImporter')}
      </p>
      <p className="mb-4 flex max-w-2xl items-start gap-2 rounded-lg border border-border/60 bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
        <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-500" />
        {t('steam-importer.safety-note') ||
          "Steam's API only reports playtime and achievements, not descriptions or cover art. Meteoric automatically looks those up on IGDB right after import."}
      </p>
      <div className="max-w-sm space-y-3">
        <div>
          <Label htmlFor="steam-id">Steam ID (Public)</Label>
          <Input
            id="steam-id"
            value={steamId}
            onChange={(e) => setSteamId(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleImport()}
            placeholder="76561198..."
            className="mt-1"
            disabled={loading}
          />
        </div>
        <Button onClick={handleImport} disabled={loading || !steamId.trim()}>
          {loading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Download className="mr-2 h-4 w-4" />
          )}
          {t('import') || 'Import'}
        </Button>

        {loading && (
          <div className="space-y-2 rounded-lg border border-border bg-card/50 p-4">
            <Progress value={progress?.percent ?? 0} className="h-1.5" />
            <p className="truncate text-xs text-muted-foreground">
              {progress
                ? `${progress.current}/${progress.total} · ${progress.label}`
                : t('please-wait') || 'Please wait…'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
