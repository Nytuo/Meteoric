import { Injectable } from '@angular/core';
import { convertFileSrc, invoke } from "@tauri-apps/api/tauri";
import IGame from "../../interfaces/IGame";
import { configDir } from "@tauri-apps/api/path";
import ICategory from "../../interfaces/ICategory";
import { platform } from "@tauri-apps/api/os";

@Injectable({
    providedIn: 'root'
})
export class DBService {

    constructor() {
    }

    JSONParserForGames(games: string): IGame[] {
        let gamesArray = JSON.parse(games) as IGame[];
        gamesArray.map(async game => {
            let dashedName = game.nom.replace(/ /g, "_").toLowerCase();
            let configDirPath = await configDir();
            let dplatform = await platform();
            if (dplatform === "win32") {
                configDirPath = configDirPath + "Nytuo\\universe\\config\\universe_extra_content\\";
            } else if (dplatform === "linux") {
                configDirPath = configDirPath + "universe/universe_extra_content/";
            }
            game.jaquette = convertFileSrc(configDirPath + dashedName + "/jaquette.jpg");
            game.background = convertFileSrc(configDirPath + dashedName + "/background.jpg");
            game.logo = convertFileSrc(configDirPath + dashedName + "/logo.png");
            game.icon = convertFileSrc(configDirPath + dashedName + "/icon.png");
            let allImagesLocation = await invoke<string>("get_all_images_location", { gameName: dashedName });
            let allImagesLocationParsed = JSON.parse(allImagesLocation);
            game.screenshots = [];
            for (let i = 0; i < allImagesLocationParsed.length; i++) {
                game.screenshots[i] = convertFileSrc(configDirPath + allImagesLocationParsed[i]);
            }
            game.videos = [];
            let allVideosLocation = await invoke<string>("get_all_videos_location", { gameName: dashedName });
            allVideosLocation = JSON.parse(allVideosLocation);
            for (let i = 0; i < allVideosLocation.length; i++) {
                game.videos[i] = convertFileSrc(configDirPath + allVideosLocation[i]);
            }
            game.backgroundMusic = convertFileSrc(configDirPath + dashedName + "/musics/theme.mp3");
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
            invoke<string>("get_games_by_category", { category }).then(games => {
                resolve(this.JSONParserForGames(games));
            });
        });
    }
}
