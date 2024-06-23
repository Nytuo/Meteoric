import {Component, EventEmitter, Input, Output} from '@angular/core';
import {ButtonModule} from "primeng/button";
import {ListboxModule} from "primeng/listbox";
import {NgIf, NgFor} from "@angular/common";
import {FormsModule} from "@angular/forms";
import ISGDB from './ISGDB';
import { invoke } from '@tauri-apps/api/tauri';
import IGame from '../../../interfaces/IGame';

@Component({
    selector: 'app-steam-grid',
    standalone: true,
    imports: [
        ButtonModule,
        ListboxModule,
        NgIf,
        NgFor,
        FormsModule
    ],
    templateUrl: './steam_grid.component.html',
    styleUrl: './steam_grid.component.css'
})

export class SteamGridComponent {

    @Input() message: string = '';
    @Input() searchedGames: any[] = [];
    @Output() selectItem: EventEmitter<any> = new EventEmitter<any>();
    @Output() back: EventEmitter<void> = new EventEmitter<void>();
    @Input() selectedItem: any = null;
    @Output() selectedItemChange: EventEmitter<any> = new EventEmitter<any>();

    currentStep: number = 0;

    availableGrids: any[] = [];
    availableHeroes: any[] = [];
    availableLogos: any[] = [];
    availableIcons: any[] = [];
    selectedItemLocal: ISGDB = {
        id: '',
        name: '',
        release_date: '',
        verified: false,
        types: []
    };
    toSendGame = {
        id: '-1',
        jaquette: '',
        background: '',
        logo: '',
        icon: '',
    };

    send(){
        console.log(this.toSendGame);
        this.selectedItemChange.emit(this.toSendGame);
        this.selectItem.emit();
    }

    updateSelectedItem($event: any) {
        this.selectedItem = $event;
        this.currentStep++;
        this.selectedItemLocal = this.selectedItem;
        this.updateAvailableGrids();
        this.updateAvailableHeroes();
        this.updateAvailableLogos();
        this.updateAvailableIcons();
    }

    async updateAvailableGrids() {
        this.availableGrids = await invoke<string[]>("steamgrid_get_grid", { gameId: this.selectedItemLocal.id }).then((grids) => {
            return grids;
        });
        console.log(this.availableGrids);
        this.availableGrids = this.availableGrids.map((grid: any) => {
            return {
                image: grid.url,
                thumb: grid.thumb
            };
        });
    }

    async updateAvailableHeroes() {
        this.availableHeroes = await invoke<string[]>("steamgrid_get_hero", { gameId: this.selectedItemLocal.id }).then((heroes) => {
            return heroes;
        });
        console.log(this.availableHeroes);
        this.availableHeroes = this.availableHeroes.map((hero: any) => {
            return {
                image: hero.url,
                thumb: hero.thumb
            };
        });
    }

    async updateAvailableLogos() {
        this.availableLogos = await invoke<string[]>("steamgrid_get_logo", { gameId: this.selectedItemLocal.id }).then((logos) => {
            return logos;
        });
        console.log(this.availableLogos);
        this.availableLogos = this.availableLogos.map((logo: any) => {
            return {
                image: logo.url,
                thumb: logo.thumb
            };
        });
    }

    async updateAvailableIcons() {
        this.availableIcons = await invoke<string[]>("steamgrid_get_icon", { gameId: this.selectedItemLocal.id }).then((icons) => {
            return icons;
        });
        console.log(this.availableIcons);
        this.availableIcons = this.availableIcons.map((icon: any) => {
            return {
                image: icon.url,
                thumb: icon.thumb
            };
        });
    }

    selectGrid(grid: string) {
        this.toSendGame.jaquette = grid;
        this.currentStep++;
    }

    selectHero(hero: string) {
        this.toSendGame.background = hero;
        this.currentStep++;
    }

    selectLogo(logo: string) {
        this.toSendGame.logo = logo;
        this.currentStep++;
    }

    selectIcon(icon: string) {
        this.toSendGame.icon = icon;
    }


}
