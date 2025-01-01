import {Component, OnDestroy, OnInit} from '@angular/core';
import {ActivatedRoute} from '@angular/router';
import {GameService} from '../../services/game.service';
import IGame, { ITrophy } from '../../../interfaces/IGame';
import {CarouselResponsiveOptions} from 'primeng/carousel';
import {GenericService} from '../../services/generic.service';
import type {SimpleIcon} from 'simple-icons';
import * as simpleIcons from 'simple-icons';
import {TranslateService} from '@ngx-translate/core';

@Component({
	selector: 'app-details',
	templateUrl: './details.component.html',
	styleUrl: './details.component.css',
})
export class DetailsComponent implements OnInit, OnDestroy {
	friendsTrohpiesAvg: number = 0;
	friendsTimePlayedAvg: number = 0;
	allPlayersTrophyAvg: number = 0;
	allPlayersTimePlayedAvg: number = 0;
	gameRating: any;
	gameTags: any = this.translate.instant('no-tags');
	media: any = {
		images: [],
		videos: [],
	};
	logoOffsetTop: number = 0;
	isSticky: boolean = false;
	imageHeight: number = 0;
	responsiveOptions: CarouselResponsiveOptions[] | undefined = undefined;
	launcherIcon: string = 'meteor';
	protected game: IGame | undefined;
	private id: number = 0;
	totalTimePlayed = '0';
	lastTimePlayed = '0000-00-00';
	isAchievementsVisible = false;
	achievements: ITrophy[] = [];

	constructor(
		private route: ActivatedRoute,
		private gameService: GameService,
		private genericService: GenericService,
		private translate: TranslateService,
	) {}

	ngOnInit(): void {
		this.route.params.subscribe((params) => {
			this.id = params['id'];
			this.game = this.gameService.getGame(this.id.toString()) as IGame;
			this.handleRefreshMetadata(this.game);
		});

		this.gameService.getGameObservable().subscribe((game) => {
			this.handleRefreshMetadata(game);
			if (this.game === undefined) {
				return;
			}
			this.determineIcon();

			if (
				this.game.backgroundMusic &&
				!this.genericService.isBackgroundMusicPlaying()
			) {
				this.genericService.playBackgroundMusic(this.game.backgroundMusic);
			} else {
				this.gameService.autoDownloadBackgroundMusic(this.game);
			}
			console.log(this.game.stats);
			this.totalTimePlayed = this.toParsedTime(
				(
					this.game.stats.reduce(
						(acc, stat) => acc + parseInt(stat.time_played),
						0,
					) || 0
				).toString() || '0',
			);

			this.lastTimePlayed =
				this.game.stats
					.reduce((acc, stat) => {
						if (new Date(acc.date_of_play) > new Date(stat.date_of_play)) {
							return acc;
						} else {
							return stat;
						}
					})
					.date_of_play.toLocaleDateString() || '0000-00-00';
		});

		this.genericService
			.getGameLaunchAnimationObservable()
			.subscribe((status) => {
				if (status) {
					this.launchAnimation();
				} else {
					this.resetAnimation();
				}
			});
		
		this.genericService.getAchievementsVisible().subscribe((status) => {
			this.isAchievementsVisible = status;
		});

		this.gameService.getAchievementsObservable().subscribe((achievements) => {
			this.achievements = achievements;
		});
	}

	toParsedTime(time: string) {
		let days = Math.floor(parseInt(time) / 1440);
		let hours = Math.floor((parseInt(time) % 1440) / 60);
		let minutes = (parseInt(time) % 1440) % 60;
		let timePlayed = '';
		if (days > 0) {
			timePlayed += days + 'd ';
		}
		if (hours > 0) {
			timePlayed += hours + 'h ';
		}
		if (minutes > 0) {
			timePlayed += minutes + 'm';
		}
		return timePlayed;
	}

	toTitleCase(str: string) {
		return str.replace(/\w\S*/g, function (txt) {
			return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
		});
	}

	determineIcon() {
		if (this.game === undefined) {
			return;
		}
		if (this.game.platforms === undefined || this.game.platforms === '') {
			return;
		}
		let platform: string = '';
		switch (this.game.platforms) {
			case 'GOG':
				platform = 'siGogdotcom';
				break;
			case 'Steam':
				platform = 'siSteam';
				break;
			case 'Epic Games':
				platform = 'siEpicgames';
				break;
			case 'Ubisoft':
			case 'Ubisoft Connect':
				platform = 'siUbisoft';
				break;
			case 'EA Play':
				platform = 'siEa';
				break;
			case 'Origin':
				platform = 'siOrigin';
				break;
			case 'Battle.net':
				platform = 'siBattleNet';
				break;
			case 'Xbox':
				platform = 'xbox';
				break;
			case 'Playstation':
				platform = 'siPlaystation';
				break;
			case 'Nintendo':
				platform = 'siNintendo';
				break;
			case 'Apple Arcade':
				platform = 'siApple';
				break;
			case 'Google Play':
				platform = 'siGoogleplay';
				break;
			case 'itch.io':
				platform = 'siItchio';
				break;
			case 'Windows':
				platform = 'siWindows';
				break;
			case 'Linux':
				platform = 'siLinux';
				break;
			case 'MacOS':
				platform = 'siApple';
				break;
			case 'Android':
				platform = 'siAndroid';
				break;
			case 'iOS':
				platform = 'siApple';
				break;
			default:
				platform = 'none';
				break;
		}

		let icon = simpleIcons[platform as keyof typeof simpleIcons] as SimpleIcon;
		if (icon && platform.includes('si')) {
			let svg = icon.svg.replace(/#/g, '%23');
			this.launcherIcon = `data:image/svg+xml,${svg}`;
		} else {
			if (platform === 'xbox') {
				this.launcherIcon = 'assets/platforms/xbox.svg';
			} else this.launcherIcon = 'assets/logo.svg';
		}
	}

	ngOnDestroy() {
		this.genericService.stopBackgroundMusic();
	}

	onScroll(event: WheelEvent) {
		const container = document.querySelector('.gameInfo');
		if (!container) return;

		if (event.deltaY > 0 && !this.isSticky && !this.isAchievementsVisible) {
			console.log(event.deltaY);
			let image = document.getElementById('bg') as HTMLImageElement;
			if (image === null) {
				return;
			}
			image.style.opacity = (0.6 - event.deltaY / 1000).toString();
			this.isSticky = true;
		} else if (event.deltaY < 0 && container.scrollTop === 0 && !this.isAchievementsVisible) {
			this.isSticky = false;
		}
	}

	launchAnimation() {
		this.isSticky = false;
		document.getElementsByClassName('gameInfo')[0].scrollTo(0, 0);
		document.querySelector('#gameHeaderOptional')?.classList.add('hidden');
		document.querySelector('#game-logo-details')?.classList.add('logoLaunch');
		document.querySelector('#title')?.classList.add('logoLaunch');
		document.querySelector('#bg')?.classList.add('bgLaunch');
	}

	resetAnimation() {
		document.querySelectorAll('.hidden').forEach((element) => {
			element.classList.remove('hidden');
		});
		document.querySelectorAll('.logoLaunch').forEach((element) => {
			element.classList.remove('logoLaunch');
		});
		document.querySelector('#bg')?.classList.remove('bgLaunch');
	}

	onImageLoad($event: Event) {
		let id = ($event.target as HTMLImageElement).id;
		(document.getElementById(id) as HTMLImageElement).style.visibility =
			'visible';
	}

	private handleRefreshMetadata(game: IGame) {
		if (game === undefined) {
			return;
		}
		this.game = game;
		this.gameService.getGameAchievements(this.game.game_importer_id);
		this.gameTags = this.game?.tags;
		this.gameRating = this.game?.rating;
		if (this.game.tags === '') {
			this.gameTags = this.translate.instant('no-tags');
		}
		this.media.images = this.game?.screenshots;
		this.media.videos = this.game?.videos;
		console.log(this.media);
		this.responsiveOptions = [];
		for (let i = 0; i < this.media.length; i++) {
			this.responsiveOptions.push({
				breakpoint: '1024px',
				numVisible: i,
				numScroll: i,
			});
		}
		let html = document.querySelector('html');
		if (this.game === undefined || html === null) {
			return;
		}
		html.style.backgroundImage = `url(${this.game?.background})`;
	}

	protected readonly event = event;
}
