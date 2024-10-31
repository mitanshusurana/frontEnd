import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { RouterModule } from '@angular/router';
import { FormsModule, NgSelectOption, ReactiveFormsModule } from '@angular/forms';

import { AppComponent } from './app.component';
import { AuthGuard } from './auth.guard';
import { AuthService } from './auth.service';
import { LoginComponent } from './login/login.component';
import { NavigationComponent } from './navigation/navigation.component';

// Import standalone components directly
import { MainLedgerComponent } from './masters/main-ledger/main-ledger.component';
import { SubLedgerComponent } from './masters/sub-ledger/sub-ledger.component';
import { ProductNameComponent } from './masters/product-name/product-name.component';
import { OpeningBalanceComponent } from './masters/opening-balance/opening-balance.component';
import { DaybookComponent } from './reports/daybook/daybook.component';
import { LedgerComponent } from './reports/ledger/ledger.component';
import { PartyBalanceComponent } from './reports/party-balance/party-balance.component';
import { StockComponent } from './reports/stock/stock.component';
import { BookingCancellationComponent } from './transaction/booking-cancellation/booking-cancellation.component';
import { JournalComponent } from './transaction/journal/journal.component';
import { ReceiptDeliveryComponent } from './transaction/receipt-delivery/receipt-delivery.component';
import { SalePurchaseComponent } from './transaction/sale-purchase/sale-purchase.component';
import { StockValuationComponent } from './transaction/stock-valuation/stock-valuation.component';
import { UtilityComponent } from './utility/utility.component';
import { routes } from './app.routes';
import { MatTableModule } from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';

@NgModule({
  declarations: [
    
    // No need to declare standalone components here
  ],
  imports: [
    AppComponent,
    BrowserModule,
    ReactiveFormsModule,
    FormsModule,
    MatTableModule,
    MatIconModule,
    RouterModule.forRoot(routes)]})
export class AppModule { }
