import {Injectable} from '@angular/core';
import {BehaviorSubject} from "rxjs";
import {NavigationEnd, Router} from "@angular/router";
import {CategoryService} from "./category.service";
import {invoke} from "@tauri-apps/api/tauri";

@Injectable({
    providedIn: 'root'
})
export class GenericService {
    private audio: HTMLAudioElement | null = null;

    constructor(protected router: Router) {
        this.router.events.subscribe( (event) => {
            if (event instanceof NavigationEnd && this.isAuthorizedToBookmark) {
                this.changeDisplayBookmark(false);
            }

        });
    }

    async callMetadataApi() {
        await invoke<string>("get_available_metadata_api").then((metadataProviders) => {
            this.changeMetadataProviders(JSON.parse(metadataProviders));
        });
    }

    isAuthorizedToBookmark = false;

    private zoom: BehaviorSubject<number> = new BehaviorSubject<number>(12);
    private gap: BehaviorSubject<number> = new BehaviorSubject<number>(1);
    private displayInfo: BehaviorSubject<any> = new BehaviorSubject<any>(null);
    private displayBookmark: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);
    private metadataProviders: BehaviorSubject<string[]> = new BehaviorSubject<string[]>([]);

    changeMetadataProviders(metadataProviders: string[]) {
        this.metadataProviders.next(metadataProviders);
    }

    getMetadataProviders() {
        return this.metadataProviders.asObservable();
    }

    changeZoom(zoom: number) {
        this.zoom.next(zoom);
    }

    getZoom() {
        return this.zoom.asObservable();
    }

    changeGap(gap: number) {
        this.gap.next(gap);
    }

    getGap() {
        return this.gap.asObservable();
    }

    getZoomValue() {
        return this.zoom.value;
    }

    getGapValue() {
        return this.gap.value;
    }

    changeDisplayInfo(displayInfo: any) {
        this.displayInfo.next(displayInfo);
    }

    getDisplayInfo() {
        return this.displayInfo.asObservable();
    }

    changeDisplayBookmark(displayBookmark: boolean) {
        this.displayBookmark.next(displayBookmark);
    }

    getDisplayBookmark() {
        return this.displayBookmark.asObservable();
    }

    playBackgroundMusic(backgroundMusic: string) {
        if (!backgroundMusic) return;

        if (this.audio) {
            this.audio.pause();
        }

        this.audio = new Audio(backgroundMusic);
        this.audio.loop = true;
        this.audio.volume = 0;
        this.audio.play();

        let volume = 0;
        const interval = setInterval(() => {
            if (volume < 0.9) {
                volume += 0.1;
                if (this.audio) this.audio.volume = volume;
            } else {
                clearInterval(interval);
            }
        }, 100);
    }

    stopBackgroundMusic() {
        if (!this.audio) return;

        let volume = this.audio.volume;
        const interval = setInterval(() => {
            if (volume > 0.1) {
                volume -= 0.1;
                if (this.audio) this.audio.volume = volume;
            } else {
                clearInterval(interval);
                if (this.audio) this.audio.pause();
            }
        }, 100);
    }

    stopAllAudio() {
        this.stopBackgroundMusic();
    }

    async downloadYTAudio(url: string, gameName: string) {
        return await invoke<string>("download_yt_audio", {url, gameName}).then((response) => {
            console.log(response);
        });
    }
}
