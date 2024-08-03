import {Component, type OnInit, ViewChild} from '@angular/core';
import {ProgressBarModule} from 'primeng/progressbar';
import {ToastModule} from 'primeng/toast';
import {TauriService} from '../../services/tauri.service';

@Component({
    selector: 'app-loading-bar',
    standalone: true,
    imports: [
        ProgressBarModule,
        ToastModule,
    ],
    templateUrl: './loading-bar.component.html',
    styleUrl: './loading-bar.component.css',
})
export class LoadingBarComponent implements OnInit {

    total: number = 0;
    value: number = 0;
    value_text: string = "Importing games";
    normal_value = 0;
    hide: boolean = true;
    @ViewChild('progressBar', {static: true}) progressBar!: ProgressBarModule;

    constructor(private tauri: TauriService) {
    }

    ngOnInit(): void {
        this.tauri.getMessagesForLoadingBar().subscribe((message: string) => {
            this.hide = true;
            if (message.startsWith('ROUTINE_IGDB_TOTAL')) {
                if (message === 'ROUTINE_IGDB_TOTAL: -1') {
                    this.value_text = 'Nothing to import';
                    this.value = 100;
                    setTimeout(() => {
                        this.hide = false;
                    }, 2000);
                }
                this.total = parseInt(message.split('ROUTINE_IGDB_TOTAL: ')[1]);
            } else if (message.startsWith('ROUTINE_IGDB_NAME')) {
                this.value_text = message.split('ROUTINE_IGDB_NAME: ')[1];
            } else {
                const value = parseInt(message.split('ROUTINE_IGDB_STATUS: ')[1]);
                this.normal_value = (value + 1);
                this.value = ((value + 1) / this.total) * 100;
            }
        });
    }

}
