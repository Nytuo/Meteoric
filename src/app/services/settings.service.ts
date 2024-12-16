import { Injectable } from '@angular/core';
import { DBService } from './db.service';
import ISettings from '../../interfaces/ISettings';
import { BehaviorSubject } from 'rxjs';
import { TranslateService } from '@ngx-translate/core';
import { invoke } from '@tauri-apps/api/core';
import { GenericService } from './generic.service';

@Injectable({
	providedIn: 'root',
})
export class SettingsService {
	private settings: BehaviorSubject<ISettings> = new BehaviorSubject<
		ISettings
	>(
		{},
	);

	private apikeys: BehaviorSubject<any> = new BehaviorSubject<any>({});
	constructor(
		protected db: DBService,
		private translate: TranslateService,
		private genericService: GenericService,
	) {
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
		this.get_env_settings().then((res) => {
			this.apikeys.next(res);
		});
	}

	getApiKeys() {
		return this.apikeys.asObservable();
	}

	setApiKeys(apiKeys: any) {
		this.apikeys.next(apiKeys);
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

	changeLanguage(selectedLanguage: string, justSwitch: boolean = false) {
		this.translate.use(selectedLanguage);
		if (!justSwitch) {
			this.settings.next({
				...this.settings.getValue(),
				language: selectedLanguage,
			});
			this.applySettings(this.settings.getValue());
		}
	}

	changeTheme(selectedTheme: string, justSwitch: boolean = false) {
		let themeLinker = document.getElementById(
			'themeLinker',
		) as HTMLLinkElement;
		themeLinker.href = selectedTheme;
		if (!justSwitch) {
			this.settings.next({
				...this.settings.getValue(),
				theme: selectedTheme,
			});
			this.applySettings(this.settings.getValue());
		}
	}

	async get_env_settings() {
		return new Promise((resolve, reject) => {
			invoke('get_env_map').then((res) => {
				resolve(res);
			}).catch((err) => {
				reject(err);
			});
		});
	}

	async set_env_settings() {
		await invoke('set_env_map', { envMap: this.apikeys.getValue() }).then(
			() => {
				this.genericService.sendNotification(
					this.translate.instant('settingsSaved'),
					this.translate.instant('settingsSavedMessage'),
					'success',
				);
			},
		).catch((err) => {
			this.genericService.sendNotification('Error', err, 'error');
			console.error(err);
		});
	}
}
