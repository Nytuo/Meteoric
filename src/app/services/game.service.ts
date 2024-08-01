import { Injectable } from '@angular/core';
import IGame from "../../interfaces/IGame";
import { BehaviorSubject, first, Observable } from "rxjs";
import { configDir } from "@tauri-apps/api/path";
import { DBService } from "./db.service";
import { GenericService } from "./generic.service";
import { FormGroup } from "@angular/forms";
import { invoke } from '@tauri-apps/api/tauri';

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

    async autoIGDBImport(gameName: string): Promise<IGame | string> {
        let promise = new Promise<IGame | string>(async (resolve, reject) => {

            await invoke<string>("search_metadata", { gameName: gameName, pluginName: "igdb", strict: true }).then((games) => {
                console.log(games);
                if (games === undefined) {
                    reject("No games found");
                }
                if (games === "No credentials found") {
                    reject("No credentials found, please check your configuration");
                }

                let searchedGames: string[] = [];
                let currentGame: any;

                searchedGames = JSON.parse(games);
                let theFirstGame = JSON.parse(searchedGames[0]);
                if (theFirstGame === undefined) {
                    return;
                }
                let oldGame = currentGame;
                let api_game = eval(theFirstGame);
                //merge the two objects with priority to the new one
                if (oldGame !== undefined) {
                    delete oldGame.jaquette;
                    delete oldGame.background;
                    delete oldGame.logo;
                    delete oldGame.icon;
                    delete oldGame.backgroundMusic;
                    for (let key in oldGame) {
                        if (oldGame.hasOwnProperty(key)) {
                            if (api_game[key] === undefined) {
                                api_game[key] = oldGame[key];
                            }
                        }
                    }
                }

                let newGame: IGame = {
                    id: api_game.id ? api_game.id : '-1',
                    trophies: api_game.trophies ? api_game.trophies : '',
                    name: api_game.name ? api_game.name : '',
                    sort_name: api_game.name ? api_game.name : '',
                    rating: api_game.rating ? api_game.rating : '',
                    platforms: api_game.platforms ? api_game.platforms : '',
                    tags: api_game.tags ? api_game.tags : '',
                    description: api_game.description ? api_game.description : '',
                    critic_score: api_game.critic_score ? Math.round(api_game.critic_score).toString() : '',
                    genres: api_game.genres ? api_game.genres : '',
                    styles: api_game.styles ? api_game.styles : '',
                    release_date: api_game.release_date ? api_game.release_date : '',
                    developers: api_game.developers ? api_game.developers : '',
                    editors: api_game.editors ? api_game.editors : '',
                    status: api_game.status ? api_game.status : '',
                    time_played: api_game.time_played ? api_game.time_played : '',
                    trophies_unlocked: api_game.trophies_unlocked ? api_game.trophies_unlocked : '',
                    last_time_played: api_game.last_time_played ? api_game.last_time_played : '',
                    jaquette: api_game.cover ? api_game.cover : '',
                    background: api_game.background ? api_game.background : '',
                    logo: api_game.logo ? api_game.logo : '',
                    icon: api_game.icon ? api_game.icon : '',
                    backgroundMusic: api_game.backgroundMusic ? api_game.backgroundMusic : '',
                    exec_file: api_game.exec_file ? api_game.exec_file : '',
                    exec_args: api_game.exec_args ? api_game.exec_args : '',
                    game_dir: api_game.game_dir ? api_game.game_dir : '',
                    screenshots: api_game.screenshots ? api_game.screenshots : [],
                    videos: api_game.videos ? api_game.videos : [],
                };
                resolve(newGame);
            });
        });
        return promise;
    }
}
