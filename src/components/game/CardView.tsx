import { useMemo, useState, useEffect, useRef, useCallback } from 'react';
import { GameCard } from '@/components/game/GameCard';
import type { IGame } from '@/types';
import { useSettingsStore } from '@/stores/settingsStore';

interface CardViewProps {
  games: IGame[];
}

const BATCH_SIZE = 40;

export function CardView({ games }: CardViewProps) {
  const [visibleCount, setVisibleCount] = useState(BATCH_SIZE);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const { settings } = useSettingsStore();
  const gap = parseInt(settings.gap?.toString() ?? '10');

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
        <div className="flex h-64 w-full items-center justify-center">
          <p className="text-sm text-muted-foreground">No games found</p>
        </div>
      )}
      {visibleCount < games.length && (
        <div ref={sentinelRef} className="h-1 w-full" />
      )}
    </div>
  );
}
