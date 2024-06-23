import {Component} from '@angular/core';
import {GenericService} from "../../services/generic.service";
import {ButtonModule} from "primeng/button";
import {KeyValuePipe, Location, NgFor, NgIf, NgOptimizedImage} from '@angular/common';
import {RadioButtonModule} from "primeng/radiobutton";
import {FormsModule, ReactiveFormsModule} from "@angular/forms";
import {SliderModule} from "primeng/slider";
import {SelectButtonModule} from "primeng/selectbutton";
import {DialogModule} from "primeng/dialog";
import {ToolbarModule} from "primeng/toolbar";
import {SplitButtonModule} from "primeng/splitbutton";
import {appWindow} from "@tauri-apps/api/window";
import {FloatLabelModule} from "primeng/floatlabel";
import {TabViewModule} from "primeng/tabview";
import {InputTextModule} from "primeng/inputtext";
import {DropdownModule} from "primeng/dropdown";
import {ListboxModule} from "primeng/listbox";
import {AddGameOverlayComponent} from "../add-game-overlay/add-game-overlay.component";
import {FilterOverlayComponent} from "../filter-overlay/filter-overlay.component";
import {NavigationEnd, Router} from "@angular/router";
import {BehaviorSubject} from "rxjs";
import {GameService} from "../../services/game.service";

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

    constructor(protected genericService: GenericService, protected location: Location, protected router: Router, private gameService: GameService) {
        this.genericService.getDisplayBookmark().subscribe((value) => {
            this.isBookmarkAllowed = value;
        });
        this.router.events.subscribe((val) => {
            if (val instanceof NavigationEnd) {
                console.log(val.url)
                if (val.url.includes('game') && !val.url.includes('games')) {
                    this.onGamePage = true;
                    this.gameFromUrl.next(val.url.split('/')[2]);
                    let id = val.url.split('/')[2];
                    if (id) {
                        this.gameService.setGameObservable(this.gameService.getGame(id));
                    }
                }else{
                    this.onGamePage = false;
                }
            }
        });
    }

    gameOptions: any[] | undefined = [
        {label: 'Game', value: true},
        {label: 'Achievements', value: false},
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

}
