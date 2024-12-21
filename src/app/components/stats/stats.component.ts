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
	gamesPlayedPerDayData: any;
	monthlyActivityData: any;
	yearlyActivityData: any;

	constructor(
		private gameService: GameService,
		private categoryService: CategoryService,
	) {}

	dateToDay(date: Date | number): string {
		const days = [
			'Sunday',
			'Monday',
			'Tuesday',
			'Wednesday',
			'Thursday',
			'Friday',
			'Saturday',
		];
		return days[date instanceof Date ? date.getDay() : date];
	}

	calculateTime(game: IGame) {
		return game.stats?.reduce(
			(acc, stat) => acc + parseInt(stat.time_played),
			0,
		);
	}

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
			this.gamesPlayedPerDayData = {
				labels: [
					'Monday',
					'Tuesday',
					'Wednesday',
					'Thursday',
					'Friday',
					'Saturday',
					'Sunday',
				],
				datasets: [
					{
						label: 'Games Played',
						// check for each game if it has been played on a specific day of the week and increment the corresponding index in the array by 1
						data: this.games.reduce(
							(acc, game) =>
								game.stats
									? acc.map((day, index) =>
											game.stats.some(
												(stat) =>
													this.dateToDay(stat.date_of_play) ===
													this.dateToDay(index),
											)
												? day + 1
												: day,
										)
									: acc,
							[0, 0, 0, 0, 0, 0, 0],
						),
						fill: false,
						borderColor: '#4bc0c0',
					},
				],
			};
			this.monthlyActivityData = {
				labels: [
					'January',
					'February',
					'March',
					'April',
					'May',
					'June',
					'July',
					'August',
					'September',
					'October',
					'November',
					'December',
				],
				datasets: [
					{
						label: 'Games Played',
						backgroundColor: '#42A5F5',
						borderColor: '#1E88E5',
						data: this.games.reduce(
							(acc, game) =>
								game.stats
									? acc.map((month, index) =>
											game.stats.some(
												(stat) =>
													new Date(stat.date_of_play).getMonth() === index,
											)
												? month + 1
												: month,
										)
									: acc,
							[0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
						),
					},
				],
			};
			let possibleYears = this.games.reduce((acc: number[], game) => {
				if (game.stats) {
					game.stats.forEach((stat) => {
						const year = new Date(stat.date_of_play).getFullYear();
						if (!acc.includes(year)) {
							acc.push(year);
						}
					});
				}
				return acc;
			}, []);
			this.yearlyActivityData = {
				labels: possibleYears.map((year) => year.toString()),
				datasets: [
					{
						label: 'Games Played',
						backgroundColor: '#9CCC65',
						borderColor: '#7CB342',
						data: this.games.reduce(
							(acc, game) =>
								game.stats
									? acc.map((year: number, index) =>
											game.stats.some(
												(stat) =>
													new Date(stat.date_of_play).getFullYear() ===
													possibleYears[index],
											)
												? year + 1
												: year,
										)
									: acc,
							possibleYears.map((year) => 0 as number),
						),
					},
				],
			};
			this.totalGames = games.length;
			this.totalTimePlayed = games.reduce(
				(acc, game) =>
					game.stats
						? acc +
							game.stats.reduce(
								(acc, stat) => acc + parseInt(stat.time_played),
								0,
							)
						: acc,
				0,
			);
			this.averageTimePlayed = this.totalTimePlayed / this.totalGames;
			this.activities = games.sort((a, b) => {
				return (
					(b.stats ? parseInt(b.stats[0].time_played) : 0) -
					(a.stats ? parseInt(a.stats[0].time_played) : 0)
				);
			});
			this.activities = this.activities.slice(0, 5);
			this.mostPlayed = games.reduce((acc, game) =>
				(game.stats?.reduce((a, s) => a + +s.time_played, 0) || 0) >
				(acc.stats?.reduce((a, s) => a + +s.time_played, 0) || 0)
					? game
					: acc,
			);
			this.leastPlayed = games.reduce((acc, game) =>
				(game.stats?.reduce((a, s) => a + +s.time_played, 0) || 0) <
				(acc.stats?.reduce((a, s) => a + +s.time_played, 0) || 0)
					? game
					: acc,
			);
		});
	}
}
