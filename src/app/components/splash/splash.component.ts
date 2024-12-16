import { Component, OnInit } from '@angular/core';
import { platform } from '@tauri-apps/plugin-os';
import { configDir } from '@tauri-apps/api/path';
import { convertFileSrc } from '@tauri-apps/api/core';
import { getCurrentWebviewWindow } from '@tauri-apps/api/webviewWindow';
import { GenericService } from '../../services/generic.service';
const appWindow = getCurrentWebviewWindow()

@Component({
	selector: 'app-splash',
	templateUrl: './splash.component.html',
	styleUrl: './splash.component.css',
})
export class SplashComponent implements OnInit {
	constructor(private genericService: GenericService) {
	}

	ngOnInit() {
		const DEV_MODE = this.genericService.getDevMode();
		if (!DEV_MODE) {
			this.loadVideo().then(() => console.log('Video loaded'));
		} else {
			this.goToHome();
		}
	}

	async loadVideo() {
		let configDirPath = await configDir();
		let dplatform = await platform();
		if (dplatform === 'windows') {
			configDirPath = configDirPath +
				'\\Nytuo\\Meteoric\\config\\meteoric_extra_content\\';
		} else {
			configDirPath = configDirPath + '/meteoric/meteoric_extra_content/';
		}
		let videoTag = document.getElementById('myVideo') as HTMLVideoElement;
		if (videoTag) {
			videoTag.volume = 1;
			videoTag.src = convertFileSrc(configDirPath + 'startup.mp4');
		}
	}

	async goToHome() {
		window.location.href = '/games';
		await appWindow.setFullscreen(false);
	}
}
