import { useMemo, useState, useEffect, useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Gamepad2, SearchX, Loader2 } from 'lucide-react';
import { GameCard } from '@/components/game/GameCard';
import type { IGame } from '@/types';
import { useSettingsStore } from '@/stores/settingsStore';
import { useGameStore } from '@/stores/gameStore';

interface CardViewProps {
  games: IGame[];
}

const BATCH_SIZE = 40;

export function CardView({ games }: CardViewProps) {
  const { t } = useTranslation();
  const [visibleCount, setVisibleCount] = useState(BATCH_SIZE);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const { settings } = useSettingsStore();
  const gap = parseInt(settings.gap?.toString() ?? '10');
  const hasAnyGames = useGameStore((s) => s.games.length > 0);
  const loading = useGameStore((s) => s.loading);

  useEffect(() => {
    setVisibleCount(BATCH_SIZE);
  }, [games]);

  const observerCallback = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      if (entries[0]?.isIntersecting) {
        setVisibleCount((prev) => Math.min(prev + BATCH_SIZE, games.length));
      }
    },
    [games.length]
  );

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;
    const observer = new IntersectionObserver(observerCallback, {
      rootMargin: '200px',
    });
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [observerCallback]);

  const visibleGames = useMemo(
    () => games.slice(0, visibleCount),
    [games, visibleCount]
  );

  return (
    <div className="flex flex-wrap p-6" style={{ gap: `${gap}px` }}>
      {visibleGames.map((game) => (
        <GameCard key={game.id} game={game} />
      ))}
      {games.length === 0 && (
        <div className="flex h-64 w-full flex-col items-center justify-center gap-2 text-center">
          {loading ? (
            <>
              <Loader2 className="h-10 w-10 animate-spin text-muted-foreground opacity-40" />
              <p className="text-sm font-medium text-muted-foreground">
                {t('loading-games') || 'Loading your library...'}
              </p>
            </>
          ) : hasAnyGames ? (
            <>
              <SearchX className="h-10 w-10 text-muted-foreground opacity-40" />
              <p className="text-sm font-medium text-muted-foreground">
                {t('no-games-match-filters') || 'No games match your filters'}
              </p>
              <p className="text-xs text-muted-foreground">
                {t('no-games-match-filters-hint') ||
                  'Try a different search or clear your filters.'}
              </p>
            </>
          ) : (
            <>
              <Gamepad2 className="h-10 w-10 text-muted-foreground opacity-40" />
              <p className="text-sm font-medium text-muted-foreground">
                {t('library-empty') || 'Your library is empty'}
              </p>
              <p className="text-xs text-muted-foreground">
                {t('library-empty-hint') ||
                  'Add a game or import a library from the toolbar above.'}
              </p>
            </>
          )}
        </div>
      )}
      {visibleCount < games.length && (
        <div ref={sentinelRef} className="h-1 w-full" />
      )}
    </div>
  );
}
