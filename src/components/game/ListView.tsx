import { useMemo, useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Gamepad2, SearchX, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import type { IGame } from '@/types';
import { useGameStore } from '@/stores/gameStore';

interface ListViewProps {
  games: IGame[];
}

const BATCH_SIZE = 60;

export function ListView({ games }: ListViewProps) {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [visibleCount, setVisibleCount] = useState(BATCH_SIZE);
  const sentinelRef = useRef<HTMLDivElement>(null);
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
    <div className="p-4">
      <table className="w-full">
        <thead>
          <tr className="border-b border-border text-left text-xs font-medium uppercase text-muted-foreground">
            <th className="w-12 py-3"></th>
            <th className="py-3 pl-3">Name</th>
            <th className="py-3">Platform</th>
            <th className="py-3">Genres</th>
            <th className="py-3">Rating</th>
            <th className="py-3">Status</th>
          </tr>
        </thead>
        <tbody>
          {visibleGames.map((game) => (
            <tr
              key={game.id}
              onClick={() => navigate(`/game/${game.id}`)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  navigate(`/game/${game.id}`);
                }
              }}
              tabIndex={0}
              aria-label={game.name}
              className="cursor-pointer border-b border-border/30 transition-colors hover:bg-accent/30 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-inset focus-visible:ring-ring"
            >
              <td className="py-2">
                <img
                  src={game.icon || game.jaquette || '/assets/logo.gif'}
                  alt=""
                  className="h-8 w-8 rounded object-cover"
                />
              </td>
              <td className="py-2 pl-3 text-sm font-medium">{game.name}</td>
              <td className="py-2 text-xs text-muted-foreground">
                {game.platforms}
              </td>
              <td className="py-2 text-xs text-muted-foreground">
                {game.genres}
              </td>
              <td className="py-2">
                <div className="flex items-center gap-0.5">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <svg
                      key={star}
                      className={`h-3 w-3 ${parseInt(game.rating || '0') >= star ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground/30'}`}
                      viewBox="0 0 24 24"
                    >
                      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                    </svg>
                  ))}
                </div>
              </td>
              <td className="py-2">
                {game.status && (
                  <Badge variant="outline" className="text-[10px]">
                    {game.status}
                  </Badge>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
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
