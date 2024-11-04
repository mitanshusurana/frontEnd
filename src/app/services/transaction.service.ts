import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, from, of } from 'rxjs';
import { catchError, switchMap } from 'rxjs/operators';
import { IndexedDBService } from './indexeddb.service';

@Injectable({
  providedIn: 'root'
})
export class TransactionService {
  private apiUrl = 'https://your-api-url.com/transactions'; // Replace with your actual API URL

  constructor(
    private http: HttpClient,
    private indexedDBService: IndexedDBService
  ) {}

  addTransaction(transaction: any): Observable<any> {
    if (navigator.onLine) {
      return this.http.post(this.apiUrl, transaction).pipe(
        catchError((error) => {
          console.error('Error sending transaction to server:', error);
          return from(this.indexedDBService.addTransaction(transaction));
        })
      );
    } else {
      return from(this.indexedDBService.addTransaction(transaction));
    }
  }

  getTransactions(): Observable<any[]> {
    if (navigator.onLine) {
      return this.http.get<any[]>(this.apiUrl).pipe(
        catchError((error) => {
          console.error('Error fetching transactions from server:', error);
          return from(this.indexedDBService.getTransactions());
        })
      );
    } else {
      return from(this.indexedDBService.getTransactions());
    }
  }

  syncOfflineTransactions(): Observable<any> {
    return from(this.indexedDBService.getTransactions()).pipe(
      switchMap((offlineTransactions) => {
        if (offlineTransactions.length === 0) {
          return of(null);
        }

        const syncRequests = offlineTransactions.map(transaction =>
          this.http.post(this.apiUrl, transaction)
        );

        return new Observable(observer => {
          Promise.all(syncRequests)
            .then(() => this.indexedDBService.clearTransactions())
            .then(() => {
              observer.next('All offline transactions synced');
              observer.complete();
            })
            .catch(error => {
              console.error('Error syncing offline transactions:', error);
              observer.error(error);
            });
        });
      })
    );
  }
}
