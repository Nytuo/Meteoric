import { create } from 'zustand';
import { GAME_STATUSES, type ICategory } from '@/types';
import { db } from '@/lib/db';
import { useGameStore } from './gameStore';
import { useSettingsStore } from './settingsStore';
import { toast } from 'sonner';

export const STATUS_CATEGORY_PREFIX = 'status:';

function buildStatusCategories(): ICategory[] {
  return GAME_STATUSES.map((status) => ({
    id: STATUS_CATEGORY_PREFIX + status,
    name: status,
    icon: 'status',
    games: '*',
    filters: [],
    views: [],
    background: '',
  }));
}

const STATIC_CATEGORIES: ICategory[] = [
  {
    id: '0',
    name: 'All',
    icon: 'home',
    games: '*',
    filters: [],
    views: [],
    background: '',
  },
  {
    id: '-5',
    name: 'Recent Played',
    icon: 'clock',
    games: '*',
    filters: [],
    views: [],
    background: '',
  },
  {
    id: '-6',
    name: 'Installed',
    icon: 'download',
    games: '*',
    filters: [],
    views: [],
    background: '',
  },
  {
    id: '-2',
    name: 'Steam',
    icon: 'bookmark',
    games: '*',
    filters: [],
    views: [],
    background: '',
  },
  {
    id: '-3',
    name: 'Epic Games',
    icon: 'bookmark',
    games: '*',
    filters: [],
    views: [],
    background: '',
  },
  {
    id: '-4',
    name: 'GOG',
    icon: 'bookmark',
    games: '*',
    filters: [],
    views: [],
    background: '',
  },
];

interface CategoryStore {
  categories: ICategory[];
  currentCategoryId: string;
  currentCategory: ICategory | undefined;

  fetchCategories: () => Promise<void>;
  setCurrentCategory: (id: string) => void;
  getCategoriesForGame: (gameId: string) => ICategory[];
  addGameToCategory: (gameId: string, categoryId: string) => Promise<void>;
  removeGameFromCategory: (gameId: string, categoryId: string) => Promise<void>;
  createCategory: (
    name: string,
    icon: string,
    games: string[]
  ) => Promise<void>;
  getCategoryIdByName: (name: string) => string | undefined;
}

export const useCategoryStore = create<CategoryStore>((set, get) => ({
  categories: [],
  currentCategoryId: '-5',
  currentCategory: undefined,

  async fetchCategories() {
    try {
      console.time('[PERF] fetchCategories - DB Queries');
      const [dbCats, allGames] = await Promise.all([
        db.getCategories(),
        db.getGames(),
      ]);
      console.timeEnd('[PERF] fetchCategories - DB Queries');
      console.log(
        '[PERF] Loaded',
        allGames.length,
        'games and',
        dbCats.length,
        'custom categories'
      );

      const hiddenStatuses = new Set(
        (useSettingsStore.getState().settings.hiddenStatusCategories || '')
          .split(',')
          .filter(Boolean)
      );
      const statusCats = buildStatusCategories().filter(
        (c) => !hiddenStatuses.has(c.name)
      );

      let all = [...STATIC_CATEGORIES, ...statusCats, ...dbCats];
      all.sort((a, b) =>
        a.name === 'Favorites' ? -1 : b.name === 'Favorites' ? 1 : 0
      );

      console.time('[PERF] fetchCategories - Count Computation');

      const countMap = new Map<string, number>();
      countMap.set(
        'All',
        allGames.filter((g) => g.hidden === 'false' || !g.hidden).length
      );
      countMap.set(
        'Recent Played',
        allGames.filter((g) => g.stats && g.stats.length > 0).length
      );

      const { useEpicStore } = await import('./epicStore');
      const { useGogStore } = await import('./gogStore');
      const epicInstalled = useEpicStore.getState().installedGames;
      const gogInstalled = useGogStore.getState().installedGames;
      const epicAppNames = new Set(epicInstalled.map((g) => g.app_name));
      const gogGameIds = new Set(gogInstalled.map((g) => g.game_id));

      const installedCount = allGames.filter((g) => {
        if (g.exec_file && g.game_dir) return true;
        if (g.importer_id === 'epic' && g.exec_args) {
          const appName = g.exec_args.split(':')[1];
          if (appName && epicAppNames.has(appName)) return true;
        }
        if (g.importer_id === 'gog' && g.exec_args) {
          const gameId = g.exec_args.split(':')[1];
          if (gameId && gogGameIds.has(gameId)) return true;
        }
        return false;
      }).length;

      countMap.set('Installed', installedCount);
      countMap.set(
        'Steam',
        allGames.filter((g) => g.platforms?.includes('Steam')).length
      );
      countMap.set(
        'Epic Games',
        allGames.filter((g) => g.platforms?.includes('Epic Games')).length
      );
      countMap.set(
        'GOG',
        allGames.filter((g) => g.platforms?.includes('GOG')).length
      );
      for (const status of GAME_STATUSES) {
        countMap.set(status, allGames.filter((g) => g.status === status).length);
      }

      const customCats = all.filter((c) => !countMap.has(c.name));
      const customCounts = await Promise.all(
        customCats.map((c) =>
          db
            .getGamesByCategory(c.name)
            .then((g) => g.length)
            .catch(() => 0)
        )
      );
      customCats.forEach((c, i) => countMap.set(c.name, customCounts[i]));

      for (const cat of all) {
        cat.count = countMap.get(cat.name) ?? 0;
      }
      console.timeEnd('[PERF] fetchCategories - Count Computation');
      set({ categories: all });
    } catch {
      toast.error('Failed to load categories');
    }
  },

  setCurrentCategory(id) {
    const { categories } = get();
    const cat = categories.find((c) => c.id === id);
    set({ currentCategoryId: id, currentCategory: cat });
    const gameStore = useGameStore.getState();
    if (id.startsWith(STATUS_CATEGORY_PREFIX)) {
      gameStore.loadStatus(id.slice(STATUS_CATEGORY_PREFIX.length));
      return;
    }
    switch (id) {
      case '0':
      case '-1':
        gameStore.fetchGames();
        break;
      case '-2':
        gameStore.loadPlatform('Steam');
        break;
      case '-3':
        gameStore.loadPlatform('Epic Games');
        break;
      case '-4':
        gameStore.loadPlatform('GOG');
        break;
      case '-5':
        gameStore.loadRecentPlayed();
        break;
      case '-6':
        gameStore.loadInstalled();
        break;
      default: {
        const cat = categories.find((c) => c.id === id);
        if (cat) gameStore.loadCategory(cat.name);
        break;
      }
    }
  },

  getCategoriesForGame(gameId) {
    return get().categories.filter((c) => {
      const ids = c.games.split(',');
      return ids.includes(gameId);
    });
  },

  async addGameToCategory(gameId, categoryId) {
    await db.addGameToCategory(gameId, categoryId);
    toast.success('Game added to category');
    get().fetchCategories();
  },

  async removeGameFromCategory(gameId, categoryId) {
    await db.removeGameFromCategory(gameId, categoryId);
    toast.success('Game removed from category');
    get().fetchCategories();
  },

  async createCategory(name, icon, games) {
    await db.createCategory(
      name,
      icon,
      games,
      ['All', 'Installed', 'Not Installed'],
      ['Grid', 'List'],
      ''
    );
    toast.success('Category created');
    get().fetchCategories();
  },

  getCategoryIdByName(name) {
    return get().categories.find((c) => c.name === name)?.id;
  },
}));
