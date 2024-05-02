import { Component } from '@angular/core';
import { GenericService } from "../../services/generic.service";
import { ButtonModule } from "primeng/button";
import {Location, NgFor} from '@angular/common';
import {RadioButtonModule} from "primeng/radiobutton";
import {FormControl, FormGroup, FormsModule, ReactiveFormsModule} from "@angular/forms";
import {SliderModule} from "primeng/slider";
import {SelectButtonModule} from "primeng/selectbutton";
import {DialogModule} from "primeng/dialog";
import {ToolbarModule} from "primeng/toolbar";
import {SplitButtonModule} from "primeng/splitbutton";
import {MenuItem} from "primeng/api";
import {appWindow} from "@tauri-apps/api/window";
import {routes} from "../../app.routes";
import {ActivatedRoute, NavigationEnd, Router, RouterLink} from "@angular/router";

@Component({
    selector: 'app-topbar',
    standalone: true,
    imports: [
        ButtonModule,
        NgFor,
        RadioButtonModule,
        FormsModule,
        ReactiveFormsModule,
        SliderModule,
        SelectButtonModule,
        DialogModule,
        ToolbarModule,
        SplitButtonModule,
    ],
    templateUrl: './topbar.component.html',
    styleUrl: './topbar.component.css'
})
export class TopbarComponent {

    displayInfo: FormGroup = new FormGroup({
        name: new FormControl(''),
        rating: new FormControl(''),
        platforms: new FormControl(''),
        tags: new FormControl('')
    });

    zoomLevel: any = this.genericService.getZoomValue();
    gapLevel: any = this.genericService.getGapValue();

    isBookmarkAllowed: boolean = false;

    viewState: any = 'list';

    overlayVisible: boolean = false;

    showOverlay() {
        this.overlayVisible = !this.overlayVisible;
    }

    constructor(protected genericService: GenericService, protected location: Location) {
        this.genericService.getDisplayBookmark().subscribe((value) => {
            this.isBookmarkAllowed = value;
        });
    }

    changeZoom() {
        this.genericService.changeZoom(parseInt(this.zoomLevel));
    }


    changeGap() {
        this.genericService.changeGap(parseInt(this.gapLevel));
    }

    changeDisplayInfo() {
        this.genericService.changeDisplayInfo(this.displayInfo);
    }

    stateOptions: any[] | undefined = [
        {label: 'List', value: 'list'},
        {label: 'Grid', value: 'grid'},
    ];
    items: MenuItem[] | undefined = [
        {label: 'Save', icon: 'pi pi-save'},
        {label: 'Update', icon: 'pi pi-refresh'},
        {label: 'Delete', icon: 'pi pi-trash'}
    ];

    clearDisplayInfo() {
        this.displayInfo = new FormGroup({
            name: new FormControl(''),
            rating: new FormControl(''),
            platforms: new FormControl(''),
            tags: new FormControl('')
        });
        this.changeDisplayInfo();
    }

    protected readonly appWindow = appWindow;

    async toggleMinimize() {
        if (await this.appWindow.isMinimized()) {
            await this.appWindow.unminimize();
        }else {
            await this.appWindow.minimize();
        }
    }

    async toggleMaximize() {
        if (await this.appWindow.isMaximized()) {
            await this.appWindow.unmaximize();
        } else {
            await this.appWindow.maximize();
        }
    }

    protected readonly routes = routes;
}
