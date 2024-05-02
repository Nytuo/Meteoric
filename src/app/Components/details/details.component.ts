import { Component, NgIterable, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute } from "@angular/router";
import { GameService } from "../../services/game.service";
import IGame from "../../../interfaces/IGame";
import {NgForOf, NgOptimizedImage, NgStyle} from "@angular/common";
import { RatingModule } from "primeng/rating";
import { FormsModule } from "@angular/forms";
import { TagModule } from "primeng/tag";
import {SplitterModule} from "primeng/splitter";
import {DividerModule} from "primeng/divider";

@Component({
    selector: 'app-details',
    standalone: true,
    imports: [
        NgOptimizedImage,
        NgForOf,
        RatingModule,
        FormsModule,
        TagModule,
        SplitterModule,
        NgStyle,
        DividerModule
    ],
    templateUrl: './details.component.html',
    styleUrl: './details.component.css'
})
export class DetailsComponent implements OnInit, OnDestroy {

    private id: number = 0;
    private audio: HTMLAudioElement | null = null;


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
            image.src = this.game.background;
            this.playBackgroundMusic();
        });
    }

    playBackgroundMusic() {
        if (!this.game?.backgroundMusic) return;

        if (this.audio) {
            this.audio.pause();
        }

        this.audio = new Audio(this.game.backgroundMusic);
        this.audio.loop = true;
        this.audio.volume = 0;
        this.audio.play();

        let volume = 0;
        const interval = setInterval(() => {
            if (volume < 1) {
                volume += 0.1;
                if (this.audio) this.audio.volume = volume;
            } else {
                clearInterval(interval);
            }
        }, 100);
    }

    stopBackgroundMusic() {
        if (!this.audio) return;

        let volume = this.audio.volume;
        const interval = setInterval(() => {
            if (volume > 0) {
                volume -= 0.1;
                if (this.audio) this.audio.volume = volume;
            } else {
                clearInterval(interval);
                if (this.audio) this.audio.pause();
            }
        }, 100);
    }

    ngOnDestroy() {
        this.stopBackgroundMusic();
    }


}
