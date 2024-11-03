import { Component, OnInit } from '@angular/core';
import { DBService } from '../../services/db.service';

@Component({
	selector: 'app-archive-exporter',
	templateUrl: './archive_exporter.component.html',
	styleUrls: ['./archive_exporter.component.css'],
})
export class ArchiveExporter implements OnInit {
	constructor(private db: DBService) {
	}

	export_archive() {
		this.db.export_games_to_archive();
	}

	ngOnInit(): void {
	}
}
