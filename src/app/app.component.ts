import { Component, OnInit } from '@angular/core';
import { GameService } from './services/game.service';
import { CategoryService } from './services/category.service';
import { GenericService } from './services/generic.service';
import { PrimeNGConfig } from 'primeng/api';
import { SettingsService } from './services/settings.service';
import ISettings from '../interfaces/ISettings';
import { BehaviorSubject } from 'rxjs';
import { TranslateService } from '@ngx-translate/core';
import translationsEN from './i18n/en.json';
import translationsFR from './i18n/fr.json';
import translationsES from './i18n/es.json';
import translationsDE from './i18n/de.json';
import translationsDEV from './i18n/dev.json';
import translationsIT from './i18n/it.json';

@Component({
	selector: 'app-root',
	templateUrl: './app.component.html',
	styleUrl: './app.component.css',
})
export class AppComponent implements OnInit {
	constructor(
		private gameService: GameService,
		private categoryService: CategoryService,
		private genericService: GenericService,
		private primengConfig: PrimeNGConfig,
		private settingsService: SettingsService,
		translate: TranslateService,
	) {
		translate.setTranslation('en', translationsEN);
		translate.setTranslation('fr', translationsFR);
		translate.setTranslation('de', translationsDE);
		translate.setTranslation('dev', translationsDEV);
		translate.setTranslation('it', translationsIT);
		translate.setTranslation('es', translationsES);
		translate.setDefaultLang('en');
	}

	settings: BehaviorSubject<ISettings> = new BehaviorSubject<ISettings>({});

	ngOnInit() {
		this.gameService.getGames();
		this.categoryService.refreshCategories();
		this.genericService.startRoutine();
		this.primengConfig.ripple = true;
		this.settingsService.getSettings().subscribe((settings) => {
			this.settingsService.changeTheme(
				settings.theme || 'viva-dark.css',
				true,
			);
			this.settingsService.changeLanguage(
				settings.language || 'en',
				true,
			);
		});
		this.changeBackground();
	}

	changeBackground() {
		const number_of_images = 3;
		let html = document.getElementsByTagName('html')[0];
		html.style.backgroundImage = "url('assets/backgrounds/" +
			Math.floor(Math.random() * number_of_images) + ".jpg')";
	}

	closeOverlay() {
		let overlay = document.getElementById('overlay');
		console.log(overlay);
		if (overlay && overlay.style.display === 'block') {
			overlay.style.display = 'none';
		}
	}
}
