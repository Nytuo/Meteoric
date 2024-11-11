import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import {SettingsService} from "../../services/settings.service";
import {BehaviorSubject} from "rxjs";
import ISettings from "../../../interfaces/ISettings";
import { TranslateService } from '@ngx-translate/core';

@Component({
	selector: 'app-settings-overlay',
	templateUrl: './settings-overlay.component.html',
	styleUrl: './settings-overlay.component.css',
})
export class SettingsOverlayComponent implements OnInit {
	@Input()
	visible: boolean = false;
	@Output()
	visibleChange = new EventEmitter<boolean>();
	settings: BehaviorSubject<ISettings> = new BehaviorSubject<ISettings>({});
	themes: any[] = [
		{ label: 'Bootstrap4 Light Blue', value: 'bootstrap4-light-blue.css' },
		{
			label: 'Bootstrap4 Light Purple',
			value: 'bootstrap4-light-purple.css',
		},
		{ label: 'Bootstrap4 Dark Blue', value: 'bootstrap4-dark-blue.css' },
		{
			label: 'Bootstrap4 Dark Purple',
			value: 'bootstrap4-dark-purple.css',
		},
		{ label: 'MD Light Indigo', value: 'md-light-indigo.css' },
		{ label: 'MD Light Deep Purple', value: 'md-light-deeppurple.css' },
		{ label: 'MD Dark Indigo', value: 'md-dark-indigo.css' },
		{ label: 'MD Dark Deep Purple', value: 'md-dark-deeppurple.css' },
		{ label: 'MDC Light Indigo', value: 'mdc-light-indigo.css' },
		{ label: 'MDC Light Deep Purple', value: 'mdc-light-deeppurple.css' },
		{ label: 'MDC Dark Indigo', value: 'mdc-dark-indigo.css' },
		{ label: 'MDC Dark Deep Purple', value: 'mdc-dark-deeppurple.css' },
		{ label: 'Fluent Light', value: 'fluent-light.css' },
		{ label: 'Lara Light Blue', value: 'lara-light-blue.css' },
		{ label: 'Lara Light Indigo', value: 'lara-light-indigo.css' },
		{ label: 'Lara Light Purple', value: 'lara-light-purple.css' },
		{ label: 'Lara Light Teal', value: 'lara-light-teal.css' },
		{ label: 'Lara Dark Blue', value: 'lara-dark-blue.css' },
		{ label: 'Lara Dark Indigo', value: 'lara-dark-indigo.css' },
		{ label: 'Lara Dark Purple', value: 'lara-dark-purple.css' },
		{ label: 'Lara Dark Teal', value: 'lara-dark-teal.css' },
		{ label: 'Soho Light', value: 'soho-light.css' },
		{ label: 'Soho Dark', value: 'soho-dark.css' },
		{ label: 'Viva Light', value: 'viva-light.css' },
		{ label: 'Viva Dark', value: 'viva-dark.css' },
		{ label: 'Mira', value: 'mira.css' },
		{ label: 'Nano', value: 'nano.css' },
		{ label: 'Saga Blue', value: 'saga-blue.css' },
		{ label: 'Saga Green', value: 'saga-green.css' },
		{ label: 'Saga Orange', value: 'saga-orange.css' },
		{ label: 'Saga Purple', value: 'saga-purple.css' },
		{ label: 'Vela Blue', value: 'vela-blue.css' },
		{ label: 'Vela Green', value: 'vela-green.css' },
		{ label: 'Vela Orange', value: 'vela-orange.css' },
		{ label: 'Vela Purple', value: 'vela-purple.css' },
		{ label: 'Arya Blue', value: 'arya-blue.css' },
		{ label: 'Arya Green', value: 'arya-green.css' },
		{ label: 'Arya Orange', value: 'arya-orange.css' },
		{ label: 'Arya Purple', value: 'arya-purple.css' },
		{ label: 'Nova', value: 'nova.css' },
		{ label: 'Nova Alt', value: 'nova-alt.css' },
		{ label: 'Nova Accent', value: 'nova-accent.css' },
		{ label: 'Luna Amber', value: 'luna-amber.css' },
		{ label: 'Luna Blue', value: 'luna-blue.css' },
		{ label: 'Luna Green', value: 'luna-green.css' },
		{ label: 'Luna Pink', value: 'luna-pink.css' },
		{ label: 'Rhea', value: 'rhea.css' },
	];
	languages: any[] = [
		{ label: 'English', value: 'en' },
		{ label: 'Deutsch', value: 'de' },
		{ label: 'Français', value: 'fr' },
		{ label: 'Italiano', value: 'it' },
		{ label: 'Español', value: 'es' },
		{ label: 'Dev', value: 'dev' },
	];
	activeItem: any;
	items = [{
		label: this.translate.instant('general'),
		icon: 'pi pi-info-circle',
		expanded: true,
		items: [
			{
				label: this.translate.instant('themes'),
				icon: 'pi pi-file',
				command: () => {
					this.activeItem = 'Themes';
				},
			},
			{
				label: this.translate.instant('languages'),
				icon: 'pi pi-id-card',
				command: () => {
					this.activeItem = 'Languages';
				},
			},
			{
				label: this.translate.instant('api-settings'),
				icon: 'pi pi-sliders-h',
				command: () => {
					this.activeItem = 'APIKEYS';
				},
			}
		],
	}, {
		label: this.translate.instant('game-importers'),
		icon: 'pi pi-file-import',
		expanded: true,
		items: [
			{
				label: this.translate.instant('csv-importer'),
				icon: 'pi pi-cloud-upload',
				command: () => {
					this.activeItem = this.translate.instant('csv-importer')
				},
			},
			{
				label: 'Epic Games ' + this.translate.instant('importer'),
				icon: 'pi pi-cloud-download',
				command: () => {
					this.activeItem = 'Epic Games '+this.translate.instant('importer')
				},
			},
			{
				label: 'Steam '+this.translate.instant('importer'),
				icon: 'pi pi-refresh',
				command: () => {
					this.activeItem = 'Steam '+this.translate.instant('importer')
				},
			},
			{
				label: 'GOG '+ this.translate.instant('importer'),
				icon: 'pi pi-refresh',
				command: () => {
					this.activeItem = 'GOG ' + this.translate.instant('importer')
				},
			},
		],
	}, {
		label: this.translate.instant('database-exporters'),
		icon: 'pi pi-file-import',
		expanded: true,
		items: [
			{
				label: this.translate.instant('csv-exporter'),
				icon: 'pi pi-cloud-upload',
				command: () => {
					this.activeItem = this.translate.instant('csv-importer')
				},
			},
			{
				label: this.translate.instant('archive-exporter'),
				icon: 'pi pi-cloud-upload',
				command: () => {
					this.activeItem = this.translate.instant('archive-exporter')
				},
			},
		],
	}, {
		label: this.translate.instant('about'),
		icon: 'pi pi-info-circle',
		command: () => {
			this.activeItem = this.translate.instant('about')
		},
	}];
	selectedTheme: any;
	selectedLanguage: any;
	appVersion: string = '1.0.0';

	constructor(private settingsService: SettingsService, private translate: TranslateService) {}

	changeLanguage() {
		this.settingsService.changeLanguage(this.selectedLanguage.value);
	}

	changeTheme() {
		this.settingsService.changeTheme(this.selectedTheme.value);
	}

	hide() {
		this.visibleChange.emit(false);
	}

	searchThemeFromValue(value: string) {
		return this.themes.find((theme) => theme.value === value);
	}

	searchLanguageFromValue(value: string) {
		return this.languages.find((language) => language.value === value);
	}

	ngOnInit(): void {
		this.selectedTheme =
			(document.getElementById('themeLinker') as HTMLLinkElement).href
				.split('/').pop();
		this.selectedTheme = this.searchThemeFromValue(this.selectedTheme);
		this.selectedLanguage = this.searchLanguageFromValue(
			this.translate.currentLang || 'en',
		);
		this.appVersion = '1.0.0';
	}
}
