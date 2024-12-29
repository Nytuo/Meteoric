import {Component, Input} from '@angular/core';
import {NgClass} from "@angular/common";

@Component({
    selector: 'app-info-card',
    templateUrl: './info-card.component.html',
    styleUrl: './info-card.component.css'
})
export class InfoCardComponent {
    @Input() title: string = '';
    @Input() description: string = '';
    @Input() icon: string = '';
    @Input() color: string = '';
}
