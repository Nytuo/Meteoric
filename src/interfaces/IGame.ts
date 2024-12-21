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

interface IStat {
	id: string;
	game_id: string;
	time_played: string;
	date_of_play: Date;
}

interface IGame {
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
