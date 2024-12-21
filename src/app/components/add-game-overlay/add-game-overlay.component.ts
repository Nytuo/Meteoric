import {
	Component,
	ElementRef,
	EventEmitter,
	Input,
	OnInit,
	Output,
} from '@angular/core';
import IGame from '../../../interfaces/IGame';
import { DBService } from '../../services/db.service';
import { GameService } from '../../services/game.service';
import { GenericService } from '../../services/generic.service';
import simpleSvgPlaceholder from '@cloudfour/simple-svg-placeholder';
import { TranslateService } from '@ngx-translate/core';

@Component({
	selector: 'app-add-game-overlay',
	templateUrl: './add-game-overlay.component.html',
	styleUrl: './add-game-overlay.component.css',
})
export class AddGameOverlayComponent implements OnInit {
	@Input()
	visible: boolean = false;
	@Output()
	visibleChange = new EventEmitter<boolean>();

	currentGame: IGame | undefined;
	loading: boolean = false;
	statusOfImport: String = '';

	constructor(
		private db: DBService,
		private gameService: GameService,
		private elementRef: ElementRef,
		protected genericService: GenericService,
		private translate: TranslateService,
	) {}

	hide() {
		this.visibleChange.emit(false);
	}

	ngOnInit(): void {
		this.currentGame = {
			id: '-1',
			trophies: '',
			name: '',
			sort_name: '',
			rating: '',
			platforms: '',
			tags: '',
			description: '',
			critic_score: '',
			genres: '',
			styles: '',
			release_date: '',
			developers: '',
			editors: '',
			status: '',
			trophies_unlocked: '',
			hidden: 'false',
			jaquette: simpleSvgPlaceholder({
				text: this.translate.instant('placeholder'),
				textColor: '#ffffff',
				bgColor: '#7a7a7a',
				width: 200,
				height: 300,
			}),
			background: simpleSvgPlaceholder({
				text: this.translate.instant('placeholder'),
				textColor: '#ffffff',
				bgColor: '#7a7a7a',
				width: 300,
				height: 200,
			}),
			logo: simpleSvgPlaceholder({
				text: this.translate.instant('placeholder'),
				textColor: '#ffffff',
				bgColor: '#7a7a7a',
				width: 200,
				height: 200,
			}),
			icon: simpleSvgPlaceholder({
				text: this.translate.instant('placeholder'),
				textColor: '#ffffff',
				bgColor: '#7a7a7a',
				width: 200,
				height: 200,
			}),
			backgroundMusic: '',
			exec_file: '',
			game_dir: '',
			exec_args: '',
			screenshots: [],
			videos: [],
			stats: [],
		};
	}

	addGame() {
		this.loading = true;
		if (this.currentGame === undefined) {
			return;
		}
		let nameFromInput = this.elementRef.nativeElement.querySelector('#name')
			.value as string;
		this.currentGame.name = nameFromInput.trim();
		this.currentGame.sort_name = nameFromInput.trim().toLowerCase();
		this.statusOfImport = this.translate.instant(
			'insertingTheGameIntoTheDatabase',
		);
		this.db.postGame(this.currentGame).then(async (id) => {
			if (this.currentGame === undefined) {
				return;
			}
			this.statusOfImport = this.translate.instant('fetchingTheInfoFromIgdb');
			let gameIGDB = await this.gameService.autoIGDBImport(
				this.currentGame.name,
			);
			if (typeof gameIGDB === 'string') {
				this.statusOfImport =
					this.translate.instant('error') + ' : ' + gameIGDB;
				console.log(gameIGDB);
			} else {
				this.currentGame = gameIGDB;
				this.currentGame.id = id;
				this.statusOfImport =
					this.translate.instant('found') +
					' : ' +
					this.currentGame.name +
					' ' +
					this.translate.instant('ModifyingTheDatabase');
				this.db.postGame(this.currentGame).then(() => {
					if (this.currentGame === undefined) {
						return;
					}
					this.statusOfImport = this.translate.instant('gameMetadataUpdated');
					this.db.saveMediaToExternalStorage(this.currentGame).then(() => {
						this.statusOfImport = this.translate.instant('doneWaitForFinish');
						this.gameService.getGames();
						this.visibleChange.emit(false);
						this.loading = false;
					});
				});
			}
		});
	}
}
