import {ComponentFixture, TestBed} from '@angular/core/testing';

import {IGDBComponent} from './igdb.component';

describe('IGDBComponent', () => {
    let component: IGDBComponent;
    let fixture: ComponentFixture<IGDBComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [IGDBComponent]
        })
            .compileComponents();

        fixture = TestBed.createComponent(IGDBComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
