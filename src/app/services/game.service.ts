import { Injectable } from '@angular/core';
import IGame, { IStat, ITrophy } from '../../interfaces/IGame';
import { BehaviorSubject, Observable } from 'rxjs';
import { DBService } from './db.service';
import { GenericService } from './generic.service';
import { invoke } from '@tauri-apps/api/core';
import { TranslateService } from '@ngx-translate/core';

@Injectable({
	providedIn: 'root',
})
export class GameService {
	private gamesObservable = new BehaviorSubject<IGame[]>([]);
	private gameObservable = new BehaviorSubject<IGame>({} as IGame);
	private games: IGame[] = [];
	private achievementsObservable = new BehaviorSubject<ITrophy[]>([]);

	constructor(
		private db: DBService,
		private genericService: GenericService,
		private translateService: TranslateService,
	) {}

	getGamesObservable(): Observable<IGame[]> {
		return this.gamesObservable.asObservable();
	}

	getGameObservable(): Observable<IGame> {
		return this.gameObservable.asObservable();
	}

	setGameObservable(game: IGame | undefined) {
		if (game === undefined) {
			this.genericService.sendNotification(
				this.translateService.instant('error'),
				this.translateService.instant('no_game_found'),
				'error',
			);
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
		const filters: Array<{
			name: string;
			values: { cname: string; value: string; code: string }[];
		}> = [];

		filters.push({
			name: this.translateService.instant('genres'),
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
			name: this.translateService.instant('platforms'),
			values: this.games
				.map((game) => {
					return game.platforms
						? game.platforms
						: this.translateService.instant('unknown');
				})
				.flat()
				.filter((value, index, self) => self.indexOf(value) === index)
				.map((value) => {
					return { cname: value, value: value, code: 'platforms' };
				}),
		});
		filters.push({
			name: this.translateService.instant('tags'),
			values: this.games
				.map((game) => {
					return game.tags
						? game.tags
						: this.translateService.instant('no_tags');
				})
				.flat()
				.filter((value, index, self) => self.indexOf(value) === index)
				.map((value) => {
					return { cname: value, value: value, code: 'tags' };
				}),
		});
		filters.push({
			name: this.translateService.instant('developers'),
			values: this.games
				.map((game) => {
					return game.developers
						? game.developers
						: this.translateService.instant('unknown');
				})
				.flat()
				.filter((value, index, self) => self.indexOf(value) === index)
				.map((value) => {
					return { cname: value, value: value, code: 'developers' };
				}),
		});
		filters.push({
			name: this.translateService.instant('editors'),
			values: this.games
				.map((game) => {
					return game.editors
						? game.editors
						: this.translateService.instant('unknown');
				})
				.flat()
				.filter((value, index, self) => self.indexOf(value) === index)
				.map((value) => {
					return { cname: value, value: value, code: 'editors' };
				}),
		});
		filters.push({
			name: this.translateService.instant('status'),
			values: this.games
				.map((game) => {
					return game.status
						? game.status
						: this.translateService.instant('not_yet');
				})
				.flat()
				.filter((value, index, self) => self.indexOf(value) === index)
				.map((value) => {
					return { cname: value, value: value, code: 'status' };
				}),
		});
		filters.push({
			name: this.translateService.instant('rating'),
			values: this.games
				.map((game) => {
					return game.rating ? game.rating : 'Not Rated';
				})
				.filter((value, index, self) => self.indexOf(value) === index)
				.map((value) => {
					return { cname: value, value: value, code: 'rating' };
				}),
		});

		filters.push({
			name: this.translateService.instant('hidden'),
			values: [
				{
					cname: this.translateService.instant('yes'),
					value: 'true',
					code: 'hidden',
				},
				{
					cname: this.translateService.instant('no'),
					value: 'false',
					code: 'hidden',
				},
			],
		});

		return filters;
	}

	async getGames() {
		await this.db.getGames().then((games) => {
			if (games === undefined) {
				this.genericService.sendNotification(
					this.translateService.instant('error'),
					this.translateService.instant('no_game_found'),
					'error',
				);
				return;
			}
			this.games = games;
			this.filterGames('hidden', 'false');
		});
	}

	async getHiddenGames() {
		return new Promise<IGame[]>((resolve, reject) => {
			this.db.getGames().then((games) => {
				if (games === undefined) {
					this.genericService.sendNotification(
						this.translateService.instant('error'),
						this.translateService.instant('no_game_found'),
						'error',
					);
					reject();
					return;
				}
				resolve(games);
			});
		});
	}

	loadGamesOfACategory(category: string) {
		this.db.getGamesByCategory(category).then((games) => {
			if (games === undefined) {
				this.genericService.sendNotification(
					this.translateService.instant('error'),
					this.translateService.instant('no_game_found'),
					'error',
				);
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
					this.genericService.sendNotification(
						this.translateService.instant('error'),
						this.translateService.instant('no_game_found'),
						'error',
					);
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
					this.genericService.sendNotification(
						this.translateService.instant('error'),
						this.translateService.instant('no_game_found'),
						'error',
					);
					reject('No games found');
				}
				if (games === 'No credentials found') {
					this.genericService.sendNotification(
						this.translateService.instant('error'),
						this.translateService.instant('no_credentials_found'),
						'error',
					);
					reject(this.translateService.instant('no_credentials_found'));
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
	): Promise<
		IGame[] | { jaquette: string; name: string; url: string }[] | string
	> {
		return new Promise<
			IGame[] | { jaquette: string; name: string; url: string }[] | string
		>(async (resolve, reject) => {
			await invoke<string>('search_metadata', {
				gameName: gameName,
				pluginName: provider,
				strict: strict,
			}).then((games) => {
				let searchedGames: any[] = [];
				if (games === undefined || games.length === 0 || games === '[]') {
					this.genericService.sendNotification(
						this.translateService.instant('error'),
						this.translateService.instant('no_game_found'),
						'error',
					);
					reject('No games found');
					return;
				}
				if (games === 'No credentials found') {
					this.genericService.sendNotification(
						this.translateService.instant('error'),
						this.translateService.instant('no_credentials_found'),
						'error',
					);
					reject(this.translateService.instant('no_credentials_found'));
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
					let parsedGames: {
						jaquette: string;
						name: string;
						url: string;
					}[] = [];
					searchedGames.forEach((audio) => {
						audio = JSON.parse(audio);
						let newAudio: {
							jaquette: string;
							name: string;
							url: string;
						} = {
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
			game_importer_id: api_game.game_importer_id ? api_game.game_importer_id : '',
			importer_id: api_game.importer_id ? api_game.importer_id : '',
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
			trophies_unlocked: api_game.trophies_unlocked
				? api_game.trophies_unlocked
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
			hidden: api_game.hidden ? api_game.hidden : 'false',
			stats: api_game.stats ? api_game.stats : [],
		};
	}

	public async autoDownloadBackgroundMusic(game: IGame): Promise<void> {
		if (game.backgroundMusic !== '') {
			return;
		}
		this.searchGameInAPI(game.name, 'ytdl', true, game).then((audios) => {
			if (audios === undefined) {
				this.genericService.sendNotification(
					this.translateService.instant('error'),
					this.translateService.instant('noAudioFound'),
					'error',
				);
				return;
			}
			if (audios === 'No credentials found') {
				this.genericService.sendNotification(
					this.translateService.instant('error'),
					this.translateService.instant('no_credentials_found'),
					'error',
				);
				return;
			}
			let audio: { jaquette: string; name: string; url: string } = (
				audios as { jaquette: string; name: string; url: string }[]
			)[0];
			this.genericService
				.downloadYTAudio(audio.url, game.id)
				.then((response) => {
					this.db.refreshGameLinks(game).then((game) => {
						this.setGame(game.id, game);
						this.setGameObservable(game);
					});
				});
		});
	}

	public getLaunchLinkForImporter(importerId: string, gameId: string): string {
		if (importerId === 'steam') {
			return 'steam://rungameid/' + gameId;
		}
		if (importerId === 'epic') {
			return 'com.epicgames.launcher://apps/' + gameId + '?action=launch&silent=true';
		}
		if (importerId === 'gog') {
			return 'gog://game/' + gameId;
		}
		return '';
	}

	async launchGame(gameId: string, launcherId: string = '') {
		this.genericService.changeGameLaunchAnimation(true);
		if (launcherId !== '') {
			let link = this.getLaunchLinkForImporter(launcherId, gameId);
			if (link === '') {
				this.genericService.sendNotification(
					this.translateService.instant('error'),
					this.translateService.instant('no_launcher_found'),
					'error',
				);
				return;
			}
			let tab = window.open(link, '_blank');
			setTimeout(() => {
				if (tab) {
					tab.close();
				}
			}, 5000);
			this.genericService.stopAllAudio();
			setTimeout(() => {
				this.genericService.changeGameLaunchAnimation(false);
			}, 5000);
		}else {
			setTimeout(() => {
				invoke('launch_game', { gameId }).then((response) => {
					console.log(response);
				});
				this.genericService.stopAllAudio();
			}, 2000);
			setTimeout(() => {
				this.genericService.changeGameLaunchAnimation(false);
			}, 5000);
		}
	}

	async killGame(gamePID: number) {
		invoke('kill_game', { pid: gamePID }).then((response) => {
			this.genericService.sendNotification(
				this.translateService.instant('game_ended_title'),
				this.translateService.instant('game_ended_message'),
				'info',
			);
		});
	}

	async getGameAchievements(gameId: string) {
		if (gameId === '') {
			return;
		}
		invoke('get_achievements_for_game', { gameId }).then((achievements) => {
			if (achievements === undefined) {
				console.log('No achievements found');
			}
			let ach = JSON.parse(achievements as string);
			ach.sort((a: ITrophy, b: ITrophy) => {
				return a.unlocked.localeCompare(b.unlocked);
			}).reverse();

			this.achievementsObservable.next(ach);
		});
	}

	getAchievementsObservable(): Observable<ITrophy[]> {
		return this.achievementsObservable.asObservable();
	}
}
