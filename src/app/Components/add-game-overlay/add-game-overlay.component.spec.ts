import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddGameOverlayComponent } from './add-game-overlay.component';

describe('AddGameOverlaComponent', () => {
	let component: AddGameOverlayComponent;
	let fixture: ComponentFixture<AddGameOverlayComponent>;

	beforeEach(async () => {
		await TestBed.configureTestingModule({
			imports: [AddGameOverlayComponent],
		})
			.compileComponents();

		fixture = TestBed.createComponent(AddGameOverlayComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	it('should create', () => {
		expect(component).toBeTruthy();
	});
});
