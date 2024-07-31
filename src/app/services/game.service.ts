import { Injectable } from '@angular/core';
import IGame from "../../interfaces/IGame";
import { BehaviorSubject, Observable } from "rxjs";
import { configDir } from "@tauri-apps/api/path";
import { DBService } from "./db.service";
import { GenericService } from "./generic.service";
import { FormGroup } from "@angular/forms";

@Injectable({
    providedIn: 'root'
})
export class GameService {

    constructor(private db: DBService, private genericService: GenericService) {
    }

    private gamesObservable = new BehaviorSubject<IGame[]>([]);
    private gameObservable = new BehaviorSubject<IGame>({} as IGame);


    private games: IGame[] = [];


    getGamesObservable(): Observable<IGame[]> {
        return this.gamesObservable.asObservable();
    }

    getGameObservable(id: string): Observable<IGame> {
        return this.gameObservable.asObservable();
    }

    setGameObservable(game: IGame | undefined) {
        if (game === undefined) {
            return;
        }
        this.gameObservable.next(game);
    }

    async getGames() {
        await this.db.getGames().then(games => {
            if (games === undefined) {
                console.log("getGames: no games found");
                return;
            }
            console.log("getGames: games found");
            this.games = games;
            this.gamesObservable.next(this.games);
        });
    }

    loadGamesOfACategory(category: string) {
        this.db.getGamesByCategory(category).then(games => {
            if (games === undefined) {
                return;
            }
            this.games = games;
            this.gamesObservable.next(this.games);
        });
    }

    async getCountOfGamesInCategory(category: string): Promise<number> {
        if (category === "All") {
            return await this.games.length;
        }
        if (category === "Installed") {
            // TODO : implement installed count
            return 0;
        }
        let promise = new Promise<number>((resolve, reject) => {
            this.db.getGamesByCategory(category).then(games => {
                if (games === undefined) {
                    return reject();
                }
                resolve(games.length);
            });
        });
        return promise;
    }

    getGame(id: string) {
        this.genericService.changeDisplayBookmark(true);
        return this.games.find(game => game.id === id);
    }

    getGamesByPlatform(platform: string) {
        return this.games.filter(game => game.platforms.includes(platform));
    }

    getGamesByGenre(genre: string) {
        return this.games.filter(game => game.genres.includes(genre));
    }

    setGame(id: string, game: IGame) {
        this.games = this.games.map(g => {
            if (g.id === id) {
                return game;
            }
            return g;
        });
        this.gamesObservable.next(this.games);
        this.gameObservable.next(game);
    }
}
