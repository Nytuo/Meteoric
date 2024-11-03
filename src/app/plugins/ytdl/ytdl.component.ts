import { Component, EventEmitter, Input, Output } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { ListboxModule } from 'primeng/listbox';
import { NgIf } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

@Component({
	selector: 'app-ytdl',
	templateUrl: './ytdl.component.html',
	styleUrl: './ytdl.component.css',
})
export class YtdlComponent {
	@Input()
	message: string = '';
	@Input()
	searchedGames: any[] = [];
	@Input()
	selectedItem: any = null;
	@Output()
	selectedItemChange: EventEmitter<string> = new EventEmitter<string>();
	parseURL: SafeResourceUrl = '';

	constructor(private sanitizer: DomSanitizer) {
	}

	setVideoUrl(url: string) {
		this.parseURL = this.sanitizer.bypassSecurityTrustResourceUrl(url);
	}

	updateSelectedItem($event: any) {
		this.selectedItem = $event;
		this.selectedItemChange.emit(this.selectedItem);
		this.setVideoUrl(this.selectedItem.url.replace('watch?v=', 'embed/'));
	}
}
