import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { GameService } from '../../services/game.service';
import IGame from '../../../interfaces/IGame';
import { NgForOf, NgOptimizedImage, NgStyle } from '@angular/common';
import { RatingModule } from 'primeng/rating';
import { FormsModule } from '@angular/forms';
import { TagModule } from 'primeng/tag';
import { SplitterModule } from 'primeng/splitter';
import { DividerModule } from 'primeng/divider';
import { TableModule } from 'primeng/table';
import { CarouselModule, CarouselResponsiveOptions } from 'primeng/carousel';
import { ButtonModule } from 'primeng/button';
import { GalleriaModule } from 'primeng/galleria';
import { GenericService } from '../../services/generic.service';
import * as simpleIcons from 'simple-icons';
import type { SimpleIcon } from 'simple-icons';

@Component({
	selector: 'app-details',
	standalone: true,
	imports: [
		NgOptimizedImage,
		NgForOf,
		RatingModule,
		FormsModule,
		TagModule,
		SplitterModule,
		NgStyle,
		DividerModule,
		TableModule,
		CarouselModule,
		ButtonModule,
		GalleriaModule,
	],
	templateUrl: './details.component.html',
	styleUrl: './details.component.css',
})
export class DetailsComponent implements OnInit, OnDestroy {
	friendsTrohpiesAvg: number = 0;
	friendsTimePlayedAvg: number = 0;
	allPlayersTrophyAvg: number = 0;
	allPlayersTimePlayedAvg: number = 0;
	gameRating: any;
	gameTags: any = ['No tags'];
	media: any = {
		images: [],
		videos: [],
	};
	responsiveOptions: CarouselResponsiveOptions[] | undefined = undefined;
	activities: any[] = [
		{
			type: 'reach trophy',
			player: 'John',
			date: '2021-09-01',
			content: 'You reached 25%',
		},
		{
			type: 'Trophy',
			player: 'John',
			date: '2021-09-01',
			content: 'item 1, item 2',
		},
		{
			type: 'First time played',
			player: 'John',
			date: '2021-09-01',
		},
		{
			type: 'hours played',
			player: 'John',
			date: '2021-09-01',
			content: 'Reached 785 hours',
		},
	];
	protected friends: {
		player: string;
		trophies: number;
		timePlayed: number;
		lastTimePlayed: string;
		totalTrohpies: number;
	}[] = [
		{
			player: 'John',
			trophies: 3,
			timePlayed: 785,
			lastTimePlayed: '2021-09-01',
			totalTrohpies: 10,
		},
		{
			player: 'Doe',
			trophies: 5,
			timePlayed: 785,
			lastTimePlayed: '2021-09-01',
			totalTrohpies: 10,
		},
		{
			player: 'Jane',
			trophies: 7,
			timePlayed: 785,
			lastTimePlayed: '2021-09-01',
			totalTrohpies: 10,
		},
	];
	protected game: IGame | undefined;
	private id: number = 0;
	launcherIcon: string = 'meteor';

	constructor(
		private route: ActivatedRoute,
		private gameService: GameService,
		private genericService: GenericService,
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
				this.genericService.playBackgroundMusic(
					this.game.backgroundMusic,
				);
			}
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

		let icon =
			simpleIcons[platform as keyof typeof simpleIcons] as SimpleIcon;
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

	onScroll(event: any) {
		let image = document.getElementById('bg') as HTMLImageElement;
		if (image === null) {
			return;
		}
		image.style.opacity = (0.6 - event.target.scrollTop / 1000).toString();

		let logo = document.getElementById('logo') as HTMLImageElement;
		if (logo === null) {
			return;
		}

		logo.style.opacity = Math.max(
			0,
			1 - event.target.scrollTop / 250,
		).toString();
		let logoTop = document.getElementById('logo-top') as HTMLImageElement;
		if (logoTop === null) {
			return;
		}
		if (logo.style.opacity === '0') {
			logoTop.style.opacity = '1';
		} else {
			logoTop.style.opacity = '0';
		}

		if (event.target.scrollTop > 250) {
			document
				.querySelector('.navAndBookmarks')
				?.classList.add('backgroundTopbar');
			document.querySelector('.main')?.classList.add('backgroundTopbar');
		} else {
			document
				.querySelector('.navAndBookmarks')
				?.classList.remove('backgroundTopbar');
			document.querySelector('.main')?.classList.remove(
				'backgroundTopbar',
			);
		}
	}

	launchAnimation() {
		document.getElementsByClassName('gameInfo')[0].scrollTo(0, 0);
		document.querySelector('#gameContent')?.classList.add('hidden');
		document.querySelector('#gameHeaderOptional')?.classList.add('hidden');
		document.querySelector('#logo')?.classList.add('logoLaunch');
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
		this.gameTags = this.game?.tags.split(',');
		this.gameRating = this.game?.rating;
		if (this.game.tags === '') this.gameTags = ['No tags'];
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
}
