import { Component, OnInit, ViewChild, viewChild } from '@angular/core';
import { GenericService } from "../../services/generic.service";
import { ButtonModule } from "primeng/button";
import { KeyValuePipe, Location, NgFor, NgIf, NgOptimizedImage } from '@angular/common';
import { RadioButtonModule } from "primeng/radiobutton";
import { FormsModule, ReactiveFormsModule } from "@angular/forms";
import { SliderModule } from "primeng/slider";
import { SelectButtonModule } from "primeng/selectbutton";
import { DialogModule } from "primeng/dialog";
import { ToolbarModule } from "primeng/toolbar";
import { SplitButtonModule } from "primeng/splitbutton";
import { appWindow } from "@tauri-apps/api/window";
import { FloatLabelModule } from "primeng/floatlabel";
import { TabViewModule } from "primeng/tabview";
import { InputTextModule } from "primeng/inputtext";
import { DropdownModule } from "primeng/dropdown";
import { ListboxModule } from "primeng/listbox";
import { AddGameOverlayComponent } from "../add-game-overlay/add-game-overlay.component";
import { FilterOverlayComponent } from "../filter-overlay/filter-overlay.component";
import { NavigationEnd, Router } from "@angular/router";
import { BehaviorSubject } from "rxjs";
import { GameService } from "../../services/game.service";
import { open } from '@tauri-apps/api/dialog';
import { dirname } from '@tauri-apps/api/path';
import { DBService } from '../../services/db.service';

@Component({
    selector: 'app-topbar',
    standalone: true,
    imports: [
        ButtonModule,
        NgFor,
        RadioButtonModule,
        FormsModule,
        ReactiveFormsModule,
        SliderModule,
        SelectButtonModule,
        DialogModule,
        ToolbarModule,
        SplitButtonModule,
        NgIf,
        FloatLabelModule,
        TabViewModule,
        KeyValuePipe,
        InputTextModule,
        NgOptimizedImage,
        DropdownModule,
        ListboxModule,
        AddGameOverlayComponent,
        FilterOverlayComponent,
    ],
    templateUrl: './topbar.component.html',
    styleUrl: './topbar.component.css'
})
export class TopbarComponent {
    overlayVisible: boolean = false;
    onGamePage: boolean = false;
    isBookmarkAllowed: boolean = false;
    gameOverlayOpen: boolean = false;
    gameID: string = '';
    displayPlayForGame = 'LINK';


    toggleOverlay(overlay_name: string = 'filter') {
        switch (overlay_name) {
            case 'filter':
                this.overlayVisible = !this.overlayVisible;
                break;
            case 'game':
                this.gameOverlayOpen = !this.gameOverlayOpen;
                break;
        }
        this.genericService.stopAllAudio();
    }

    constructor(protected genericService: GenericService, protected location: Location, protected router: Router, private gameService: GameService, private dbService: DBService) {
        this.genericService.getDisplayBookmark().subscribe((value) => {
            this.isBookmarkAllowed = value;
        });
        this.router.events.subscribe((val) => {
            if (val instanceof NavigationEnd) {
                console.log(val.url);
                if (val.url.includes('game') && !val.url.includes('games')) {
                    this.onGamePage = true;
                    this.gameFromUrl.next(val.url.split('/')[2]);
                    let id = val.url.split('/')[2];
                    if (id) {
                        let game = this.gameService.getGame(id);
                        this.gameService.setGameObservable(game);
                        this.gameID = id;
                        this.displayPlayForGame = (game?.exec_file && game?.game_dir) ? 'PLAY' : 'LINK';
                    }
                } else {
                    this.onGamePage = false;
                }
            }
        });
    }

    gameOptions: any[] | undefined = [
        { label: 'Game', value: true },
        { label: 'Achievements', value: false },
    ];

    protected readonly appWindow = appWindow;

    async toggleMinimize() {
        if (await this.appWindow.isMinimized()) {
            await this.appWindow.unminimize();
        } else {
            await this.appWindow.minimize();
        }
    }

    async toggleMaximize() {
        if (await this.appWindow.isMaximized()) {
            await this.appWindow.unmaximize();
        } else {
            await this.appWindow.maximize();
        }
    }

    gameOpt: any = true;
    gameFromUrl: BehaviorSubject<string> = new BehaviorSubject<string>('');


    async playGame() {
        if (this.displayPlayForGame === 'LINK') {
            const selected = await open({
                multiple: false,
                filters: [{
                    name: 'Executables',
                    extensions: ['exe', 'bat', 'sh'],
                }]
            });
            if (selected) {
                const execs = {
                    exec_file: selected.toString(),
                    game_dir: await dirname(selected.toString())
                };
                let game = this.gameService.getGame(this.gameID);
                if (!game) {
                    return;
                }
                game.exec_file = execs.exec_file;
                game.game_dir = execs.game_dir;
                await this.dbService.postGame(game!);
                this.gameService.setGame(this.gameID, game!);
                this.displayPlayForGame = (game?.exec_file && game?.game_dir) ? 'PLAY' : 'LINK';
            }
            return;
        }
        this.genericService.launchGame(this.gameID);

    }
}
