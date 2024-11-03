import { Component, OnDestroy, OnInit } from '@angular/core';
import { CategoryService } from '../../services/category.service';
import { appWindow } from '@tauri-apps/api/window';
import { GenericService } from '../../services/generic.service';

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
	public logoAnimation = true;
	protected readonly appWindow = appWindow;

	constructor(
		private categoryService: CategoryService,
		private genericService: GenericService,
	) {
	}

	openSettings() {
		this.settingsOpen = true;
	}

	ngOnInit() {
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
