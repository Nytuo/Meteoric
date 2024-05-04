import {Injectable} from '@angular/core';
import IGame from "../../interfaces/IGame";
import {BehaviorSubject, Observable} from "rxjs";
import {configDir} from "@tauri-apps/api/path";
import {DBService} from "./db.service";
import {GenericService} from "./generic.service";
import {FormGroup} from "@angular/forms";

@Injectable({
    providedIn: 'root'
})
export class GameService {

    constructor(private db: DBService, private genericService: GenericService) {
    }

    private gamesObservable = new BehaviorSubject<IGame[]>([]);


    private games: IGame[] = [];


    getGamesObservable(): Observable<IGame[]> {
        return this.gamesObservable.asObservable();
    }

    getGames() {
        this.db.getGames().then(games => {
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
    }
}
