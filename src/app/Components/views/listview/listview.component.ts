import {CommonModule, NgOptimizedImage} from '@angular/common';
import {Component, Input, OnChanges, type OnInit, SimpleChanges} from '@angular/core';
import IGame from '../../../../interfaces/IGame';
import {RouterLink} from "@angular/router";
import {RatingModule} from "primeng/rating";
import {TagModule} from "primeng/tag";
import {GenericService} from "../../../services/generic.service";
import {FormsModule} from "@angular/forms";

@Component({
    selector: 'app-listview',
    standalone: true,
    imports: [
        CommonModule,
        RouterLink,
        RatingModule,
        TagModule,
        FormsModule,
        NgOptimizedImage,
    ],
    templateUrl: './listview.component.html',
    styleUrl: './listview.component.css',
})
export class ListViewComponent implements OnInit, OnChanges {


    @Input() games: IGame[] = [];
    displayInfo: any = null;
    constructor(private genericService: GenericService) {}

    ngOnInit(): void {
        this.genericService.getDisplayInfo().subscribe(displayInfo => {
            this.displayInfo = displayInfo;
        });
    }

    ngOnChanges(changes: SimpleChanges): void {
        if (changes['gameImage']) {
            // this.tryToLoadImage(changes['gameImage'].currentValue);
        }
    }

}
