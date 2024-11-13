import { Injectable } from '@angular/core';
import { DBService } from './db.service';
import ISettings from '../../interfaces/ISettings';
import { BehaviorSubject } from 'rxjs';
import { TranslateService } from '@ngx-translate/core';

@Injectable({
	providedIn: 'root',
})
export class SettingsService {
	private settings: BehaviorSubject<ISettings> = new BehaviorSubject<
		ISettings
	>(
		{},
	);
	constructor(protected db: DBService, private translate: TranslateService) {
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
}
