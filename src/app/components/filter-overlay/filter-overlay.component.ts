import { Component, EventEmitter, Input, Output } from '@angular/core';
import { GenericService } from '../../services/generic.service';
import { FormControl, FormGroup } from '@angular/forms';
import { BehaviorSubject } from 'rxjs';
import ISettings from '../../../interfaces/ISettings';
import { SettingsService } from '../../services/settings.service';
import { TranslateService } from '@ngx-translate/core';

@Component({
	selector: 'app-filter-overlay',
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
		{ label: this.translate.instant('view.list'), value: 'list' },
		{ label: this.translate.instant('view.grid'), value: 'card' },
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

	constructor(
		protected genericService: GenericService,
		protected settingsService: SettingsService,
		private translate: TranslateService,
	) {
		this.settingsService.getSettings().subscribe((settings) => {
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
		this.settingsService.applySettings(settings);
	}

	updateVisible() {
		this.visible = !this.visible;
		this.visibleChange.emit(this.visible);
	}

	changeDisplayInfo() {
		let settings = this.settings.getValue();
		settings.displayInfo = (this.displayInfo as ISettings['displayInfo']) ||
			{};
		this.settingsService.applySettings(settings);
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
		this.settingsService.applySettings(settings);
	}

	changeZoom() {
		let settings = this.settings.getValue();
		settings.zoom = this.zoomLevel.toString();
		this.settingsService.changeSettings(settings);
	}

	changeGap() {
		let settings = this.settings.getValue();
		settings.gap = this.gapLevel.toString();
		this.settingsService.changeSettings(settings);
	}

	applyZoom() {
		let settings = this.settings.getValue();
		settings.zoom = this.zoomLevel.toString();
		this.settingsService.applySettings(settings);
	}

	applyGap() {
		let settings = this.settings.getValue();
		settings.gap = this.gapLevel.toString();
		this.settingsService.applySettings(settings);
	}
}
