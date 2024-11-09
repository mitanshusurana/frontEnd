import { Injectable } from '@angular/core';
import { HttpClient, HttpParams, HttpErrorResponse } from '@angular/common/http';
import { Observable, from, of, throwError } from 'rxjs';
import { catchError, tap, map, switchMap } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { IndexedDBService } from './indexeddb.service';

export interface Transaction {
  id?: string;
  date: string;
  transaction: string;
  ledgerName: string;
  stockName?: string;
  netWeight?: number;
  touch?: number;
  rate?: number;
  pure?: number;
  cash?: number;
  amount?: number;
  comments?: string;
}

export interface CreateCustomer {
  customerName: string;
  openingCashBalance: number;
  openingMetalBalance: number;
}

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient, private indexedDBService: IndexedDBService) {}

  syncOfflineTransactions(): Observable<any> {
    return from(this.indexedDBService.getItems('pendingTransactions')).pipe(
      switchMap((offlineTransactions: any[]) => {
        if (offlineTransactions.length === 0) {
          return of(null);
        }

        const syncRequests = offlineTransactions.map(transaction =>
          this.http.post(`${this.apiUrl}/transactions`, transaction)
        );

        return new Observable(observer => {
          Promise.all(syncRequests)
            .then(() => this.indexedDBService.clearStore('pendingTransactions'))
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

  private handleRequest<T>(endpoint: string, params?: HttpParams): Observable<T> {
    console.log(`Handling request for endpoint: ${endpoint}`);
    if (navigator.onLine) {
      return this.http.get<T>(`${this.apiUrl}/${endpoint}`, { params }).pipe(
        tap(response => {
          console.log(`Saving response to IndexedDB store: ${endpoint}`);
          this.saveToIndexedDB(endpoint, response);
        }),
        catchError(this.handleError)
      );
    } else {
      console.log(`Fetching data from IndexedDB store: ${endpoint}`);
      return from(this.indexedDBService.getItems(endpoint));
    }
  }

  private saveToIndexedDB(storeName: string, data: any): void {
    console.log(`Saving data to IndexedDB store: ${storeName}`);
    if (Array.isArray(data)) {
      data.forEach(item => this.indexedDBService.addItem(storeName, item));
    } else {
      this.indexedDBService.addItem(storeName, data);
    }
  }

  private handleError(error: HttpErrorResponse) {
    console.error('An error occurred:', error);
    return throwError(() => new Error('Something bad happened; please try again later.'));
  }

  getLedgerNames(): Observable<string[]> {
    return this.handleRequest<string[]>('ledgerNames');
  }

  getTransactions(): Observable<Transaction[]> {
    return this.handleRequest<Transaction[]>('transactions');
  }

  createTransaction(transaction: Transaction): Observable<Transaction> {
    if (navigator.onLine) {
      return this.http.post<Transaction>(`${this.apiUrl}/transactions`, transaction).pipe(
        tap(newTransaction => this.saveToIndexedDB('transactions', newTransaction)),
        catchError(this.handleError)
      );
    } else {
      return from(this.indexedDBService.addItem('pendingTransactions', transaction)).pipe(
        map(() => transaction)
      );
    }
  }

  createCustomer(customer: CreateCustomer): Observable<CreateCustomer> {
    if (navigator.onLine) {
      return this.http.post<CreateCustomer>(`${this.apiUrl}/customers`, customer).pipe(
        catchError(this.handleError)
      );
    } else {
      return from(this.indexedDBService.addItem('pendingLedgers', customer)).pipe(
        map(() => customer)
      );
    }
  }
}
