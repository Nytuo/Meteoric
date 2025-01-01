interface ITrophy {
	id: string,
    game_id: string,
    name: string,
    description: string,
    visible: string,
    date_of_unlock: string,
    importer_id: string,
    image_url_locked: string,
    image_url_unlocked: string,
    unlocked: string,
}

interface IStat {
	id: string;
	game_id: string;
	time_played: string;
	date_of_play: Date;
}

interface IGame {
	id: string;
	game_importer_id: string;
	importer_id: string;
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
	exec_args: string;
	tags: string;
	backgroundMusic: string;
	status: string;
	trophies: string;
	trophies_unlocked: string;
	hidden: string;
	stats: IStat[];

	[key: string]: any;
}

export { IGame, IStat, ITrophy };
export default IGame;
