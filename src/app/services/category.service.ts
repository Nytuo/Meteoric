import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { GameService } from './game.service';
import { DBService } from './db.service';
import ICategory from '../../interfaces/ICategory';
import { GenericService } from './generic.service';

@Injectable({
	providedIn: 'root',
})
export class CategoryService {
	getCategoriesForGame(gameID: string): ICategory[] {
		let categories: ICategory[] = [];
		this.categories.forEach((category) => {
			let gamesArrayFromString = category.games.split(',');
			if (gamesArrayFromString.includes(gameID)) {
				categories.push(category);
			}
		});
		return categories;
	}
	private catSubject = new BehaviorSubject<ICategory[]>([]);

	constructor(
		private gameService: GameService,
		private db: DBService,
		private genericService: GenericService,
	) { }

	private categories_static: ICategory[] = [
		{
			id: '0',
			name: 'All',
			icon: 'home',
			games: '*',
			filters: ['All', 'Installed', 'Not Installed'],
			views: ['Grid', 'List'],
			background: '',
		},
		{
			id: '-1',
			name: 'Installed',
			icon: 'download',
			games: '*',
			filters: ['All', 'Installed', 'Not Installed'],
			views: ['Grid', 'List'],
			background: '',
		},
		{
			id: '-2',
			name: 'Steam',
			icon: 'bookmark',
			games: '*',
			filters: ['All', 'Installed', 'Not Installed'],
			views: ['Grid', 'List'],
			background: '',
		},
		{
			id: '-3',
			name: 'Epic Games',
			icon: 'bookmark',
			games: '*',
			filters: ['All', 'Installed', 'Not Installed'],
			views: ['Grid', 'List'],
			background: '',
		},
		{
			id: '-4',
			name: 'GOG',
			icon: 'bookmark',
			games: '*',
			filters: ['All', 'Installed', 'Not Installed'],
			views: ['Grid', 'List'],
			background: '',
		}

	];

	categories: ICategory[] = [];

	private currentCategory = '0';

	private autorizedToBookmark = false;

	getAutorizedToBookmark() {
		return this.autorizedToBookmark;
	}

	refreshCategories() {
		this.getCategoriesFromDB();
	}

	getCategoriesFromDB() {
		this.db.getCategories().then((categories) => {
			this.categories = this.categories_static.concat(categories);
			this.getCategories();
		});
	}

	createCategory(
		name: string,
		icon: string,
		games: string[],
		filters: string[],
		views: string[],
		background: string,
	) {
		this.db
			.createCategory(name, icon, games, filters, views, background)
			.then(() => {
				this.getCategoriesFromDB();
			});
	}

	getCurrentCategory() {
		return this.currentCategory;
	}

	setCurrentCategory(id: string) {
		this.currentCategory = id;
		if (id === '0' || id === '-1' || id === '-2' || id === '-3' || id === '-4') {
			switch (id) {
				case '0':
					this.gameService.getGames();
					break;
				case '-1':
					this.gameService.getGames();
					break;
				case '-2':
					this.gameService.getGamesByPlatform('Steam');
					break;
				case '-3':
					this.gameService.getGamesByPlatform('Epic Games');
					break;
				case '-4':
					this.gameService.getGamesByPlatform('GOG');
					break;
			}
			this.genericService.isAuthorizedToBookmark = true;
			this.genericService.changeDisplayBookmark(false);
			return;
		}
		this.gameService.loadGamesOfACategory(
			this.categories[this.categories.findIndex((cat) => cat.id === id)].name,
		);
		this.genericService.isAuthorizedToBookmark = false;
		this.genericService.changeDisplayBookmark(true);
	}

	addGameToCategory(gameID: string, categoryID: string) {
		console.log('addGameToCategory', gameID, categoryID);
		this.db.addGameToCategory(gameID, categoryID).then(() => {
			this.getCategoriesFromDB();
		});
	}

	async getCategories() {
		for (let i = 0; i < this.categories.length; i++) {
			this.categories[i].count =
				await this.gameService.getCountOfGamesInCategory(
					this.categories[i].name,
				);
		}
		this.catSubject.next(this.categories);
	}

	getCategoriesObservable() {
		return this.catSubject.asObservable();
	}
}
