import { Component, OnInit } from '@angular/core';
import { GameService } from '../../services/game.service';
import { CategoryService } from '../../services/category.service';
import IGame from '../../../interfaces/IGame';

@Component({
	selector: 'app-stats',
	templateUrl: './stats.component.html',
	styleUrl: './stats.component.css',
})
export class StatsComponent implements OnInit {
	protected favNumber: number = 0;
	protected favPercentage: number = 0;
	protected totalGames: number = 0;
	protected totalTimePlayed: number = 0;
	protected averageTimePlayed: number = 0;
	protected games: IGame[] = [];
	protected activities: any[] = [];
	protected mostPlayed: IGame = {} as IGame;
	protected leastPlayed: IGame = {} as IGame;
	protected categories: any[] = [];
	constructor(
		private gameService: GameService,
		private categoryService: CategoryService,
	) {}

	ngOnInit(): void {
		this.gameService.getGames();
		this.categoryService.getCategoriesObservable().subscribe((categories) => {
			this.categories = categories;
			this.favNumber = categories.reduce(
				(acc, category) =>
					category.name === 'Favorite' ? category.games.length : acc,
				0,
			);
			this.favPercentage = (this.favNumber / this.totalGames) * 100;
		});
		this.gameService.getGamesObservable().subscribe((games) => {
			this.games = games;
			this.totalGames = games.length;
			this.totalTimePlayed = games.reduce(
				(acc, game) => acc + parseInt(game.time_played),
				0,
			);
			this.averageTimePlayed = this.totalTimePlayed / this.totalGames;
			this.activities = games.sort((a, b) => {
				return parseInt(b.time_played) - parseInt(a.time_played);
			});
			this.activities = this.activities.slice(0, 5);
			this.mostPlayed = games.reduce((acc, game) =>
				parseInt(game.time_played) > parseInt(acc.time_played)
					? game
					: acc,
			);
			this.leastPlayed = games.reduce((acc, game) =>
				parseInt(game.time_played) < parseInt(acc.time_played)
					? game
					: acc,
			);
		});
	}
}
