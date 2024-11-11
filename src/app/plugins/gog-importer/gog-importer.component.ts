import { Component, EventEmitter, Input, Output } from '@angular/core';
import { invoke } from '@tauri-apps/api/tauri';
import { ConfirmationService } from 'primeng/api';
import {TranslateService} from "@ngx-translate/core";

@Component({
	selector: 'app-gog-importer',
	templateUrl: './gog-importer.component.html',
	styleUrl: './gog-importer.component.css',
	providers: [ConfirmationService],
})
export class GogImporterComponent {
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

	async loginAndSync() {
		console.log(this.authCode);
		await invoke('import_library', {
			pluginName: 'gog_importer',
			creds: [this.authCode],
		});
	}

	async syncOnly() {
		console.log(this.authCode);
		await invoke('import_library', {
			pluginName: 'gog_importer',
			creds: [''],
		});
	}

	openLinkInBrowser(link: string) {
		window.open(link, '_blank');
	}

	confirm() {
		this.confirmationService.confirm({
			header:  this.translateService.instant('gog-importer.readme'),
			message: this.translateService.instant('gog-importer.howto'),
			acceptIcon: 'pi pi-check mr-2',
			rejectIcon: 'pi pi-times mr-2',
			rejectButtonStyleClass: 'p-button-sm',
			acceptButtonStyleClass: 'p-button-outlined p-button-sm',
			accept: () => {
				this.openLinkInBrowser(
					'https://login.gog.com/auth?client_id=46899977096215655&layout=galaxy&redirect_uri=https%3A%2F%2Fembed.gog.com%2Fon_login_success%3Forigin%3Dclient&response_type=code',
				);
			},
			reject: () => {
			},
		});
	}
}
