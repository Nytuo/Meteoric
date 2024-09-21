import { Injectable } from '@angular/core';
import IGame from '../../interfaces/IGame';
import { BehaviorSubject, Observable } from 'rxjs';
import { DBService } from './db.service';
import { GenericService } from './generic.service';
import { invoke } from '@tauri-apps/api/tauri';

@Injectable({
	providedIn: 'root',
})
export class GameService {
	private gamesObservable = new BehaviorSubject<IGame[]>([]);
	private gameObservable = new BehaviorSubject<IGame>({} as IGame);
	private games: IGame[] = [];

	constructor(private db: DBService, private genericService: GenericService) {}

	getGamesObservable(): Observable<IGame[]> {
		return this.gamesObservable.asObservable();
	}

	getGameObservable(): Observable<IGame> {
		return this.gameObservable.asObservable();
	}

	setGameObservable(game: IGame | undefined) {
		if (game === undefined) {
			return;
		}
		this.gameObservable.next(game);
	}

	sortGames(option = 'name') {
		if (option === 'name') {
			this.games.forEach((game) => {
				if (game.sort_name === undefined) {
					game.sort_name = game.name;
				}
			});
		}
		this.games.sort((a, b) => {
			if (a[option] < b[option]) {
				return -1;
			}
			if (a[option] > b[option]) {
				return 1;
			}
			return 0;
		});
		this.gamesObservable.next(this.games);
	}

	filterGames(on = 'name', value = '') {
		if (value === '') {
			this.gamesObservable.next(this.games);
			return;
		}
		if (
			value === 'Not Set' ||
			value === 'Not Rated' ||
			value === 'No Tags' ||
			value === 'Unknown'
		) {
			this.gamesObservable.next(
				this.games.filter((game) => game[on] === undefined || game[on] === ''),
			);
			return;
		}
		this.gamesObservable.next(
			this.games.filter((game) =>
				game[on].toLowerCase().includes(value.toLowerCase()),
			),
		);
	}

	getAllFilters() {
		const filters: [
			{
				name: 'Genres';
				values: { cname: string; value: string; code: string }[];
			},
			{
				name: 'Platforms';
				values: { cname: string; value: string; code: string }[];
			},
			{
				name: 'Tags';
				values: { cname: string; value: string; code: string }[];
			},
			{
				name: 'Developers';
				values: { cname: string; value: string; code: string }[];
			},
			{
				name: 'Editors';
				values: { cname: string; value: string; code: string }[];
			},
			{
				name: 'Status';
				values: { cname: string; value: string; code: string }[];
			},
			{
				name: 'Rating';
				values: { cname: string; value: string; code: string }[];
			},
		] = [] as any;

		filters.push({
			name: 'Genres',
			values: this.games
				.map((game) => {
					return game.genres.concat(game.styles ? ',' + game.styles : '');
				})
				.flat()
				.filter((value, index, self) => self.indexOf(value) === index)
				.map((genre) => {
					return genre.split(',');
				})
				.flat()
				.filter((value, index, self) => self.indexOf(value) === index)
				.map((value) => {
					return { cname: value, value: value, code: 'genres' };
				}),
		});
		filters.push({
			name: 'Platforms',
			values: this.games
				.map((game) => {
					return game.platforms ? game.platforms : 'Unknown';
				})
				.flat()
				.filter((value, index, self) => self.indexOf(value) === index)
				.map((value) => {
					return { cname: value, value: value, code: 'platforms' };
				}),
		});
		filters.push({
			name: 'Tags',
			values: this.games
				.map((game) => {
					return game.tags ? game.tags : 'No Tags';
				})
				.flat()
				.filter((value, index, self) => self.indexOf(value) === index)
				.map((value) => {
					return { cname: value, value: value, code: 'tags' };
				}),
		});
		filters.push({
			name: 'Developers',
			values: this.games
				.map((game) => {
					return game.developers ? game.developers : 'Unknown';
				})
				.flat()
				.filter((value, index, self) => self.indexOf(value) === index)
				.map((value) => {
					return { cname: value, value: value, code: 'developers' };
				}),
		});
		filters.push({
			name: 'Editors',
			values: this.games
				.map((game) => {
					return game.editors ? game.editors : 'Unknown';
				})
				.flat()
				.filter((value, index, self) => self.indexOf(value) === index)
				.map((value) => {
					return { cname: value, value: value, code: 'editors' };
				}),
		});
		filters.push({
			name: 'Status',
			values: this.games
				.map((game) => {
					return game.status ? game.status : 'Not Set';
				})
				.flat()
				.filter((value, index, self) => self.indexOf(value) === index)
				.map((value) => {
					return { cname: value, value: value, code: 'status' };
				}),
		});
		filters.push({
			name: 'Rating',
			values: this.games
				.map((game) => {
					return game.rating ? game.rating : 'Not Rated';
				})
				.filter((value, index, self) => self.indexOf(value) === index)
				.map((value) => {
					return { cname: value, value: value, code: 'rating' };
				}),
		});

		return filters;
	}

	async getGames() {
		await this.db.getGames().then((games) => {
			if (games === undefined) {
				console.log('getGames: no games found');
				return;
			}
			this.games = games;
			this.gamesObservable.next(this.games);
		});
	}

	loadGamesOfACategory(category: string) {
		this.db.getGamesByCategory(category).then((games) => {
			if (games === undefined) {
				return;
			}
			this.games = games;
			this.gamesObservable.next(this.games);
		});
	}

	async getCountOfGamesInCategory(category: string): Promise<number> {
		if (category === 'All') {
			return this.games.length;
		}
		if (category === 'Installed') {
			// TODO : implement installed count
			return 0;
		}
		if (category === 'Steam') {
			return await this.getGamesByPlatform('Steam', true).then((count) => {
				if (count === undefined) {
					return 0;
				}
				return count;
			});
		}
		if (category === 'Epic Games') {
			return await this.getGamesByPlatform('Epic Games', true).then((count) => {
				if (count === undefined) {
					return 0;
				}
				return count;
			});
		}
		if (category === 'GOG') {
			return await this.getGamesByPlatform('GOG', true).then((count) => {
				if (count === undefined) {
					return 0;
				}
				return count;
			});
		}
		return new Promise<number>((resolve, reject) => {
			this.db.getGamesByCategory(category).then((games) => {
				if (games === undefined) {
					return reject();
				}
				resolve(games.length);
			});
		});
	}

	getGame(id: string) {
		this.genericService.changeDisplayBookmark(true);
		return this.games.find((game) => game.id === id);
	}

	async getGamesByPlatform(platform: string, count: boolean = false) {
		return new Promise<number | void>(async (resolve, reject) => {
			await this.db.getGames().then((games) => {
				if (games === undefined) {
					console.log('getGames: no games found');
					reject();
					return;
				}
				if (count) {
					resolve(
						games.filter((game) => game.platforms.includes(platform)).length,
					);
					return;
				}
				this.games = games;
				this.gamesObservable.next(
					this.games.filter((game) => game.platforms.includes(platform)),
				);
				resolve();
			});
		});
	}

	getGamesByGenre(genre: string) {
		return this.games.filter((game) => game.genres.includes(genre));
	}

	setGame(id: string, game: IGame) {
		this.games = this.games.map((g) => {
			if (g.id === id) {
				return game;
			}
			return g;
		});
		this.gamesObservable.next(this.games);
		this.gameObservable.next(game);
	}

	async autoIGDBImport(gameName: string): Promise<IGame | string> {
		return new Promise<IGame | string>(async (resolve, reject) => {
			await invoke<string>('search_metadata', {
				gameName: gameName,
				pluginName: 'igdb',
				strict: true,
			}).then((games) => {
				if (games === undefined) {
					reject('No games found');
				}
				if (games === 'No credentials found') {
					reject('No credentials found, please check your configuration');
				}

				let searchedGames: string[];
				let currentGame: any;

				searchedGames = JSON.parse(games);
				let theFirstGame = JSON.parse(searchedGames[0]);
				if (theFirstGame === undefined) {
					return;
				}
				let api_game = eval(theFirstGame);
				//merge the two objects with priority to the new one

				let newGame: IGame = this.create_new_game(api_game);
				resolve(newGame);
			});
		});
	}

	async searchGameInAPI(
		gameName: string,
		provider: string,
		strict: boolean,
		currentGame?: IGame,
	): Promise<IGame[] | string> {
		return new Promise<IGame[] | string>(async (resolve, reject) => {
			await invoke<string>('search_metadata', {
				gameName: gameName,
				pluginName: provider,
				strict: strict,
			}).then((games) => {
				let searchedGames: any[] = [];
				if (games === undefined || games.length === 0 || games === '[]') {
					reject('No games found');
					return;
				}
				if (games === 'No credentials found') {
					reject('No credentials found, please check your configuration');
					return;
				}

				if (provider === 'steam_grid') {
					resolve(JSON.parse(JSON.parse(games)));
					return;
				}

				let type = JSON.parse(games) && JSON.parse(JSON.parse(games)[0]);
				type = type.url ? 'audio' : 'game';
				if (type === 'audio') {
					searchedGames = JSON.parse(games);
					let parsedGames: any[] = [];
					searchedGames.forEach((audio) => {
						audio = JSON.parse(audio);
						let newAudio = {
							name: audio.name ? audio.name : '',
							url: audio.url ? audio.url : '',
							jaquette: audio.jaquette ? audio.jaquette : '',
						};
						parsedGames.push(newAudio);
					});
					resolve(parsedGames);
					return;
				}
				let parsedGames: IGame[] = [];
				searchedGames = JSON.parse(games);
				searchedGames.forEach((api_game) => {
					let oldGame: any = currentGame;
					api_game = JSON.parse(api_game);
					api_game = eval(api_game);
					//merge the two objects with priority to the new one
					if (oldGame !== undefined) {
						delete oldGame.jaquette;
						delete oldGame.background;
						delete oldGame.logo;
						delete oldGame.icon;
						delete oldGame.backgroundMusic;
						for (let key in oldGame) {
							if (oldGame.hasOwnProperty(key)) {
								if (api_game[key] === undefined) {
									api_game[key] = oldGame[key];
								}
							}
						}
					}

					let newGame = this.create_new_game(api_game);
					parsedGames.push(newGame);
				});
				resolve(parsedGames);
			});
		});
	}

	public searchGame(gameName: string): void {
		this.gamesObservable.next(
			this.games.filter((game) =>
				game.name.toLowerCase().includes(gameName.toLowerCase()),
			),
		);
	}

	private create_new_game(api_game: any): IGame {
		return {
			id: api_game.id ? api_game.id : '-1',
			trophies: api_game.trophies ? api_game.trophies : '',
			name: api_game.name ? api_game.name : '',
			sort_name: api_game.name ? api_game.name : '',
			rating: api_game.rating ? api_game.rating : '',
			platforms: api_game.platforms ? api_game.platforms : '',
			tags: api_game.tags ? api_game.tags : '',
			description: api_game.description ? api_game.description : '',
			critic_score: api_game.critic_score
				? Math.round(api_game.critic_score).toString()
				: '',
			genres: api_game.genres ? api_game.genres : '',
			styles: api_game.styles ? api_game.styles : '',
			release_date: api_game.release_date ? api_game.release_date : '',
			developers: api_game.developers ? api_game.developers : '',
			editors: api_game.editors ? api_game.editors : '',
			status: api_game.status ? api_game.status : '',
			time_played: api_game.time_played ? api_game.time_played : '',
			trophies_unlocked: api_game.trophies_unlocked
				? api_game.trophies_unlocked
				: '',
			last_time_played: api_game.last_time_played
				? api_game.last_time_played
				: '',
			jaquette: api_game.cover ? api_game.cover : '',
			background: api_game.background ? api_game.background : '',
			logo: api_game.logo ? api_game.logo : '',
			icon: api_game.icon ? api_game.icon : '',
			backgroundMusic: api_game.backgroundMusic ? api_game.backgroundMusic : '',
			exec_file: api_game.exec_file ? api_game.exec_file : '',
			exec_args: api_game.exec_args ? api_game.exec_args : '',
			game_dir: api_game.game_dir ? api_game.game_dir : '',
			screenshots: api_game.screenshots ? api_game.screenshots : [],
			videos: api_game.videos ? api_game.videos : [],
		};
	}
}
