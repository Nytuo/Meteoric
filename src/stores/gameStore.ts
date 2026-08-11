import { create } from 'zustand';
import { invoke } from '@tauri-apps/api/core';
import { openUrl } from '@tauri-apps/plugin-opener';
import type { IGame, IStat, ITrophy } from '@/types';
import { db, refreshGameLinks } from '@/lib/db';
import { toast } from 'sonner';
import { useEpicStore } from './epicStore';
import { useGogStore } from './gogStore';

interface GameStore {
  games: IGame[];
  filteredGames: IGame[];
  currentGame: IGame | null;
  achievements: ITrophy[];
  loading: boolean;

  fetchGames: () => Promise<void>;
  getGame: (id: string) => IGame | undefined;
  setCurrentGame: (game: IGame | undefined) => void;
  setGame: (id: string, game: IGame) => void;
  searchGame: (query: string) => void;
  sortGames: (option?: string) => void;
  filterGames: (on?: string, value?: string, or_?: string) => void;
  loadCategory: (category: string) => void;
  loadPlatform: (platform: string) => void;
  loadStatus: (status: string) => Promise<void>;
  loadRecentPlayed: () => Promise<void>;
  loadInstalled: () => Promise<void>;
  loadGameExtras: (id: string) => Promise<void>;
  getCountForCategory: (name: string) => Promise<number>;
  getAllFilters: () => FilterGroup[];
  fetchAchievements: (gameId: string) => Promise<void>;
  launchGame: (gameId: string, launcherId?: string) => Promise<void>;
  killGame: (pid: number) => Promise<void>;
  searchAPI: (
    name: string,
    provider: string,
    strict: boolean,
    currentGame?: IGame
  ) => Promise<any[]>;
  autoIGDB: (name: string) => Promise<IGame | string>;
  autoDownloadBGMusic: (game: IGame) => Promise<void>;
  getHiddenGames: () => Promise<IGame[]>;
  enrichMissingMetadataFromIGDB: (importerId: string) => Promise<void>;
  linkGameToNative: (
    gameId: string,
    targetImporter: 'steam' | 'gog' | 'epic',
    nativeId: string
  ) => Promise<void>;
}

export interface FilterGroup {
  name: string;
  values: { cname: string; value: string; code: string }[];
}

function sortByName(games: IGame[]): IGame[] {
  return [...games].sort((a, b) =>
    (a.sort_name || a.name || '').toLowerCase().localeCompare(
      (b.sort_name || b.name || '').toLowerCase()
    )
  );
}

function createNewGame(api: any): IGame {
  return {
    id: api.id ?? '-1',
    game_importer_id: api.game_importer_id ?? '',
    importer_id: api.importer_id ?? '',
    igdb_id: api.igdb_id ?? '',
    trophies: api.trophies ?? '',
    name: api.name ?? '',
    sort_name: api.name ?? '',
    rating: api.rating ?? '',
    platforms: api.platforms ?? '',
    tags: api.tags ?? '',
    description: api.description ?? '',
    critic_score: api.critic_score
      ? Math.round(api.critic_score).toString()
      : '',
    genres: api.genres ?? '',
    styles: api.styles ?? '',
    release_date: api.release_date ?? '',
    developers: api.developers ?? '',
    editors: api.editors ?? '',
    status: api.status ?? '',
    trophies_unlocked: api.trophies_unlocked ?? '',
    jaquette: api.cover ?? '',
    jaquette_horizontal: api.jaquette_horizontal ?? '',
    background: api.background ?? '',
    logo: api.logo ?? '',
    icon: api.icon ?? '',
    backgroundMusic: api.backgroundMusic ?? '',
    exec_file: api.exec_file ?? '',
    exec_args: api.exec_args ?? '',
    game_dir: api.game_dir ?? '',
    screenshots: api.screenshots ?? [],
    videos: api.videos ?? [],
    hidden: api.hidden ?? 'false',
    metadata_source: api.metadata_source ?? '',
    stats: api.stats ?? [],
  };
}

export const useGameStore = create<GameStore>((set, get) => ({
  games: [],
  filteredGames: [],
  currentGame: null,
  achievements: [],
  loading: true,

  async fetchGames() {
    set({ loading: true });
    try {
      console.time('[PERF] fetchGames');
      const games = sortByName(await db.getGames());
      console.log('[PERF] fetchGames - Loaded', games.length, 'games');
      set({ games });

      const visible = games.filter((g) => g.hidden === 'false' || !g.hidden);
      console.log('[PERF] fetchGames - Visible:', visible.length);
      console.timeEnd('[PERF] fetchGames');
      set({ filteredGames: visible });
    } catch (e) {
      console.error('[ERROR] fetchGames:', e);
      toast.error('Failed to load games');
    } finally {
      set({ loading: false });
    }
  },

  getGame(id: string) {
    return get().games.find((g) => g.id === id);
  },

  setCurrentGame(game) {
    if (!game) {
      toast.error('No game found');
      return;
    }
    set({ currentGame: game });
  },

  setGame(id, game) {
    const games = get().games.map((g) => (g.id === id ? game : g));
    const filtered = get().filteredGames.map((g) => (g.id === id ? game : g));
    set({ games, filteredGames: filtered, currentGame: game });
  },

  searchGame(query) {
    if (!query) {
      set({
        filteredGames: get().games.filter(
          (g) => g.hidden === 'false' || !g.hidden
        ),
      });
      return;
    }
    set({
      filteredGames: get().games.filter((g) =>
        g.name.toLowerCase().includes(query.toLowerCase())
      ),
    });
  },

  sortGames(option = 'name') {
    const games = [...get().filteredGames];
    if (option === 'name') {
      games.forEach((g) => {
        if (!g.sort_name) g.sort_name = g.name;
      });
    }
    games.sort((a, b) => {
      if (a[option] < b[option]) return -1;
      if (a[option] > b[option]) return 1;
      return 0;
    });
    set({ filteredGames: games });
  },

  filterGames(on = 'name', value = '', or_ = '') {
    const { games } = get();
    if (!value) {
      set({
        filteredGames: games.filter((g) => g.hidden === 'false' || !g.hidden),
      });
      return;
    }
    if (['Not Set', 'Not Rated', 'No Tags', 'Unknown'].includes(value)) {
      set({
        filteredGames: games.filter((g) => !g[on] || g[on] === ''),
      });
      return;
    }
    set({
      filteredGames: games.filter(
        (g) =>
          g[on]?.toLowerCase().includes(value.toLowerCase()) ||
          (or_ && g[on]?.toLowerCase().includes(or_.toLowerCase()))
      ),
    });
  },

  async loadCategory(category) {
    set({ loading: true });
    try {
      const games = sortByName(await db.getGamesByCategory(category));
      set({ games, filteredGames: games });
    } catch {
      toast.error('Failed to load category');
    } finally {
      set({ loading: false });
    }
  },

  async loadPlatform(platform) {
    set({ loading: true });
    try {
      const allGames = sortByName(await db.getGames());
      const filtered = allGames.filter((g) => g.platforms?.includes(platform));
      set({ games: allGames, filteredGames: filtered });
    } catch {
      toast.error('Failed to load games');
    } finally {
      set({ loading: false });
    }
  },

  async loadStatus(status) {
    set({ loading: true });
    try {
      const allGames = sortByName(await db.getGames());
      const filtered = allGames.filter((g) => g.status === status);
      set({ games: allGames, filteredGames: filtered });
    } catch {
      toast.error('Failed to load games');
    } finally {
      set({ loading: false });
    }
  },

  async loadRecentPlayed() {
    set({ loading: true });
    try {
      console.time('[PERF] loadRecentPlayed');
      const allGames = await db.getGames();
      console.log('[PERF] loadRecentPlayed - Total games:', allGames.length);

      const played = allGames.filter((g) => g.stats && g.stats.length > 0);
      console.log('[PERF] loadRecentPlayed - Games with stats:', played.length);

      played.sort((a, b) => {
        const lastA =
          a.stats.length > 0
            ? Math.max(
                ...a.stats.map((s) => new Date(s.date_of_play).getTime())
              )
            : 0;
        const lastB =
          b.stats.length > 0
            ? Math.max(
                ...b.stats.map((s) => new Date(s.date_of_play).getTime())
              )
            : 0;
        return lastB - lastA;
      });

      console.timeEnd('[PERF] loadRecentPlayed');
      set({ games: allGames, filteredGames: played });
    } catch (e) {
      console.error('[ERROR] loadRecentPlayed:', e);
      toast.error('Failed to load recent games');
    } finally {
      set({ loading: false });
    }
  },

  async loadInstalled() {
    set({ loading: true });
    try {
      console.time('[PERF] loadInstalled');
      const allGames = sortByName(await db.getGames());

      const epicStore = useEpicStore.getState();
      const gogStore = useGogStore.getState();

      await Promise.all([
        epicStore.fetchInstalledGames().catch(() => {}),
        gogStore.fetchInstalledGames().catch(() => {}),
      ]);

      const epicInstalledAppNames = new Set(
        epicStore.installedGames.map((g) => g.app_name)
      );
      const gogInstalledGameIds = new Set(
        gogStore.installedGames.map((g) => g.game_id)
      );

      const installed = allGames.filter((g) => {
        if (g.exec_file && g.game_dir) return true;

        if (g.importer_id === 'epic' && g.exec_args) {
          const appName = g.exec_args.split(':')[1];
          if (appName && epicInstalledAppNames.has(appName)) return true;
        }

        if (g.importer_id === 'gog' && g.exec_args) {
          const gameId = g.exec_args.split(':')[1];
          if (gameId && gogInstalledGameIds.has(gameId)) return true;
        }

        return false;
      });

      console.log(
        '[PERF] loadInstalled - Total:',
        allGames.length,
        'Installed:',
        installed.length
      );
      console.log(
        '[PERF] loadInstalled - Epic:',
        epicInstalledAppNames.size,
        'GOG:',
        gogInstalledGameIds.size
      );
      console.timeEnd('[PERF] loadInstalled');
      set({ games: allGames, filteredGames: installed });
    } catch (e) {
      console.error('[ERROR] loadInstalled:', e);
      toast.error('Failed to load installed games');
    } finally {
      set({ loading: false });
    }
  },

  async loadGameExtras(id: string): Promise<void> {
    try {
      console.time(`[PERF] loadGameExtras for game ${id}`);
      const game = get().games.find((g) => g.id === id);
      if (!game) return;

      if (game.screenshots && game.screenshots.length > 0) {
        console.log(`[PERF] Game ${id} extras already loaded, skipping`);
        return;
      }

      const updated = await refreshGameLinks(game);

      const games = get().games.map((g) => (g.id === id ? updated : g));
      const filteredGames = get().filteredGames.map((g) =>
        g.id === id ? updated : g
      );
      set({ games, filteredGames });

      if (get().currentGame?.id === id) {
        set({ currentGame: updated });
      }

      console.timeEnd(`[PERF] loadGameExtras for game ${id}`);
    } catch (e) {
      console.error(`[ERROR] loadGameExtras for game ${id}:`, e);
    }
  },

  async getCountForCategory(name) {
    if (name === 'All') return get().games.length;
    if (name === 'Installed') return 0;
    if (['Steam', 'Epic Games', 'GOG'].includes(name)) {
      const allGames = await db.getGames();
      return allGames.filter((g) => g.platforms?.includes(name)).length;
    }
    try {
      const games = await db.getGamesByCategory(name);
      return games.length;
    } catch {
      return 0;
    }
  },

  getAllFilters(): FilterGroup[] {
    const { games } = get();
    const unique = (arr: string[]) => [...new Set(arr)];
    const extract = (field: string, fallback: string) =>
      unique(games.map((g) => g[field] || fallback)).map((v) => ({
        cname: v,
        value: v,
        code: field,
      }));

    return [
      {
        name: 'Genres',
        values: unique(
          games.flatMap((g) =>
            (g.genres + (g.styles ? ',' + g.styles : ''))
              .split(',')
              .filter(Boolean)
          )
        ).map((v) => ({ cname: v, value: v, code: 'genres' })),
      },
      { name: 'Platforms', values: extract('platforms', 'Unknown') },
      { name: 'Tags', values: extract('tags', 'No Tags') },
      { name: 'Developers', values: extract('developers', 'Unknown') },
      { name: 'Editors', values: extract('editors', 'Unknown') },
      { name: 'Status', values: extract('status', 'Not Yet') },
      { name: 'Rating', values: extract('rating', 'Not Rated') },
      {
        name: 'Hidden',
        values: [
          { cname: 'Yes', value: 'true', code: 'hidden' },
          { cname: 'No', value: 'false', code: 'hidden' },
        ],
      },
    ];
  },

  async fetchAchievements(gameId) {
    if (!gameId) return;
    try {
      const raw = await invoke<string>('get_achievements_for_game', { gameId });
      const parsed: ITrophy[] = JSON.parse(raw);
      parsed.sort((a, b) => b.unlocked.localeCompare(a.unlocked));
      set({ achievements: parsed });
    } catch {
      set({ achievements: [] });
    }
  },

  async launchGame(gameId, launcherId = '') {
    const { useAppStore } = await import('@/stores/appStore');
    useAppStore.getState().stopBGMusic();

    // Only these importer ids have a dedicated native-launcher/protocol-link
    // path below. Every other game must fall through to the generic local
    // exec_file/game_dir launch
    const knownStoreLaunchers = ['epic', 'gog', 'steam'];

    if (launcherId && knownStoreLaunchers.includes(launcherId)) {
      if (launcherId === 'epic') {
        const game = get().games.find(
          (g) => g.game_importer_id === gameId || g.id === gameId
        );
        if (game?.exec_args?.startsWith('epic:')) {
          const parts = game.exec_args.split(':');
          const appName = parts[1];
          if (appName) {
            try {
              const { useEpicStore } = await import('@/stores/epicStore');
              const pid = await useEpicStore.getState().launchGame(appName);
              if (pid > 0) return;
            } catch (e) {
              console.error(
                'Failed to launch via Epic client, falling back to protocol link:',
                e
              );
            }
          }
        }
      }

      if (launcherId === 'gog') {
        try {
          const { useGogStore } = await import('@/stores/gogStore');
          const pid = await useGogStore.getState().launchGame(gameId);
          if (pid > 0) return;
        } catch (e) {
          console.error('Failed to launch GOG game:', e);
          toast.error('Failed to launch GOG game: ' + String(e));
          return;
        }
      }

      let link = '';
      if (launcherId === 'steam') link = 'steam://rungameid/' + gameId;
      else if (launcherId === 'epic')
        link =
          'com.epicgames.launcher://apps/' +
          gameId +
          '?action=launch&silent=true';

      if (link) {
        await openUrl(link);
        return;
      }
    }

    try {
      await invoke('launch_game', { gameId });
    } catch (e) {
      console.error('Failed to launch game:', e);
      toast.error('Failed to launch game: ' + String(e));
    }
  },

  async killGame(pid) {
    await invoke('kill_game', { pid });
    toast.info('Game ended');
  },

  async searchAPI(name, provider, strict, currentGame?) {
    const raw = await invoke<string>('search_metadata', {
      gameName: name,
      pluginName: provider,
      strict,
    });
    if (!raw || raw === '[]') throw new Error('No games found');
    if (raw === 'No credentials found') throw new Error('No credentials found');

    if (provider === 'steam_grid') return JSON.parse(JSON.parse(raw));

    const parsed = JSON.parse(raw);
    const first = JSON.parse(parsed[0]);
    const type = first.url ? 'audio' : 'game';

    if (type === 'audio') {
      return parsed.map((a: string) => {
        const audio = JSON.parse(a);
        return {
          name: audio.name ?? '',
          url: audio.url ?? '',
          jaquette: audio.jaquette ?? '',
        };
      });
    }

    return parsed.map((p: string) => {
      let game = JSON.parse(p);
      if (currentGame) {
        const old = { ...currentGame } as any;
        delete old.jaquette;
        delete old.background;
        delete old.logo;
        delete old.icon;
        delete old.backgroundMusic;
        for (const k of Object.keys(old)) {
          if (game[k] === undefined) game[k] = old[k];
        }
      }
      return createNewGame(game);
    });
  },

  async autoIGDB(name) {
    try {
      const results = await get().searchAPI(name, 'igdb', true);
      if (results.length > 0) return results[0];
      return 'No games found';
    } catch (e: any) {
      return e.message;
    }
  },

  /// Some importers (Steam, Epic) don't provide a description or cover art of
  /// their own - this backfills those specific games from IGDB, one at a
  /// time, without touching anything the importer itself is the source of
  /// truth
  async enrichMissingMetadataFromIGDB(importerId) {
    const { useImportProgressStore } = await import(
      '@/stores/importProgressStore'
    );
    const progressStore = useImportProgressStore.getState();

    const all = await db.getGames();
    const targets = all.filter(
      (g) => g.importer_id === importerId && !g.description && !g.jaquette
    );
    const total = targets.length;
    if (total === 0) return;

    for (let i = 0; i < targets.length; i++) {
      const target = targets[i];
      progressStore.setProgress(importerId as any, {
        percent: Math.round(((i + 1) / total) * 100),
        current: i + 1,
        total,
        label: `Fetching metadata: ${target.name}`,
      });

      const result = await get().autoIGDB(target.name);
      if (typeof result === 'string') {
        console.error(
          `IGDB metadata lookup failed for "${target.name}": ${result}`
        );
        if (i === 0) {
          toast.error(
            'Could not fetch metadata from IGDB: ' + result
          );
          break;
        }
        continue;
      }

      const merged: IGame = {
        ...target,
        description: result.description || target.description,
        genres: result.genres || target.genres,
        styles: result.styles || target.styles,
        critic_score: result.critic_score || target.critic_score,
        release_date: result.release_date || target.release_date,
        developers: result.developers || target.developers,
        editors: result.editors || target.editors,
        igdb_id: result.igdb_id || target.igdb_id,
      };

      try {
        await db.postGame(merged);
        await db.saveMediaToExternalStorage({
          ...merged,
          jaquette: result.jaquette,
          jaquette_horizontal: result.jaquette_horizontal,
          background: result.background,
          logo: result.logo,
          icon: result.icon,
        });
      } catch (e) {
        console.error(`Failed to save IGDB metadata for "${target.name}":`, e);
      }
    }

    progressStore.clear(importerId as any);
    await get().fetchGames();
  },

  async linkGameToNative(gameId, targetImporter, nativeId) {
    await invoke('link_game_to_native', {
      gameId,
      targetImporter,
      nativeId,
    });
    const [refreshed] = await db.getGame(gameId);
    if (refreshed) {
      get().setGame(gameId, refreshed);
    }
    await get().fetchGames();
  },

  async autoDownloadBGMusic(game) {
    if (game.backgroundMusic) return;
    try {
      const results = await get().searchAPI(game.name, 'ytdl', true, game);
      if (results?.length > 0 && results[0].url) {
        await invoke<string>('download_yt_audio', {
          url: results[0].url,
          id: game.id,
        });
        const refreshed = await refreshGameLinks(game);
        get().setGame(game.id, refreshed);
      }
    } catch {}
  },

  async getHiddenGames() {
    const all = await db.getGames();
    return all.filter((g) => g.hidden === 'true');
  },
}));
