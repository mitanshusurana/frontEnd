import { Injectable } from '@angular/core';
import { TransactionService } from './transaction.service';

@Injectable({
  providedIn: 'root'
})
export class BackgroundSyncService {
  constructor(private transactionService: TransactionService) {
    this.setupNetworkStatusListener();
  }

  private setupNetworkStatusListener(): void {
    window.addEventListener('online', () => {
      console.log('App is online. Starting sync...');
      this.syncOfflineData();
    });
  }

  private syncOfflineData(): void {
    this.transactionService.syncOfflineTransactions().subscribe({
      next: (result) => console.log('Sync result:', result),
      error: (error) => console.error('Sync error:', error)
    });
  }

  // This method can be called manually if needed
  public triggerSync(): void {
    if (navigator.onLine) {
      this.syncOfflineData();
    } else {
      console.log('App is offline. Sync will be triggered when online.');
    }
  }
}
