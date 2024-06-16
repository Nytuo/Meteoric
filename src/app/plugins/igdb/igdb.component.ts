import {Component, EventEmitter, Input, Output} from '@angular/core';
import {ButtonModule} from "primeng/button";
import {ListboxModule} from "primeng/listbox";
import {NgIf} from "@angular/common";
import {FormsModule} from "@angular/forms";

@Component({
    selector: 'app-igdb',
    standalone: true,
    imports: [
        ButtonModule,
        ListboxModule,
        NgIf,
        FormsModule
    ],
    templateUrl: './igdb.component.html',
    styleUrl: './igdb.component.css'
})
export class IGDBComponent {
    @Input() message: string = '';
    @Input() searchedGames: any[] = [];
    @Output() selectItem: EventEmitter<any> = new EventEmitter<any>();
    @Output() back: EventEmitter<void> = new EventEmitter<void>();
    @Input() selectedItem: any = null;
    @Output() selectedItemChange: EventEmitter<string> = new EventEmitter<string>();

    updateSelectedItem($event: any) {
        this.selectedItem = $event;
        this.selectedItemChange.emit(this.selectedItem);
    }
}
