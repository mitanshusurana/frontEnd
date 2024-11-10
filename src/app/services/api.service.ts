
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
  [x: string]: any;
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient, private indexedDBService: IndexedDBService) {
    this.checkOnlineStatus();
  }

  private checkOnlineStatus(): void {
    window.addEventListener('online', () => this.syncOfflineTransactions().subscribe());
  }

  syncOfflineTransactions(): Observable<any> {
    return from(this.indexedDBService.getPendingTransactions()).pipe(
      switchMap((pendingTransactions: Transaction[]) => {
        if (pendingTransactions.length === 0) {
          return of(null);
        }

        const syncRequests = pendingTransactions.map(transaction =>
          this.http.post(`${this.apiUrl}/transactions`, transaction).pipe(
            catchError(error => {
              console.error('Error syncing transaction:', error);
              return throwError(error);
            }),
            tap(() => this.indexedDBService.removePendingTransaction(transaction.id))
          )
        );

        return new Observable(observer => {
          Promise.all(syncRequests)
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
    return this.handleRequest<string[]>('Ledgers');
  }

  getTransactions(date?: string): Observable<Transaction[]> {
    let params = new HttpParams();
    if (date) {
      params = params.append('date', date);
    }
    return this.handleRequest<Transaction[]>('transactions',false, params);
  }

  getTransactionsByName(name?: string): Observable<Transaction[]> {
    let params = new HttpParams();
    if (name) {
      params = params.append('name', name);
    }
    return this.handleRequest<Transaction[]>('transactions/name',false, params);
  }

  createTransaction(transaction: Transaction): Observable<Transaction> {
    if (navigator.onLine) {
      return this.http.post<Transaction>(`${this.apiUrl}/transactions`, transaction).pipe(
        catchError(this.handleError)
      );
    } else {
      return from(this.indexedDBService.addData('pendingTransactions', transaction)).pipe(
        map(() => transaction),
        catchError(error => {
          console.error('Error saving offline transaction:', error);
          return throwError('Failed to save transaction offline');
        })
      );
    }
  }

  deleteTransaction(id: string): Observable<any> {
    if (navigator.onLine) {
      let params = new HttpParams().append('id', id);
      return this.http.delete(`${this.apiUrl}/transactions`, { params }).pipe(
        catchError(this.handleError)
      );
    } else {
      return throwError('Cannot delete transactions while offline');
    }
  }

  createLedger(newLedger: CreateCustomer): Observable<any> {
    if (navigator.onLine) {
      return this.http.post(`${this.apiUrl}/Ledgers`, newLedger).pipe(
        catchError(this.handleError)
      );
    } else {
      return from(this.indexedDBService.addData('pendingLedgers', newLedger)).pipe(
        map(() => newLedger),
        catchError(error => {
          console.error('Error saving offline ledger:', error);
          return throwError('Failed to save ledger offline');
        })
      );
    }
  }

  getBalances(): Observable<any> {
    return this.handleRequest<any>('transactions/balances');
  }

  private handleRequest<T>(endpoint: string,  shouldSaveToDB: boolean = true,params?: HttpParams,): Observable<T> {
    if (navigator.onLine) {
      return this.http.get<T>(`${this.apiUrl}/${endpoint}`, { params }).pipe(
        tap(response => {
          if (shouldSaveToDB) {
 this.indexedDBService.addData(endpoint, response);
          }
        }),
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