import {ComponentFixture, TestBed} from '@angular/core/testing';

import {EpicImporterComponent} from './epic-importer.component';

describe('IGDBComponent', () => {
    let component: EpicImporterComponent;
    let fixture: ComponentFixture<EpicImporterComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [EpicImporterComponent]
        })
            .compileComponents();

        fixture = TestBed.createComponent(EpicImporterComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
