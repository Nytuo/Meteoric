import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FilterOverlayComponent } from './filter-overlay.component';

describe('FilterOverlayComponent', () => {
  let component: FilterOverlayComponent;
  let fixture: ComponentFixture<FilterOverlayComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FilterOverlayComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(FilterOverlayComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
