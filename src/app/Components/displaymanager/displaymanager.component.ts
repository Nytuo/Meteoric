import { CommonModule } from '@angular/common';
import {
	AfterViewChecked,
	AfterViewInit,
	Component,
	type OnInit,
} from '@angular/core';
import { CardViewComponent } from '../views/card-view/card-view.component';
import { GameService } from '../../services/game.service';
import IGame from '../../../interfaces/IGame';
import { ListViewComponent } from '../views/listview/listview.component';
import { GenericService } from '../../services/generic.service';
import { BehaviorSubject } from 'rxjs';
import { After } from 'v8';

@Component({
	selector: 'app-displaymanager',
	standalone: true,
	imports: [CommonModule, CardViewComponent, ListViewComponent],
	templateUrl: './displaymanager.component.html',
	styleUrl: './displaymanager.component.css',
})
export class DisplaymanagerComponent implements OnInit {
	games: IGame[] = [];

	currentView: BehaviorSubject<string> = new BehaviorSubject<string>('');

	constructor(
		private gameService: GameService,
		private genericService: GenericService,
	) {}

	ngOnInit(): void {
		this.gameService.getGamesObservable().subscribe((games) => {
			this.games = games;
		});
		if (this.genericService.getAsAlreadyLaunched()) {
			this.genericService.getSettings().subscribe((settings) => {
				this.currentView.next(settings.view || 'card');
			});
			let logo = document.getElementById('logo');
			logo?.classList.remove('logo-animation');
		} else {
			setTimeout(() => {
				this.genericService.setAsAlreadyLaunched();
				this.genericService.getSettings().subscribe((settings) => {
					this.currentView.next(settings.view || 'card');
				});
			}, 3000);
		}
	}
}
