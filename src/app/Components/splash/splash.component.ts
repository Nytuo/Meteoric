import {Component, OnInit} from '@angular/core';
import {platform} from "@tauri-apps/api/os";
import {configDir} from "@tauri-apps/api/path";
import {convertFileSrc} from "@tauri-apps/api/tauri";
import {appWindow} from "@tauri-apps/api/window";

@Component({
    selector: 'app-splash',
    standalone: true,
    imports: [],
    templateUrl: './splash.component.html',
    styleUrl: './splash.component.css'
})
export class SplashComponent implements OnInit {


    constructor() {
    }

    ngOnInit() {
        const DEV_MODE = true;
        if (!DEV_MODE) {
            this.loadVideo().then(r => console.log("Video loaded"));
        } else {
            this.goToHome();
        }
    }

    async loadVideo() {
        let configDirPath = await configDir();
        let dplatform = await platform();
        if (dplatform === "win32") {
            configDirPath = configDirPath + "Nytuo\\universe\\config\\universe_extra_content\\";
        } else {
            configDirPath = configDirPath + "universe/universe_extra_content/";
        }
        let videoTag = document.getElementById("myVideo") as HTMLVideoElement;
        if (videoTag) {
            videoTag.volume = 1;
            videoTag.src = convertFileSrc(configDirPath + "startup.mp4");
        }
    }

    async goToHome() {
        window.location.href = "/games";
        await appWindow.setFullscreen(false);
    }
}
