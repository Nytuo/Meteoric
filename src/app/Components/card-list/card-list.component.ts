import {Component, OnInit} from '@angular/core';
import {CardComponent} from "../card/card.component";
import {NgForOf} from "@angular/common";
import IGame from "../../../interfaces/IGame";
import {GameService} from "../../services/game.service";
import {GenericService} from "../../services/generic.service";

@Component({
    selector: 'app-card-list',
    standalone: true,
    imports: [
        CardComponent,
        NgForOf
    ],
    templateUrl: './card-list.component.html',
    styleUrl: './card-list.component.css'
})
export class CardListComponent implements OnInit {

    constructor(private gameService: GameService, private genericService: GenericService) {
    }

    games: IGame[] = [];
    gap: any;

    ngOnInit() {
        this.genericService.getGap().subscribe(gap => {
            this.gap = gap + "px";
        });
        this.gameService.getGamesObservable().subscribe((games) => {
            console.log(games);
            this.games = games;
        });
        console.log(this.games);
    }


}
