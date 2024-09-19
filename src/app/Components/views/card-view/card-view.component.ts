import {Component, Input, OnInit} from '@angular/core';
import {CardComponent} from "../../card/card.component";
import {NgForOf, NgIf} from "@angular/common";
import IGame from "../../../../interfaces/IGame";
import {GenericService} from "../../../services/generic.service";

@Component({
    selector: 'app-card-view',
    standalone: true,
    imports: [
        CardComponent,
        NgForOf, NgIf
    ],
    templateUrl: './card-view.component.html',
    styleUrl: './card-view.component.css'
})
export class CardViewComponent implements OnInit {

    @Input() games: IGame[] = [];
    gap: any;


    constructor(private genericService: GenericService) {
    }

    ngOnInit() {
        this.genericService.getSettings().subscribe(settings => {
            this.gap = (settings.gap || 1) + "rem";
        });
    }


}
