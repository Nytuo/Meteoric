export interface ITrophy {
  id: string;
  game_id: string;
  name: string;
  description: string;
  visible: string;
  date_of_unlock: string;
  importer_id: string;
  image_url_locked: string;
  image_url_unlocked: string;
  unlocked: string;
}

export interface IStat {
  id: string;
  game_id: string;
  time_played: string;
  date_of_play: Date;
}

export interface IGame {
  id: string;
  game_importer_id: string;
  importer_id: string;
  igdb_id: string;
  name: string;
  sort_name: string;
  jaquette: string;
  jaquette_horizontal: string;
  background: string;
  logo: string;
  icon: string;
  rating: string;
  platforms: string;
  description: string;
  critic_score: string;
  genres: string;
  styles: string;
  release_date: string;
  developers: string;
  editors: string;
  videos: string[];
  screenshots: string[];
  game_dir: string;
  exec_file: string;
  exec_args: string;
  tags: string;
  backgroundMusic: string;
  status: string;
  trophies: string;
  trophies_unlocked: string;
  hidden: string;
  metadata_source: string;
  stats: IStat[];
  [key: string]: any;
}

export const GAME_STATUSES = [
  'Not started',
  'In progress',
  'On hold',
  'Dropped',
  'Completed',
  'Platinum',
] as const;

export type GameStatus = (typeof GAME_STATUSES)[number];

export const GAME_STATUS_I18N_KEYS: Record<GameStatus, string> = {
  'Not started': 'not-started',
  'In progress': 'in-progress',
  'On hold': 'on-hold',
  Dropped: 'dropped',
  Completed: 'completed',
  Platinum: 'platinum',
};

export interface ICategory {
  id: string;
  name: string;
  icon: string;
  games: string;
  filters: string[];
  views: string[];
  background: string;
  count?: number;
}

export interface ISettings {
  view?: 'list' | 'card';
  sort?: 'asc' | 'desc';
  filter?: 'all' | 'favorite';
  gap?: string;
  zoom?: string;
  displayInfo?: string;
  language?: string;
  theme?: string;
  accent?: string;
  apiKeys?: string[];
  preferStoreMetadataOnLink?: string;
  hiddenStatusCategories?: string;
}

export interface IGameLaunchedMessage {
  gamePID: number;
  isError?: boolean;
  errorMessage?: string;
  isEnded?: boolean;
}

export function createEmptyGame(): IGame {
  return {
    id: '-1',
    game_importer_id: '',
    importer_id: '',
    igdb_id: '',
    trophies: '',
    name: '',
    sort_name: '',
    rating: '',
    platforms: '',
    tags: '',
    description: '',
    critic_score: '',
    genres: '',
    styles: '',
    release_date: '',
    developers: '',
    editors: '',
    status: '',
    trophies_unlocked: '',
    hidden: 'false',
    metadata_source: '',
    jaquette: '',
    jaquette_horizontal: '',
    background: '',
    logo: '',
    icon: '',
    backgroundMusic: '',
    exec_file: '',
    game_dir: '',
    exec_args: '',
    screenshots: [],
    videos: [],
    stats: [],
  };
}
