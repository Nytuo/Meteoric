import {
	Component,
	Input,
	OnChanges,
	OnInit,
	SimpleChanges,
	ViewChild,
} from '@angular/core';
import { NgForOf, NgIf, NgOptimizedImage, NgStyle } from '@angular/common';
import { GenericService } from '../../services/generic.service';
import { RouterLink } from '@angular/router';
import { SkeletonModule } from 'primeng/skeleton';
import { TagModule } from 'primeng/tag';
import { RatingModule } from 'primeng/rating';
import { FormsModule } from '@angular/forms';
import ISettings from '../../../interfaces/ISettings';

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

	constructor(private genericService: GenericService) {
	}

	ngOnInit(): void {
		if (this.gameName === undefined) {
			this.gameName = 'Game Name';
		}

		this.genericService.getSettings().subscribe((settings) => {
			this.settings = settings;
			this.displayInfo = settings.displayInfo;
			this.width = (settings.zoom) + 'rem';
		});

		this.parsedTags = this.gameTags.split(',') || ['No tags'];
		if (this.gameTags === '') {
			this.parsedTags = ['No tags'];
		}
	}

	ngOnChanges(changes: SimpleChanges): void {
		if (changes['gameImage']) {
			// this.tryToLoadImage(changes['gameImage'].currentValue);
		}
	}
}
