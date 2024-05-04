interface ITrophy {
    id: string;
    name: string;
    description: string;
    icon: string;
    game_id: string;
    status: string;
    date_obtained: string;
    platform: string;
}

export default interface IGame {
    [key: string]: any;
    id: string;
    name: string;
    sort_name: string;
    jaquette: string;
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
    tags: string;
    backgroundMusic: string;
    status: string;
    time_played: string;
    trophies: ITrophy[];
    trophies_unlocked: string;
    last_time_played: string;
}