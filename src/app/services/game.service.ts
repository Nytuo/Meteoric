import {Injectable} from '@angular/core';
import IGame from "../../interfaces/IGame";
import {BehaviorSubject, Observable} from "rxjs";
import {DBService} from "./db.service";
import {GenericService} from "./generic.service";
import {invoke} from '@tauri-apps/api/tauri';

@Injectable({
    providedIn: 'root'
})
export class GameService {

    private gamesObservable = new BehaviorSubject<IGame[]>([]);
    private gameObservable = new BehaviorSubject<IGame>({} as IGame);
    private games: IGame[] = [];

    constructor(private db: DBService, private genericService: GenericService) {
    }

    getGamesObservable(): Observable<IGame[]> {
        return this.gamesObservable.asObservable();
    }

    getGameObservable(): Observable<IGame> {
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
            return this.games.length;
        }
        if (category === "Installed") {
            // TODO : implement installed count
            return 0;
        }
        if (category === "Steam") {
            return await this.getGamesByPlatform("Steam", true).then((count) => {
                if (count === undefined) {
                    return 0;
                }
                return count;
            });
        }
        if (category === "Epic Games") {
            return await this.getGamesByPlatform("Epic Games", true).then((count) => {
                if (count === undefined) {
                    return 0;
                }
                return count;
            });
        }
        if (category === "GOG") {
            return await this.getGamesByPlatform("GOG", true).then((count) => {
                if (count === undefined) {
                    return 0;
                }
                return count;
            });
        }
        return new Promise<number>((resolve, reject) => {
            this.db.getGamesByCategory(category).then(games => {
                if (games === undefined) {
                    return reject();
                }
                resolve(games.length);
            });
        });
    }

    getGame(id: string) {
        this.genericService.changeDisplayBookmark(true);
        return this.games.find(game => game.id === id);
    }

    async getGamesByPlatform(platform: string, count: boolean = false) {
        return new Promise<number | void>(async (resolve, reject) => {
            await this.db.getGames().then(games => {
                if (games === undefined) {
                    console.log("getGames: no games found");
                    reject();
                    return;
                }
                if (count) {
                    resolve(games.filter(game => game.platforms.includes(platform)).length);
                    return;
                }
                this.games = games;
                this.gamesObservable.next(this.games.filter(game => game.platforms.includes(platform)));
                resolve();
            });
        });
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
        return new Promise<IGame | string>(async (resolve, reject) => {

            await invoke<string>("search_metadata", {
                gameName: gameName,
                pluginName: "igdb",
                strict: true
            }).then((games) => {
                if (games === undefined) {
                    reject("No games found");
                }
                if (games === "No credentials found") {
                    reject("No credentials found, please check your configuration");
                }

                let searchedGames: string[];
                let currentGame: any;

                searchedGames = JSON.parse(games);
                let theFirstGame = JSON.parse(searchedGames[0]);
                if (theFirstGame === undefined) {
                    return;
                }
                let api_game = eval(theFirstGame);
                //merge the two objects with priority to the new one

                let newGame: IGame = this.create_new_game(api_game);
                resolve(newGame);
            });
        });
    }

    async searchGameInAPI(gameName: string, provider: string, strict: boolean, currentGame?: IGame): Promise<IGame[] | string> {
        return new Promise<IGame[] | string>(async (resolve, reject) => {
            await invoke<string>("search_metadata", {
                gameName: gameName,
                pluginName: provider,
                strict: strict
            }).then((games) => {
                let searchedGames: any[] = [];
                if (games === undefined || games.length === 0 || games === '[]') {
                    reject("No games found")
                    return;
                }
                if (games === "No credentials found") {
                    reject("No credentials found, please check your configuration");
                    return;
                }

                if (provider === "steam_grid") {
                    resolve(JSON.parse(JSON.parse(games)));
                    return;
                }

                let type = JSON.parse(games) && JSON.parse(JSON.parse(games)[0]);
                type = type.url ? "audio" : "game";
                if (type === "audio") {
                    searchedGames = JSON.parse(games);
                    let parsedGames: any[] = [];
                    searchedGames.forEach((audio) => {
                        audio = JSON.parse(audio);
                        let newAudio = {
                            name: audio.name ? audio.name : '',
                            url: audio.url ? audio.url : '',
                            jaquette: audio.jaquette ? audio.jaquette : '',
                        };
                        parsedGames.push(newAudio);
                    });
                    resolve(parsedGames);
                    return;
                }
                let parsedGames: IGame[] = [];
                searchedGames = JSON.parse(games);
                searchedGames.forEach((api_game) => {

                    let oldGame: any = currentGame;
                    api_game = JSON.parse(api_game);
                    api_game = eval(api_game);
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

                    let newGame = this.create_new_game(api_game);
                    parsedGames.push(newGame);
                });
                resolve(parsedGames);
            });
        });
    }

    private create_new_game(api_game: any): IGame {
        return {
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
    }

    public searchGame(gameName: string) : void {
        this.gamesObservable.next(this.games.filter(game => game.name.toLowerCase().includes(gameName.toLowerCase())));
    }
}
