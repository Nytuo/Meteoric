import { Component, OnInit } from '@angular/core';
import { GenericService } from '../../services/generic.service';
import { Location } from '@angular/common';
import { getCurrentWebviewWindow } from '@tauri-apps/api/webviewWindow';
import { NavigationEnd, Router } from '@angular/router';
import { BehaviorSubject } from 'rxjs';
import { GameService } from '../../services/game.service';
import { open } from '@tauri-apps/plugin-dialog';
import { dirname } from '@tauri-apps/api/path';
import { DBService } from '../../services/db.service';
import { TauriService } from '../../services/tauri.service';
import IGameLaunchedMessage from '../../../interfaces/IGameLaunchMessage';
import { CategoryService } from '../../services/category.service';
import { TranslateService } from '@ngx-translate/core';
const appWindow = getCurrentWebviewWindow()

@Component({
	selector: 'app-topbar',
	templateUrl: './topbar.component.html',
	styleUrl: './topbar.component.css',
})
export class TopbarComponent implements OnInit {
	overlayVisible: boolean = false;
	onGamePage: boolean = false;
	isBookmarkAllowed: boolean = false;
	gameOverlayOpen: boolean = false;
	gameID: string = '';
	displayPlayForGame = this.translate.instant('link');
	btnicon = 'pi pi-link';
	color: { [klass: string]: any } = { backgroundColor: 'purple' };
	loading: boolean = false;
	gamePID: number | null = null;
	editPage: string | any[] | null | undefined;
	allCategories: any[] = [];
	currentGameCategories: any[] = [];
	gameFromUrl: BehaviorSubject<string> = new BehaviorSubject<string>('');
	searchQuery: string = '';
	selectedFilter: any = 'null';
	selectedSort: any = 'name';
	filters: any[] = [] as any;
	sorts: any[] = [
		{ name: this.translate.instant('criticsScore'), value: 'critic_score' },
		{ name: this.translate.instant('gameTime'), value: 'time_played' },
		{ name: this.translate.instant('genres'), value: 'genres' },
		{
			name: this.translate.instant('last-played'),
			value: 'last_time_played',
		},
		{ name: this.translate.instant('name'), value: 'sort_name' },
		{ name: this.translate.instant('platforms'), value: 'platforms' },
		{ name: this.translate.instant('publishers'), value: 'editors' },
		{ name: this.translate.instant('release-date'), value: 'release_date' },
		{ name: this.translate.instant('user-rating'), value: 'rating' },
		{ name: this.translate.instant('tags'), value: 'tags' },
	];
	protected readonly appWindow = appWindow;

	constructor(
		protected genericService: GenericService,
		protected location: Location,
		protected router: Router,
		private gameService: GameService,
		private dbService: DBService,
		private tauri: TauriService,
		private categoryService: CategoryService,
		private translate: TranslateService,
	) {
	}

	addCategory() {
		let name =
			(document.getElementById('addcat') as HTMLInputElement).value;
		this.categoryService.createCategory(
			name,
			'bookmark',
			[this.gameID],
			[
				this.translate.instant('category.all'),
				this.translate.instant('installed'),
				this.translate.instant('not-installed'),
			],
			[
				this.translate.instant('view.grid'),
				this.translate.instant('view.list'),
			],
			'',
		);
		this.genericService.sendNotification(
			this.translate.instant('category.all'),
			this.translate.instant('game-added-to-category'),
		);
	}

	toggleCategory($event: any, id: string) {
		let gameID = this.gameID;
		if (!gameID) {
			return;
		}
		if (!$event.target.checked) {
			this.categoryService.removeGameFromCategory(gameID, id);
			return;
		}
		this.categoryService.addGameToCategory(gameID, id);
	}

	toggleFavorites() {
		let gameID = this.gameID;
		if (!gameID) {
			return;
		}
		let favCatId = this.categoryService.getCategoryIdByName('Favorites');
		if (!favCatId) {
			return;
		}
		if (this.isFavoritesChecked()) {
			this.categoryService.removeGameFromCategory(gameID, favCatId);
			return;
		}
		this.categoryService.addGameToCategory(gameID, favCatId);
	}

	isFavoritesChecked(): boolean {
		return this.currentGameCategories.some((cat) =>
			cat.name === this.translate.instant('favorites')
		);
	}

	toggleOverlay(overlay_name: string = 'filter') {
		switch (overlay_name) {
			case 'filter':
				this.overlayVisible = !this.overlayVisible;
				break;
			case 'game':
				this.gameOverlayOpen = !this.gameOverlayOpen;
				break;
		}
	}

	isCategoryChecked(catId: string): boolean {
		return this.currentGameCategories.some((cat) => cat.id === catId);
	}

	sortGames() {
		this.gameService.sortGames(this.selectedSort.value);
	}

	filterGames() {
		this.gameService.filterGames(
			this.selectedFilter.code,
			this.selectedFilter.value,
		);
	}

	ngOnInit(): void {
		this.genericService.getDisplayBookmark().subscribe((value) => {
			this.isBookmarkAllowed = value;
		});
		this.categoryService.getCategoriesObservable().subscribe((value) => {
			let exclusion = [
				this.translate.instant('all'),
				this.translate.instant('installed'),
				'Steam',
				'Epic Games',
				'GOG',
				this.translate.instant('favorites'),
			];
			value = value.filter((cat) => !exclusion.includes(cat.name));
			this.allCategories = value;
			this.currentGameCategories = this.categoryService
				.getCategoriesForGame(
					this.gameID,
				);
		});
		this.router.events.subscribe((val) => {
			if (val instanceof NavigationEnd) {
				if (val.url.includes('game') && !val.url.includes('games')) {
					this.onGamePage = true;
					this.gameFromUrl.next(val.url.split('/')[2]);
					let id = val.url.split('/')[2];
					if (id) {
						this.editPage = `/edit/${id}`;
						let game = this.gameService.getGame(id);
						this.gameService.setGameObservable(game);
						this.gameID = id;
						this.currentGameCategories = this.categoryService
							.getCategoriesForGame(this.gameID);
						this.displayPlayForGame =
							game?.exec_file && game?.game_dir
								? this.translate.instant('play')
								: this.translate.instant('link');
						this.btnicon = game?.exec_file && game?.game_dir
							? 'pi pi-play'
							: 'pi pi-link';
						this.color = game?.exec_file && game?.game_dir
							? { backgroundColor: 'rgb(13 81 198)' }
							: { backgroundColor: 'purple' };
					}
				} else {
					this.onGamePage = false;
					this.gameFromUrl.next('');
				}
			}
		});
		this.tauri
			.getMessagesForGameLaunched()
			.subscribe((value: IGameLaunchedMessage) => {
				this.gamePID = value.gamePID;
				if (!value.isEnded) {
					this.loading = false;
					this.displayPlayForGame = this.translate.instant('stop');
					this.btnicon = 'pi pi-stop';
					this.color = { backgroundColor: 'darkred' };
				} else {
					this.loading = false;
					this.displayPlayForGame = this.translate.instant('play');
					this.btnicon = 'pi pi-play';
					this.color = { backgroundColor: 'rgb(13 81 198)' };
				}
			});

		this.gameService.getGameObservable().subscribe((game) => {
			if (!game) {
				return;
			}
			this.displayPlayForGame = game?.exec_file && game?.game_dir
				? this.translate.instant('play')
				: this.translate.instant('link');
			this.btnicon = game?.exec_file && game?.game_dir
				? 'pi pi-play'
				: 'pi pi-link';
			this.color = game?.exec_file && game?.game_dir
				? { backgroundColor: 'rgb(13 81 198)' }
				: { backgroundColor: 'purple' };
		});

		this.gameService.getGamesObservable().subscribe((games) => {
			this.filters = this.gameService.getAllFilters();
		});
	}

	async toggleMinimize() {
		if (await this.appWindow.isMinimized()) {
			await this.appWindow.unminimize();
		} else {
			await this.appWindow.minimize();
		}
	}

	async toggleMaximize() {
		if (await this.appWindow.isMaximized()) {
			await this.appWindow.unmaximize();
		} else {
			await this.appWindow.maximize();
		}
	}

	async playGame() {
		if (this.displayPlayForGame === 'LINK') {
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
				let game = this.gameService.getGame(this.gameID);
				if (!game) {
					return;
				}
				game.exec_file = execs.exec_file;
				game.game_dir = execs.game_dir;
				game.exec_args = execs.exec_args;
				await this.dbService.postGame(game!);
				this.gameService.setGame(this.gameID, game!);
				this.displayPlayForGame = game?.exec_file && game?.game_dir
					? this.translate.instant('play')
					: this.translate.instant('link');
				this.btnicon = game?.exec_file && game?.game_dir
					? 'pi pi-play'
					: 'pi pi-link';
				this.color = game?.exec_file && game?.game_dir
					? { backgroundColor: 'rgb(13 81 198)' }
					: { backgroundColor: 'purple' };
			}
			return;
		} else if (this.displayPlayForGame === 'STOP') {
			if (!this.gamePID || this.gamePID === 0) {
				return;
			}
			await this.genericService.killGame(this.gamePID);
		} else {
			this.loading = true;
			await this.genericService.launchGame(this.gameID);
		}
	}

	searchGame() {
		this.gameService.searchGame(this.searchQuery);
	}
}
