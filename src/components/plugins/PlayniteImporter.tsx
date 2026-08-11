import { useEffect, useState } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { open } from '@tauri-apps/plugin-dialog';
import { basename } from '@tauri-apps/api/path';
import { useTranslation } from 'react-i18next';
import {
  FolderArchive,
  FolderOpen,
  Loader2,
  Download,
  CheckCircle2,
  AlertTriangle,
  ShieldCheck,
  Wand2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { useGameStore } from '@/stores/gameStore';
import { usePlayniteStore } from '@/stores/playniteStore';
import { useIgdbLookupStore } from '@/stores/igdbLookupStore';
import { GAME_STATUSES, GAME_STATUS_I18N_KEYS } from '@/types';

const UNMAPPED = '__unmapped__';

interface CompletionStatusEntry {
  name: string;
  suggested: string;
}

export function PlayniteImporter() {
  const { t } = useTranslation();
  const { fetchGames } = useGameStore();
  const {
    importing,
    progress,
    summary,
    warnings,
    igdbStatus,
    setImporting,
    reset,
  } = usePlayniteStore();
  const { progress: igdbProgress, setProgress: setIgdbProgress } =
    useIgdbLookupStore();

  const [selectedPath, setSelectedPath] = useState('');
  const [selectedLabel, setSelectedLabel] = useState('');
  const [showWarnings, setShowWarnings] = useState(false);
  const [statusEntries, setStatusEntries] = useState<CompletionStatusEntry[]>(
    []
  );
  const [statusMap, setStatusMap] = useState<Record<string, string>>({});
  const [loadingStatuses, setLoadingStatuses] = useState(false);

  useEffect(() => {
    return () => {
      if (!importing) reset();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!selectedPath) {
      setStatusEntries([]);
      setStatusMap({});
      return;
    }
    setLoadingStatuses(true);
    invoke<string>('playnite_list_completion_statuses', {
      exportPath: selectedPath,
    })
      .then((raw) => {
        const entries = JSON.parse(raw) as CompletionStatusEntry[];
        setStatusEntries(entries);
        const initial: Record<string, string> = {};
        entries.forEach((e) => {
          initial[e.name] = e.suggested;
        });
        setStatusMap(initial);
      })
      .catch(() => {
        setStatusEntries([]);
        setStatusMap({});
      })
      .finally(() => setLoadingStatuses(false));
  }, [selectedPath]);

  const pickZip = async () => {
    const file = await open({
      multiple: false,
      directory: false,
      filters: [{ name: 'Playnite Backup', extensions: ['zip'] }],
    });
    if (!file) return;
    setSelectedPath(file.toString());
    setSelectedLabel(await basename(file.toString()));
    reset();
  };

  const pickFolder = async () => {
    const dir = await open({ multiple: false, directory: true });
    if (!dir) return;
    setSelectedPath(dir.toString());
    setSelectedLabel(await basename(dir.toString()));
    reset();
  };

  const startImport = async () => {
    if (!selectedPath) return;
    reset();
    setIgdbProgress(null);
    setImporting(true);
    try {
      await invoke('import_library', {
        pluginName: 'playnite_importer',
        creds: [selectedPath, JSON.stringify(statusMap)],
      });
      await fetchGames();
    } catch (e: any) {
      setImporting(false);
      toast.error(String(e));
    }
  };

  return (
    <div>
      <h2 className="mb-1 flex items-center gap-2 text-xl font-semibold">
        <FolderArchive className="h-5 w-5" />
        {t('playnite-importer') || 'Playnite Importer'}
      </h2>
      <p className="mb-3 max-w-2xl text-sm text-muted-foreground">
        {t('playnite-importer.description')}
      </p>
      <p className="mb-4 flex items-start gap-2 rounded-lg border border-border/60 bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
        <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-500" />
        {t('playnite-importer.safety-note')}
      </p>

      <div className="mb-4 flex max-w-xl flex-wrap gap-3">
        <Button variant="outline" onClick={pickZip} disabled={importing}>
          <FolderArchive className="mr-2 h-4 w-4" />
          {t('playnite-importer.browse-zip') || 'Select backup .zip'}
        </Button>
        <Button variant="outline" onClick={pickFolder} disabled={importing}>
          <FolderOpen className="mr-2 h-4 w-4" />
          {t('playnite-importer.browse-folder') || 'Select extracted folder'}
        </Button>
      </div>

      {selectedPath ? (
        <p className="mb-4 truncate text-xs text-muted-foreground">
          {t('playnite-importer.selected') || 'Selected'}:{' '}
          <span className="font-medium text-foreground">{selectedLabel}</span>
        </p>
      ) : (
        <p className="mb-4 text-xs text-muted-foreground">
          {t('playnite-importer.no-selection') ||
            'Choose a Playnite backup zip or extracted folder to begin.'}
        </p>
      )}

      {loadingStatuses && (
        <p className="mb-4 flex items-center gap-2 text-xs text-muted-foreground">
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
          {t('playnite-importer.reading-statuses') ||
            'Reading completion statuses...'}
        </p>
      )}

      {!loadingStatuses && !importing && statusEntries.length > 0 && (
        <div className="mb-6 max-w-xl space-y-3 rounded-lg border border-border bg-card/50 p-4">
          <p className="flex items-center gap-2 text-sm font-medium">
            <Wand2 className="h-4 w-4" />
            {t('playnite-importer.map-statuses') || 'Map Playnite statuses'}
          </p>
          <p className="text-xs text-muted-foreground">
            {t('playnite-importer.map-statuses-desc') ||
              "Playnite's completion statuses (including any custom ones you defined) don't map onto Meteoric's list automatically - review the guesses below before importing."}
          </p>
          <div className="space-y-2">
            {statusEntries.map((entry) => (
              <div
                key={entry.name}
                className="flex items-center justify-between gap-3"
              >
                <span
                  className="truncate text-sm"
                  title={entry.name}
                >
                  {entry.name}
                </span>
                <Select
                  value={statusMap[entry.name] || UNMAPPED}
                  onValueChange={(v) =>
                    setStatusMap((m) => ({
                      ...m,
                      [entry.name]: v === UNMAPPED ? '' : v,
                    }))
                  }
                >
                  <SelectTrigger className="h-8 w-48 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={UNMAPPED}>
                      {t('playnite-importer.dont-set') || "Don't set"}
                    </SelectItem>
                    {GAME_STATUSES.map((s) => (
                      <SelectItem key={s} value={s}>
                        {t(GAME_STATUS_I18N_KEYS[s]) || s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ))}
          </div>
        </div>
      )}

      <Button
        onClick={startImport}
        disabled={importing || !selectedPath}
        className="mb-6"
      >
        {importing ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <Download className="mr-2 h-4 w-4" />
        )}
        {t('playnite-importer.start') || 'Start Import'}
      </Button>

      {importing && (
        <div className="mb-6 max-w-xl space-y-2 rounded-lg border border-border bg-card/50 p-4">
          <p className="text-sm text-muted-foreground">
            {t('playnite-importer.importing') ||
              'Importing your Playnite library...'}
          </p>
          <Progress value={progress?.percent ?? 0} className="h-1.5" />
          <p className="truncate text-xs text-muted-foreground">
            {progress
              ? `${progress.current}/${progress.total} · ${progress.label}`
              : ''}
          </p>
        </div>
      )}

      {summary && !importing && (
        <div className="mb-6 max-w-xl space-y-3 rounded-lg border border-border bg-card/50 p-4">
          <p className="flex items-center gap-2 text-sm font-medium">
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
            {t('playnite-importer.done') || 'Import finished'}
          </p>
          <div className="grid grid-cols-3 gap-3 text-center">
            <div>
              <p className="text-lg font-semibold">{summary.imported}</p>
              <p className="text-[11px] text-muted-foreground">
                {t('playnite-importer.imported') || 'Imported'}
              </p>
            </div>
            <div>
              <p className="text-lg font-semibold">{summary.alreadyPresent}</p>
              <p className="text-[11px] text-muted-foreground">
                {t('playnite-importer.already-present') || 'Already in Meteoric'}
              </p>
            </div>
            <div>
              <p className="text-lg font-semibold">{summary.needsRelink}</p>
              <p className="text-[11px] text-muted-foreground">
                {t('playnite-importer.needs-relink') || 'Needs a manual relink'}
              </p>
            </div>
          </div>

          {igdbStatus && (
            <div className="space-y-1.5">
              <p className="flex items-center gap-2 text-xs text-muted-foreground">
                <Loader2
                  className={`h-3.5 w-3.5 ${
                    igdbStatus.startsWith('Matched') ? 'hidden' : 'animate-spin'
                  }`}
                />
                {igdbStatus}
              </p>
              {!igdbStatus.startsWith('Matched') &&
                igdbProgress &&
                igdbProgress.total > 0 && (
                  <>
                    <Progress
                      value={(igdbProgress.current / igdbProgress.total) * 100}
                      className="h-1.5"
                    />
                    <p className="text-[11px] text-muted-foreground">
                      {igdbProgress.current}/{igdbProgress.total}
                    </p>
                  </>
                )}
            </div>
          )}

          {warnings.length > 0 && (
            <div>
              <button
                onClick={() => setShowWarnings((v) => !v)}
                className="flex items-center gap-1 text-xs text-amber-600 hover:underline dark:text-amber-400"
              >
                <AlertTriangle className="h-3.5 w-3.5" />
                {warnings.length} {t('playnite-importer.warnings') || 'Warnings'}
              </button>
              {showWarnings && (
                <ul className="mt-2 max-h-40 space-y-1 overflow-y-auto text-xs text-muted-foreground">
                  {warnings.map((w, i) => (
                    <li key={i} className="truncate">
                      {w}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
