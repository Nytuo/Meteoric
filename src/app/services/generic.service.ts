import {Injectable} from '@angular/core';
import {BehaviorSubject} from "rxjs";
import {NavigationEnd, Router} from "@angular/router";
import {invoke} from "@tauri-apps/api/tauri";
import ISettings from "../../interfaces/ISettings";
import {DBService} from "./db.service";

@Injectable({
    providedIn: 'root',
})
export class GenericService {

    isAuthorizedToBookmark = false;
    private audio: HTMLAudioElement | null = null;
    private displayBookmark: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);
    private gameLaunchAnimation: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);
    private blockUI: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);
    private sidebarOpen: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(true);
    private audioInterval: string | number | NodeJS.Timeout | undefined;
    private settings: BehaviorSubject<ISettings> = new BehaviorSubject<ISettings>({});

    constructor(protected router: Router, protected db: DBService) {
        this.router.events.subscribe((event) => {
            if (event instanceof NavigationEnd && this.isAuthorizedToBookmark) {
                this.changeDisplayBookmark(false);
            }

        });

        this.db.getSettings().then((settings) => {
            console.log(settings);
            if (settings.gap) {
                if (Number.isNaN(settings.gap)) {
                    settings.gap = '1';
                }
                settings.gap = settings.gap.toString();

            }
            if (settings.zoom) {
                if (Number.isNaN(settings.gap)) {
                    settings.zoom = '10';
                }
                settings.zoom = settings.zoom.toString();

            }
            console.log(settings);
            this.settings.next(settings);
        });
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

    changeDisplayBookmark(displayBookmark: boolean) {
        this.displayBookmark.next(displayBookmark);
    }

    getDisplayBookmark() {
        return this.displayBookmark.asObservable();
    }

    playBackgroundMusic(backgroundMusic: string) {
        console.log('Playing background music');
        console.log(backgroundMusic);
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
        console.log('Stopping background music');
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
        return await invoke<string>("download_yt_audio", {url, id}).then((response) => {
            console.log(response);
        });
    }

    async launchGame(gameId: string) {
        this.gameLaunchAnimation.next(true);
        setTimeout(() => {
            invoke('launch_game', {gameId}).then((response) => {
                console.log(response);
            });
            this.stopAllAudio();
        }, 2000);
        setTimeout(() => {
            this.gameLaunchAnimation.next(false);
        }, 5000);
    }

    async killGame(gamePID: number) {
        invoke('kill_game', {pid: gamePID}).then((response) => {
            console.log(response);
        });
    }

    changeSettings(settings: ISettings) {
        this.settings.next(settings);
    }

    applySettings(settings: ISettings) {
        this.settings.next(settings);
        this.db.setSettings(settings);
    }

    getSettings() {
        return this.settings.asObservable();
    }
}
