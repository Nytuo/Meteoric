class ITrophy {

}

export default interface IGame {
    id: string;
    nom: string;
    nomTri: string;
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
    images: string;
    screenshots: string[];
    game_dir: string;
    exec_file: string;
    tags: string;
    backgroundMusic: string;
    status: string;
    time_played: string;
    trophies: ITrophy[];
    trophies_count: string;
    last_time_played: string;
}