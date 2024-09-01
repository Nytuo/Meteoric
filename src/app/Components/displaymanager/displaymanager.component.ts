import { CommonModule } from '@angular/common';
import { Component, type OnInit } from '@angular/core';
import { CardViewComponent } from '../views/card-view/card-view.component';
import { GameService } from '../../services/game.service';
import IGame from '../../../interfaces/IGame';
import { ListViewComponent } from '../views/listview/listview.component';
import {GenericService} from "../../services/generic.service";
import {BehaviorSubject} from "rxjs";
@Component({
    selector: 'app-displaymanager',
    standalone: true,
    imports: [
        CommonModule,
        CardViewComponent,
        ListViewComponent
    ],
    templateUrl: './displaymanager.component.html',
    styleUrl: './displaymanager.component.css',
})

export class DisplaymanagerComponent implements OnInit {

    games: IGame[] = [];

    currentView: BehaviorSubject<string> = new BehaviorSubject<string>('card');

    constructor(private gameService: GameService, private genericService: GenericService) { }
    ngOnInit(): void {
        this.gameService.getGamesObservable().subscribe((games) => {
            console.log(games);
            this.games = games;
        });

        this.genericService.getSettings().subscribe((settings) => {
            this.currentView.next(settings.view || 'card');
        });
    }
}
