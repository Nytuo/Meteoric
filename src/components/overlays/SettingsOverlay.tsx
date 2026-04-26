import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { invoke } from '@tauri-apps/api/core';
import { open } from '@tauri-apps/plugin-dialog';
import {
  Palette,
  Video,
  Key,
  FileText,
  ShoppingBag,
  Server,
  FileOutput,
  Archive,
  Info,
  FolderOpen,
  Upload,
  Sun,
  Moon,
  Cloud,
  Eye,
  EyeOff,
  Loader2,
  CheckCircle2,
  XCircle,
  RefreshCw,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useSettingsStore } from '@/stores/settingsStore';
import { useAppStore } from '@/stores/appStore';
import { db } from '@/lib/db';
import { CsvImporter } from '@/components/plugins/CsvImporter';
import { SteamImporter } from '@/components/plugins/SteamImporter';
import { EpicImporter } from '@/components/plugins/EpicImporter';
import { GogImporter } from '@/components/plugins/GogImporter';
import logoSvg from '@/assets/logo.svg';

const languages = [
  { label: 'English', value: 'en' },
  { label: 'Deutsch', value: 'de' },
  { label: 'Français', value: 'fr' },
  { label: 'Italiano', value: 'it' },
  { label: 'Español', value: 'es' },
  { label: 'Dev', value: 'dev' },
];

const ACCENTS = [
  { value: 'default', label: 'Default', color: '#a1a1aa' },
  { value: 'blue', label: 'Blue', color: '#3b82f6' },
  { value: 'purple', label: 'Purple', color: '#a855f7' },
  { value: 'green', label: 'Green', color: '#22c55e' },
  { value: 'teal', label: 'Teal', color: '#14b8a6' },
  { value: 'orange', label: 'Orange', color: '#f97316' },
  { value: 'red', label: 'Red', color: '#ef4444' },
];

interface SettingsOverlayProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SettingsOverlay({
  open: isOpen,
  onOpenChange,
}: SettingsOverlayProps) {
  const { t, i18n } = useTranslation();
  const {
    settings,
    apiKeys,
    fetchApiKeys,
    setApiKey,
    saveApiKeys,
    changeLanguage,
    changeTheme,
    changeAccent,
  } = useSettingsStore();
  const { getAppVersion } = useAppStore();

  const [activeItem, setActiveItem] = useState('appearance');
  const [selectedLanguage, setSelectedLanguage] = useState(
    i18n.language || 'en'
  );
  const [appVersion, setAppVersion] = useState('1.0.0');
  const [localApiKeys, setLocalApiKeys] = useState<Record<string, string>>({});

  const [conferoUrl, setConferoUrl] = useState('');
  const [conferoEmail, setConferoEmail] = useState('');
  const [conferoPassword, setConferoPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [conferoStatus, setConferoStatus] = useState<
    'idle' | 'testing' | 'syncing' | 'ok' | 'error'
  >('idle');
  const [conferoMsg, setConferoMsg] = useState('');

  const currentTheme = settings.theme || 'dark';
  const currentAccent = settings.accent || 'default';

  useEffect(() => {
    if (isOpen) {
      fetchApiKeys();
      getAppVersion().then(setAppVersion);
    }
  }, [isOpen]);

  useEffect(() => {
    if (apiKeys) {
      setLocalApiKeys({ ...apiKeys });
      setConferoEmail(apiKeys['CONFERO_EMAIL'] ?? '');
      setConferoPassword(apiKeys['CONFERO_PASSWORD'] ?? '');
    }
  }, [apiKeys]);

  const handleLanguageChange = (value: string) => {
    setSelectedLanguage(value);
    changeLanguage(value);
  };

  const handleApiKeyChange = (key: string, value: string) => {
    setLocalApiKeys((prev) => ({ ...prev, [key]: value }));
    setApiKey(key, value);
    saveApiKeys();
  };

  const saveConferoField = (key: string, value: string) => {
    setApiKey(key, value);
    saveApiKeys();
  };

  const handleConferoEmailChange = (v: string) => {
    setConferoEmail(v);
    saveConferoField('CONFERO_EMAIL', v);
  };
  const handleConferoPasswordChange = (v: string) => {
    setConferoPassword(v);
    saveConferoField('CONFERO_PASSWORD', v);
  };

  const testConferoConnection = async () => {
    setConferoStatus('testing');
    setConferoMsg('');
    try {
      await invoke('confero_test_connection');
      setConferoStatus('ok');
      setConferoMsg('Connected successfully');
    } catch (err) {
      setConferoStatus('error');
      setConferoMsg(String(err));
    }
  };

  const runConferoSync = async () => {
    setConferoStatus('syncing');
    setConferoMsg('');
    try {
      const result = await invoke<string>('confero_full_sync');
      const parsed = JSON.parse(result) as Record<string, number>;
      setConferoStatus('ok');
      setConferoMsg(
        `Pushed ${parsed.pushed_games ?? 0} games, ${parsed.pushed_stats ?? 0} stats, ${parsed.pushed_trophies ?? 0} trophies — pulled ${parsed.pulled_games ?? 0} remote games`
      );
    } catch (err) {
      setConferoStatus('error');
      setConferoMsg(String(err));
    }
  };

  const openProgramFolder = () => invoke('open_program_folder');
  const openDataFolder = () => invoke('open_data_folder');
  const openLaunchVideo = async () => {
    const file = await open({ multiple: false, directory: false });
    if (file) await invoke('save_launch_video', { file });
  };

  const navItems = [
    {
      key: 'appearance',
      icon: <Palette className="h-4 w-4" />,
      label: `${t('themes')} & ${t('languages')}`,
    },
    {
      key: 'media',
      icon: <Video className="h-4 w-4" />,
      label: t('intro-video'),
    },
    {
      key: 'apikeys',
      icon: <Key className="h-4 w-4" />,
      label: t('api-settings'),
    },
    {
      key: 'confero',
      icon: <Cloud className="h-4 w-4" />,
      label: 'Confero Sync',
    },
    'divider',
    { key: 'divider-label', label: t('game-importers'), type: 'label' },
    {
      key: 'import-csv',
      icon: <FileText className="h-4 w-4" />,
      label: t('csv-importer'),
      sub: true,
    },
    {
      key: 'import-epic',
      icon: <ShoppingBag className="h-4 w-4" />,
      label: 'Epic Games',
      sub: true,
    },
    {
      key: 'import-steam',
      icon: <Server className="h-4 w-4" />,
      label: 'Steam',
      sub: true,
    },
    {
      key: 'import-gog',
      icon: <Server className="h-4 w-4" />,
      label: 'GOG',
      sub: true,
    },
    'divider',
    { key: 'divider-label2', label: t('database-exporters'), type: 'label' },
    {
      key: 'export-csv',
      icon: <FileOutput className="h-4 w-4" />,
      label: t('csv-exporter'),
      sub: true,
    },
    {
      key: 'export-archive',
      icon: <Archive className="h-4 w-4" />,
      label: t('archive-exporter'),
      sub: true,
    },
    'divider',
    { key: 'about', icon: <Info className="h-4 w-4" />, label: t('about') },
  ] as Array<
    | string
    | {
        key: string;
        icon?: React.ReactNode;
        label: string;
        type?: string;
        sub?: boolean;
      }
  >;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl h-[85vh] p-0 gap-0 overflow-hidden">
        <div className="flex h-full overflow-hidden">
          <div className="flex w-56 shrink-0 flex-col border-r border-border bg-card/50">
            <DialogHeader className="shrink-0 p-4 pb-3">
              <DialogTitle className="text-base">
                {t('settings') || 'Settings'}
              </DialogTitle>
            </DialogHeader>
            <ScrollArea className="min-h-0 flex-1 px-2 pb-2">
              <nav className="space-y-0.5">
                {navItems.map((item, i) => {
                  if (item === 'divider')
                    return <Separator key={`d-${i}`} className="my-2" />;
                  if (typeof item === 'object' && item.type === 'label') {
                    return (
                      <p
                        key={item.key}
                        className="px-3 py-1 text-xs text-muted-foreground font-medium"
                      >
                        {item.label}
                      </p>
                    );
                  }
                  if (typeof item === 'object' && 'key' in item) {
                    return (
                      <button
                        key={item.key}
                        onClick={() => setActiveItem(item.key)}
                        className={`flex w-full items-center gap-2 rounded-md px-3 py-2 text-xs transition-colors hover:bg-accent ${
                          activeItem === item.key
                            ? 'bg-accent text-accent-foreground'
                            : ''
                        } ${item.sub ? 'pl-6' : ''}`}
                      >
                        {item.icon}
                        <span>{item.label}</span>
                      </button>
                    );
                  }
                  return null;
                })}
              </nav>
            </ScrollArea>
          </div>

          <ScrollArea className="min-h-0 flex-1">
            <div className="p-6">
              {activeItem === 'appearance' && (
                <div>
                  <h2 className="mb-4 flex items-center gap-2 text-xl font-semibold">
                    <Palette className="h-5 w-5" /> {t('themes')} &amp;{' '}
                    {t('languages')}
                  </h2>

                  <div className="mb-6">
                    <Label className="mb-1 block">
                      {t('colorMode') || 'Color Mode'}
                    </Label>
                    <p className="mb-3 text-xs text-muted-foreground">
                      {t('choose-a-theme') ||
                        'Choose between dark and light mode.'}
                    </p>
                    <div className="flex gap-3">
                      <button
                        onClick={() => changeTheme('dark')}
                        className={`flex items-center gap-2 rounded-lg border px-4 py-3 text-sm transition-colors hover:bg-accent ${
                          currentTheme === 'dark'
                            ? 'border-primary bg-accent'
                            : 'border-border'
                        }`}
                      >
                        <Moon className="h-4 w-4" /> {t('dark') || 'Dark'}
                      </button>
                      <button
                        onClick={() => changeTheme('light')}
                        className={`flex items-center gap-2 rounded-lg border px-4 py-3 text-sm transition-colors hover:bg-accent ${
                          currentTheme === 'light'
                            ? 'border-primary bg-accent'
                            : 'border-border'
                        }`}
                      >
                        <Sun className="h-4 w-4" /> {t('light') || 'Light'}
                      </button>
                    </div>
                  </div>

                  <div className="mb-6">
                    <Label className="mb-1 block">
                      {t('accentColor') || 'Accent Color'}
                    </Label>
                    <p className="mb-3 text-xs text-muted-foreground">
                      {t('choose-an-accent') ||
                        'Choose an accent color for interactive elements.'}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {ACCENTS.map((a) => (
                        <button
                          key={a.value}
                          title={a.label}
                          onClick={() => changeAccent(a.value)}
                          className={`h-9 w-9 rounded-full border-2 transition-all hover:scale-110 ${
                            currentAccent === a.value
                              ? 'border-foreground scale-110'
                              : 'border-transparent'
                          }`}
                          style={{ backgroundColor: a.color }}
                        />
                      ))}
                    </div>
                  </div>

                  <div>
                    <Label className="mb-1 block">{t('languages')}</Label>
                    <p className="mb-2 text-xs text-muted-foreground">
                      {t('choose-a-language')}
                    </p>
                    <Select
                      value={selectedLanguage}
                      onValueChange={handleLanguageChange}
                    >
                      <SelectTrigger className="max-w-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {languages.map((l) => (
                          <SelectItem key={l.value} value={l.value}>
                            {l.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}

              {activeItem === 'media' && (
                <div>
                  <h2 className="mb-4 flex items-center gap-2 text-xl font-semibold">
                    <Video className="h-5 w-5" /> {t('intro-video')}
                  </h2>
                  <p className="mb-4 text-sm text-muted-foreground">
                    {t('settings.intro-video')}
                  </p>
                  <Button onClick={openLaunchVideo}>
                    <Upload className="mr-2 h-4 w-4" /> {t('upload-a-video')}
                  </Button>
                </div>
              )}

              {activeItem === 'apikeys' && (
                <div>
                  <h2 className="mb-4 flex items-center gap-2 text-xl font-semibold">
                    <Key className="h-5 w-5" /> {t('api-keys')}
                  </h2>
                  <p className="mb-4 text-sm text-muted-foreground">
                    {t('settings.api-keys')}
                  </p>
                  <div className="space-y-4">
                    {Object.entries(localApiKeys).map(([key, value]) => (
                      <div key={key}>
                        <Label htmlFor={`api-${key}`}>{key}</Label>
                        <Input
                          id={`api-${key}`}
                          value={value}
                          onChange={(e) =>
                            handleApiKeyChange(key, e.target.value)
                          }
                          className="mt-1 max-w-md"
                          type="password"
                        />
                      </div>
                    ))}
                    {Object.keys(localApiKeys).length === 0 && (
                      <p className="text-sm text-muted-foreground">
                        No API keys configured.
                      </p>
                    )}
                  </div>
                </div>
              )}

              {activeItem === 'confero' && (
                <div>
                  <h2 className="mb-1 flex items-center gap-2 text-xl font-semibold">
                    <Cloud className="h-5 w-5" /> Confero Sync
                  </h2>
                  <p className="mb-5 text-sm text-muted-foreground">
                    Connect to your Confero account to sync your game library,
                    stats and achievements across devices. This is optional —
                    leave blank to skip.
                  </p>

                  <div className="max-w-md space-y-4">
                    <div>
                      <Label htmlFor="confero-email">Email</Label>
                      <Input
                        id="confero-email"
                        type="email"
                        placeholder="you@example.com"
                        value={conferoEmail}
                        onChange={(e) =>
                          handleConferoEmailChange(e.target.value)
                        }
                        className="mt-1"
                      />
                    </div>

                    <div>
                      <Label htmlFor="confero-password">Password</Label>
                      <div className="relative mt-1">
                        <Input
                          id="confero-password"
                          type={showPassword ? 'text' : 'password'}
                          placeholder="••••••••"
                          value={conferoPassword}
                          onChange={(e) =>
                            handleConferoPasswordChange(e.target.value)
                          }
                          className="pr-10"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword((p) => !p)}
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                          tabIndex={-1}
                        >
                          {showPassword ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                    </div>

                    <div className="flex gap-2 pt-1">
                      <Button
                        variant="outline"
                        onClick={testConferoConnection}
                        disabled={
                          !conferoUrl ||
                          !conferoEmail ||
                          !conferoPassword ||
                          conferoStatus === 'testing' ||
                          conferoStatus === 'syncing'
                        }
                      >
                        {conferoStatus === 'testing' ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <Cloud className="mr-2 h-4 w-4" />
                        )}
                        Test Connection
                      </Button>
                      <Button
                        onClick={runConferoSync}
                        disabled={
                          !conferoUrl ||
                          !conferoEmail ||
                          !conferoPassword ||
                          conferoStatus === 'testing' ||
                          conferoStatus === 'syncing'
                        }
                      >
                        {conferoStatus === 'syncing' ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <RefreshCw className="mr-2 h-4 w-4" />
                        )}
                        Sync Now
                      </Button>
                    </div>

                    {conferoStatus === 'ok' && (
                      <div className="flex items-center gap-2 text-sm text-green-500">
                        <CheckCircle2 className="h-4 w-4" />
                        {conferoMsg}
                      </div>
                    )}
                    {conferoStatus === 'error' && (
                      <div className="flex items-start gap-2 text-sm text-destructive">
                        <XCircle className="mt-0.5 h-4 w-4 shrink-0" />
                        {conferoMsg}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {activeItem === 'import-csv' && <CsvImporter />}
              {activeItem === 'import-steam' && <SteamImporter />}
              {activeItem === 'import-epic' && <EpicImporter />}
              {activeItem === 'import-gog' && <GogImporter />}

              {activeItem === 'export-csv' && (
                <div>
                  <h2 className="mb-4 flex items-center gap-2 text-xl font-semibold">
                    <FileOutput className="h-5 w-5" /> {t('csv-exporter')}
                  </h2>
                  <p className="mb-4 text-sm text-muted-foreground">
                    {t('exportGamesToCSV') ||
                      'Export your entire game library to a CSV file.'}
                  </p>
                  <Button onClick={() => db.exportToCSV()}>
                    <FileOutput className="mr-2 h-4 w-4" />{' '}
                    {t('export') || 'Export'}
                  </Button>
                </div>
              )}
              {activeItem === 'export-archive' && (
                <div>
                  <h2 className="mb-4 flex items-center gap-2 text-xl font-semibold">
                    <Archive className="h-5 w-5" /> {t('archive-exporter')}
                  </h2>
                  <p className="mb-4 text-sm text-muted-foreground">
                    {t('exportGamesToArchive') ||
                      'Export your entire game library (including media) to a ZIP archive.'}
                  </p>
                  <Button onClick={() => db.exportToArchive()}>
                    <Archive className="mr-2 h-4 w-4" />{' '}
                    {t('export') || 'Export'}
                  </Button>
                </div>
              )}

              {activeItem === 'about' && (
                <div className="flex flex-col items-center text-center">
                  <img
                    src={logoSvg}
                    alt="Meteoric"
                    className="mb-4 h-40 w-40"
                  />
                  <h2 className="text-2xl font-bold">Meteoric</h2>
                  <p className="mt-1 rounded-full bg-primary/10 px-4 py-1 text-sm text-primary">
                    v{appVersion}
                  </p>
                  <div className="mt-6 flex gap-4">
                    <a
                      href="https://github.com/Nytuo/Meteoric"
                      target="_blank"
                      rel="noreferrer"
                      className="text-sm text-muted-foreground hover:text-foreground"
                    >
                      GitHub
                    </a>
                    <a
                      href="https://github.com/Nytuo/Meteoric/wiki"
                      target="_blank"
                      rel="noreferrer"
                      className="text-sm text-muted-foreground hover:text-foreground"
                    >
                      {t('documentation')}
                    </a>
                    <a
                      href="https://github.com/Nytuo/Meteoric/issues"
                      target="_blank"
                      rel="noreferrer"
                      className="text-sm text-muted-foreground hover:text-foreground"
                    >
                      {t('reportIssue')}
                    </a>
                  </div>
                  <div className="mt-6 flex gap-3">
                    <Button variant="outline" onClick={openProgramFolder}>
                      <FolderOpen className="mr-2 h-4 w-4" />{' '}
                      {t('open-program-folder')}
                    </Button>
                    <Button variant="outline" onClick={openDataFolder}>
                      <FolderOpen className="mr-2 h-4 w-4" />{' '}
                      {t('open-data-folder')}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  );
}
