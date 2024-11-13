import { Component, OnInit } from '@angular/core';
import { invoke } from '@tauri-apps/api/tauri';
import * as Papa from 'papaparse';
import { GenericService } from '../../services/generic.service';
import { TranslateService } from '@ngx-translate/core';

@Component({
	selector: 'app-csv-importer',
	templateUrl: './csv_importer.component.html',
	styleUrls: ['./csv_importer.component.css'],
})
export class CSVImporter implements OnInit {
	csvData: any[] = [];
	csvHeaders: string[] = [];
	dbColumns: string[] = [];
	columnMapping: { [key: string]: string } = {};

	constructor(
		private genericService: GenericService,
		private tr: TranslateService,
	) {
	}

	ngOnInit(): void {
		this.getDatabaseFields();
	}

	onFileSelect(event: any) {
		const file = event.files[0];
		const reader = new FileReader();
		reader.onload = (e: any) => {
			const csv = e.target.result;
			this.parseCSV(csv);
		};
		reader.readAsText(file);
	}

	parseCSV(csv: string) {
		const utf8csv = new TextDecoder('utf-8').decode(
			new TextEncoder().encode(csv),
		);

		Papa.parse(utf8csv, {
			header: true,
			skipEmptyLines: true,
			complete: (result) => {
				this.csvHeaders = result.meta.fields || [];
				this.csvData = result.data;
			},
		});
	}

	async getDatabaseFields() {
		await invoke<any>('get_all_fields_from_db').then((fields) => {
			this.dbColumns = JSON.parse(fields)[0];
		});
	}

	async importData() {
		const mappedData = this.csvData.map((row) => {
			const mappedRow: any = {};
			for (const csvHeader in this.columnMapping) {
				const dbColumn = this.columnMapping[csvHeader];
				mappedRow[dbColumn] = row[csvHeader];
			}
			return mappedRow;
		});

		await invoke('upload_csv_to_db', { data: mappedData }).then(() => {
			this.genericService.sendNotification(
				this.tr.instant('csvUpload'),
				this.tr.instant('dataImportedSuccessfully'),
			);
		});
	}
}
