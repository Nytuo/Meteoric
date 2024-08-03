import {Component, EventEmitter, Input, Output} from '@angular/core';
import {ButtonModule} from "primeng/button";
import {DialogModule} from "primeng/dialog";
import {NgIf} from "@angular/common";
import {RadioButtonModule} from "primeng/radiobutton";
import {SelectButtonModule} from "primeng/selectbutton";
import {SliderModule} from "primeng/slider";
import {GenericService} from "../../services/generic.service";
import {FormControl, FormGroup, FormsModule} from "@angular/forms";

@Component({
    selector: 'app-filter-overlay',
    standalone: true,
    imports: [
        ButtonModule,
        DialogModule,
        NgIf,
        RadioButtonModule,
        SelectButtonModule,
        SliderModule,
        FormsModule
    ],
    templateUrl: './filter-overlay.component.html',
    styleUrl: './filter-overlay.component.css'
})
export class FilterOverlayComponent {

    @Input() visible: boolean = false;
    @Output() visibleChange = new EventEmitter<boolean>();

    zoomLevel: any = this.genericService.getZoomValue();
    gapLevel: any = this.genericService.getGapValue();
    viewState: any = 'list';
    stateOptions: any[] | undefined = [
        {label: 'List', value: 'list'},
        {label: 'Grid', value: 'grid'},
    ];
    displayInfo: FormGroup = new FormGroup({
        name: new FormControl(''),
        rating: new FormControl(''),
        platforms: new FormControl(''),
        tags: new FormControl('')
    });

    constructor(protected genericService: GenericService) {
    }

    updateVisible() {
        this.visible = !this.visible;
        this.visibleChange.emit(this.visible);
    }

    changeDisplayInfo() {
        this.genericService.changeDisplayInfo(this.displayInfo);
    }

    clearDisplayInfo() {
        this.displayInfo = new FormGroup({
            name: new FormControl(''),
            rating: new FormControl(''),
            platforms: new FormControl(''),
            tags: new FormControl('')
        });
        this.changeDisplayInfo();
    }


    changeZoom() {
        this.genericService.changeZoom(parseInt(this.zoomLevel));
    }

    changeGap() {
        this.genericService.changeGap(parseInt(this.gapLevel));
    }
}
