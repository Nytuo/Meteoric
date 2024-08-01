import { Component, ElementRef, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { ButtonModule } from "primeng/button";
import { DialogModule } from "primeng/dialog";
import { DropdownModule } from "primeng/dropdown";
import { FloatLabelModule } from "primeng/floatlabel";
import { InputTextModule } from "primeng/inputtext";
import { KeyValuePipe, NgForOf, NgIf } from "@angular/common";
import { ListboxModule } from "primeng/listbox";
import { SharedModule } from "primeng/api";
import { TabViewModule } from "primeng/tabview";
import IGame from "../../../interfaces/IGame";
import { DBService } from "../../services/db.service";
import { GameService } from "../../services/game.service";
import { GenericService } from "../../services/generic.service";
import simpleSvgPlaceholder from "@cloudfour/simple-svg-placeholder";
import { IGDBComponent } from "../../plugins/igdb/igdb.component";
import { YtdlComponent } from "../../plugins/ytdl/ytdl.component";
import { SteamGridComponent } from "../../plugins/steam_grid/steam_grid.component";
import { CSVImporter } from "../../plugins/csv_importer/csv_importer.component";
import { EpicImporterComponent } from "../../plugins/epic-importer/epic-importer.component";
import { SteamImporterComponent } from "../../plugins/steam-importer/steam-importer.component";
import { GogImporterComponent } from "../../plugins/gog-importer/gog-importer.component";
import { PanelMenuModule } from 'primeng/panelmenu';
import { ProgressBarModule } from 'primeng/progressbar';


@Component({
    selector: 'app-add-game-overlay',
    standalone: true,
    templateUrl: './add-game-overlay.component.html',
    styleUrl: './add-game-overlay.component.css',
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
        SharedModule,
        TabViewModule,
        IGDBComponent,
        YtdlComponent,
        SteamGridComponent,
        CSVImporter,
        EpicImporterComponent,
        SteamImporterComponent,
        GogImporterComponent,
        ProgressBarModule
    ]
})
export class AddGameOverlayComponent implements OnInit {

    @Input() visible: boolean = false;
    @Output() visibleChange = new EventEmitter<boolean>();

    currentGame: IGame | undefined;
    hideSearch: boolean = false;
    loading: boolean = false;
    statusOfImport: String = "";

    hide() {
        this.visibleChange.emit(false);
    }

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
    };

    addGame() {
        this.loading = true;
        if (this.currentGame === undefined) {
            return;
        }
        let nameFromInput = this.elementRef.nativeElement.querySelector('#name').value as string;
        this.currentGame.name = nameFromInput.trim();
        this.currentGame.sort_name = nameFromInput.trim().toLowerCase();
        this.statusOfImport = "Inserting the game into the database";
        this.db.postGame(this.currentGame).then(async (id) => {
            if (this.currentGame === undefined) {
                return;
            }
            this.statusOfImport = "Fetching the info from IGDB";
            let gameIGDB = await this.gameService.autoIGDBImport(this.currentGame.name);
            if (typeof gameIGDB === 'string') {
                this.statusOfImport = "Error: " + gameIGDB;
                console.log(gameIGDB);
            } else {
                this.currentGame = gameIGDB;
                this.currentGame.id = id;
                this.statusOfImport = "Found : " + this.currentGame.name + " on IGDB, modifying the database";
                this.db.postGame(this.currentGame).then(() => {
                    if (this.currentGame === undefined) {
                        return;
                    }
                    this.statusOfImport = "Game metadata updated, saving media to external storage";
                    this.db.saveMediaToExternalStorage(this.currentGame).then
                        (() => {
                            this.statusOfImport = "Done, wait for finish";
                            this.gameService.getGames();
                            this.visibleChange.emit(false);
                            this.loading = false;
                        });
                });
            }
        });
    }


    constructor(private db: DBService, private gameService: GameService, private elementRef: ElementRef, protected genericService: GenericService) {

    }

}
