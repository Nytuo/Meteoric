import { Component, OnInit } from '@angular/core';
import { DBService } from '../../services/db.service';

@Component({
	selector: 'app-csv-exporter',
	templateUrl: './csv_exporter.component.html',
	styleUrls: ['./csv_exporter.component.css'],
})
export class CSVExporter implements OnInit {
	constructor(private db: DBService) {
	}

	export_csv() {
		this.db.export_games_to_csv();
	}

	ngOnInit(): void {
	}
}
