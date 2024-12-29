import { Component, OnDestroy, OnInit } from '@angular/core';
import { CategoryService } from '../../services/category.service';
import { getCurrentWebviewWindow } from '@tauri-apps/api/webviewWindow';
import { GenericService } from '../../services/generic.service';
import {Router} from "@angular/router";
const appWindow = getCurrentWebviewWindow()

@Component({
	selector: 'app-sidebar',
	templateUrl: './sidebar.component.html',
	styleUrl: './sidebar.component.css',
})
export class SidebarComponent implements OnInit, OnDestroy {
	settingsOpen = false;
	showSidebar = true;
	categories: any[] = [];
	currentCategory = '0';
	displayIndicator = true;
	public logoAnimation = true;
	protected readonly appWindow = appWindow;

	constructor(
		private categoryService: CategoryService,
		private genericService: GenericService,
		protected router: Router,
	) {
	}

	openSettings() {
		this.settingsOpen = true;
	}

	ngOnInit() {
		this.logoAnimation = this.genericService.getDevMode() ? false : this.genericService.enableLogoAnimation;
		this.router.events.subscribe(() => {
			if (this.router.url !== '/stats') {
				this.genericService.setDisplayIndicator(true);
			}
		});
		this.categoryService.getCategories();
		this.categoryService.getCategoriesObservable().subscribe(
			(categories) => {
				this.categories = categories;
				this.currentCategory = this.categoryService
					.getCurrentCategory();
			},
		);
		this.genericService.getSidebarOpen().subscribe((sidebarOpen) => {
			this.showSidebar = sidebarOpen;
			if (this.genericService.getAsAlreadyLaunched()) {
				this.logoAnimation = false;
			}
		});

		this.genericService.getDisplayIndicator().subscribe((displayIndicator: boolean) => {
			this.displayIndicator = displayIndicator;
		});
	}

	setCurrentCategory(id: string) {
		this.currentCategory = id;
		this.categoryService.setCurrentCategory(id);
	}

	ngOnDestroy() {
	}

	async toggleFullscreen() {
		if (await this.appWindow.isFullscreen()) {
			await this.appWindow.setFullscreen(false);
		} else {
			await this.appWindow.setFullscreen(true);
		}
	}
}
