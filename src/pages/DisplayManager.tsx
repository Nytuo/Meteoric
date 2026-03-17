import { useEffect, useState } from 'react';
import { useGameStore } from '@/stores/gameStore';
import { useSettingsStore } from '@/stores/settingsStore';
import { useAppStore } from '@/stores/appStore';
import { useCategoryStore } from '@/stores/categoryStore';
import { CardView } from '@/components/game/CardView';
import { ListView } from '@/components/game/ListView';

export function DisplayManager() {
  const { filteredGames, fetchGames, loadRecentPlayed } = useGameStore();
  const { settings } = useSettingsStore();
  const { alreadyLaunched, setAlreadyLaunched } = useAppStore();
  const { currentCategoryId, fetchCategories } = useCategoryStore();

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

  return (
    <div className="h-full">
      {currentView === 'card' ? (
        <CardView games={filteredGames} />
      ) : (
        <ListView games={filteredGames} />
      )}
    </div>
  );
}
