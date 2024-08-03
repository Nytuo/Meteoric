import {CommonModule} from '@angular/common';
import {ChangeDetectionStrategy, Component, type OnInit} from '@angular/core';
import {ProgressBarModule} from 'primeng/progressbar';
import {GenericService} from '../../services/generic.service';

@Component({
    selector: 'app-blocking-overlay',
    standalone: true,
    imports: [
        CommonModule, ProgressBarModule
    ],
    templateUrl: './blocking-overlay.component.html',
    styleUrl: './blocking-overlay.component.css',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BlockingOverlayComponent implements OnInit {
    loading: boolean = false;

    constructor(private genericService: GenericService) {
    }

    ngOnInit(): void {
        this.genericService.getBlockUI().subscribe((loading: boolean) => {
            this.loading = loading;
        });
    }

}
