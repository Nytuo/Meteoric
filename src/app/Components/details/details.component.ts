import {Component, OnInit} from '@angular/core';
import {ActivatedRoute} from "@angular/router";
import {GameService} from "../../services/game.service";
import IGame from "../../../interfaces/IGame";
import {NgOptimizedImage} from "@angular/common";

@Component({
    selector: 'app-details',
    standalone: true,
    imports: [
        NgOptimizedImage
    ],
    templateUrl: './details.component.html',
    styleUrl: './details.component.css'
})
export class DetailsComponent implements OnInit {

    private id: number = 0;

    constructor(private route: ActivatedRoute, private gameService: GameService) {

    }

    protected game: IGame | undefined;

    ngOnInit(): void {
        this.route.params.subscribe(params => {
            this.id = params['id'];
            this.game = this.gameService.getGame(this.id.toString()) as IGame;
            let html = document.querySelector('html');
            if (this.game === undefined || html === null) {
                return;
            }
            html.style.backgroundImage = `url(${this.game?.background})`;
            let image = document.getElementById("bg") as HTMLImageElement;
            if (image === null) {
                return;
            }
            console.log(this.game.background);
            image.src = this.game.background;
        });
    }


}
