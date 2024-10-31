import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SubLedgerComponent } from './sub-ledger.component';

describe('SubLedgerComponent', () => {
  let component: SubLedgerComponent;
  let fixture: ComponentFixture<SubLedgerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SubLedgerComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SubLedgerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
