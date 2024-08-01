import { Component, EventEmitter, Input, Output } from '@angular/core';
import { ButtonModule } from "primeng/button";
import { ListboxModule } from "primeng/listbox";
import { NgIf } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { FloatLabelModule } from 'primeng/floatlabel';
import { invoke } from '@tauri-apps/api/tauri';
import { StepperModule } from 'primeng/stepper';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ConfirmationService, MessageService } from 'primeng/api';
import { InputTextModule } from 'primeng/inputtext';

@Component({
    selector: 'app-epic-importer',
    standalone: true,
    imports: [
        ButtonModule,
        ListboxModule,
        NgIf,
        FormsModule,
        FloatLabelModule, StepperModule, ConfirmDialogModule,
        InputTextModule
    ],
    templateUrl: './epic-importer.component.html',
    styleUrl: './epic-importer.component.css',
    providers: [ConfirmationService]
})
export class EpicImporterComponent {
    openLinkInBrowser(link: string) {
        window.open(link, '_blank');
    }

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
    constructor(private confirmationService: ConfirmationService) { }

    confirm() {
        this.confirmationService.confirm({
            header: 'Readme',
            message: 'You will be redirected to the Epic Games website to get an authentication code. This code will be used to sync your library. You will have to copy/paste the AuthCode for the next step. Do you want to continue?',
            acceptIcon: 'pi pi-check mr-2',
            rejectIcon: 'pi pi-times mr-2',
            rejectButtonStyleClass: 'p-button-sm',
            acceptButtonStyleClass: 'p-button-outlined p-button-sm',
            accept: () => {
                this.openLinkInBrowser(
                    'https://www.epicgames.com/id/login?redirectUrl=https%3A//www.epicgames.com/id/api/redirect%3FclientId%3D34a02cf8f4414e29b15921876da36f9a%26responseType%3Dcode'
                );
            },
            reject: () => {
            }
        });
    }

}
