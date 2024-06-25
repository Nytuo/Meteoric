import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from "rxjs";
import { GameService } from "./game.service";
import { DBService } from "./db.service";
import ICategory from "../../interfaces/ICategory";
import { GenericService } from "./generic.service";

@Injectable({
    providedIn: 'root'
})
export class CategoryService {

    private catSubject = new BehaviorSubject<ICategory[]>([]);

    constructor(private gameService: GameService, private db: DBService, private genericService: GenericService) {
    }

    private categories_static: ICategory[] = [
        {
            id: 0,
            name: "All",
            icon: "home",
            games: ["*"],
            filters: ["All", "Installed", "Not Installed"],
            views: ["Grid", "List"],
            background: "",
        },
        {
            id: -1,
            name: "Installed",
            icon: "download",
            games: ["*"],
            filters: ["All", "Installed", "Not Installed"],
            views: ["Grid", "List"],
            background: "",
        }
    ];

    categories: ICategory[] = [];

    private currentCategory = 0;

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

    createCategory(name: string, icon: string, games: string[], filters: string[], views: string[], background: string) {
        this.db.createCategory(name, icon, games, filters, views, background).then(() => {
            this.getCategoriesFromDB();
        });
    }

    getCurrentCategory() {
        return this.currentCategory;
    }

    setCurrentCategory(id: number) {
        this.currentCategory = id;
        if (id === 0 || id === -1) {
            this.gameService.getGames();
            this.genericService.isAuthorizedToBookmark = true;
            this.genericService.changeDisplayBookmark(false);
            return;
        }
        this.gameService.loadGamesOfACategory(this.categories[this.categories.findIndex(cat => cat.id === id)].name);
        this.genericService.isAuthorizedToBookmark = false;
        this.genericService.changeDisplayBookmark(true);
    }

    async getCategories() {
        this.categories[0].count = await this.gameService.getCountOfGamesInCategory(this.categories[0].name);
        this.categories[1].count = await this.gameService.getCountOfGamesInCategory(this.categories[1].name);
        this.catSubject.next(this.categories);
    }

    getCategoriesObservable() {
        return this.catSubject.asObservable();
    }
}
