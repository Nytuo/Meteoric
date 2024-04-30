import {Injectable} from '@angular/core';
import {convertFileSrc, invoke} from "@tauri-apps/api/tauri";
import IGame from "../../interfaces/IGame";
import {BehaviorSubject, Observable} from "rxjs";
import {configDir} from "@tauri-apps/api/path";

@Injectable({
    providedIn: 'root'
})
export class GameService {

    constructor() {
    }

    private gamesObservable = new BehaviorSubject<IGame[]>([]);


    private games: IGame[] = [];

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

    getGamesObservable(): Observable<IGame[]> {
        return this.gamesObservable.asObservable();
    }

    getGames() {
        invoke<string>("get_all_games").then(games => {
            this.games = this.JSONParserForGames(games);
            this.gamesObservable.next(this.games);
        });
    }

    getGame(id: string) {
        return this.games.find(game => game.id === id);
    }

    getGamesByPlatform(platform: string) {
        return this.games.filter(game => game.platforms.includes(platform));
    }

    getGamesByGenre(genre: string) {
        return this.games.filter(game => game.genres.includes(genre));
    }


}
