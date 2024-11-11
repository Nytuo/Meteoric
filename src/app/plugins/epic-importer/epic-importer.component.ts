import { Component, EventEmitter, Input, Output } from '@angular/core';
import { invoke } from '@tauri-apps/api/tauri';
import { ConfirmationService } from 'primeng/api';
import {TranslateService} from "@ngx-translate/core";

@Component({
	selector: 'app-epic-importer',
	templateUrl: './epic-importer.component.html',
	styleUrl: './epic-importer.component.css',
	providers: [ConfirmationService],
})
export class EpicImporterComponent {
	@Input()
	message: string = '';
	@Input()
	searchedGames: any[] = [];
	@Output()
	selectItem: EventEmitter<any> = new EventEmitter<any>();
	@Output()
	back: EventEmitter<void> = new EventEmitter<void>();
	@Input()
	selectedItem: any = null;
	@Output()
	selectedItemChange: EventEmitter<string> = new EventEmitter<string>();
	authCode: any;

	constructor(private confirmationService: ConfirmationService, private translateService: TranslateService) {
	}

	openLinkInBrowser(link: string) {
		window.open(link, '_blank');
	}

	async loginAndSync() {
		console.log(this.authCode);
		await invoke('import_library', {
			pluginName: 'epic_importer',
			creds: [this.authCode],
		});
	}

	async syncOnly() {
		console.log(this.authCode);
		await invoke('import_library', {
			pluginName: 'epic_importer',
			creds: [''],
		});
	}

	confirm() {
		this.confirmationService.confirm({
			header: this.translateService.instant('epic-importer.readme'),
			message: this.translateService.instant('epic-importer.popup'),
			acceptIcon: 'pi pi-check mr-2',
			rejectIcon: 'pi pi-times mr-2',
			rejectButtonStyleClass: 'p-button-sm',
			acceptButtonStyleClass: 'p-button-outlined p-button-sm',
			accept: () => {
				this.openLinkInBrowser(
					'https://www.epicgames.com/id/login?redirectUrl=https%3A//www.epicgames.com/id/api/redirect%3FclientId%3D34a02cf8f4414e29b15921876da36f9a%26responseType%3Dcode',
				);
			},
			reject: () => {
			},
		});
	}
}
