import { ChangeDetectionStrategy, Component, type OnInit } from '@angular/core';
import { GenericService } from '../../services/generic.service';

@Component({
	selector: 'app-blocking-overlay',
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
