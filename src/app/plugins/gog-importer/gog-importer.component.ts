import {Component, EventEmitter, Input, Output} from '@angular/core';
import {ButtonModule} from "primeng/button";
import {ListboxModule} from "primeng/listbox";
import {NgIf} from "@angular/common";
import {FormsModule} from "@angular/forms";
import {FloatLabelModule} from 'primeng/floatlabel';
import {invoke} from '@tauri-apps/api/tauri';
import {ConfirmationService} from 'primeng/api';
import {StepperModule} from 'primeng/stepper';
import {ConfirmDialogModule} from 'primeng/confirmdialog';
import {InputTextModule} from 'primeng/inputtext';

@Component({
    selector: 'app-gog-importer',
    standalone: true,
    imports: [
        ButtonModule,
        ListboxModule,
        NgIf,
        FormsModule,
        InputTextModule,
        FloatLabelModule, StepperModule, ConfirmDialogModule,
    ],
    templateUrl: './gog-importer.component.html',
    styleUrl: './gog-importer.component.css',
    providers: [ConfirmationService]
})
export class GogImporterComponent {

    @Input() message: string = '';
    @Input() searchedGames: any[] = [];
    @Output() selectItem: EventEmitter<any> = new EventEmitter<any>();
    @Output() back: EventEmitter<void> = new EventEmitter<void>();
    @Input() selectedItem: any = null;
    @Output() selectedItemChange: EventEmitter<string> = new EventEmitter<string>();
    authCode: any;

    constructor(private confirmationService: ConfirmationService) {
    }

    async loginAndSync() {
        console.log(this.authCode);
        await invoke('import_library', {
            pluginName: "gog_importer", creds: [this.authCode]
        });
    }

    async syncOnly() {
        console.log(this.authCode);
        await invoke('import_library', {
            pluginName: "gog_importer", creds: ['']
        });
    }

    openLinkInBrowser(link: string) {
        window.open(link, '_blank');
    }

    confirm() {
        this.confirmationService.confirm({
            header: 'Readme',
            message: 'You will be redirected to the GOG website to get an authentication code. This code will be used to sync your library. You will have to copy/paste the AuthCode for the next step. Do you want to continue?',
            acceptIcon: 'pi pi-check mr-2',
            rejectIcon: 'pi pi-times mr-2',
            rejectButtonStyleClass: 'p-button-sm',
            acceptButtonStyleClass: 'p-button-outlined p-button-sm',
            accept: () => {
                this.openLinkInBrowser(
                    'https://login.gog.com/auth?client_id=46899977096215655&layout=galaxy&redirect_uri=https%3A%2F%2Fembed.gog.com%2Fon_login_success%3Forigin%3Dclient&response_type=code'
                );
            },
            reject: () => {
            }
        });
    }
}
