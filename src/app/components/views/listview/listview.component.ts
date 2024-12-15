import {
	Component,
	Input,
	OnChanges,
	type OnInit,
	SimpleChanges,
} from '@angular/core';
import IGame from '../../../../interfaces/IGame';
import { GenericService } from '../../../services/generic.service';
import ISettings from '../../../../interfaces/ISettings';
import { SettingsService } from '../../../services/settings.service';

@Component({
	selector: 'app-listview',
	templateUrl: './listview.component.html',
	styleUrl: './listview.component.css',
})
export class ListViewComponent implements OnInit, OnChanges {
	@Input()
	games: IGame[] = [];
	displayInfo: any = null;
	settings: ISettings = {};

	constructor(
		private genericService: GenericService,
		private settingsService: SettingsService,
	) {
	}

	ngOnInit(): void {
		this.settingsService.getSettings().subscribe((settings) => {
			this.displayInfo = settings.displayInfo;
		});
	}

	ngOnChanges(changes: SimpleChanges): void {
		if (changes['gameImage']) {
			// this.tryToLoadImage(changes['gameImage'].currentValue);
		}
	}
}
