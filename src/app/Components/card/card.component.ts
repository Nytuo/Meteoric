import {Component, Input, OnChanges, OnInit, SimpleChanges, ViewChild} from '@angular/core';
import {NgForOf, NgIf, NgOptimizedImage, NgStyle} from "@angular/common";
import {GenericService} from "../../services/generic.service";
import {RouterLink} from "@angular/router";
import {SkeletonModule} from "primeng/skeleton";
import {TagModule} from "primeng/tag";
import {RatingModule} from "primeng/rating";
import {FormsModule} from "@angular/forms";

@Component({
    selector: 'app-card',
    standalone: true,
    imports: [
        NgIf,
        NgStyle,
        RouterLink,
        SkeletonModule,
        NgForOf,
        TagModule,
        RatingModule,
        FormsModule,
        NgOptimizedImage,
    ],
    templateUrl: './card.component.html',
    styleUrl: './card.component.css'
})
export class CardComponent implements OnInit, OnChanges {
    @Input() gameName: string | undefined;
    @Input() gameImage: string | undefined;
    @Input() gameId: string | undefined;
    @Input() gameTags: string = "No tags";
    @Input() gameRating: string = "0";
    @Input() gamePlatforms: string | undefined;

    @ViewChild('imageElement') img: any;
    width: string = "1rem";
    displayInfo: any = null;
    height: string = "auto";
    protected parsedTags: string[] = [];

    constructor(private genericService: GenericService) {
    }

    ngOnInit(): void {
        if (this.gameName === undefined) {
            this.gameName = "Game Name";
        }

        this.genericService.getZoom().subscribe(zoom => {
            this.width = (zoom) + "rem";
        });

        this.genericService.getDisplayInfo().subscribe(displayInfo => {
            this.displayInfo = displayInfo;
        });

        this.parsedTags = this.gameTags.split(',') || ["No tags"];
        if (this.gameTags === "") {
            this.parsedTags = ["No tags"];
        }
    }

    ngOnChanges(changes: SimpleChanges): void {
        if (changes['gameImage']) {
            // this.tryToLoadImage(changes['gameImage'].currentValue);
        }
    }
}
