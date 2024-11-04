import { Injectable } from '@angular/core';
import { convertFileSrc, invoke } from '@tauri-apps/api/tauri';
import IGame from '../../interfaces/IGame';
import { BaseDirectory, configDir } from '@tauri-apps/api/path';
import ICategory from '../../interfaces/ICategory';
import { platform } from '@tauri-apps/api/os';
import ISettings from '../../interfaces/ISettings';
import { save } from '@tauri-apps/api/dialog';
import { GenericService } from './generic.service';
import { exists } from '@tauri-apps/api/fs';

@Injectable({
	providedIn: 'root',
})
export class DBService {
	constructor(private genericService: GenericService) {}

	async deleteGame(currentGameID: string) {
		await invoke('delete_game', { id: currentGameID }).then(() => {
			this.genericService.sendNotification(
				'Game deleted',
				'The game has been deleted',
				'success',
			);
		}).catch((error) => {
			this.genericService.sendNotification('Error', error, 'error');
		});
	}

	JSONParserForGames(games: string): IGame[] {
		// Remove all unicode characters
		games = games.replace(/\\u\{a0\}/g, '\\u00A0');
		let gamesArray: IGame[] = [];
		try {
			gamesArray = JSON.parse(games) as IGame[];
		} catch (error) {
			console.error('Failed to parse games JSON:', error);
			return [];
		}
		gamesArray.map(async (game) => {
			let id = game.id;
			let configDirPath = await configDir();
			let dplatform = await platform();
			if (dplatform === 'win32') {
				configDirPath = configDirPath +
					'Nytuo\\Meteoric\\config\\meteoric_extra_content\\';
			} else {
				configDirPath = configDirPath +
					'meteoric/meteoric_extra_content/';
			}
			game.jaquette = convertFileSrc(
				configDirPath + id + '/jaquette.jpg',
			);
			game.background = convertFileSrc(
				configDirPath + id + '/background.jpg',
			);
			game.logo = convertFileSrc(configDirPath + id + '/logo.png');
			game.icon = convertFileSrc(configDirPath + id + '/icon.png');
			return await this.get_all_img_and_video(id, game, configDirPath);
		});
		return gamesArray;
	}

	async refreshGameLinks(game: IGame): Promise<IGame> {
		let id = game.id;
		let configDirPath = await configDir();
		let dplatform = await platform();
		if (dplatform === 'win32') {
			configDirPath = configDirPath +
				'Nytuo\\Meteoric\\config\\meteoric_extra_content\\';
		} else if (dplatform === 'linux') {
			configDirPath = configDirPath + 'meteoric/meteoric_extra_content/';
		}
		game.jaquette = convertFileSrc(configDirPath + id + '/jaquette.jpg') +
			'?' +
			new Date().getTime();
		game.background =
			convertFileSrc(configDirPath + id + '/background.jpg') +
			'?' +
			new Date().getTime();
		game.logo = convertFileSrc(configDirPath + id + '/logo.png') +
			'?' +
			new Date().getTime();
		game.icon = convertFileSrc(configDirPath + id + '/icon.png') +
			'?' +
			new Date().getTime();
		return await this.get_all_img_and_video(id, game, configDirPath);
	}

	async getCategories() {
		const categories = await invoke<string>('get_all_categories');
		return JSON.parse(categories) as ICategory[];
	}

	async createCategory(
		name: string,
		icon: string,
		games: string[],
		filters: string[],
		views: string[],
		background: string,
	) {
		await invoke('create_category', {
			name: name,
			icon: icon,
			games: games,
			filters: filters,
			views: views,
			background: background,
		}).then(() => {
			this.genericService.sendNotification(
				'Category created',
				'The category has been created',
				'success',
			);
		}).catch((error) => {
			this.genericService.sendNotification('Error', error, 'error');
		});
	}

	async getSettings(): Promise<ISettings> {
		let db_settings = await invoke<string>('get_settings');
		let parsedSettings = JSON.parse(db_settings);
		let settings: ISettings = {};
		parsedSettings.forEach((setting: { name: string; value: string }) => {
			if (setting.name === 'gap' || setting.name === 'zoom') {
				settings[setting.name as keyof ISettings] = parseInt(
					setting.value,
				);
				return;
			}
			settings[setting.name as keyof ISettings] = setting.value;
		});
		return settings;
	}

	async setSettings(settings: ISettings) {
		let settingsArray = [];
		for (let key in settings) {
			settingsArray.push({
				name: key,
				value: settings[key as keyof ISettings],
			});
		}
		await invoke('set_settings', {
			settings: JSON.stringify(settingsArray),
		}).then(() => {
			this.genericService.sendNotification(
				'Settings saved',
				'The settings have been saved',
				'success',
			);
		}).catch((error) => {
			this.genericService.sendNotification('Error', error, 'error');
		});
	}

	async addGameToCategory(gameID: string, categoryID: string) {
		await invoke('add_game_to_category', {
			gameId: gameID,
			categoryId: categoryID,
		}).then(() => {
			this.genericService.sendNotification(
				'Game added',
				'The game has been added',
				'success',
			);
		}).catch((error) => {
			this.genericService.sendNotification('Error', error, 'error');
		});
	}

	async getGames(): Promise<IGame[]> {
		return new Promise<IGame[]>((resolve, reject) => {
			invoke<string>('get_all_games').then((games) => {
				if (games === undefined) {
					console.log('getGames: no games found');
					reject();
				}
				resolve(this.JSONParserForGames(games));
			});
		});
	}

	async getGamesByCategory(category: string) {
		return new Promise<void | IGame[]>((resolve) => {
			invoke<string>('get_games_by_category', { category }).then(
				(games) => {
					resolve(this.JSONParserForGames(games));
				},
			);
		});
	}

	async postGame(game: IGame) {
		return new Promise<string>((resolve, reject) => {
			invoke('post_game', { game: JSON.stringify(game) })
				.then((id) => {
					this.genericService.sendNotification(
						'Game saved',
						'The game has been saved',
						'success',
					);
					resolve(id as string);
				})
				.catch((error) => {
					this.genericService.sendNotification(
						'Error',
						error,
						'error',
					);
					reject(error);
				});
		});
	}

	async uploadFile(
		file: any,
		typeOf:
			| 'screenshot'
			| 'video'
			| 'audio'
			| 'background'
			| 'icon'
			| 'logo'
			| 'jaquette',
		id: string,
	) {
		let fileContent = Array.from(new Uint8Array(file));
		return invoke('upload_file', { fileContent, typeOf, id }).then(() => {
			this.genericService.sendNotification(
				'File uploaded',
				'The file has been uploaded',
				'success',
			);
		}).catch((error) => {
			this.genericService.sendNotification('Error', error, 'error');
		});
	}

	async deleteElement(
		typeOf: 'screenshot' | 'video' | 'audio',
		gameID: string,
		elementToDelete?: string,
	) {
		if (elementToDelete === undefined) {
			return invoke('delete_element', {
				typeOf,
				id: gameID,
				elementToDelete: '',
			}).then(() => {
				this.genericService.sendNotification(
					'Element deleted',
					'The element has been deleted',
					'success',
				);
			}).catch((error) => {
				this.genericService.sendNotification('Error', error, 'error');
			});
		}
		return invoke('delete_element', {
			typeOf,
			id: gameID,
			elementToDelete,
		}).then(() => {
			this.genericService.sendNotification(
				'Element deleted',
				'The element has been deleted',
				'success',
			);
		}).catch((error) => {
			this.genericService.sendNotification('Error', error, 'error');
		});
	}

	async getGame(id: string) {
		return new Promise<void | IGame[]>((resolve) => {
			invoke<string>('get_game', { id }).then((games) => {
				resolve(this.JSONParserForGames(games));
			});
		});
	}

	async saveMediaToExternalStorage(currentGame: IGame): Promise<void> {
		return new Promise((resolve, reject) => {
			let exportGame = {
				jaquette: currentGame.jaquette,
				background: currentGame.background,
				logo: currentGame.logo,
				icon: currentGame.icon,
				screenshots: currentGame.screenshots,
				videos: currentGame.videos,
				audio: currentGame.backgroundMusic,
			};

			let exportGameString = JSON.stringify(exportGame);

			invoke('save_media_to_external_storage', {
				id: currentGame.id,
				game: exportGameString,
			})
				.then(() => {
					setTimeout(() => {
						this.genericService.sendNotification(
							'Metadata saved',
							'The metadata has been saved',
							'success',
						);
						resolve();
					}, 4000);
				})
				.catch((error) => {
					this.genericService.sendNotification(
						'Error',
						error,
						'error',
					);
					reject(error);
				});
		});
	}

	removeGameFromCategory(gameID: string, id: string) {
		return invoke('remove_game_from_category', {
			gameId: gameID,
			categoryId: id,
		}).then(() => {
			this.genericService.sendNotification(
				'Game removed',
				'The game has been removed',
				'success',
			);
		}).catch((error) => {
			this.genericService.sendNotification('Error', error, 'error');
		});
	}

	public async export_games_to_csv() {
		const path = await save({
			filters: [{
				name: 'CSV',
				extensions: ['csv'],
			}],
			title: 'Export games to CSV',
		});
		return await invoke('export_game_database_to_csv', { path }).then(
			() => {
				this.genericService.sendNotification(
					'Games exported',
					'The games have been exported',
					'success',
				);
			},
		).catch((error) => {
			this.genericService.sendNotification('Error', error, 'error');
		});
	}

	public async export_games_to_archive() {
		const path = await save({
			filters: [{
				name: 'ZIP',
				extensions: ['zip'],
			}],
			title: 'Export games to archive',
		});
		return await invoke('export_game_database_to_archive', { path }).then(
			() => {
				this.genericService.sendNotification(
					'Games exported',
					'The games have been exported',
					'success',
				);
			},
		).catch((error) => {
			this.genericService.sendNotification('Error', error, 'error');
		});
	}

	private async get_all_img_and_video(
		id: string,
		game: IGame,
		configDirPath: string,
	) {
		let allImagesLocation = await invoke<string>(
			'get_all_images_location',
			{
				id: id,
			},
		);
		let allImagesLocationParsed = JSON.parse(allImagesLocation);
		game.screenshots = [];
		for (let i = 0; i < allImagesLocationParsed.length; i++) {
			game.screenshots[i] = convertFileSrc(
				configDirPath + allImagesLocationParsed[i],
			);
		}
		game.videos = [];
		let allVideosLocation = await invoke<string>(
			'get_all_videos_location',
			{
				id: id,
			},
		);
		allVideosLocation = JSON.parse(allVideosLocation);
		for (let i = 0; i < allVideosLocation.length; i++) {
			game.videos[i] = convertFileSrc(
				configDirPath + allVideosLocation[i],
			);
		}

		let configDirPathMusic;
		let dplatform = await platform();
		if (dplatform === 'win32') {
			configDirPathMusic =
				'Nytuo\\Meteoric\\config\\meteoric_extra_content\\';
		} else if (dplatform === 'linux') {
			configDirPathMusic = 'meteoric/meteoric_extra_content/';
		}

		let musicFilePath = configDirPathMusic + id + '/musics/theme.mp3';
		game.backgroundMusic =
			await exists(musicFilePath, { dir: BaseDirectory.Config })
				? convertFileSrc(configDirPath + id + '/musics/theme.mp3')
				: '';
		return game;
	}
}
