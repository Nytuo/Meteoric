import { Component, ElementRef, OnDestroy, OnInit } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import { MessageService } from 'primeng/api';
import IGame from '../../../interfaces/IGame';
import { DBService } from '../../services/db.service';
import { GameService } from '../../services/game.service';
import { GenericService } from '../../services/generic.service';
import simpleSvgPlaceholder from '@cloudfour/simple-svg-placeholder';
import { Router } from '@angular/router';
import { open } from '@tauri-apps/plugin-dialog';
import { dirname } from '@tauri-apps/api/path';
import { TranslateService } from '@ngx-translate/core';

@Component({
	selector: 'app-edit-game',
	templateUrl: './edit-game.component.html',
	styleUrl: './edit-game.component.css',
})
export class EditGameComponent implements OnInit, OnDestroy {
	currentGame: IGame | undefined;
	currentGameID: string | undefined;
	ytUrl: string = '';
	selectedItem: any = undefined;
	selectedProvider: any = undefined;
	searchMode = false;
	message: string = '';
	searchedGames: any[] = [];
	searchingGame: string = '';
	strict: boolean = false;
	hideSelectBtn: boolean = false;
	statuses: any = [
		this.translate.instant('not-started'),
		this.translate.instant('in-progress'),
		this.translate.instant('completed'),
		this.translate.instant('on-hold'),
		this.translate.instant('dropped'),
		this.translate.instant('platinum'),
	];
	// ADD API HERE
	hideSearch: boolean = false;
	items = [
		{
			label: this.translate.instant('game-information'),
			icon: 'pi pi-info-circle',
			expanded: true,
			items: [
				{
					label: this.translate.instant('general'),
					icon: 'pi pi-file',
					command: () => {
						this.selectedProvider = 'general';
						this.searchedGames = [];
						this.hideSearch = false;
					},
				},
				{
					label: this.translate.instant('personal'),
					icon: 'pi pi-id-card',
					command: () => {
						this.searchedGames = [];
						this.hideSearch = false;
						this.selectedProvider = 'personal';
					},
				},
				{
					label: this.translate.instant('media'),
					icon: 'pi pi-images',
					command: () => {
						this.searchedGames = [];
						this.hideSearch = false;
						this.selectedProvider = 'media';
					},
				},
				{
					label: this.translate.instant('execution'),
					icon: 'pi pi-play',
					command: () => {
						this.searchedGames = [];
						this.hideSearch = false;
						this.selectedProvider = 'exec';
					},
				},
			],
		},
		{
			label: this.translate.instant('metadata-providers'),
			icon: 'pi pi-pencil',
			expanded: true,
			items: [
				{
					label: this.translate.instant(
						'youtube-background-music-provider',
					),
					icon: 'pi pi-youtube',
					command: () => {
						this.selectedProvider = 'ytdl';
						this.searchedGames = [];
						this.hideSearch = true;
						this.hideSelectBtn = true;
					},
				},
				{
					label: this.translate.instant('steam-grid-db-provider'),
					icon: 'pi pi-desktop',
					command: () => {
						this.selectedProvider = 'steam_grid';
						this.searchedGames = [];
						this.hideSearch = true;
						this.hideSelectBtn = false;
					},
				},
				{
					label: this.translate.instant('igdb-provider'),
					icon: 'pi pi-desktop',
					command: () => {
						this.selectedProvider = 'igdb';
						this.searchedGames = [];
						this.hideSearch = true;
						this.hideSelectBtn = true;
					},
				},
			],
		},
	];
	displayInfo: FormGroup = new FormGroup({
		name: new FormControl(''),
		rating: new FormControl(''),
		platforms: new FormControl(''),
		tags: new FormControl(''),
	});
	info: FormGroup = new FormGroup({
		name: new FormControl(''),
		sort_name: new FormControl(''),
		rating: new FormControl(''),
		platforms: new FormControl(''),
		tags: new FormControl(''),
		description: new FormControl(''),
		critic_score: new FormControl(''),
		genres: new FormControl(''),
		styles: new FormControl(''),
		release_date: new FormControl(''),
		developers: new FormControl(''),
		editors: new FormControl(''),
	});
	stat: FormGroup = new FormGroup({
		status: new FormControl(''),
		time_played: new FormControl(''),
		trophies_unlocked: new FormControl(''),
		last_time_played: new FormControl(''),
	});
	exec: FormGroup = new FormGroup({
		exec_file: new FormControl(''),
		game_dir: new FormControl(''),
		exec_args: new FormControl(''),
	});

	constructor(
		private db: DBService,
		private gameService: GameService,
		private elementRef: ElementRef,
		protected genericService: GenericService,
		protected router: Router,
		private messageService: MessageService,
		private translate: TranslateService,
	) {
	}

	get generalKeys() {
		return Object.keys(this.info.controls);
	}

	get statKeys() {
		return Object.keys(this.stat.controls);
	}

	get execKeys() {
		return Object.keys(this.exec.controls);
	}

	ngOnInit(): void {
		this.currentGame = {
			id: '-1',
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
			time_played: '',
			trophies_unlocked: '',
			last_time_played: '',
			hidden: 'false',
			jaquette: simpleSvgPlaceholder({
				text: this.translate.instant('placeholder'),
				textColor: '#ffffff',
				bgColor: '#7a7a7a',
				width: 200,
				height: 300,
			}),
			background: simpleSvgPlaceholder({
				text: this.translate.instant('placeholder'),
				textColor: '#ffffff',
				bgColor: '#7a7a7a',
				width: 300,
				height: 200,
			}),
			logo: simpleSvgPlaceholder({
				text: this.translate.instant('placeholder'),
				textColor: '#ffffff',
				bgColor: '#7a7a7a',
				width: 200,
				height: 200,
			}),
			icon: simpleSvgPlaceholder({
				text: this.translate.instant('placeholder'),
				textColor: '#ffffff',
				bgColor: '#7a7a7a',
				width: 200,
				height: 200,
			}),
			backgroundMusic: '',
			exec_file: '',
			game_dir: '',
			exec_args: '',
			screenshots: [],
			videos: [],
		};

		let gameID = this.router.url.split('/')[2];
		this.genericService.stopAllAudio();
		this.currentGameID = gameID;
		console.log(this.currentGameID);
		let game = this.gameService.getGame(gameID);
		this.gameService.setGameObservable(game);
		if (game !== undefined) {
			this.currentGame = game;
			this.searchingGame = game.name;
			console.log(game);
			this.displayInfo = new FormGroup({
				name: new FormControl(game.name),
				rating: new FormControl(game.rating),
				platforms: new FormControl(game.platforms),
				tags: new FormControl(game.tags),
			});
			this.info = new FormGroup({
				name: new FormControl(game.name),
				sort_name: new FormControl(game.sort_name),
				rating: new FormControl(game.rating),
				platforms: new FormControl(game.platforms),
				tags: new FormControl(game.tags),
				description: new FormControl(game.description),
				critic_score: new FormControl(game.critic_score),
				genres: new FormControl(game.genres),
				styles: new FormControl(game.styles),
				release_date: new FormControl(game.release_date),
				developers: new FormControl(game.developers),
				editors: new FormControl(game.editors),
			});
			this.stat = new FormGroup({
				status: new FormControl(game.status),
				time_played: new FormControl(game.time_played),
				trophies_unlocked: new FormControl(game.trophies_unlocked),
				last_time_played: new FormControl(game.last_time_played),
			});
			this.exec = new FormGroup({
				exec_file: new FormControl(game.exec_file),
				game_dir: new FormControl(game.game_dir),
				exec_args: new FormControl(game.exec_args),
			});
		}
	}

	ngAfterViewInit() {
		let topBar = document.querySelector('.topbar') as HTMLElement;
		if (topBar) {
			topBar.style.display = 'none';
		}
		this.genericService.changeSidebarOpen(false);
	}

	ngOnDestroy() {
		let topBar = document.querySelector('.topbar') as HTMLElement;
		if (topBar) {
			topBar.style.display = 'flex';
		}
		this.genericService.changeSidebarOpen(true);
	}

	onFileSelected(
		event: any,
		type:
			| 'screenshot'
			| 'video'
			| 'audio'
			| 'background'
			| 'icon'
			| 'logo'
			| 'jaquette',
	) {
		const file = event.target.files[0];
		if (
			file === undefined || file === null ||
			this.currentGame === undefined
		) {
			this.genericService.sendNotification(
				this.translate.instant('error'),
				this.translate.instant('no-file-selected'),
				'error',
			);
			return;
		}
		const reader = new FileReader();
		reader.onload = () => {
			const fileContent = reader.result;
			if (
				fileContent === null ||
				fileContent === undefined ||
				this.currentGame === undefined
			) {
				this.genericService.sendNotification(
					this.translate.instant('error'),
					this.translate.instant('no-file-selected'),
					'error',
				);
				return;
			}
			this.db.uploadFile(fileContent, type, this.currentGame.id).then(
				() => {
					if (this.currentGame === undefined) {
						this.genericService.sendNotification(
							this.translate.instant('error'),
							this.translate.instant('no-file-selected'),
							'error',
						);
						return;
					}
					this.db.refreshGameLinks(this.currentGame).then((game) => {
						if (this.currentGameID === undefined) {
							this.genericService.sendNotification(
								this.translate.instant('error'),
								this.translate.instant('no-file-selected'),
								'error',
							);
							return;
						}
						this.currentGame = game;
						this.gameService.setGame(
							this.currentGameID,
							this.currentGame,
						);
					});
				},
			);
		};
		reader.readAsArrayBuffer(file);
	}

	openFileChooser(id: string) {
		let fileInput = this.elementRef.nativeElement.querySelector('#' + id);
		if (fileInput) fileInput.click();
	}

	deleteVideo(path: any) {
		if (
			this.currentGame === undefined || this.currentGameID === undefined
		) {
			return;
		}
		let id = this.currentGame
			.screenshots[this.currentGame.screenshots.indexOf(path)];
		id = id.toString().split('video-')[1].split('.')[0];
		this.db
			.deleteElement('video', this.currentGame.id, id.toString())
			.then(() => {
				this.messageService.add({
					severity: 'info',
					summary: this.translate.instant('video-deleted'),
					detail: this.translate.instant(
						'the-video-has-been-deleted',
					),
					life: 3000,
				});
			});
		delete this.currentGame.videos[this.currentGame.videos.indexOf(path)];
		this.gameService.setGame(this.currentGameID, this.currentGame);
	}

	deleteScreenshot(path: any) {
		if (
			this.currentGame === undefined || this.currentGameID === undefined
		) {
			return;
		}
		let id = this.currentGame
			.screenshots[this.currentGame.screenshots.indexOf(path)];
		id = id.toString().split('screenshot-')[1].split('.')[0];
		this.db.deleteElement('screenshot', this.currentGame.id, id).then(
			() => {
				this.messageService.add({
					severity: 'info',
					summary: this.translate.instant('screenshot-deleted'),
					detail: this.translate.instant(
						'the-screenshot-has-been-deleted',
					),
					life: 3000,
				});
			},
		);
		delete this.currentGame.screenshots[
			this.currentGame.screenshots.indexOf(path)
		];
		this.gameService.setGame(this.currentGameID, this.currentGame);
	}

	deleteBackgroundMusic() {
		if (this.currentGame === undefined) {
			return;
		}
		this.db.deleteElement('audio', this.currentGame.id).then(() => {
			this.messageService.add({
				severity: 'info',
				summary: this.translate.instant('audio-deleted'),
				detail: this.translate.instant('the-audio-has-been-deleted'),
				life: 3000,
			});
		});
	}

	searchYT4BGMusic() {
		let url = this.ytUrl;
		console.log(url);
		if (url === '' || this.currentGame === undefined) {
			return;
		}
		this.genericService.downloadYTAudio(url, this.currentGame?.id).then(
			() => {
				console.log('Downloaded');
				if (this.currentGame === undefined) {
					this.genericService.sendNotification(
						this.translate.instant('error'),
						this.translate.instant('no-file-selected'),
						'error',
					);
					return;
				}
				this.db.refreshGameLinks(this.currentGame).then((game) => {
					if (this.currentGameID === undefined) {
						this.genericService.sendNotification(
							this.translate.instant('error'),
							this.translate.instant('no-file-selected'),
							'error',
						);
						return;
					}
					this.currentGame = game;
					this.gameService.setGame(
						this.currentGameID,
						this.currentGame,
					);
					this.gameService.setGameObservable(this.currentGame);
				});
			},
		);
	}

	selectItem() {
		this.genericService.changeBlockUI(true);
		console.log(this.selectedItem);
		if (this.selectedItem === undefined) {
			this.genericService.sendNotification(
				this.translate.instant('error'),
				this.translate.instant('no-file-selected'),
				'error',
			);
			return;
		}
		this.selectedItem.id = this.currentGameID;
		this.currentGame = this.selectedItem;
		if (this.selectedProvider === 'ytdl') {
			this.ytUrl = this.selectedItem.url;
			this.searchYT4BGMusic();
			return;
		}
		if (this.selectedProvider === 'steam_grid') {
			this.saveMediaToExternalStorage();
			return;
		}
		this.displayInfo = new FormGroup({
			name: new FormControl(this.currentGame?.name),
			rating: new FormControl(this.currentGame?.rating),
			platforms: new FormControl(this.currentGame?.platforms),
			tags: new FormControl(this.currentGame?.tags),
		});
		this.info = new FormGroup({
			name: new FormControl(this.currentGame?.name),
			sort_name: new FormControl(this.currentGame?.sort_name),
			rating: new FormControl(this.currentGame?.rating),
			platforms: new FormControl(this.currentGame?.platforms),
			tags: new FormControl(this.currentGame?.tags),
			description: new FormControl(this.currentGame?.description),
			critic_score: new FormControl(this.currentGame?.critic_score),
			genres: new FormControl(this.currentGame?.genres),
			styles: new FormControl(this.currentGame?.styles),
			release_date: new FormControl(this.currentGame?.release_date),
			developers: new FormControl(this.currentGame?.developers),
			editors: new FormControl(this.currentGame?.editors),
		});
		this.stat = new FormGroup({
			status: new FormControl(this.currentGame?.status),
			time_played: new FormControl(this.currentGame?.time_played),
			trophies_unlocked: new FormControl(
				this.currentGame?.trophies_unlocked,
			),
			last_time_played: new FormControl(
				this.currentGame?.last_time_played,
			),
		});
		this.exec = new FormGroup({
			exec_file: new FormControl(this.currentGame?.exec_file),
			game_dir: new FormControl(this.currentGame?.game_dir),
			exec_args: new FormControl(this.currentGame?.exec_args),
		});
		this.searchMode = false;
		if (this.currentGame === undefined) {
			return;
		}
		this.saveGameInfo();
	}

	saveGameExec() {
		if (
			this.currentGameID === undefined && this.currentGame === undefined
		) {
			this.genericService.sendNotification(
				this.translate.instant('error'),
				this.translate.instant('no-file-selected'),
				'error',
			);
			return;
		}
		if (
			this.currentGameID === undefined && this.currentGame !== undefined
		) {
			let game = this.currentGame;
			for (let key of this.execKeys) {
				game[key] = this.exec.get(key)?.value;
			}
			this.db.postGame(game).then(() => this.gameService.getGames());
			return;
		}
		if (this.currentGameID === undefined) {
			this.genericService.sendNotification(
				this.translate.instant('error'),
				this.translate.instant('no-file-selected'),
				'error',
			);
			return;
		}
		let game = this.gameService.getGame(this.currentGameID);
		if (game === undefined) {
			this.genericService.sendNotification(
				this.translate.instant('error'),
				this.translate.instant('no-file-selected'),
				'error',
			);
			return;
		}

		for (let key of this.execKeys) {
			game[key] = this.exec.get(key)?.value;
		}
		this.db.postGame(game).then(() =>
			this.gameService.getGames().then(() => {
				this.messageService.add({
					severity: 'info',
					summary: this.translate.instant('saved'),
					detail: this.translate.instant('the-change-has-been-saved'),
					life: 3000,
				});
			})
		);
		this.gameService.setGame(this.currentGameID, game);
	}

	saveGameInfo() {
		this.genericService.changeBlockUI(true);
		if (
			this.currentGameID === undefined && this.currentGame === undefined
		) {
			this.genericService.sendNotification(
				this.translate.instant('error'),
				this.translate.instant('no-file-selected'),
				'error',
			);
			return;
		}
		if (
			this.currentGameID === undefined && this.currentGame !== undefined
		) {
			let game = this.currentGame;
			for (let key of this.generalKeys) {
				game[key] = this.info.get(key)?.value;
			}
			this.db.postGame(game).then(() => this.gameService.getGames());
			return;
		}
		if (this.currentGameID === undefined) {
			this.genericService.sendNotification(
				this.translate.instant('error'),
				this.translate.instant('no-file-selected'),
				'error',
			);
			return;
		}
		let game = this.gameService.getGame(this.currentGameID);
		if (game === undefined) {
			this.genericService.sendNotification(
				this.translate.instant('error'),
				this.translate.instant('no-file-selected'),
				'error',
			);
			return;
		}

		for (let key of this.generalKeys) {
			game[key] = this.info.get(key)?.value;
		}

		this.db.postGame(game).then(() =>
			this.gameService.getGames().then(() => {
				this.messageService.add({
					severity: 'info',
					summary: this.translate.instant('saved'),
					detail: this.translate.instant('the-change-has-been-saved'),
					life: 3000,
				});
				this.saveMediaToExternalStorage();
			})
		);
	}

	saveGameStat() {
		if (
			this.currentGameID === undefined && this.currentGame === undefined
		) {
			this.genericService.sendNotification(
				this.translate.instant('error'),
				this.translate.instant('no-file-selected'),
				'error',
			);
			return;
		}
		if (
			this.currentGameID === undefined && this.currentGame !== undefined
		) {
			let game = this.currentGame;
			for (let key of this.statKeys) {
				game[key] = this.stat.get(key)?.value;
			}
			this.db.postGame(game).then(() => this.gameService.getGames());
			return;
		}
		if (this.currentGameID === undefined) {
			this.genericService.sendNotification(
				this.translate.instant('error'),
				this.translate.instant('no-file-selected'),
				'error',
			);
			return;
		}

		let game = this.gameService.getGame(this.currentGameID);
		if (game === undefined) {
			this.genericService.sendNotification(
				this.translate.instant('error'),
				this.translate.instant('no-file-selected'),
				'error',
			);
			return;
		}
		for (let key of this.statKeys) {
			game[key] = this.stat.get(key)?.value;
		}

		this.db.postGame(game).then(() =>
			this.gameService.getGames().then(() => {
				this.messageService.add({
					severity: 'info',
					summary: this.translate.instant('saved'),
					detail: this.translate.instant('the-change-has-been-saved'),
					life: 3000,
				});
			})
		);
		this.gameService.setGame(this.currentGameID, game);
	}

	async linkGame() {
		const selected = await open({
			multiple: false,
			filters: [
				{
					name: 'Executables',
					extensions: ['exe', 'bat', 'sh'],
				},
			],
		});
		if (selected) {
			const execs = {
				exec_file: selected.toString(),
				game_dir: await dirname(selected.toString()),
				exec_args: '',
			};
			if (this.currentGameID) {
				let game = this.gameService.getGame(this.currentGameID);
				if (!game) {
					this.genericService.sendNotification(
						this.translate.instant('error'),
						this.translate.instant('no-file-selected'),
						'error',
					);
					return;
				}
				game.exec_file = execs.exec_file;
				game.game_dir = execs.game_dir;
				game.exec_args = execs.exec_args;
				await this.db.postGame(game!);
				this.gameService.setGame(this.currentGameID, game!);
				this.messageService.add({
					severity: 'info',
					summary: this.translate.instant('game-linked'),
					detail: this.translate.instant('the-game-has-been-linked'),
					life: 3000,
				});
			}
		}
		return;
	}

	searchGameInAPI() {
		this.gameService
			.searchGameInAPI(
				this.searchingGame,
				this.selectedProvider,
				this.strict,
				this.currentGame,
			)
			.then((result) => {
				if (result === undefined) {
					this.genericService.sendNotification(
						this.translate.instant('error'),
						this.translate.instant('no-file-selected'),
						'error',
					);
					return;
				}
				if (typeof result === 'string') {
					this.messageService.add({
						severity: 'error',
						summary: this.translate.instant('error'),
						detail: result,
						life: 3000,
					});
					return;
				}
				this.searchedGames = result;
			});
	}

	deleteGame() {
		if (this.currentGameID === undefined) {
			this.genericService.sendNotification(
				this.translate.instant('error'),
				this.translate.instant('no-file-selected'),
				'error',
			);
			return;
		}
		this.db.deleteGame(this.currentGameID).then(() => {
			this.gameService.getGames().then(() => {
				this.router.navigate(['/']);
			});
		});
	}

	private saveMediaToExternalStorage() {
		if (this.currentGame === undefined) {
			this.genericService.sendNotification(
				this.translate.instant('error'),
				this.translate.instant('no-file-selected'),
				'error',
			);
			return;
		}
		this.db.saveMediaToExternalStorage(this.currentGame).then(() => {
			if (this.currentGame === undefined) {
				this.genericService.sendNotification(
					this.translate.instant('error'),
					this.translate.instant('no-file-selected'),
					'error',
				);
				return;
			}
			this.db.refreshGameLinks(this.currentGame).then((game) => {
				this.currentGame = game;
				this.gameService.getGames().then(() => {
					if (
						this.currentGameID === undefined ||
						this.currentGame === undefined
					) {
						this.genericService.sendNotification(
							this.translate.instant('error'),
							this.translate.instant('no-file-selected'),
							'error',
						);
						return;
					}
					this.gameService.setGame(
						this.currentGameID,
						this.gameService.getGame(this.currentGameID) as IGame,
					);
					this.gameService.setGameObservable(this.currentGame);
					this.messageService.add({
						severity: 'info',
						summary: this.translate.instant('metadata-saved'),
						detail: this.translate.instant(
							'the-metadata-has-been-saved-for',
						) +
							this.currentGame.name,
						life: 3000,
					});
					this.genericService.changeBlockUI(false);
				});
			});
		});
	}

	toggleHiddenStatusForGame() {
		if (this.currentGame === undefined) {
			this.genericService.sendNotification(
				this.translate.instant('error'),
				this.translate.instant(
					'impossible-to-hide-a-game-that-does-not-exist',
				),
				'error',
			);
			return;
		}
		this.currentGame.hidden = this.currentGame.hidden === 'true'
			? 'false'
			: 'true';
		this.db.postGame(this.currentGame).then(() => {
			if (
				this.currentGameID === undefined ||
				this.currentGame === undefined
			) {
				this.genericService.sendNotification(
					this.translate.instant('error'),
					this.translate.instant(
						'impossible-to-hide-a-game-that-does-not-exist',
					),
					'error',
				);
				return;
			}
			this.gameService.setGame(this.currentGameID, this.currentGame);
			this.messageService.add({
				severity: 'info',
				summary: this.translate.instant('hidden-status-changed'),
				detail: this.translate.instant(
					'the-hidden-status-has-been-changed',
				),
				life: 3000,
			});
		});
	}
}
