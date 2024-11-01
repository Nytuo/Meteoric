import { KeyValuePipe, NgForOf, NgIf, NgOptimizedImage } from '@angular/common';
import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { DropdownModule } from 'primeng/dropdown';
import { FloatLabelModule } from 'primeng/floatlabel';
import { InputTextModule } from 'primeng/inputtext';
import { ListboxModule } from 'primeng/listbox';
import { SharedModule } from 'primeng/api';
import { TabViewModule } from 'primeng/tabview';
import { IGDBComponent } from '../../plugins/igdb/igdb.component';
import { YtdlComponent } from '../../plugins/ytdl/ytdl.component';
import { SteamGridComponent } from '../../plugins/steam_grid/steam_grid.component';
import { CSVImporter } from '../../plugins/csv_importer/csv_importer.component';
import { EpicImporterComponent } from '../../plugins/epic-importer/epic-importer.component';
import { SteamImporterComponent } from '../../plugins/steam-importer/steam-importer.component';
import { GogImporterComponent } from '../../plugins/gog-importer/gog-importer.component';
import { PanelMenuModule } from 'primeng/panelmenu';
import { ProgressBarModule } from 'primeng/progressbar';
import { FormsModule } from '@angular/forms';
import { CSVEmporter } from '../../plugins/csv_exporter/csv_exporter.component';

@Component({
	selector: 'app-settings-overlay',
	standalone: true,
	imports: [
		ButtonModule,
		DialogModule,
		DropdownModule,
		FloatLabelModule,
		InputTextModule,
		KeyValuePipe,
		ListboxModule,
		NgForOf,
		PanelMenuModule,
		NgIf,
		SharedModule,
		TabViewModule,
		IGDBComponent,
		YtdlComponent,
		SteamGridComponent,
		CSVImporter,
		EpicImporterComponent,
		SteamImporterComponent,
		GogImporterComponent,
		ProgressBarModule,
		FormsModule,
		NgOptimizedImage,
		CSVEmporter,
	],
	templateUrl: './settings-overlay.component.html',
	styleUrl: './settings-overlay.component.css',
})
export class SettingsOverlayComponent implements OnInit {
	@Input()
	visible: boolean = false;
	@Output()
	visibleChange = new EventEmitter<boolean>();
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
		{ label: 'Polski', value: 'pl' },
		{ label: 'Português', value: 'pt' },
		{ label: 'Русский', value: 'ru' },
		{ label: '中文', value: 'zh' },
		{ label: '日本語', value: 'ja' },
		{ label: '한국어', value: 'ko' },
	];
	activeItem: any;
	items = [{
		label: 'General',
		icon: 'pi pi-info-circle',
		expanded: true,
		items: [
			{
				label: 'Themes',
				icon: 'pi pi-file',
				command: () => {
					this.activeItem = 'Themes';
				},
			},
			{
				label: 'Languages',
				icon: 'pi pi-id-card',
				command: () => {
					this.activeItem = 'Languages';
				},
			},
		],
	}, {
		label: 'Game Importers',
		icon: 'pi pi-file-import',
		expanded: true,
		items: [
			{
				label: 'CSV Importer',
				icon: 'pi pi-cloud-upload',
				command: () => {
					this.activeItem = 'CSV Importer';
				},
			},
			{
				label: 'Epic Games Importer',
				icon: 'pi pi-cloud-download',
				command: () => {
					this.activeItem = 'Epic Games Importer';
				},
			},
			{
				label: 'Steam Importer',
				icon: 'pi pi-refresh',
				command: () => {
					this.activeItem = 'Steam Importer';
				},
			},
			{
				label: 'GOG Importer',
				icon: 'pi pi-refresh',
				command: () => {
					this.activeItem = 'GOG Importer';
				},
			},
		],
	}, {
		label: 'Database Exporters',
		icon: 'pi pi-file-import',
		expanded: true,
		items: [
			{
				label: 'CSV Exporter',
				icon: 'pi pi-cloud-upload',
				command: () => {
					this.activeItem = 'CSV Exporter';
				},
			},
		],
	}, {
		label: 'About',
		icon: 'pi pi-info-circle',
		command: () => {
			this.activeItem = 'About';
		},
	}];
	selectedTheme: any;
	selectedLanguage: any;
	appVersion: string = '1.0.0';

	changeLanguage() {
		throw new Error('Method not implemented.');
	}

	changeTheme() {
		let themeLinker = document.getElementById(
			'themeLinker',
		) as HTMLLinkElement;
		themeLinker.href = this.selectedTheme.value;
	}

	hide() {
		this.visibleChange.emit(false);
	}

	ngOnInit(): void {
		this.selectedTheme =
			(document.getElementById('themeLinker') as HTMLLinkElement).href
				.split('/').pop();
		this.appVersion = '1.0.0'; // TODO get version from package.json
	}
}
