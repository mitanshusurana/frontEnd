import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MainLedgerComponent } from './main-ledger.component';

describe('MainLedgerComponent', () => {
  let component: MainLedgerComponent;
  let fixture: ComponentFixture<MainLedgerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MainLedgerComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MainLedgerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
