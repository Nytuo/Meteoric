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
	imports: [
		NgIf,
		NgFor,
		TableModule,
		HttpClientModule,
		FileUploadModule,
		FormsModule,
		DropdownModule,
	],
	standalone: true,
	selector: 'app-csv-exporter',
	templateUrl: './csv_exporter.component.html',
	styleUrls: ['./csv_exporter.component.css'],
})
export class CSVEmporter implements OnInit {
	export_csv() {
		this.db.export_games_to_csv();
	}

	constructor(private db: DBService) {
	}

	ngOnInit(): void {
	}
}
