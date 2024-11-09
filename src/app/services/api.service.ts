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
    return from(this.indexedDBService.getTransactions()).pipe(
      switchMap((offlineTransactions: Transaction[]) => {
        if (offlineTransactions.length === 0) {
          return of(null);
        }

        const syncRequests = offlineTransactions.map(transaction =>
          this.http.post(`${this.apiUrl}/api/transactions`, transaction).pipe(
            catchError(error => {
              console.error('Error syncing transaction:', error);
              return throwError(error);
            })
          )
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

  getLedgerNames(): Observable<string[]> {
    return this.handleRequest<string[]>('api/Ledgers');
  }

  getTransactions(date?: string): Observable<Transaction[]> {
    let params = new HttpParams();
    if (date) {
      params = params.append('date', date);
    }
    return this.handleRequest<Transaction[]>('api/transactions', params);
  }

  getTransactionsByName(name?: string): Observable<Transaction[]> {
    let params = new HttpParams();
    if (name) {
      params = params.append('name', name);
    }
    return this.handleRequest<Transaction[]>('api/transactions/name', params);
  }

  createTransaction(transaction: Transaction): Observable<Transaction> {
    if (navigator.onLine) {
      return this.http.post<Transaction>(`${this.apiUrl}/api/transactions`, transaction).pipe(
        catchError(this.handleError)
      );
    } else {
      return this.saveOfflineData('pendingTransactions', transaction);
    }
  }

  deleteTransaction(id: string): Observable<any> {
    if (navigator.onLine) {
      let params = new HttpParams().append('id', id);
      return this.http.delete(`${this.apiUrl}/api/transactions`, { params }).pipe(
        catchError(this.handleError)
      );
    } else {
      return throwError('Cannot delete transactions while offline');
    }
  }

  createLedger(newLedger: CreateCustomer): Observable<any> {
    if (navigator.onLine) {
      return this.http.post(`${this.apiUrl}/api/Ledgers`, newLedger).pipe(
        catchError(this.handleError)
      );
    } else {
      return this.saveOfflineData('pendingLedgers', newLedger);
    }
  }

  getBalances(): Observable<any> {
    return this.handleRequest<any>('api/transactions/balances');
  }

  private saveOfflineData<T>(storeName: string, data: T): Observable<T> {
    return new Observable(observer => {
      this.indexedDBService.addData(storeName, data)
        .then(() => {
          observer.next(data);
          observer.complete();
        })
        .catch(error => observer.error(error));
    });
  }

  private handleRequest<T>(endpoint: string, params?: HttpParams): Observable<T> {
    if (navigator.onLine) {
      return this.http.get<T>(`${this.apiUrl}/${endpoint}`, { params }).pipe(
        tap(response => this.indexedDBService.addData(endpoint, response)),
        catchError(this.handleError)
      );
    } else {
      return this.getFromIndexedDB<T>(endpoint);
    }
  }

  private getFromIndexedDB<T>(storeName: string): Observable<T> {
    return new Observable(observer => {
      this.indexedDBService.getData(storeName)
        .then(data => {
          observer.next(data as T);
          observer.complete();
        })
        .catch(error => observer.error(error));
    });
  }

  private handleError(error: HttpErrorResponse) {
    let errorMessage = 'An error occurred';
    if (error.error instanceof ErrorEvent) {
      errorMessage = `Error: ${error.error.message}`;
    } else {
      errorMessage = `Error Code: ${error.status}\nMessage: ${error.message}`;
    }
    console.error(errorMessage);
    return throwError(errorMessage);
  }
}
