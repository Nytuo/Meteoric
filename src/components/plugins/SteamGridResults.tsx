import { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, CheckCircle2, Loader2 } from 'lucide-react';

const PAGE_SIZE = 12;

type Slot = 'jaquette' | 'jaquette_horizontal' | 'background' | 'logo' | 'icon';
type TabKey = 'static' | 'animated';

interface CategoryDef {
  key: string;
  label: string;
  slot: Slot;
  aspect: string;
  cols: string;
  objectFit: 'cover' | 'contain';
  staticCmd: string;
  animatedCmd: string | null;
}

const CATEGORIES: CategoryDef[] = [
  {
    key: 'grid',
    label: 'Cover (Grid)',
    slot: 'jaquette',
    aspect: '2/3',
    cols: 'grid-cols-3 sm:grid-cols-4 lg:grid-cols-5',
    objectFit: 'cover',
    staticCmd: 'steamgrid_get_grid',
    animatedCmd: 'steamgrid_get_grid_animated',
  },
  {
    key: 'horizontal',
    label: 'Horizontal',
    slot: 'jaquette_horizontal',
    aspect: '92/43',
    cols: 'grid-cols-2 sm:grid-cols-3',
    objectFit: 'cover',
    staticCmd: 'steamgrid_get_grid_horizontal',
    animatedCmd: 'steamgrid_get_grid_horizontal_animated',
  },
  {
    key: 'hero',
    label: 'Background (Hero)',
    slot: 'background',
    aspect: '16/5',
    cols: 'grid-cols-1 sm:grid-cols-2',
    objectFit: 'cover',
    staticCmd: 'steamgrid_get_hero',
    animatedCmd: 'steamgrid_get_hero_animated',
  },
  {
    key: 'logo',
    label: 'Logo',
    slot: 'logo',
    aspect: '16/7',
    cols: 'grid-cols-2 sm:grid-cols-3',
    objectFit: 'contain',
    staticCmd: 'steamgrid_get_logo',
    animatedCmd: 'steamgrid_get_logo_animated',
  },
  {
    key: 'icon',
    label: 'Icon',
    slot: 'icon',
    aspect: '1/1',
    cols: 'grid-cols-4 sm:grid-cols-5 lg:grid-cols-6',
    objectFit: 'contain',
    staticCmd: 'steamgrid_get_icon',
    animatedCmd: null,
  },
];

interface ImageGridProps {
  images: any[];
  loading: boolean;
  selected: string;
  onPick: (url: string) => void;
  page: number;
  setPage: (p: number) => void;
  aspect: string;
  cols: string;
  objectFit?: 'cover' | 'contain';
}

function ImageGrid({
  images,
  loading,
  selected,
  onPick,
  page,
  setPage,
  aspect,
  cols,
  objectFit = 'cover',
}: ImageGridProps) {
  const totalPages = Math.max(1, Math.ceil(images.length / PAGE_SIZE));
  const slice = images.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  if (loading)
    return (
      <div className="flex h-40 items-center justify-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" /> Loading…
      </div>
    );

  if (images.length === 0)
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">
        No images found.
      </p>
    );

  const fitClass =
    objectFit === 'contain' ? 'object-contain p-1' : 'object-cover';

  return (
    <div>
      <div className={`grid gap-3 ${cols}`}>
        {slice.map((img: any, i: number) => {
          const url = img.image || img.url;

          const isWebm = img.mime === 'video/webm';
          const isGif = img.mime?.includes('gif');
          const isApng = img.mime?.includes('apng');
          const isAnimated = isWebm || isGif || isApng;
          const isSelected = selected === url;
          return (
            <button
              key={i}
              type="button"
              onClick={() => onPick(url)}
              className={`group relative mx-auto w-full overflow-hidden rounded-lg border-2 transition-all ${
                isSelected
                  ? 'border-primary shadow-lg shadow-primary/20'
                  : 'border-transparent hover:border-primary/50'
              }`}
            >
              <div
                style={{ aspectRatio: aspect }}
                className="relative w-full overflow-hidden bg-muted/40"
              >
                {isWebm ? (
                  <video
                    src={url}
                    autoPlay
                    muted
                    loop
                    playsInline
                    className={`absolute inset-0 h-full w-full transition-transform duration-200 group-hover:scale-105 ${fitClass}`}
                  />
                ) : (
                  <img
                    src={url}
                    alt=""
                    loading="lazy"
                    className={`absolute inset-0 h-full w-full transition-transform duration-200 group-hover:scale-105 ${fitClass}`}
                  />
                )}
                {isAnimated && (
                  <span className="absolute left-1 top-1 rounded bg-black/70 px-1.5 py-0.5 text-[10px] font-bold text-white">
                    {isWebm ? 'WEBM' : isGif ? 'GIF' : 'APNG'}
                  </span>
                )}
                {isSelected && (
                  <div className="absolute inset-0 flex items-center justify-center bg-primary/30">
                    <CheckCircle2 className="h-8 w-8 text-primary drop-shadow" />
                  </div>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {totalPages > 1 && (
        <div className="mt-3 flex items-center justify-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage(Math.max(0, page - 1))}
            disabled={page === 0}
          >
            <ChevronLeft className="h-3 w-3" />
          </Button>
          <span className="text-xs text-muted-foreground">
            {page + 1} / {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage(Math.min(totalPages - 1, page + 1))}
            disabled={page === totalPages - 1}
          >
            <ChevronRight className="h-3 w-3" />
          </Button>
        </div>
      )}
    </div>
  );
}

interface SteamGridResultsProps {
  results: any[];
  onSelect: (item: any) => void;
}

export function SteamGridResults({ results, onSelect }: SteamGridResultsProps) {
  const [step, setStep] = useState(0);
  const [selectedGame, setSelectedGame] = useState<any>(null);
  const [gameFilter, setGameFilter] = useState('');

  const [images, setImages] = useState<Record<string, any[]>>({});
  const [loading, setLoading] = useState<Record<string, boolean>>({});
  const [pages, setPages] = useState<Record<string, number>>({});

  const [activeTabs, setActiveTabs] = useState<Record<string, TabKey>>(
    Object.fromEntries(CATEGORIES.map((c) => [c.key, 'static']))
  );

  const [selectedUrls, setSelectedUrls] = useState<Record<Slot, string>>({
    jaquette: '',
    jaquette_horizontal: '',
    background: '',
    logo: '',
    icon: '',
  });

  useEffect(() => {
    setStep(0);
    setSelectedGame(null);
    setImages({});
    setSelectedUrls({
      jaquette: '',
      jaquette_horizontal: '',
      background: '',
      logo: '',
      icon: '',
    });
    setActiveTabs(Object.fromEntries(CATEGORIES.map((c) => [c.key, 'static'])));
  }, [results]);

  const loadImages = async (game: any) => {
    const loadingInit: Record<string, boolean> = {};
    CATEGORIES.forEach((c) => {
      loadingInit[`${c.key}_static`] = true;
      if (c.animatedCmd) loadingInit[`${c.key}_animated`] = true;
    });
    setLoading(loadingInit);
    setImages({});

    for (const cat of CATEGORIES) {
      try {
        const res = await invoke<any[]>(cat.staticCmd, {
          gameId: Number(game.id),
        });
        setImages((prev) => ({
          ...prev,
          [`${cat.key}_static`]: Array.isArray(res)
            ? res.map((item: any) => ({
                image: item.url,
                thumb: item.thumb,
                mime: item.mime,
              }))
            : [],
        }));
      } catch {
        setImages((prev) => ({ ...prev, [`${cat.key}_static`]: [] }));
      }
      setLoading((prev) => ({ ...prev, [`${cat.key}_static`]: false }));

      if (cat.animatedCmd) {
        try {
          const res = await invoke<any[]>(cat.animatedCmd, {
            gameId: Number(game.id),
          });
          setImages((prev) => ({
            ...prev,
            [`${cat.key}_animated`]: Array.isArray(res)
              ? res.map((item: any) => ({
                  image: item.url,
                  thumb: item.thumb,
                  mime: item.mime,
                }))
              : [],
          }));
        } catch {
          setImages((prev) => ({ ...prev, [`${cat.key}_animated`]: [] }));
        }
        setLoading((prev) => ({ ...prev, [`${cat.key}_animated`]: false }));
      }
    }
  };

  const pickGame = (game: any) => {
    setSelectedGame(game);
    setStep(1);
    loadImages(game);
    const pagesInit: Record<string, number> = {};
    CATEGORIES.forEach((c) => {
      pagesInit[`${c.key}_static`] = 0;
      pagesInit[`${c.key}_animated`] = 0;
    });
    setPages(pagesInit);
  };

  const handleApply = () => {
    if (!selectedGame) return;
    onSelect({
      id: String(selectedGame.id),
      jaquette: selectedUrls.jaquette,
      jaquette_horizontal: selectedUrls.jaquette_horizontal,
      background: selectedUrls.background,
      logo: selectedUrls.logo,
      icon: selectedUrls.icon,
    });
  };

  if (!results || results.length === 0) return null;

  const filteredResults = results.filter(
    (g) =>
      !gameFilter || g.name?.toLowerCase().includes(gameFilter.toLowerCase())
  );

  const STEPS = ['Game', ...CATEGORIES.map((c) => c.label)];

  return (
    <div className="flex h-full flex-col gap-3">
      <div className="flex flex-wrap items-center gap-1 pb-1">
        {STEPS.map((label, i) => (
          <button
            key={i}
            type="button"
            disabled={i > 0 && !selectedGame}
            onClick={() => {
              if (i === 0) setStep(0);
              else if (selectedGame) setStep(i);
            }}
            className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium transition-colors disabled:cursor-default ${
              step === i
                ? 'bg-primary text-primary-foreground'
                : i < step
                  ? 'bg-primary/20 text-primary hover:bg-primary/30'
                  : 'bg-muted text-muted-foreground'
            }`}
          >
            {i + 1}. {label}
          </button>
        ))}
      </div>

      {step === 0 && (
        <div className="flex min-h-0 flex-1 flex-col">
          <input
            type="text"
            placeholder="Filter…"
            value={gameFilter}
            onChange={(e) => setGameFilter(e.target.value)}
            className="mb-2 w-full rounded-md border border-border bg-background px-3 py-1.5 text-sm outline-none focus:ring-1 focus:ring-primary"
          />
          <div className="flex-1 min-h-0 overflow-y-auto rounded-lg border border-border">
            <div className="space-y-1 p-2">
              {filteredResults.map((game: any, i: number) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => pickGame(game)}
                  className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-left text-sm hover:bg-accent"
                >
                  {game.jaquette && (
                    <img
                      src={game.jaquette}
                      alt=""
                      className="h-14 w-10 shrink-0 rounded object-cover"
                    />
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{game.name}</p>
                    {game.release_date && (
                      <p className="text-xs text-muted-foreground">
                        {game.release_date}
                      </p>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {step > 0 &&
        CATEGORIES[step - 1] &&
        (() => {
          const cat = CATEGORIES[step - 1];
          const activeTab = activeTabs[cat.key] as TabKey;
          const tabKey = `${cat.key}_${activeTab}`;
          const hasAnimated = !!cat.animatedCmd;
          const animatedImages = images[`${cat.key}_animated`] ?? [];
          const staticCount = (images[`${cat.key}_static`] ?? []).length;
          const animatedCount = animatedImages.length;

          return (
            <div className="flex min-h-0 flex-1 flex-col">
              <div className="mb-2 flex items-center justify-between gap-2">
                <div className="flex gap-1">
                  {(['static', 'animated'] as TabKey[]).map((tab) => {
                    if (tab === 'animated' && !hasAnimated) return null;
                    const count =
                      tab === 'static' ? staticCount : animatedCount;
                    const isActive = activeTab === tab;
                    return (
                      <button
                        key={tab}
                        type="button"
                        onClick={() =>
                          setActiveTabs((prev) => ({ ...prev, [cat.key]: tab }))
                        }
                        className={`rounded-md px-3 py-1 text-xs font-medium transition-colors ${
                          isActive
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted text-muted-foreground hover:bg-accent'
                        }`}
                      >
                        {tab === 'static' ? 'Static' : 'Animated'}
                        {loading[`${cat.key}_${tab}`] ? (
                          <Loader2 className="ml-1 inline h-3 w-3 animate-spin" />
                        ) : (
                          <span className="ml-1 opacity-60">({count})</span>
                        )}
                      </button>
                    );
                  })}
                </div>
                {selectedUrls[cat.slot] && (
                  <span className="text-xs text-primary">✓ Selected</span>
                )}
              </div>

              <div className="flex-1 min-h-0 overflow-y-auto rounded-lg border border-border p-3">
                <ImageGrid
                  images={images[tabKey] ?? []}
                  loading={!!loading[tabKey]}
                  selected={selectedUrls[cat.slot]}
                  onPick={(url) =>
                    setSelectedUrls((prev) => ({ ...prev, [cat.slot]: url }))
                  }
                  page={pages[tabKey] ?? 0}
                  setPage={(p) =>
                    setPages((prev) => ({ ...prev, [tabKey]: p }))
                  }
                  aspect={cat.aspect}
                  cols={cat.cols}
                  objectFit={cat.objectFit}
                />
              </div>
            </div>
          );
        })()}

      <div className="flex items-center justify-between gap-2">
        <div className="flex gap-2">
          {step > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setStep((s) => s - 1)}
            >
              <ChevronLeft className="mr-1 h-3 w-3" /> Back
            </Button>
          )}
          {step < STEPS.length - 1 && selectedGame && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setStep((s) => s + 1)}
            >
              Next <ChevronRight className="ml-1 h-3 w-3" />
            </Button>
          )}
        </div>
        {step > 0 && (
          <Button
            size="sm"
            onClick={handleApply}
            className="bg-green-600 hover:bg-green-700 text-white"
          >
            Apply selected images
          </Button>
        )}
      </div>
    </div>
  );
}
