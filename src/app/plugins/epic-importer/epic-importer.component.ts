import { Component, EventEmitter, Input, Output } from '@angular/core';
import { ButtonModule } from "primeng/button";
import { ListboxModule } from "primeng/listbox";
import { NgIf } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { FloatLabelModule } from 'primeng/floatlabel';
import { invoke } from '@tauri-apps/api/tauri';

@Component({
    selector: 'app-epic-importer',
    standalone: true,
    imports: [
        ButtonModule,
        ListboxModule,
        NgIf,
        FormsModule,
        FloatLabelModule
    ],
    templateUrl: './epic-importer.component.html',
    styleUrl: './epic-importer.component.css'
})
export class EpicImporterComponent {

    @Input() message: string = '';
    @Input() searchedGames: any[] = [];
    @Output() selectItem: EventEmitter<any> = new EventEmitter<any>();
    @Output() back: EventEmitter<void> = new EventEmitter<void>();
    @Input() selectedItem: any = null;
    @Output() selectedItemChange: EventEmitter<string> = new EventEmitter<string>();
    authCode: any;

    async loginAndSync() {
        console.log(this.authCode);
        await invoke('import_library', {
            pluginName: "epic_importer", creds: [this.authCode]
        });
    }

    async syncOnly() {
        console.log(this.authCode);
        await invoke('import_library', {
            pluginName: "epic_importer", creds: ['']
        });
    }
}
