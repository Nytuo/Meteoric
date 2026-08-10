import { useState, useEffect, useRef } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { useTranslation } from 'react-i18next';
import { Upload, Import, Loader2, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import { useGameStore } from '@/stores/gameStore';
import { useImportProgressStore } from '@/stores/importProgressStore';

function parseCSV(text: string): {
  headers: string[];
  rows: Record<string, string>[];
} {
  const lines = text.split(/\r?\n/).filter((l) => l.trim());
  if (lines.length === 0) return { headers: [], rows: [] };
  const sep = lines[0].includes(';') ? ';' : ',';
  const headers = lines[0]
    .split(sep)
    .map((h) => h.trim().replace(/^"|"$/g, ''));
  const rows = lines.slice(1).map((line) => {
    const vals = line.split(sep).map((v) => v.trim().replace(/^"|"$/g, ''));
    const row: Record<string, string> = {};
    headers.forEach((h, i) => {
      row[h] = vals[i] ?? '';
    });
    return row;
  });
  return { headers, rows };
}

export function CsvImporter() {
  const { t } = useTranslation();
  const { fetchGames } = useGameStore();
  const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
  const [csvRows, setCsvRows] = useState<Record<string, string>[]>([]);
  const [dbColumns, setDbColumns] = useState<string[]>([]);
  const [mapping, setMapping] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const progress = useImportProgressStore((s) => s.progress.csv);
  const clearProgress = useImportProgressStore((s) => s.clear);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    invoke<string>('get_all_fields_from_db')
      .then((res) => {
        try {
          const parsed = JSON.parse(res);
          setDbColumns(Array.isArray(parsed[0]) ? parsed[0] : parsed);
        } catch {
          setDbColumns([]);
        }
      })
      .catch(() => setDbColumns([]));
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      const { headers, rows } = parseCSV(text);
      setCsvHeaders(headers);
      setCsvRows(rows);
      const autoMap: Record<string, string> = {};
      headers.forEach((h) => {
        const match = dbColumns.find(
          (c) => c.toLowerCase() === h.toLowerCase()
        );
        if (match) autoMap[h] = match;
      });
      setMapping(autoMap);
    };
    reader.readAsText(file, 'utf-8');
  };

  const handleImport = async () => {
    setLoading(true);
    try {
      const mappedData = csvRows.map((row) => {
        const out: Record<string, string> = {};
        for (const [csvCol, dbCol] of Object.entries(mapping)) {
          if (dbCol) out[dbCol] = row[csvCol] ?? '';
        }
        return out;
      });
      await invoke('upload_csv_to_db', { data: mappedData });
      await fetchGames();
      toast.success(
        t('dataImportedSuccessfully') || 'Data imported successfully'
      );
    } catch (e: any) {
      toast.error(String(e));
    } finally {
      setLoading(false);
      clearProgress('csv');
    }
  };

  return (
    <div>
      <h2 className="mb-1 flex items-center gap-2 text-xl font-semibold">
        {t('csvToDatabaseImporter') || 'CSV to Database Importer'}
      </h2>
      <p className="mb-3 max-w-2xl text-sm text-muted-foreground">
        {t('csv-importer') ||
          'Import games from a CSV file and map columns to database fields.'}
      </p>
      <p className="mb-4 flex max-w-2xl items-start gap-2 rounded-lg border border-border/60 bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
        <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-500" />
        {t('csv-importer-safety-note') ||
          'Only the columns you map below are imported - cover art and other media are not included and can be added afterward from each game’s edit page.'}
      </p>

      <div className="mb-4">
        <input
          ref={fileRef}
          type="file"
          accept=".csv"
          className="hidden"
          onChange={handleFileChange}
        />
        <Button variant="outline" onClick={() => fileRef.current?.click()}>
          <Upload className="mr-2 h-4 w-4" />
          {t('browse') || 'Browse CSV file'}
        </Button>
      </div>

      {csvHeaders.length > 0 && (
        <>
          <h3 className="mb-2 font-medium">{t('bindCSV') || 'Map columns'}</h3>
          <div className="mb-4 max-h-60 space-y-2 overflow-y-auto pr-1">
            {csvHeaders.map((header) => (
              <div key={header} className="flex items-center gap-3">
                <Label className="w-40 shrink-0 truncate text-sm">
                  {header}
                </Label>
                <Select
                  value={mapping[header] || '__none__'}
                  onValueChange={(val) =>
                    setMapping((prev) => ({
                      ...prev,
                      [header]: val === '__none__' ? '' : val,
                    }))
                  }
                >
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="— skip —" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">
                      — {t('skip') || 'skip'} —
                    </SelectItem>
                    {dbColumns.map((col) => (
                      <SelectItem key={col} value={col}>
                        {col}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ))}
          </div>

          <Button onClick={handleImport} disabled={loading} className="mb-3">
            {loading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Import className="mr-2 h-4 w-4" />
            )}
            {t('importToDatabase') || 'Import to Database'}
          </Button>

          {loading && (
            <div className="mb-6 space-y-2 rounded-lg border border-border bg-card/50 p-4">
              <Progress value={progress?.percent ?? 0} className="h-1.5" />
              <p className="truncate text-xs text-muted-foreground">
                {progress
                  ? `${progress.current}/${progress.total} · ${progress.label}`
                  : t('please-wait') || 'Please wait…'}
              </p>
            </div>
          )}

          <h3 className="mb-2 font-medium">
            {t('preview') || 'Preview'} ({csvRows.length} rows)
          </h3>
          <ScrollArea className="h-48 w-full rounded-md border">
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b bg-muted/50">
                    {csvHeaders.map((h) => (
                      <th key={h} className="px-3 py-2 text-left font-medium">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {csvRows.slice(0, 20).map((row, i) => (
                    <tr
                      key={i}
                      className="border-b last:border-0 hover:bg-muted/30"
                    >
                      {csvHeaders.map((h) => (
                        <td key={h} className="px-3 py-1.5">
                          {row[h]}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </ScrollArea>
        </>
      )}
    </div>
  );
}
