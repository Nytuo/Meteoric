import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
	selector: 'app-igdb',
	templateUrl: './igdb.component.html',
	styleUrl: './igdb.component.css',
})
export class IGDBComponent {
	@Input()
	message: string = '';
	@Input()
	searchedGames: any[] = [];
	@Input()
	selectedItem: any = null;
	@Output()
	selectedItemChange: EventEmitter<string> = new EventEmitter<string>();

	updateSelectedItem($event: any) {
		this.selectedItem = $event;
		console.log('selectedItem', this.selectedItem);
		let allSelectedItemsHTML = document.getElementsByClassName('selected');
		for (let i = 0; i < allSelectedItemsHTML.length; i++) {
			allSelectedItemsHTML[i].className = '';
		}
		let selectedItemHTML = document.getElementById(
			'igdb_jaquette-' +
				this.selectedItem.name.toLowerCase().replace(' ', '-'),
		) as HTMLImageElement;
		selectedItemHTML.className = 'selected';

		this.selectedItemChange.emit(this.selectedItem);
	}
}
