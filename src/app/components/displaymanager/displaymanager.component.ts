import { Component, type OnInit } from '@angular/core';
import { GameService } from '../../services/game.service';
import IGame from '../../../interfaces/IGame';
import { GenericService } from '../../services/generic.service';
import { BehaviorSubject } from 'rxjs';
import { SettingsService } from '../../services/settings.service';

@Component({
	selector: 'app-displaymanager',
	templateUrl: './displaymanager.component.html',
	styleUrl: './displaymanager.component.css',
})
export class DisplaymanagerComponent implements OnInit {
	games: IGame[] = [];

	currentView: BehaviorSubject<string> = new BehaviorSubject<string>('');

	constructor(
		private gameService: GameService,
		private genericService: GenericService,
		private settingsService: SettingsService,
	) {
	}

	ngOnInit(): void {
		this.gameService.getGamesObservable().subscribe((games) => {
			this.games = games;
		});
		if (this.genericService.getAsAlreadyLaunched()) {
			this.settingsService.getSettings().subscribe((settings) => {
				this.currentView.next(settings.view || 'card');
			});
			let logo = document.getElementById('logo');
			logo?.classList.remove('logo-animation');
		} else {
			setTimeout(() => {
				this.genericService.setAsAlreadyLaunched();
				this.settingsService.getSettings().subscribe((settings) => {
					this.currentView.next(settings.view || 'card');
				});
			}, this.genericService.getDevMode() ? 0 : 3000);
		}
	}
}
