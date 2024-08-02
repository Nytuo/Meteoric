import { CommonModule } from '@angular/common';
import { Component, ElementRef, EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { ButtonModule } from "primeng/button";
import { DialogModule } from "primeng/dialog";
import { DropdownModule } from "primeng/dropdown";
import { FloatLabelModule } from "primeng/floatlabel";
import { InputTextModule } from "primeng/inputtext";
import { KeyValuePipe, NgForOf, NgIf } from "@angular/common";
import { ListboxModule } from "primeng/listbox";
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule } from "@angular/forms";
import { MessageService, SharedModule } from "primeng/api";
import { TabViewModule } from "primeng/tabview";
import IGame from "../../../interfaces/IGame";
import { DBService } from "../../services/db.service";
import { GameService } from "../../services/game.service";
import { GenericService } from "../../services/generic.service";
import { invoke } from "@tauri-apps/api/tauri";
import simpleSvgPlaceholder from "@cloudfour/simple-svg-placeholder";
import { NavigationEnd, Router } from "@angular/router";
import { BehaviorSubject } from "rxjs";
import { IGDBComponent } from "../../plugins/igdb/igdb.component";
import { YtdlComponent } from "../../plugins/ytdl/ytdl.component";
import { SteamGridComponent } from "../../plugins/steam_grid/steam_grid.component";
import { CSVImporter } from "../../plugins/csv_importer/csv_importer.component";
import { EpicImporterComponent } from "../../plugins/epic-importer/epic-importer.component";
import { SteamImporterComponent } from "../../plugins/steam-importer/steam-importer.component";
import { GogImporterComponent } from "../../plugins/gog-importer/gog-importer.component";
import { open } from '@tauri-apps/api/dialog';
import { dirname, documentDir } from '@tauri-apps/api/path';
import { PanelMenuModule } from 'primeng/panelmenu';
import { CheckboxModule } from 'primeng/checkbox';
import { SidebarModule } from 'primeng/sidebar';
@Component({
    selector: 'app-edit-game',
    standalone: true,
    imports: [
        ButtonModule,
        DialogModule,
        DropdownModule,
        FloatLabelModule,
        InputTextModule,
        KeyValuePipe,
        ListboxModule,
        NgForOf,
        PanelMenuModule,
        NgIf,
        ReactiveFormsModule,
        SharedModule,
        TabViewModule,
        FormsModule,
        IGDBComponent,
        YtdlComponent,
        SteamGridComponent,
        CSVImporter,
        EpicImporterComponent,
        SteamImporterComponent,
        GogImporterComponent, CheckboxModule, SidebarModule
    ],
    templateUrl: './edit-game.component.html',
    styleUrl: './edit-game.component.css',
})
export class EditGameComponent implements OnInit, OnDestroy {


    currentGame: IGame | undefined;
    currentGameID: string | undefined;
    YTURL: string = '';
    isAudioMetadata: boolean = false;
    selectedItem: any = undefined;
    selectedProvider: any = undefined;
    searchMode = false;
    message: string = '';
    searchedGames: any[] = [];
    searchingGame: string = '';
    strict: boolean = false;
    hideSelectBtn: boolean = false;
    statuses: any = ['Not started', 'In progress', 'Completed', 'On hold', 'Dropped', 'Platinum'];
    items = [{
        label: 'Game information',
        icon: 'pi pi-info-circle',
        expanded: true,
        items: [
            {
                label: 'General',
                icon: 'pi pi-file',
                command: () => {
                    this.selectedProvider = 'general';
                    this.searchedGames = [];
                    this.hideSearch = false;
                }
            },
            {
                label: 'Personal',
                icon: 'pi pi-id-card',
                command: () => {
                    this.searchedGames = [];
                    this.hideSearch = false;
                    this.selectedProvider = 'personal';
                }
            },
            {
                label: 'Media',
                icon: 'pi pi-images',
                command: () => {
                    this.searchedGames = [];
                    this.hideSearch = false;
                    this.selectedProvider = 'media';
                }
            },
            {
                label: 'Execution',
                icon: 'pi pi-play',
                command: () => {
                    this.searchedGames = [];
                    this.hideSearch = false;
                    this.selectedProvider = 'exec';

                }
            }
        ]
    },
    {
        label: 'Metadata Providers',
        icon: 'pi pi-pencil',
        expanded: true,
        items: [
            {
                label: 'Youtube Background Music Provider',
                icon: 'pi pi-youtube',
                command: () => {
                    this.selectedProvider = 'ytdl';
                    this.searchedGames = [];
                    this.hideSearch = true;
                    this.hideSelectBtn = true;
                }
            },
            {
                label: 'Steam Grid DB Provider',
                icon: 'pi pi-desktop',
                command: () => {
                    this.selectedProvider = 'steam_grid';
                    this.searchedGames = [];
                    this.hideSearch = true;
                    this.hideSelectBtn = false;

                }
            },
            {
                label: 'IGDB Provider',
                icon: 'pi pi-desktop',
                command: () => {
                    this.selectedProvider = 'igdb';
                    this.searchedGames = [];
                    this.hideSearch = true;
                    this.hideSelectBtn = true;

                }
            }
        ]
    }
    ];
    // ADD API HERE
    hideSearch: boolean = false;

    ngOnInit(): void {
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
            exec_args: '',
            screenshots: [],
            videos: [],
        };

        let gameID = this.router.url.split('/')[2];
        this.genericService.stopAllAudio();
        this.currentGameID = gameID;
        console.log(this.currentGameID);
        let game = this.gameService.getGame(gameID);
        this.gameService.setGameObservable(game);
        if (game !== undefined) {
            this.currentGame = game;
            this.searchingGame = game.name;
            console.log(game);
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
                exec_args: new FormControl(game.exec_args),
            });
        }
    };

    ngAfterViewInit() {
        let topBar = document.querySelector('.topbar') as HTMLElement;
        if (topBar) {
            topBar.style.display = 'none';
        }
        this.genericService.changeSidebarOpen(false);
    }

    ngOnDestroy() {
        let topBar = document.querySelector('.topbar') as HTMLElement;
        if (topBar) {
            topBar.style.display = 'flex';
        }
        this.genericService.changeSidebarOpen(true);
    }


    constructor(private db: DBService, private gameService: GameService, private elementRef: ElementRef, protected genericService: GenericService, protected router: Router, private messageService: MessageService) { }

    openSearchMode() {
        this.searchMode = true;
    }




    async searchGameInAPI() {
        let gameName = this.searchingGame;
        let provider = this.selectedProvider;
        let strict = this.strict;
        console.log(gameName, provider, strict);
        await invoke<string>("search_metadata", { gameName: gameName, pluginName: provider, strict: strict }).then((games) => {
            console.log(games);
            this.message = "";
            if (games === undefined || games.length === 0 || games === '[]') {
                this.message = "No games found";
                this.messageService.add({ severity: 'error', summary: 'No games found', detail: 'No games found', life: 3000 });
                return;
            }
            if (games === "No credentials found") {
                this.message = "No credentials found, please check your configuration";
                this.messageService.add({ severity: 'error', summary: 'No credentials found', detail: 'No credentials found, please check your configuration', life: 3000 });
                return;
            }

            if (provider === "steam_grid") {
                let array = JSON.parse(JSON.parse(games));
                this.searchedGames = array;
                return;
            }

            let type = JSON.parse(games) && JSON.parse(JSON.parse(games)[0]);
            type = type.url ? "audio" : "game";
            console.log(type);
            if (this.message !== "") {
                return;
            }
            if (type === "audio") {
                this.searchedGames = JSON.parse(games);
                let parsedGames: any[] = [];
                this.searchedGames.forEach((audio) => {
                    audio = JSON.parse(audio);
                    let newAudio = {
                        name: audio.name ? audio.name : '',
                        url: audio.url ? audio.url : '',
                        jaquette: audio.jaquette ? audio.jaquette : '',
                    };
                    parsedGames.push(newAudio);
                });
                this.searchedGames = parsedGames;
                this.isAudioMetadata = true;
                return;
            }
            let parsedGames: IGame[] = [];
            this.searchedGames = JSON.parse(games);
            this.searchedGames.forEach((api_game) => {

                let oldGame: any = this.currentGame;
                api_game = JSON.parse(api_game);
                api_game = eval(api_game);
                //merge the two objects with priority to the new one
                if (oldGame !== undefined) {
                    delete oldGame.jaquette;
                    delete oldGame.background;
                    delete oldGame.logo;
                    delete oldGame.icon;
                    delete oldGame.backgroundMusic;
                    for (let key in oldGame) {
                        if (oldGame.hasOwnProperty(key)) {
                            if (api_game[key] === undefined) {
                                api_game[key] = oldGame[key];
                            }
                        }
                    }
                }

                let newGame = {
                    id: api_game.id ? api_game.id : '-1',
                    trophies: api_game.trophies ? api_game.trophies : '',
                    name: api_game.name ? api_game.name : '',
                    sort_name: api_game.name ? api_game.name : '',
                    rating: api_game.rating ? api_game.rating : '',
                    platforms: api_game.platforms ? api_game.platforms : '',
                    tags: api_game.tags ? api_game.tags : '',
                    description: api_game.description ? api_game.description : '',
                    critic_score: api_game.critic_score ? Math.round(api_game.critic_score).toString() : '',
                    genres: api_game.genres ? api_game.genres : '',
                    styles: api_game.styles ? api_game.styles : '',
                    release_date: api_game.release_date ? api_game.release_date : '',
                    developers: api_game.developers ? api_game.developers : '',
                    editors: api_game.editors ? api_game.editors : '',
                    status: api_game.status ? api_game.status : '',
                    time_played: api_game.time_played ? api_game.time_played : '',
                    trophies_unlocked: api_game.trophies_unlocked ? api_game.trophies_unlocked : '',
                    last_time_played: api_game.last_time_played ? api_game.last_time_played : '',
                    jaquette: api_game.cover ? api_game.cover : '',
                    background: api_game.background ? api_game.background : '',
                    logo: api_game.logo ? api_game.logo : '',
                    icon: api_game.icon ? api_game.icon : '',
                    backgroundMusic: api_game.backgroundMusic ? api_game.backgroundMusic : '',
                    exec_file: api_game.exec_file ? api_game.exec_file : '',
                    exec_args: api_game.exec_args ? api_game.exec_args : '',
                    game_dir: api_game.game_dir ? api_game.game_dir : '',
                    screenshots: api_game.screenshots ? api_game.screenshots : [],
                    videos: api_game.videos ? api_game.videos : [],
                };
                console.log(newGame);
                parsedGames.push(newGame);
            });
            this.searchedGames = parsedGames;
        });
    }

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
            this.db.uploadFile(fileContent, type, this.currentGame.id).then(() => {
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

    deleteVideo(path: any) {
        if (this.currentGame === undefined || this.currentGameID === undefined) {
            return;
        }
        let id = this.currentGame.screenshots[this.currentGame.screenshots.indexOf(path)];
        id = id.toString().split("video-")[1].split(".")[0];
        this.db.deleteElement("video", this.currentGame.id, id.toString());
        delete this.currentGame.videos[this.currentGame.videos.indexOf(path)];
        this.gameService.setGame(this.currentGameID, this.currentGame);
        this.messageService.add({ severity: 'info', summary: 'Video deleted', detail: 'The video has been deleted', life: 3000 });
    }

    deleteScreenshot(path: any) {
        if (this.currentGame === undefined || this.currentGameID === undefined) {
            return;
        }
        let id = this.currentGame.screenshots[this.currentGame.screenshots.indexOf(path)];
        id = id.toString().split("screenshot-")[1].split(".")[0];
        this.db.deleteElement("screenshot", this.currentGame.id, id);
        delete this.currentGame.screenshots[this.currentGame.screenshots.indexOf(path)];
        this.gameService.setGame(this.currentGameID, this.currentGame);
        this.messageService.add({ severity: 'info', summary: 'Screenshot deleted', detail: 'The screenshot has been deleted', life: 3000 });
    }

    deleteBackgroundMusic() {
        if (this.currentGame === undefined) {
            return;
        }
        this.db.deleteElement("audio", this.currentGame.id).then(() => {
            this.messageService.add({ severity: 'info', summary: 'Audio deleted', detail: 'The audio has been deleted', life: 3000 });
        });
    }

    private saveMediaToExternalStorage() {
        if (this.currentGame === undefined) {
            return;
        }
        this.db.saveMediaToExternalStorage(this.currentGame).then(() => {
            if (this.currentGame === undefined) {
                return;
            }
            this.db.refreshGameLinks(this.currentGame).then((game) => {
                this.currentGame = game;
                this.gameService.getGames().then(() => {
                    if (this.currentGameID === undefined || this.currentGame === undefined) {
                        return;
                    }
                    this.gameService.setGame(this.currentGameID, this.gameService.getGame(this.currentGameID) as IGame);
                    this.gameService.setGameObservable(this.currentGame);
                    this.messageService.add({ severity: 'info', summary: 'Metadata saved', detail: 'The metadata has been saved for : ' + this.currentGame.name, life: 3000 });
                    this.genericService.changeBlockUI(false);
                });
                this.isAudioMetadata = false;
            });
        });
    }

    searchYT4BGMusic() {
        let url = this.YTURL;
        if (url === '' || this.currentGame === undefined) {
            return;
        }
        this.genericService.downloadYTAudio(url, this.currentGame?.id).then(() => {
            console.log("Downloaded");
            if (this.currentGame === undefined) {
                return;
            }
            this.db.refreshGameLinks(this.currentGame).then((game) => {
                if (this.currentGameID === undefined) {
                    return;
                }
                this.currentGame = game;
                this.gameService.setGame(this.currentGameID, this.currentGame);
                this.gameService.setGameObservable(this.currentGame);
                this.isAudioMetadata = false;
            });
        });
    }

    displayInfo: FormGroup = new FormGroup({
        name: new FormControl(''),
        rating: new FormControl(''),
        platforms: new FormControl(''),
        tags: new FormControl('')
    });

    selectItem() {
        this.genericService.changeBlockUI(true);
        console.log(this.selectedItem);
        if (this.selectedItem === undefined) {
            return;
        }
        this.selectedItem.id = this.currentGameID;
        this.currentGame = this.selectedItem;
        if (this.selectedItem === 'ytdl') {
            this.YTURL = this.selectedItem.url;
            this.searchYT4BGMusic();
            return;
        }
        if (this.selectedProvider === 'steam_grid') {
            this.saveMediaToExternalStorage();
            return;
        }
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
            exec_args: new FormControl(this.currentGame?.exec_args),
        });
        this.searchMode = false;
        if (this.currentGame === undefined) {
            return;
        }
        this.saveGameInfo();
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
        this.db.postGame(game).then(r => this.gameService.getGames().then(() => { this.messageService.add({ severity: 'info', summary: 'Saved', detail: 'The change has been saved', life: 3000 }); }));
        this.gameService.setGame(this.currentGameID, game);
    }

    saveGameInfo() {
        this.genericService.changeBlockUI(true);
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

        this.db.postGame(game).then(r => this.gameService.getGames().then(() => {
            this.messageService.add({ severity: 'info', summary: 'Saved', detail: 'The change has been saved', life: 3000 });
            this.saveMediaToExternalStorage();
        }));
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

        this.db.postGame(game).then(r => this.gameService.getGames().then(() => { this.messageService.add({ severity: 'info', summary: 'Saved', detail: 'The change has been saved', life: 3000 }); }));
        this.gameService.setGame(this.currentGameID, game);
    }

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
        exec_args: new FormControl(''),
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

    async linkGame() {
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
                game_dir: await dirname(selected.toString()),
                exec_args: ""
            };
            if (this.currentGameID) {
                let game = this.gameService.getGame(this.currentGameID);
                if (!game) {
                    return;
                }
                game.exec_file = execs.exec_file;
                game.game_dir = execs.game_dir;
                game.exec_args = execs.exec_args;
                await this.db.postGame(game!);
                this.gameService.setGame(this.currentGameID, game!);
                this.messageService.add({ severity: 'info', summary: 'Game Linked', detail: 'The game has been linked', life: 3000 });
            }
        }
        return;
    }

}

