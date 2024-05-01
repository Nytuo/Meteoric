import {Injectable} from '@angular/core';
import {convertFileSrc, invoke} from "@tauri-apps/api/tauri";
import IGame from "../../interfaces/IGame";
import {configDir} from "@tauri-apps/api/path";
import ICategory from "../../interfaces/ICategory";

@Injectable({
    providedIn: 'root'
})
export class DBService {

    constructor() {
    }

    JSONParserForGames(games: string) : IGame[] {
        let gamesArray = JSON.parse(games) as IGame[];
        gamesArray.map(async game => {
            let dashedName = game.nom.replace(/ /g, "_").toLowerCase();
            let configDirPath = await configDir();
            game.jaquette = convertFileSrc(configDirPath + "universe/universe_extra_content/" + dashedName + "/jaquette.jpg");
            game.background = convertFileSrc(configDirPath + "universe/universe_extra_content/" + dashedName + "/background.jpg");
            game.logo = convertFileSrc(configDirPath + "universe/universe_extra_content/" + dashedName + "/logo.png");
            game.icon = convertFileSrc(configDirPath + "universe/universe_extra_content/" + dashedName + "/icon.png");
            game.images = convertFileSrc(configDirPath + "universe/universe_extra_content/" + dashedName + "/images");
            game.videos = convertFileSrc(configDirPath + "universe/universe_extra_content/" + dashedName + "/videos");
            return game;
        });
        return gamesArray;
    }

    async getCategories() {
        const categories = await invoke<string>("get_all_categories");
        return JSON.parse(categories) as ICategory[];
    }

    async getGames(): Promise<void | IGame[]> {
        return new Promise<void | IGame[]>((resolve, reject) => {
            invoke<string>("get_all_games").then(games => {
                resolve(this.JSONParserForGames(games));
            });
        });
    }

    async getGamesByCategory(category: string) {
        return new Promise<void | IGame[]>((resolve, reject) => {
            invoke<string>("get_games_by_category", {category}).then(games => {
                resolve(this.JSONParserForGames(games));
            });
        });
    }
}
