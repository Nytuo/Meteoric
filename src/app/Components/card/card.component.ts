import {
	Component,
	Input,
	OnChanges,
	OnInit,
	SimpleChanges,
	ViewChild,
} from '@angular/core';
import { GenericService } from '../../services/generic.service';
import ISettings from '../../../interfaces/ISettings';
import { SettingsService } from '../../services/settings.service';
import { TranslateService } from '@ngx-translate/core';

@Component({
	selector: 'app-card',
	templateUrl: './card.component.html',
	styleUrl: './card.component.css',
})
export class CardComponent implements OnInit, OnChanges {
	@Input()
	gameName: string | undefined;
	@Input()
	gameImage: string | undefined;
	@Input()
	gameId: string | undefined;
	@Input()
	gameTags: string = 'No tags';
	@Input()
	gameRating: string = '0';
	@Input()
	gamePlatforms: string | undefined;

	@ViewChild('imageElement')
	img: any;

	settings: ISettings = {};
	width: string = '1rem';
	displayInfo: any = null;
	height: string = 'auto';
	protected parsedTags: string[] = [];

	constructor(
		private genericService: GenericService,
		private settingsService: SettingsService,
		private translate: TranslateService,
	) {
	}

	ngOnInit(): void {
		if (this.gameName === undefined) {
			this.gameName = 'Game Name';
		}

		this.settingsService.getSettings().subscribe((settings) => {
			this.settings = settings;
			this.displayInfo = settings.displayInfo;
			this.width = (settings.zoom) + 'rem';
		});

		this.parsedTags = this.gameTags.split(',') ||
			[this.translate.instant('no_tags')];
		if (this.gameTags === '') {
			this.parsedTags = [this.translate.instant('no_tags')];
		}
	}

	ngOnChanges(changes: SimpleChanges): void {
		if (changes['gameImage']) {
			// this.tryToLoadImage(changes['gameImage'].currentValue);
		}
	}
}
