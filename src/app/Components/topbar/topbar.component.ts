import {Component, ElementRef, HostListener, ViewChild} from '@angular/core';
import {GenericService} from "../../services/generic.service";
import {ButtonModule} from "primeng/button";
import {KeyValuePipe, Location, NgFor, NgIf, NgOptimizedImage} from '@angular/common';
import {RadioButtonModule} from "primeng/radiobutton";
import {FormControl, FormGroup, FormsModule, ReactiveFormsModule} from "@angular/forms";
import {SliderModule} from "primeng/slider";
import {SelectButtonModule} from "primeng/selectbutton";
import {DialogModule} from "primeng/dialog";
import {ToolbarModule} from "primeng/toolbar";
import {SplitButtonModule} from "primeng/splitbutton";
import {MenuItem, ScrollerOptions, SelectItem} from "primeng/api";
import {appWindow} from "@tauri-apps/api/window";
import {routes} from "../../app.routes";
import {ActivatedRoute, NavigationEnd, Router, RouterLink} from "@angular/router";
import {FloatLabelModule} from "primeng/floatlabel";
import {TabViewModule} from "primeng/tabview";
import IGame from "../../../interfaces/IGame";
import {GameService} from "../../services/game.service";
import {InputTextModule} from "primeng/inputtext";
import {DBService} from "../../services/db.service";
import {window} from "rxjs";
import simpleSvgPlaceholder from "@cloudfour/simple-svg-placeholder";
import {DropdownLazyLoadEvent, DropdownModule} from "primeng/dropdown";
import {invoke} from "@tauri-apps/api/tauri";
import {ListboxModule} from "primeng/listbox";

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
    ],
    templateUrl: './topbar.component.html',
    styleUrl: './topbar.component.css'
})
export class TopbarComponent {

    displayInfo: FormGroup = new FormGroup({
        name: new FormControl(''),
        rating: new FormControl(''),
        platforms: new FormControl(''),
        tags: new FormControl('')
    });

    zoomLevel: any = this.genericService.getZoomValue();
    gapLevel: any = this.genericService.getGapValue();

    isBookmarkAllowed: boolean = false;

    viewState: any = 'list';

    overlayVisible: boolean = false;

    gameMode: boolean = false;

    currentGame: IGame | undefined;
    currentGameID: string | undefined;

    showOverlay() {
        if (this.creationMode && this.overlayVisible) {
            this.creationMode = false;
        }
        if (this.creationMode) {
            this.currentGame = {
                id: "-1",
                trophies: '',
                name: '',
                sort_name: '',
                rating: '',
                platforms: '',
                tags: '',
                description: '',
                critic_score: '',
                genres: '',
                styles: '',
                release_date: '',
                developers: '',
                editors: '',
                status: '',
                time_played: '',
                trophies_unlocked: '',
                last_time_played: '',
                jaquette: simpleSvgPlaceholder({
                    text: "Placeholder",
                    textColor: "#ffffff",
                    bgColor: "#7a7a7a",
                    width: 200,
                    height: 300
                }),
                background: simpleSvgPlaceholder({
                    text: "Placeholder",
                    textColor: "#ffffff",
                    bgColor: "#7a7a7a",
                    width: 300,
                    height: 200
                }),
                logo: simpleSvgPlaceholder({
                    text: "Placeholder",
                    textColor: "#ffffff",
                    bgColor: "#7a7a7a",
                    width: 200,
                    height: 200
                }),
                icon: simpleSvgPlaceholder({
                    text: "Placeholder",
                    textColor: "#ffffff",
                    bgColor: "#7a7a7a",
                    width: 200,
                    height: 200
                }),
                backgroundMusic: '',
                exec_file: '',
                game_dir: '',
                screenshots: [],
                videos: [],
            };
        }
        this.overlayVisible = !this.overlayVisible;
        this.genericService.stopAllAudio();
    }

    constructor(protected genericService: GenericService, protected location: Location, protected router: Router, private elementRef: ElementRef, private gameService: GameService, private db: DBService) {
        this.genericService.getDisplayBookmark().subscribe((value) => {
            this.isBookmarkAllowed = value;
        });

        this.genericService.getMetadataProviders().subscribe((value) => {
            value.forEach((provider) => {
                this.metadataProviders.push({
                    label: provider.split('_')[1],
                    provider: provider
                });
            });
        });
        this.router.events.subscribe((val) => {
            if (val instanceof NavigationEnd) {
                if (val.url.includes('game') && !val.url.includes('games')) {
                    this.gameMode = true;
                    let gameID = val.url.split('/')[2];
                    this.currentGameID = gameID;
                    let game = this.gameService.getGame(gameID);
                    this.gameService.setGameObservable(game);
                    if (game !== undefined) {
                        this.currentGame = game;
                        this.displayInfo = new FormGroup({
                            name: new FormControl(game.name),
                            rating: new FormControl(game.rating),
                            platforms: new FormControl(game.platforms),
                            tags: new FormControl(game.tags),
                        });
                        this.info = new FormGroup({
                            name: new FormControl(game.name),
                            sort_name: new FormControl(game.sort_name),
                            rating: new FormControl(game.rating),
                            platforms: new FormControl(game.platforms),
                            tags: new FormControl(game.tags),
                            description: new FormControl(game.description),
                            critic_score: new FormControl(game.critic_score),
                            genres: new FormControl(game.genres),
                            styles: new FormControl(game.styles),
                            release_date: new FormControl(game.release_date),
                            developers: new FormControl(game.developers),
                            editors: new FormControl(game.editors),
                        });
                        this.stat = new FormGroup({
                            status: new FormControl(game.status),
                            time_played: new FormControl(game.time_played),
                            trophies_unlocked: new FormControl(game.trophies_unlocked),
                            last_time_played: new FormControl(game.last_time_played),
                        });
                        this.exec = new FormGroup({
                            exec_file: new FormControl(game.exec_file),
                            game_dir: new FormControl(game.game_dir),
                        });
                    }
                } else {
                    this.gameMode = false;
                    this.info = new FormGroup({
                        name: new FormControl(''),
                        sort_name: new FormControl(''),
                        rating: new FormControl(''),
                        platforms: new FormControl(''),
                        tags: new FormControl(''),
                        description: new FormControl(''),
                        critic_score: new FormControl(''),
                        genres: new FormControl(''),
                        styles: new FormControl(''),
                        release_date: new FormControl(''),
                        developers: new FormControl(''),
                        editors: new FormControl(''),
                    });
                    this.stat = new FormGroup({
                        status: new FormControl(''),
                        time_played: new FormControl(''),
                        trophies_unlocked: new FormControl(''),
                        last_time_played: new FormControl(''),
                    });

                    this.exec = new FormGroup({
                        exec_file: new FormControl(''),
                        game_dir: new FormControl(''),
                    });
                }
            }
        });
    }

    changeZoom() {
        this.genericService.changeZoom(parseInt(this.zoomLevel));
    }


    changeGap() {
        this.genericService.changeGap(parseInt(this.gapLevel));
    }

    changeDisplayInfo() {
        this.genericService.changeDisplayInfo(this.displayInfo);
    }

    stateOptions: any[] | undefined = [
        {label: 'List', value: 'list'},
        {label: 'Grid', value: 'grid'},
    ];
    gameOptions: any[] | undefined = [
        {label: 'Game', value: true},
        {label: 'Achievements', value: false},
    ];
    items: MenuItem[] | undefined = [
        {label: 'Save', icon: 'pi pi-save'},
        {label: 'Update', icon: 'pi pi-refresh'},
        {label: 'Delete', icon: 'pi pi-trash'}
    ];

    clearDisplayInfo() {
        this.displayInfo = new FormGroup({
            name: new FormControl(''),
            rating: new FormControl(''),
            platforms: new FormControl(''),
            tags: new FormControl('')
        });
        this.changeDisplayInfo();
    }

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

    protected readonly routes = routes;
    gameOpt: any = true;
    info: FormGroup = new FormGroup({
        name: new FormControl(''),
        sort_name: new FormControl(''),
        rating: new FormControl(''),
        platforms: new FormControl(''),
        tags: new FormControl(''),
        description: new FormControl(''),
        critic_score: new FormControl(''),
        genres: new FormControl(''),
        styles: new FormControl(''),
        release_date: new FormControl(''),
        developers: new FormControl(''),
        editors: new FormControl(''),
    });

    stat: FormGroup = new FormGroup({
        status: new FormControl(''),
        time_played: new FormControl(''),
        trophies_unlocked: new FormControl(''),
        last_time_played: new FormControl(''),
    });

    exec: FormGroup = new FormGroup({
        exec_file: new FormControl(''),
        game_dir: new FormControl(''),
    });

    get generalKeys() {
        return Object.keys(this.info.controls);
    }

    get statKeys() {
        return Object.keys(this.stat.controls);
    }

    get execKeys() {
        return Object.keys(this.exec.controls);
    }

    saveGameInfo() {
        if (this.currentGameID === undefined && this.currentGame === undefined) {
            return;
        }
        if (this.currentGameID === undefined && this.currentGame !== undefined) {
            let game = this.currentGame;
            for (let key of this.generalKeys) {
                game[key] = this.info.get(key)?.value;
            }
            this.db.postGame(game).then(r => this.gameService.getGames());
            return;
        }
        if (this.currentGameID === undefined) {
            return;
        }
        let game = this.gameService.getGame(this.currentGameID);
        if (game === undefined) {
            return;
        }

        for (let key of this.generalKeys) {
            game[key] = this.info.get(key)?.value;
        }

        this.db.postGame(game);

        this.gameService.setGame(this.currentGameID, game);
    }

    saveGameStat() {
        if (this.currentGameID === undefined && this.currentGame === undefined) {
            return;
        }
        if (this.currentGameID === undefined && this.currentGame !== undefined) {
            let game = this.currentGame;
            for (let key of this.statKeys) {
                game[key] = this.stat.get(key)?.value;
            }
            this.db.postGame(game).then(r => this.gameService.getGames());
            return;
        }
        if (this.currentGameID === undefined) {
            return;
        }

        let game = this.gameService.getGame(this.currentGameID);
        if (game === undefined) {
            return;
        }
        for (let key of this.statKeys) {
            game[key] = this.stat.get(key)?.value;
        }

        this.db.postGame(game);
        this.gameService.setGame(this.currentGameID, game);
    }

    saveGameExec() {
        if (this.currentGameID === undefined && this.currentGame === undefined) {
            return;
        }
        if (this.currentGameID === undefined && this.currentGame !== undefined) {
            let game = this.currentGame;
            for (let key of this.execKeys) {
                game[key] = this.exec.get(key)?.value;
            }
            this.db.postGame(game).then(r => this.gameService.getGames());
            return;
        }
        if (this.currentGameID === undefined) {
            return;
        }
        let game = this.gameService.getGame(this.currentGameID);
        if (game === undefined) {
            return;
        }

        for (let key of this.execKeys) {
            game[key] = this.exec.get(key)?.value;
        }
        this.db.postGame(game);
        this.gameService.setGame(this.currentGameID, game);
    }

    protected readonly isSecureContext = isSecureContext;
    creationMode: boolean = false;
    metadataProviders: { label: string, provider: string }[] = [];
    selectedMetadataProvider: { label: string, provider: string } = {label: '', provider: ''};

    onFileSelected(event: any, type: "screenshot" | "video" | "audio" | "background" | "icon" | "logo" | "jaquette") {
        const file = event.target.files[0];
        if (file === undefined || file === null || this.currentGame === undefined) {
            return;
        }
        const reader = new FileReader();
        reader.onload = () => {
            const fileContent = reader.result;
            if (fileContent === null || fileContent === undefined || this.currentGame === undefined) {
                return;
            }
            this.db.uploadFile(fileContent, type, this.currentGame.name).then(() => {
                console.log("File uploaded");
                if (this.currentGame === undefined) {
                    return;
                }
                this.db.refreshGameLinks(this.currentGame).then((game) => {
                    if (this.currentGameID === undefined) {
                        return;
                    }
                    this.currentGame = game;
                    this.gameService.setGame(this.currentGameID, this.currentGame);

                });
            });
        };
        reader.readAsArrayBuffer(file);
    }

    openFileChooser(id: string) {
        let fileInput = this.elementRef.nativeElement.querySelector('#' + id);
        if (fileInput)
            fileInput.click();
    }

    deleteVideo(key: any) {
        if (this.currentGame === undefined || this.currentGameID === undefined) {
            return;
        }
        delete this.currentGame.videos[this.currentGame.videos.indexOf(key)];
        this.gameService.setGame(this.currentGameID, this.currentGame);
        this.db.deleteElement("video", this.currentGame.name, key);
    }

    deleteBackgroundMusic() {
        if (this.currentGame === undefined) {
            return;
        }
        this.db.deleteElement("audio", this.currentGame.name);
    }

    deleteScreenshot(path: any) {
        console.log(path);
        if (this.currentGame === undefined || this.currentGameID === undefined) {
            return;
        }
        delete this.currentGame.screenshots[this.currentGame.screenshots.indexOf(path)];
        this.gameService.setGame(this.currentGameID, this.currentGame);
        this.db.deleteElement("screenshot", this.currentGame.name, path);
    }

    closeOverlay() {
        if (this.creationMode && this.overlayVisible) {
            this.creationMode = false;
        }
        if (this.creationMode) {
            this.currentGame = {
                id: "-1",
                trophies: '',
                name: '',
                sort_name: '',
                rating: '',
                platforms: '',
                tags: '',
                description: '',
                critic_score: '',
                genres: '',
                styles: '',
                release_date: '',
                developers: '',
                editors: '',
                status: '',
                time_played: '',
                trophies_unlocked: '',
                last_time_played: '',
                jaquette: simpleSvgPlaceholder({
                    text: "Placeholder",
                    textColor: "#ffffff",
                    bgColor: "#7a7a7a",
                    width: 200,
                    height: 300
                }),
                background: simpleSvgPlaceholder({
                    text: "Placeholder",
                    textColor: "#ffffff",
                    bgColor: "#7a7a7a",
                    width: 300,
                    height: 200
                }),
                logo: simpleSvgPlaceholder({
                    text: "Placeholder",
                    textColor: "#ffffff",
                    bgColor: "#7a7a7a",
                    width: 200,
                    height: 200
                }),
                icon: simpleSvgPlaceholder({
                    text: "Placeholder",
                    textColor: "#ffffff",
                    bgColor: "#7a7a7a",
                    width: 200,
                    height: 200
                }),
                backgroundMusic: '',
                exec_file: '',
                game_dir: '',
                screenshots: [],
                videos: [],
            };
        }
        this.genericService.stopAllAudio();
    }

    async searchGameInAPI() {
        let gameName = this.searchingGame;
        let provider = this.selectedMetadataProvider.provider;
        console.log(gameName);
        console.log(provider);
        await invoke<string>("search_metadata_api", {gameName: gameName, pluginName: provider}).then((games) => {
            console.log(games);
            this.message = "";
            if (games === undefined) {
                this.message = "No games found";
            }
            if (games === "[]") {
                this.message = "No games found";
            }
            if (games === "No credentials found") {
                this.message = "No credentials found, please check your configuration";
            }
            this.openSearchMode();
            if (this.message !== "") {
                return;
            }
            let parsedGames: IGame[] = [];
            this.searchedGames = JSON.parse(games);
            this.searchedGames.forEach((game) => {
                game = JSON.parse(game);
                game = eval(game);
                console.log(game);

                let newGame = {
                    id: "-1",
                    trophies: '',
                    name: game.name,
                    sort_name: game.name,
                    rating: '',
                    platforms: game.platforms ? game.platforms : '',
                    tags: '',
                    description: game.description ? game.description : '',
                    critic_score: game.rating ? Math.round(game.rating).toString() : '',
                    genres: game.genres ? game.genres : '',
                    styles: game.styles ? game.styles : '',
                    release_date: game.release_date ? game.release_date : '',
                    developers: game.developers ? game.developers : '',
                    editors: game.editors ? game.editors : '',
                    status: '',
                    time_played: '',
                    trophies_unlocked: '',
                    last_time_played: '',
                    jaquette: game.cover,
                    background: game.background,
                    logo: "",
                    icon: "",
                    backgroundMusic: '',
                    exec_file: '',
                    game_dir: '',
                    screenshots: game.screenshots,
                    videos: game.videos,
                };
                parsedGames.push(newGame);
            });
            this.searchedGames = parsedGames;
        });
    }

    protected readonly document = document;
    searchingGame: string = '';

    searchMode = false;
    searchedGames: any[] = [];
    selectedGame: any = undefined;
    message: string = '';

    openSearchMode() {
        this.searchMode = !this.searchMode;
    }

    selectGame() {
        console.log(this.selectedGame);
        this.currentGame = this.selectedGame;
        this.displayInfo = new FormGroup({
            name: new FormControl(this.currentGame?.name),
            rating: new FormControl(this.currentGame?.rating),
            platforms: new FormControl(this.currentGame?.platforms),
            tags: new FormControl(this.currentGame?.tags),
        });
        this.info = new FormGroup({
            name: new FormControl(this.currentGame?.name),
            sort_name: new FormControl(this.currentGame?.sort_name),
            rating: new FormControl(this.currentGame?.rating),
            platforms: new FormControl(this.currentGame?.platforms),
            tags: new FormControl(this.currentGame?.tags),
            description: new FormControl(this.currentGame?.description),
            critic_score: new FormControl(this.currentGame?.critic_score),
            genres: new FormControl(this.currentGame?.genres),
            styles: new FormControl(this.currentGame?.styles),
            release_date: new FormControl(this.currentGame?.release_date),
            developers: new FormControl(this.currentGame?.developers),
            editors: new FormControl(this.currentGame?.editors),
        });
        this.stat = new FormGroup({
            status: new FormControl(this.currentGame?.status),
            time_played: new FormControl(this.currentGame?.time_played),
            trophies_unlocked: new FormControl(this.currentGame?.trophies_unlocked),
            last_time_played: new FormControl(this.currentGame?.last_time_played),
        });
        this.exec = new FormGroup({
            exec_file: new FormControl(this.currentGame?.exec_file),
            game_dir: new FormControl(this.currentGame?.game_dir),
        });
        this.saveMediaToExternalStorage();
        this.searchMode = false;
        if (this.currentGame === undefined) {
            return;
        }
        this.saveGameInfo();
    }

    private saveMediaToExternalStorage() {
        if (this.currentGame === undefined) {
            return;
        }
        this.db.saveMediaToExternalStorage(this.currentGame);
    }
}
