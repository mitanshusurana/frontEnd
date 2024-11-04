import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { HttpClientModule } from '@angular/common/http';

import { AppComponent } from './app.component';
import { IndexedDBService } from './services/indexeddb.service';
import { TransactionService } from './services/transaction.service';
import { BackgroundSyncService } from './services/background-sync.service';
import { LedgerCacheService } from './services/ledger-cache.service';
import { NotificationService } from './services/notification.service';
import { NotificationComponent } from './components/notification/notification.component';

@NgModule({
  declarations: [
    AppComponent,
    NotificationComponent,
    // Add other components here
  ],
  imports: [
    BrowserModule,
    HttpClientModule,
    // Add other modules here
  ],
  providers: [
    IndexedDBService,
    TransactionService,
    BackgroundSyncService,
    LedgerCacheService,
    NotificationService
  ],
  bootstrap: [AppComponent]
})
export class AppModule {
  constructor(private backgroundSyncService: BackgroundSyncService) {}
}
