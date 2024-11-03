import { Component, OnInit } from '@angular/core';
import { HttpClientModule } from '@angular/common/http';
import { NgFor, NgIf } from '@angular/common';
import { TableModule } from 'primeng/table';
import { FileUploadModule } from 'primeng/fileupload';
import { FormsModule } from '@angular/forms';
import { invoke } from '@tauri-apps/api/tauri';
import * as Papa from 'papaparse';
import { DropdownModule } from 'primeng/dropdown';
import { DBService } from '../../services/db.service';

@Component({
	selector: 'app-archive-exporter',
	templateUrl: './archive_exporter.component.html',
	styleUrls: ['./archive_exporter.component.css'],
})
export class ArchiveExporter implements OnInit {
	export_archive() {
		this.db.export_games_to_archive();
	}

	constructor(private db: DBService) {
	}

	ngOnInit(): void {
	}
}
