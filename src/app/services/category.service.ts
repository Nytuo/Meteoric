import {Injectable} from '@angular/core';
import {BehaviorSubject, Observable} from "rxjs";
import {GameService} from "./game.service";
import {DBService} from "./db.service";
import ICategory from "../../interfaces/ICategory";

@Injectable({
    providedIn: 'root'
})
export class CategoryService {

    private catSubject = new BehaviorSubject<ICategory[]>([]);

    constructor(private gameService: GameService, private db: DBService) {
    }

    private categories_static: ICategory[] = [
        {
            id: 0,
            name: "All",
            icon: "home",
            games: ["*"],
            filters: ["All", "Installed", "Not Installed"],
            views: ["Grid", "List"],
            background: ""
        },
        {
            id: -1,
            name: "Installed",
            icon: "download",
            games: ["installed"],
            filters: ["All", "Installed", "Not Installed"],
            views: ["Grid", "List"],
            background: ""
        }
    ];

    categories: ICategory[] = [];

    private currentCategory = 0;

    refreshCategories() {
        this.getCategoriesFromDB();
    }

    getCategoriesFromDB() {
        this.db.getCategories().then((categories) => {
            this.categories = this.categories_static.concat(categories);
            this.getCategories();
        });
    }

    getCurrentCategory() {
        return this.currentCategory;
    }

    setCurrentCategory(id: number) {
        this.currentCategory = id;
        if (id === 0 || id === -1) {
            this.gameService.getGames();
            return;
        }
        this.gameService.loadGamesOfACategory(this.categories[this.categories.findIndex(cat => cat.id === id)].name);
    }

    getCategories() {
        this.catSubject.next(this.categories);
    }

    getCategoriesObservable() {
        return this.catSubject.asObservable();
    }
}
