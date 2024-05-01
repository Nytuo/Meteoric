import {Component, Input, OnChanges, OnDestroy, OnInit} from '@angular/core';
import {NgIf, NgStyle} from "@angular/common";
import {GenericService} from "../../services/generic.service";
import {RouterLink} from "@angular/router";

@Component({
    selector: 'app-card',
    standalone: true,
    imports: [
        NgIf,
        NgStyle,
        RouterLink
    ],
    templateUrl: './card.component.html',
    styleUrl: './card.component.css'
})
export class CardComponent implements OnInit {
    @Input() gameName: string | undefined;
    @Input() gameImage: string | undefined;
    @Input() gameId: string | undefined;
    @Input() gameTags: string | undefined;
    @Input() gameRating: string | undefined;
    @Input() gamePlatforms: string | undefined;

    constructor(private genericService: GenericService) {
    }

    width: string = "1rem";

    ngOnInit(): void {
        if (this.gameName === undefined) {
            this.gameName = "Game Name";
        }

        this.genericService.getZoom().subscribe(zoom => {
            this.width = (zoom) + "rem";
        });

    }

    changeSourceOnError(event: any) {
        event.target.src = "https://placehold.co/400x600/4B1AE5/white?text=" + this.gameName;
    }


}
