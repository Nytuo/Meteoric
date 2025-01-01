import {Injectable} from '@angular/core';
import {BehaviorSubject} from 'rxjs';
import {NavigationEnd, Router} from '@angular/router';
import {invoke} from '@tauri-apps/api/core';
import {MessageService} from 'primeng/api';
import {TranslateService} from '@ngx-translate/core';

@Injectable({
	providedIn: 'root',
})
export class GenericService {
	isAuthorizedToBookmark = false;
	private audio: HTMLAudioElement | null = null;
	private displayBookmark: BehaviorSubject<boolean> = new BehaviorSubject<
		boolean
	>(false);
	private gameLaunchAnimation: BehaviorSubject<boolean> = new BehaviorSubject<
		boolean
	>(false);
	private blockUI: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(
		false,
	);
	private sidebarOpen: BehaviorSubject<boolean> = new BehaviorSubject<
		boolean
	>(
		true,
	);

	private achievementsVisible: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);

	private displayIndicator: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(true);
	private audioInterval: string | number | NodeJS.Timeout | undefined;
	private asAlreadyLaunched = false;
	private devMode = false;
	enableLogoAnimation = false;

	constructor(
		protected router: Router,
		private messageService: MessageService,
		private translateService: TranslateService,
	) {
		this.router.events.subscribe((event) => {
			if (event instanceof NavigationEnd && this.isAuthorizedToBookmark) {
				this.changeDisplayBookmark(false);
			}
		});
	}

	getAchievementsVisible() {
		return this.achievementsVisible.asObservable();
	}

	getDevMode() {
		return this.devMode;
	}

	setAsAlreadyLaunched() {
		this.asAlreadyLaunched = true;
	}

	getAsAlreadyLaunched() {
		return this.asAlreadyLaunched;
	}

	changeSidebarOpen(sidebarOpen: boolean) {
		this.sidebarOpen.next(sidebarOpen);
	}

	getSidebarOpen() {
		return this.sidebarOpen.asObservable();
	}

	changeBlockUI(blockUI: boolean) {
		this.blockUI.next(blockUI);
	}

	getBlockUI() {
		return this.blockUI.asObservable();
	}

	getGameLaunchAnimationObservable() {
		return this.gameLaunchAnimation.asObservable();
	}

	changeGameLaunchAnimation(gameLaunchAnimation: boolean) {
		this.gameLaunchAnimation.next(gameLaunchAnimation);
	}

	changeDisplayBookmark(displayBookmark: boolean) {
		this.displayBookmark.next(displayBookmark);
	}

	getDisplayBookmark() {
		return this.displayBookmark.asObservable();
	}

	playBackgroundMusic(backgroundMusic: string) {
		if (!backgroundMusic) return;

		if (this.audioInterval) {
			clearInterval(this.audioInterval);
		}

		this.audio = new Audio(backgroundMusic);
		this.audio.loop = true;
		this.audio.volume = 1;
		this.audio.play();
	}

	isBackgroundMusicPlaying() {
		return this.audio && !this.audio.paused;
	}

	stopBackgroundMusic() {
		if (!this.audio) return;

		let volume = this.audio.volume;
		this.audioInterval = setInterval(() => {
			if (volume > 0.1) {
				volume -= 0.1;
				if (this.audio) this.audio.volume = volume;
			} else {
				clearInterval(this.audioInterval);
				if (this.audio) this.audio.pause();
			}
		}, 100);
	}

	stopAllAudio() {
		this.stopBackgroundMusic();
	}

	startRoutine() {
		invoke('startup_routine');
	}

	async downloadYTAudio(url: string, id: string) {
		return await invoke<string>('download_yt_audio', { url, id }).then(
			(response) => {
				console.log(response);
			},
		);
	}

	sendNotification(
		title: string = 'title',
		message: string = 'message',
		type: string = 'info',
		duration: number = 3000,
		sticky: boolean = false,
	) {
		this.messageService.add({
			severity: type,
			summary: title,
			detail: message,
			life: duration,
			sticky: sticky,
		});
	}

	getDisplayIndicator() {
		return this.displayIndicator.asObservable();
	}

	setDisplayIndicator(displayIndicator: boolean) {
		this.displayIndicator.next(displayIndicator);
	}

	async getAppVersion() {
		return new Promise<string>((resolve) => {
			invoke('get_app_version').then((response) => {
				resolve(response as string);
			});
		});
	}

	toggleAchievementsVisible() {
		this.achievementsVisible.next(!this.achievementsVisible.getValue());
	}
}
