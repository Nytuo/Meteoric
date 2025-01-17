import { Component, EventEmitter, Input, Output } from '@angular/core';
import { invoke } from '@tauri-apps/api/core';

@Component({
	selector: 'app-steam-importer',
	templateUrl: './steam-importer.component.html',
	styleUrl: './steam-importer.component.css',
})
export class SteamImporterComponent {
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

	async loginAndSync() {
		console.log(this.authCode);
		await invoke('import_library', {
			pluginName: 'steam_importer',
			creds: [this.authCode],
		});
	}
}
