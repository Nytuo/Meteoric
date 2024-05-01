import {Component, NgIterable, OnInit} from '@angular/core';
import {ActivatedRoute} from "@angular/router";
import {GameService} from "../../services/game.service";
import IGame from "../../../interfaces/IGame";
import {NgForOf, NgOptimizedImage} from "@angular/common";
import {RatingModule} from "primeng/rating";
import {FormsModule} from "@angular/forms";
import {TagModule} from "primeng/tag";

@Component({
    selector: 'app-details',
    standalone: true,
    imports: [
        NgOptimizedImage,
        NgForOf,
        RatingModule,
        FormsModule,
        TagModule
    ],
    templateUrl: './details.component.html',
    styleUrl: './details.component.css'
})
export class DetailsComponent implements OnInit {

    private id: number = 0;

    constructor(private route: ActivatedRoute, private gameService: GameService) {

    }

    protected game: IGame | undefined;
    gameRating: any;
    gameTags: any = ["No tags"];

    ngOnInit(): void {
        this.route.params.subscribe(params => {
            this.id = params['id'];
            this.game = this.gameService.getGame(this.id.toString()) as IGame;
            this.gameTags = this.game?.tags.split(',');
            if (this.game.tags === "") this.gameTags = ["No tags"];
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
