import { Component, Input, OnInit } from '@angular/core';
import IGame from '../../../../interfaces/IGame';
import { GenericService } from '../../../services/generic.service';
import { SettingsService } from '../../../services/settings.service';

@Component({
	selector: 'app-card-view',
	templateUrl: './card-view.component.html',
	styleUrl: './card-view.component.css',
})
export class CardViewComponent implements OnInit {
	@Input()
	games: IGame[] = [];
	gap: any;

	constructor(
		private genericService: GenericService,
		private settingsService: SettingsService,
	) {
	}

	ngOnInit() {
		this.settingsService.getSettings().subscribe((settings) => {
			this.gap = (settings.gap || 1) + 'rem';
		});
	}
}
