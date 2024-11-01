import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { ListboxModule } from 'primeng/listbox';
import { NgFor, NgIf, NgOptimizedImage } from '@angular/common';
import { FormsModule } from '@angular/forms';
import ISGDB from './ISGDB';
import { invoke } from '@tauri-apps/api/tauri';
import { StepperModule } from 'primeng/stepper';

@Component({
	selector: 'app-steam-grid',
	standalone: true,
	imports: [
		ButtonModule,
		ListboxModule,
		NgIf,
		NgFor,
		FormsModule,
		StepperModule,
		NgOptimizedImage,
	],
	templateUrl: './steam_grid.component.html',
	styleUrl: './steam_grid.component.css',
})
export class SteamGridComponent implements OnInit {
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
	selectedItemChange: EventEmitter<any> = new EventEmitter<any>();
	availableGrids: any[] = [];
	availableHeroes: any[] = [];
	availableLogos: any[] = [];
	availableIcons: any[] = [];
	selectedItemLocal: ISGDB = {
		id: '',
		name: '',
		release_date: '',
		verified: false,
		types: [],
	};
	toSendGame = {
		id: '-1',
		jaquette: '',
		background: '',
		logo: '',
		icon: '',
	};
	selectGridIndex = 0;
	selectHeroIndex = 0;
	selectLogoIndex = 0;
	selectIconIndex = 0;

	ngOnInit(): void {
	}

	onStepChange($event: any) {
		console.log($event);
		//try switch
		this.applySelectionOn('grid', this.selectGridIndex);
		this.applySelectionOn('hero', this.selectHeroIndex);
		this.applySelectionOn('logo', this.selectLogoIndex);
		this.applySelectionOn('icon', this.selectIconIndex);
	}

	send() {
		console.log(this.toSendGame);
		this.selectedItemChange.emit(this.toSendGame);
		this.selectItem.emit();
	}

	updateSelectedItem($event: any) {
		this.selectedItem = $event;
		this.selectedItemLocal = this.selectedItem;
		this.updateAvailableGrids();
		this.updateAvailableHeroes();
		this.updateAvailableLogos();
		this.updateAvailableIcons();
	}

	async updateAvailableGrids() {
		this.availableGrids = await invoke<string[]>('steamgrid_get_grid', {
			gameId: this.selectedItemLocal.id,
		}).then((grids) => {
			return grids;
		});
		console.log(this.availableGrids);
		this.availableGrids = this.availableGrids.map((grid: any) => {
			return {
				image: grid.url,
				thumb: grid.thumb,
			};
		});
	}

	async updateAvailableHeroes() {
		this.availableHeroes = await invoke<string[]>('steamgrid_get_hero', {
			gameId: this.selectedItemLocal.id,
		}).then((heroes) => {
			return heroes;
		});
		console.log(this.availableHeroes);
		this.availableHeroes = this.availableHeroes.map((hero: any) => {
			return {
				image: hero.url,
				thumb: hero.thumb,
			};
		});
	}

	async updateAvailableLogos() {
		this.availableLogos = await invoke<string[]>('steamgrid_get_logo', {
			gameId: this.selectedItemLocal.id,
		}).then((logos) => {
			return logos;
		});
		console.log(this.availableLogos);
		this.availableLogos = this.availableLogos.map((logo: any) => {
			return {
				image: logo.url,
				thumb: logo.thumb,
			};
		});
	}

	async updateAvailableIcons() {
		this.availableIcons = await invoke<string[]>('steamgrid_get_icon', {
			gameId: this.selectedItemLocal.id,
		}).then((icons) => {
			return icons;
		});
		console.log(this.availableIcons);
		this.availableIcons = this.availableIcons.map((icon: any) => {
			return {
				image: icon.url,
				thumb: icon.thumb,
			};
		});
	}

	applySelectionOn(item: string, index: number) {
		console.log('applySelectionOn', item, index);
		let allSelectedItemsHTML = document.querySelectorAll(
			'.' + item + '.selected',
		);
		for (let i = 0; i < allSelectedItemsHTML.length; i++) {
			allSelectedItemsHTML[i].classList.remove('selected');
		}
		let selectedItemHTML = document.getElementById(
			item + '-' + index,
		) as HTMLImageElement;
		console.log(selectedItemHTML);
		if (selectedItemHTML === null) {
			return;
		}
		selectedItemHTML.classList.add('selected');
	}

	selectGrid(grid: string, index: number) {
		this.toSendGame.jaquette = grid;
		this.selectGridIndex = index;
		this.applySelectionOn('grid', index);
	}

	selectHero(hero: string, index: number) {
		this.toSendGame.background = hero;
		this.selectHeroIndex = index;
		this.applySelectionOn('hero', index);
	}

	selectLogo(logo: string, index: number) {
		this.toSendGame.logo = logo;
		this.selectLogoIndex = index;
		this.applySelectionOn('logo', index);
	}

	selectIcon(icon: string, index: number) {
		this.toSendGame.icon = icon;
		this.selectIconIndex = index;
		this.applySelectionOn('icon', index);
	}
}
