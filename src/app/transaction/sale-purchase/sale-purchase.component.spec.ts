import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SalePurchaseComponent } from './sale-purchase.component';

describe('SalePurchaseComponent', () => {
  let component: SalePurchaseComponent;
  let fixture: ComponentFixture<SalePurchaseComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SalePurchaseComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SalePurchaseComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
