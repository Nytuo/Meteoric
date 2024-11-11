import { Injectable } from '@angular/core';
import { DBService } from './db.service';
import ISettings from '../../interfaces/ISettings';
import { BehaviorSubject } from 'rxjs';

@Injectable({
	providedIn: 'root',
})
export class SettingsService {
	private settings: BehaviorSubject<ISettings> = new BehaviorSubject<
		ISettings
	>(
		{},
	);
	constructor(protected db: DBService) {
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

	changeLanguage(selectedTheme: string) {
		//TODO MAKE LANGUAGE
		this.settings.next( { ...this.settings.getValue(), theme: selectedTheme });
		this.applySettings(this.settings.getValue());
	}

	changeTheme(selectedTheme: string, justSwitch: boolean = false) {
		let themeLinker = document.getElementById(
			'themeLinker',
		) as HTMLLinkElement;
		themeLinker.href = selectedTheme;
		this.settings.next( { ...this.settings.getValue(), theme: selectedTheme });
		if (!justSwitch) this.applySettings(this.settings.getValue());
	}
}
