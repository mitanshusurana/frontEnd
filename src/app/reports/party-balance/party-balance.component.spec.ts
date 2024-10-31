import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PartyBalanceComponent } from './party-balance.component';

describe('PartyBalanceComponent', () => {
  let component: PartyBalanceComponent;
  let fixture: ComponentFixture<PartyBalanceComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PartyBalanceComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PartyBalanceComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
