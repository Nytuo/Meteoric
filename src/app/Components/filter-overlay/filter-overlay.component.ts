import {Component, EventEmitter, Input, Output} from '@angular/core';
import {ButtonModule} from "primeng/button";
import {DialogModule} from "primeng/dialog";
import {NgIf} from "@angular/common";
import {RadioButtonModule} from "primeng/radiobutton";
import {SelectButtonModule} from "primeng/selectbutton";
import {SliderModule} from "primeng/slider";
import {GenericService} from "../../services/generic.service";
import {FormControl, FormGroup, FormsModule} from "@angular/forms";
import {BehaviorSubject} from "rxjs";
import ISettings from "../../../interfaces/ISettings";

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
    viewState: any = 'card';
    stateOptions: any[] | undefined = [
        {label: 'List', value: 'list'},
        {label: 'Grid', value: 'card'},
    ];
    displayInfo: FormGroup = new FormGroup({
        name: new FormControl(''),
        rating: new FormControl(''),
        platforms: new FormControl(''),
        tags: new FormControl('')
    });
    settings: BehaviorSubject<ISettings> = new BehaviorSubject<ISettings>({});

    constructor(protected genericService: GenericService) {
        this.genericService.getSettings().subscribe(settings => {
            this.settings.next(settings);
            this.viewState = settings.view || 'card';
        });
    }

    changeView(){
        let settings = this.settings.getValue();
        settings.view = this.viewState;
        this.genericService.changeSettings(settings);
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
