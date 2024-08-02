import { Component, OnDestroy, OnInit } from '@angular/core';
import { RouterLink } from "@angular/router";
import { NgForOf, NgIf } from "@angular/common";
import { CategoryService } from "../../services/category.service";
import { appWindow } from "@tauri-apps/api/window";
import { TagModule } from 'primeng/tag';
import { SettingsOverlayComponent } from "../settings-overlay/settings-overlay.component";
import { SidebarModule } from 'primeng/sidebar';
import { GenericService } from '../../services/generic.service';

@Component({
    selector: 'app-sidebar',
    standalone: true,
    imports: [
        RouterLink,
        NgForOf,
        NgIf,
        TagModule,
        SettingsOverlayComponent, SidebarModule
    ],
    templateUrl: './sidebar.component.html',
    styleUrl: './sidebar.component.css'
})
export class SidebarComponent implements OnInit, OnDestroy {

    settingsOpen = false;
    showSidebar = true;
    openSettings() {
        this.settingsOpen = true;
    }

    categories: any[] = [
    ];

    currentCategory = 0;

    ngOnInit() {
        this.categoryService.getCategories();
        this.categoryService.getCategoriesObservable().subscribe((categories) => {
            this.categories = categories;
            this.currentCategory = this.categoryService.getCurrentCategory();
        });
        this.genericService.getSidebarOpen().subscribe((sidebarOpen) => {
            this.showSidebar = sidebarOpen;
        });
    }

    setCurrentCategory(id: number) {
        this.currentCategory = id;
        this.categoryService.setCurrentCategory(id);
    }



    ngOnDestroy() {

    }
    constructor(private categoryService: CategoryService, private genericService: GenericService) {
    }


    protected readonly appWindow = appWindow;

    async toogleFullscreen() {
        if (await this.appWindow.isFullscreen()) {
            await this.appWindow.setFullscreen(false);
        } else {
            await this.appWindow.setFullscreen(true);
        }
    }
}
