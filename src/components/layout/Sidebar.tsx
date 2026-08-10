import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { getCurrentWebviewWindow } from '@tauri-apps/api/webviewWindow';
import { useTranslation } from 'react-i18next';
import {
  Settings,
  Maximize2,
  ChevronRight,
  BarChart3,
  Monitor,
  Gamepad2,
  Clock,
  Download,
  Home,
  Circle,
  PlayCircle,
  PauseCircle,
  XCircle,
  CheckCircle2,
  Award,
  type LucideIcon,
} from 'lucide-react';
import logoUrl from '@/assets/logo.png';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from '@/components/ui/tooltip';
import { useCategoryStore, STATUS_CATEGORY_PREFIX } from '@/stores/categoryStore';
import { useAppStore } from '@/stores/appStore';
import { SettingsOverlay } from '@/components/overlays/SettingsOverlay';
import { cn } from '@/lib/utils';
import type { ICategory } from '@/types';

const STATUS_ICONS: Record<string, LucideIcon> = {
  'Not started': Circle,
  'In progress': PlayCircle,
  'On hold': PauseCircle,
  Dropped: XCircle,
  Completed: CheckCircle2,
  Platinum: Award,
};

function getCategoryIcon(cat: ICategory): LucideIcon {
  if (cat.id === '0') return Home;
  if (cat.id === '-5') return Clock;
  if (cat.id === '-6') return Download;
  if (cat.id.startsWith(STATUS_CATEGORY_PREFIX))
    return STATUS_ICONS[cat.name] ?? Circle;
  return Gamepad2;
}

const appWindow = getCurrentWebviewWindow();

export function Sidebar() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();

  const [settingsOpen, setSettingsOpen] = useState(false);
  const [logoAnimated, setLogoAnimated] = useState(true);

  const { categories, currentCategoryId, fetchCategories, setCurrentCategory } =
    useCategoryStore();
  const { sidebarOpen, alreadyLaunched } = useAppStore();

  useEffect(() => {
    fetchCategories();
    if (alreadyLaunched) setLogoAnimated(false);
  }, []);

  useEffect(() => {
    if (alreadyLaunched) setLogoAnimated(false);
  }, [sidebarOpen]);

  const handleCategoryClick = (id: string) => {
    setCurrentCategory(id);
    navigate('/games');
  };

  const regularCategories = categories.filter(
    (cat) => !cat.id.startsWith(STATUS_CATEGORY_PREFIX)
  );
  const statusCategories = categories.filter((cat) =>
    cat.id.startsWith(STATUS_CATEGORY_PREFIX)
  );

  const renderCategoryButton = (cat: ICategory) => {
    const IconComp = getCategoryIcon(cat);
    return (
      <button
        key={cat.id}
        onClick={() => handleCategoryClick(cat.id)}
        className={cn(
          'group flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all hover:bg-accent/50',
          currentCategoryId === cat.id && 'bg-accent text-accent-foreground'
        )}
      >
        {currentCategoryId === cat.id && (
          <div className="h-4 w-1 rounded-full bg-primary" />
        )}
        <IconComp className="h-4 w-4 shrink-0 text-muted-foreground group-hover:text-foreground" />
        <span className="flex-1 truncate text-left">{cat.name}</span>
        <Badge variant="secondary" className="h-5 px-1.5 text-[10px]">
          {cat.count ?? 0}
        </Badge>
      </button>
    );
  };

  const toggleFullscreen = async () => {
    const isFs = await appWindow.isFullscreen();
    await appWindow.setFullscreen(!isFs);
  };

  if (!sidebarOpen) return null;

  return (
    <>
      <aside className="flex h-screen w-64 flex-col border-r border-border/40 bg-card/50 backdrop-blur-xl">
        <div
          className="flex items-center justify-between p-4"
          data-tauri-drag-region
        >
          <div
            className={cn(
              'flex items-center gap-3',
              logoAnimated && 'animate-in slide-in-from-left duration-700'
            )}
          >
            <img
              src={logoUrl}
              alt="Meteoric"
              className="h-10 w-10 drop-shadow-lg"
            />
            <h1 className="text-lg font-bold tracking-tight">Meteoric</h1>
          </div>
          <div className="flex gap-1">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setSettingsOpen(true)}
                >
                  <Settings className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>{t('settings')}</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={toggleFullscreen}
                >
                  <Maximize2 className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>{t('fullscreen')}</TooltipContent>
            </Tooltip>
          </div>
        </div>

        <Separator className="opacity-50" />

        <div className="space-y-1 p-3">
          <Button
            variant={location.pathname === '/stats' ? 'secondary' : 'ghost'}
            className="w-full justify-start gap-3"
            onClick={() => navigate('/stats')}
          >
            <BarChart3 className="h-4 w-4" />
            <span>{t('stats')}</span>
          </Button>
          <Button
            variant="ghost"
            className="w-full justify-start gap-3"
            onClick={() => navigate('/bigpicture')}
          >
            <Monitor className="h-4 w-4" />
            <span>{t('bigpicture_mode')}</span>
          </Button>
        </div>

        <Separator className="opacity-50" />

        <div className="px-3 pt-3">
          <p className="mb-2 px-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {t('categories')}
          </p>
        </div>
        <ScrollArea className="flex-1 px-3">
          <div className="space-y-0.5 pb-2">
            {regularCategories.map(renderCategoryButton)}
          </div>

          {statusCategories.length > 0 && (
            <>
              <p className="mb-2 mt-3 px-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {t('status')}
              </p>
              <div className="space-y-0.5 pb-4">
                {statusCategories.map(renderCategoryButton)}
              </div>
            </>
          )}
        </ScrollArea>
      </aside>

      {settingsOpen && (
        <SettingsOverlay open={settingsOpen} onOpenChange={setSettingsOpen} />
      )}
    </>
  );
}
