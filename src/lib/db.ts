import { convertFileSrc, invoke } from '@tauri-apps/api/core';
import { configDir } from '@tauri-apps/api/path';
import { platform } from '@tauri-apps/plugin-os';
import { exists } from '@tauri-apps/plugin-fs';
import { save } from '@tauri-apps/plugin-dialog';
import { BaseDirectory } from '@tauri-apps/plugin-fs';
import type { IGame, IStat, ICategory, ISettings } from '@/types';

async function getExtraContentPath(): Promise<string> {
  const configDirPath = await configDir();
  const p = platform();
  if (p === 'windows')
    return (
      configDirPath + '\\Nytuo\\Meteoric\\config\\meteoric_extra_content\\'
    );
  if (p === 'macos')
    return configDirPath + '/fr.Nytuo.Meteoric/meteoric_extra_content/';
  return configDirPath + '/meteoric/meteoric_extra_content/';
}

async function getMusicBasePath(): Promise<string> {
  const p = platform();
  if (p === 'windows')
    return 'Nytuo\\Meteoric\\config\\meteoric_extra_content\\';
  if (p === 'macos') return 'fr.Nytuo.Meteoric/meteoric_extra_content/';
  return 'meteoric/meteoric_extra_content/';
}

async function getAllImgAndVideo(
  id: string,
  game: IGame,
  basePath: string
): Promise<IGame> {
  const allImgLoc = await invoke<string>('get_all_images_location', { id });
  const parsedImgs = JSON.parse(allImgLoc);
  game.screenshots = parsedImgs.map((loc: string) =>
    convertFileSrc(basePath + loc)
  );

  const allVidLoc = await invoke<string>('get_all_videos_location', { id });
  const parsedVids = JSON.parse(allVidLoc);
  game.videos = parsedVids.map((loc: string) => convertFileSrc(basePath + loc));

  const musicBase = await getMusicBasePath();
  const musicPath = musicBase + id + '/musics/theme.mp3';
  game.backgroundMusic = (await exists(musicPath, {
    baseDir: BaseDirectory.Config,
  }))
    ? convertFileSrc(basePath + id + '/musics/theme.mp3')
    : '';

  return game;
}

export async function parseGames(raw: string): Promise<IGame[]> {
  console.time('[PERF] parseGames - JSON parsing');
  const cleaned = raw.replaceAll(String.raw`\u{a0}`, String.raw`\u00A0`);
  let games: IGame[];
  try {
    games = JSON.parse(cleaned) as IGame[];
    games.forEach((g) => {
      g.stats = JSON.parse((g.stats as any).toString());
      g.stats.forEach((s: IStat) => {
        s.date_of_play = new Date(s.date_of_play);
      });
    });
  } catch {
    console.error('[ERROR] parseGames - Failed to parse games JSON');
    return [];
  }
  console.timeEnd('[PERF] parseGames - JSON parsing');
  console.log('[PERF] parseGames - Parsed', games.length, 'games');

  console.time('[PERF] parseGames - Build basic image paths');
  const basePath = await getExtraContentPath();

  // Build image paths dynamically checking for correct extensions
  await Promise.all(
    games.map(async (game) => {
      const id = game.id;
      try {
        const imagePaths = await invoke<string>('get_game_image_paths', { id });
        const paths = JSON.parse(imagePaths) as Record<string, string>;

        game.jaquette = paths.jaquette
          ? convertFileSrc(basePath + paths.jaquette)
          : '';
        game.jaquette_horizontal = paths.jaquette_horizontal
          ? convertFileSrc(basePath + paths.jaquette_horizontal)
          : '';
        game.background = paths.background
          ? convertFileSrc(basePath + paths.background)
          : '';
        game.logo = paths.logo ? convertFileSrc(basePath + paths.logo) : '';
        game.icon = paths.icon ? convertFileSrc(basePath + paths.icon) : '';
      } catch (e) {
        console.error(
          `[ERROR] parseGames - Failed to get image paths for game ${id}:`,
          e
        );
        game.jaquette = '';
        game.jaquette_horizontal = '';
        game.background = '';
        game.logo = '';
        game.icon = '';
      }

      // Initialize empty arrays - will be loaded on demand
      game.screenshots = [];
      game.videos = [];
      game.backgroundMusic = '';
    })
  );

  console.timeEnd('[PERF] parseGames - Build basic image paths');
  return games;
}

export async function refreshGameLinks(game: IGame): Promise<IGame> {
  const basePath = await getExtraContentPath();
  const id = game.id;
  const ts = Date.now();

  try {
    const imagePaths = await invoke<string>('get_game_image_paths', { id });
    const paths = JSON.parse(imagePaths) as Record<string, string>;

    game.jaquette = paths.jaquette
      ? convertFileSrc(basePath + paths.jaquette) + '?' + ts
      : '';
    game.jaquette_horizontal = paths.jaquette_horizontal
      ? convertFileSrc(basePath + paths.jaquette_horizontal) + '?' + ts
      : '';
    game.background = paths.background
      ? convertFileSrc(basePath + paths.background) + '?' + ts
      : '';
    game.logo = paths.logo
      ? convertFileSrc(basePath + paths.logo) + '?' + ts
      : '';
    game.icon = paths.icon
      ? convertFileSrc(basePath + paths.icon) + '?' + ts
      : '';
  } catch (e) {
    console.error(
      `[ERROR] refreshGameLinks - Failed to get image paths for game ${id}:`,
      e
    );
  }

  // Load screenshots, videos, and music on-demand
  await getAllImgAndVideo(id, game, basePath);

  return game;
}

export const db = {
  async getGames(): Promise<IGame[]> {
    console.time('[PERF] db.getGames - Invoke backend');
    const raw = await invoke<string>('get_all_games');
    console.timeEnd('[PERF] db.getGames - Invoke backend');
    console.log(
      '[PERF] db.getGames - Raw data size:',
      (raw.length / 1024).toFixed(2),
      'KB'
    );
    return parseGames(raw);
  },

  async getGamesByCategory(category: string): Promise<IGame[]> {
    const raw = await invoke<string>('get_games_by_category', { category });
    return parseGames(raw);
  },

  async getGame(id: string): Promise<IGame[]> {
    const raw = await invoke<string>('get_game', { id });
    return parseGames(raw);
  },

  async postGame(game: IGame): Promise<string> {
    const g = { ...game } as any;
    if (Array.isArray(g.stats)) {
      g.stats = g.stats.map((s: IStat) => ({
        ...s,
        date_of_play: new Date(s.date_of_play).toISOString(),
      }));
    }
    return invoke<string>('post_game', { game: JSON.stringify(g) });
  },

  async deleteGame(id: string): Promise<void> {
    await invoke('delete_game', { id });
  },

  async getCategories(): Promise<ICategory[]> {
    const raw = await invoke<string>('get_all_categories');
    return JSON.parse(raw) as ICategory[];
  },

  async createCategory(
    name: string,
    icon: string,
    games: string[],
    filters: string[],
    views: string[],
    background: string
  ) {
    await invoke('create_category', {
      name,
      icon,
      games,
      filters,
      views,
      background,
    });
  },

  async addGameToCategory(gameId: string, categoryId: string) {
    await invoke('add_game_to_category', { gameId, categoryId });
  },

  async removeGameFromCategory(gameId: string, categoryId: string) {
    await invoke('remove_game_from_category', { gameId, categoryId });
  },

  async getSettings(): Promise<ISettings> {
    const raw = await invoke<string>('get_settings');
    const parsed = JSON.parse(raw);
    const settings: ISettings = {};
    parsed.forEach((s: { name: string; value: string }) => {
      if (s.name === 'gap' || s.name === 'zoom') {
        (settings as any)[s.name] = parseInt(s.value, 10);
        return;
      }
      (settings as any)[s.name] = s.value;
    });
    return settings;
  },

  async setSettings(settings: ISettings) {
    const arr = Object.entries(settings).map(([name, value]) => ({
      name,
      value,
    }));
    await invoke('set_settings', { settings: JSON.stringify(arr) });
  },

  async uploadFile(file: ArrayBuffer, typeOf: string, id: string) {
    const fileContent = Array.from(new Uint8Array(file));
    await invoke('upload_file', { fileContent, typeOf, id });
  },

  async deleteElement(typeOf: string, gameID: string, elementToDelete = '') {
    await invoke('delete_element', { typeOf, id: gameID, elementToDelete });
  },

  async saveMediaToExternalStorage(game: IGame) {
    const exportGame = {
      jaquette: game.jaquette,
      jaquette_horizontal: game.jaquette_horizontal,
      background: game.background,
      logo: game.logo,
      icon: game.icon,
      screenshots: game.screenshots,
      videos: game.videos,
      audio: game.backgroundMusic,
    };
    await invoke('save_media_to_external_storage', {
      id: game.id,
      game: JSON.stringify(exportGame),
    });
  },

  async exportToCSV() {
    const path = await save({
      filters: [{ name: 'CSV', extensions: ['csv'] }],
      title: 'Export Games To CSV',
    });
    if (path) await invoke('export_game_database_to_csv', { path });
  },

  async exportToArchive() {
    const path = await save({
      filters: [{ name: 'ZIP', extensions: ['zip'] }],
      title: 'Export Games To Archive',
    });
    if (path) await invoke('export_game_database_to_archive', { path });
  },
};
