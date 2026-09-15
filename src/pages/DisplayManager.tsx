import { useEffect, useRef } from 'react';
import { useGameStore } from '@/stores/gameStore';
import { useSettingsStore } from '@/stores/settingsStore';
import { useAppStore } from '@/stores/appStore';
import { useCategoryStore } from '@/stores/categoryStore';
import { useLibraryScrollRestore } from '@/hooks/useLibraryScrollRestore';
import { CardView } from '@/components/game/CardView';
import { ListView } from '@/components/game/ListView';

export function DisplayManager() {
  const { filteredGames, fetchGames, loadRecentPlayed } = useGameStore();
  const listToken = useGameStore((s) => s.listToken);
  const { settings } = useSettingsStore();
  const { alreadyLaunched, setAlreadyLaunched } = useAppStore();
  const { currentCategoryId, fetchCategories } = useCategoryStore();
  const rootRef = useRef<HTMLDivElement>(null);

  const currentView = settings.view || 'card';
  const devMode = import.meta.env.DEV;

  useEffect(() => {
    if (alreadyLaunched) {
    } else {
      const load =
        currentCategoryId === '-5' ? loadRecentPlayed() : fetchGames();
      load.then(() => fetchCategories());
      const delay = devMode ? 0 : 3000;
      setTimeout(() => {
        setAlreadyLaunched();
      }, delay);
    }
  }, []);

  useLibraryScrollRestore({
    containerRef: rootRef,
    games: filteredGames,
    listToken,
  });

  return (
    <div className="h-full" ref={rootRef}>
      {currentView === 'card' ? (
        <CardView games={filteredGames} />
      ) : (
        <ListView games={filteredGames} />
      )}
    </div>
  );
}
