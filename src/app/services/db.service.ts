import { Injectable } from '@angular/core';
import { convertFileSrc, invoke } from "@tauri-apps/api/tauri";
import IGame from "../../interfaces/IGame";
import { configDir } from "@tauri-apps/api/path";
import ICategory from "../../interfaces/ICategory";
import { platform } from "@tauri-apps/api/os";
import {FormGroup} from "@angular/forms";

@Injectable({
    providedIn: 'root'
})
export class DBService {

    constructor() {
    }

    JSONParserForGames(games: string): IGame[] {
        let gamesArray = JSON.parse(games) as IGame[];
        console.log(gamesArray);
        gamesArray.map(async game => {
            let id = game.id;
            let configDirPath = await configDir();
            let dplatform = await platform();
            if (dplatform === "win32") {
                configDirPath = configDirPath + "Nytuo\\universe\\config\\universe_extra_content\\";
            } else {
                configDirPath = configDirPath + "universe/universe_extra_content/";
            }
            game.jaquette = convertFileSrc(configDirPath + id + "/jaquette.jpg");
            game.background = convertFileSrc(configDirPath + id + "/background.jpg");
            game.logo = convertFileSrc(configDirPath + id + "/logo.png");
            game.icon = convertFileSrc(configDirPath + id + "/icon.png");
            let allImagesLocation = await invoke<string>("get_all_images_location", { id: id });
            let allImagesLocationParsed = JSON.parse(allImagesLocation);
            game.screenshots = [];
            for (let i = 0; i < allImagesLocationParsed.length; i++) {
                game.screenshots[i] = convertFileSrc(configDirPath + allImagesLocationParsed[i]);
            }
            game.videos = [];
            let allVideosLocation = await invoke<string>("get_all_videos_location", { id: id });
            allVideosLocation = JSON.parse(allVideosLocation);
            for (let i = 0; i < allVideosLocation.length; i++) {
                game.videos[i] = convertFileSrc(configDirPath + allVideosLocation[i]);
            }
            game.backgroundMusic = convertFileSrc(configDirPath + id + "/musics/theme.mp3");
            return game;
        });
        return gamesArray;
    }

    async refreshGameLinks(game: IGame): Promise<IGame> {
        let id = game.id;
        let configDirPath = await configDir();
        let dplatform = await platform();
        if (dplatform === "win32") {
            configDirPath = configDirPath + "Nytuo\\universe\\config\\universe_extra_content\\";
        } else if (dplatform === "linux") {
            configDirPath = configDirPath + "universe/universe_extra_content/";
        }
        game.jaquette = convertFileSrc(configDirPath + id + "/jaquette.jpg") + "?" + new Date().getTime();
        game.background = convertFileSrc(configDirPath + id + "/background.jpg") + "?" + new Date().getTime();
        game.logo = convertFileSrc(configDirPath + id + "/logo.png") + "?" + new Date().getTime();
        game.icon = convertFileSrc(configDirPath + id + "/icon.png") + "?" + new Date().getTime();
        let allImagesLocation = await invoke<string>("get_all_images_location", {id: id});
        let allImagesLocationParsed = JSON.parse(allImagesLocation);
        game.screenshots = [];
        for (let i = 0; i < allImagesLocationParsed.length; i++) {
            game.screenshots[i] = convertFileSrc(configDirPath + allImagesLocationParsed[i]);
        }
        game.videos = [];
        let allVideosLocation = await invoke<string>("get_all_videos_location", {id: id});
        allVideosLocation = JSON.parse(allVideosLocation);
        for (let i = 0; i < allVideosLocation.length; i++) {
            game.videos[i] = convertFileSrc(configDirPath + allVideosLocation[i]);
        }
        game.backgroundMusic = convertFileSrc(configDirPath + id + "/musics/theme.mp3");
        return game;
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

    async postGame(game: IGame) {
        console.log(game);
        console.log(JSON.stringify(game));
        return invoke("post_game", { game: JSON.stringify(game) });
    }

    async uploadFile(file: any, typeOf: "screenshot" | "video" | "audio" | "background" | "icon" | "logo" | "jaquette", gameName: string) {
        let fileContent = Array.from(new Uint8Array(file));
        return invoke("upload_file", {fileContent, typeOf, gameName});
    }

    async deleteElement(typeOf: "screenshot" | "video" | "audio", gameName: string, elementName?: string) {
        if (elementName === undefined) {
            return invoke("delete_element", {typeOf, gameName, elementName: ""});
        }
        return invoke("delete_element", {typeOf, gameName, elementName});
    }

    async getGame(id: string) {
        return new Promise<void | IGame[]>((resolve, reject) => {
            invoke<string>("get_game", { id }).then(games => {
                resolve(this.JSONParserForGames(games));
            });
        });
    }

    saveMediaToExternalStorage(currentGame: IGame) {
        let exportGame = {
            jaquette: currentGame.jaquette,
            background: currentGame.background,
            logo: currentGame.logo,
            icon: currentGame.icon,
            screenshots: currentGame.screenshots,
            videos: currentGame.videos,
            audio: currentGame.backgroundMusic
        }

        let exportGameString = JSON.stringify(exportGame);

        invoke("save_media_to_external_storage", { id: currentGame.id, game: exportGameString });
    }
}
