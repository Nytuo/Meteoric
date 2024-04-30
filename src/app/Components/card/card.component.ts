import {Component, Input, OnInit} from '@angular/core';

@Component({
    selector: 'app-card',
    standalone: true,
    imports: [],
    templateUrl: './card.component.html',
    styleUrl: './card.component.css'
})
export class CardComponent implements OnInit {
    @Input() gameName: string | undefined;
    @Input() gameImage: string | undefined;
    @Input() gameId: string | undefined;

    constructor() {
    }

    ngOnInit(): void {
        if (this.gameName === undefined) {
            this.gameName = "Game Name";
        }
    }

    changeSourceOnError(event: any) {
        event.target.src = "https://placehold.co/400x600/4B1AE5/white?text="+this.gameName;
    }


}
