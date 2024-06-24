import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { NgFor, NgIf } from '@angular/common';
import { TableModule } from 'primeng/table';
import { FileUploadModule } from 'primeng/fileupload';
import { HttpClientModule } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { invoke } from '@tauri-apps/api/tauri';
import * as Papa from 'papaparse';

@Component({
    imports: [
        NgIf,
        NgFor,
        TableModule,
        HttpClientModule,
        FileUploadModule,
        FormsModule
    ],
    standalone: true,
    selector: 'app-csv-importer',
    templateUrl: './csv_importer.component.html',
    styleUrls: ['./csv_importer.component.css']
})
export class CSVImporter implements OnInit {
    csvData: any[] = [];
    csvHeaders: string[] = [];
    dbColumns: string[] = [];
    columnMapping: { [key: string]: string; } = {};

    constructor(private http: HttpClient) { }
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
        const utf8csv = new TextDecoder('utf-8').decode(new TextEncoder().encode(csv));

        Papa.parse(utf8csv, {
            header: true,
            skipEmptyLines: true,
            complete: (result) => {
                this.csvHeaders = result.meta.fields || [];
                this.csvData = result.data;
            }
        });
    }


    async getDatabaseFields() {
        await invoke<any>("get_all_fields_from_db").then((fields) => {
            this.dbColumns = JSON.parse(fields)[0];
        });
    }

    async importData() {
        const mappedData = this.csvData.map(row => {
            const mappedRow: any = {};
            for (const csvHeader in this.columnMapping) {
                const dbColumn = this.columnMapping[csvHeader];
                mappedRow[dbColumn] = row[csvHeader];
            }
            return mappedRow;
        });

        await invoke('upload_csv_to_db', { data: mappedData });
    }
};
