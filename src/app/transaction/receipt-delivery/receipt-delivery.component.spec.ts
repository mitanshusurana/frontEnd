import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ReceiptDeliveryComponent } from './receipt-delivery.component';

describe('ReceiptDeliveryComponent', () => {
  let component: ReceiptDeliveryComponent;
  let fixture: ComponentFixture<ReceiptDeliveryComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ReceiptDeliveryComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ReceiptDeliveryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
