import { Component, EventEmitter, Input, Output } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { NgIf } from '@angular/common';
import { RadioButtonModule } from 'primeng/radiobutton';
import { SelectButtonModule } from 'primeng/selectbutton';
import { SliderModule } from 'primeng/slider';
import { GenericService } from '../../services/generic.service';
import { FormControl, FormGroup, FormsModule } from '@angular/forms';
import { BehaviorSubject } from 'rxjs';
import ISettings from '../../../interfaces/ISettings';

@Component({
	selector: 'app-filter-overlay',
	standalone: true,
	imports: [
		ButtonModule,
		DialogModule,
		NgIf,
		RadioButtonModule,
		SelectButtonModule,
		SliderModule,
		FormsModule,
	],
	templateUrl: './filter-overlay.component.html',
	styleUrl: './filter-overlay.component.css',
})
export class FilterOverlayComponent {
	@Input()
	visible: boolean = false;
	@Output()
	visibleChange = new EventEmitter<boolean>();

	viewState: any = 'card';
	stateOptions: any[] | undefined = [
		{ label: 'List', value: 'list' },
		{ label: 'Grid', value: 'card' },
	];
	displayInfo: FormGroup = new FormGroup({
		name: new FormControl(''),
		rating: new FormControl(''),
		platforms: new FormControl(''),
		tags: new FormControl(''),
	});
	settings: BehaviorSubject<ISettings> = new BehaviorSubject<ISettings>({});

	zoomLevel: any;
	gapLevel: any;

	constructor(protected genericService: GenericService) {
		this.genericService.getSettings().subscribe((settings) => {
			this.settings.next(settings);
			this.viewState = settings.view || 'card';
			this.displayInfo = new FormGroup({
				name: new FormControl(settings.displayInfo?.name || ''),
				rating: new FormControl(settings.displayInfo?.rating || ''),
				platforms: new FormControl(
					settings.displayInfo?.platforms || '',
				),
				tags: new FormControl(settings.displayInfo?.tags || ''),
			});
		});
		this.zoomLevel = this.settings.getValue().zoom || '1';
		this.gapLevel = this.settings.getValue().gap || '1';
	}

	changeView() {
		let settings = this.settings.getValue();
		settings.view = this.viewState;
		this.genericService.applySettings(settings);
	}

	updateVisible() {
		this.visible = !this.visible;
		this.visibleChange.emit(this.visible);
	}

	changeDisplayInfo() {
		let settings = this.settings.getValue();
		settings.displayInfo = (this.displayInfo as ISettings['displayInfo']) ||
			{};
		this.genericService.applySettings(settings);
	}

	clearDisplayInfo() {
		this.displayInfo = new FormGroup({
			name: new FormControl(''),
			rating: new FormControl(''),
			platforms: new FormControl(''),
			tags: new FormControl(''),
		});
		let settings = this.settings.getValue();
		settings.displayInfo = '';
		this.genericService.applySettings(settings);
	}

	changeZoom() {
		let settings = this.settings.getValue();
		settings.zoom = this.zoomLevel.toString();
		this.genericService.changeSettings(settings);
	}

	changeGap() {
		let settings = this.settings.getValue();
		settings.gap = this.gapLevel.toString();
		this.genericService.changeSettings(settings);
	}

	applyZoom() {
		let settings = this.settings.getValue();
		settings.zoom = this.zoomLevel.toString();
		this.genericService.applySettings(settings);
	}

	applyGap() {
		let settings = this.settings.getValue();
		settings.gap = this.gapLevel.toString();
		this.genericService.applySettings(settings);
	}
}
