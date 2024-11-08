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
  syncOfflineTransactions(): Observable<any> {
    return from(this.indexedDBService.getTransactions()).pipe(
      switchMap((offlineTransactions: any[]) => {
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
  private apiUrl = environment.apiUrl;
  private dbName = 'OfflineStore';
  private db: IDBDatabase | null = null;

  constructor(private http: HttpClient, private indexedDBService: IndexedDBService) {

    this.initIndexedDB();
    
  }

  private initIndexedDB(): void {
    const request = indexedDB.open(this.dbName);

    request.onerror = (event) => {
      console.error('IndexedDB error:', event);
    };

    request.onsuccess = (event) => {
      this.db = (event.target as IDBOpenDBRequest).result;
    };

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      db.createObjectStore('ledgerNames', { keyPath: 'id', autoIncrement: true });
      db.createObjectStore('transactions', { keyPath: 'id' });
      db.createObjectStore('pendingTransactions', { keyPath: 'id', autoIncrement: true });
      db.createObjectStore('pendingLedgers', { keyPath: 'id', autoIncrement: true });
    };
  }

  private handleRequest<T>(endpoint: string, params?: HttpParams): Observable<T> {
    if (navigator.onLine) {
      return this.http.get<T>(`${this.apiUrl}/${endpoint}`, { params }).pipe(
        tap(response => this.saveToIndexedDB(endpoint, response)),
        catchError(this.handleError)
      );
    } else {
      return this.getFromIndexedDB<T>(endpoint);
    }
  }

  private saveToIndexedDB(storeName: string, data: any): void {
    if (!this.db) {
      console.error('IndexedDB not initialized');
      return;
    }

    const transaction = this.db.transaction([storeName], 'readwrite');
    const store = transaction.objectStore(storeName);
    
    if (Array.isArray(data)) {
      data.forEach(item => store.put(item));
    } else {
      store.put(data);
    }
  }

  private getFromIndexedDB<T>(storeName: string): Observable<T> {
    return new Observable(observer => {
      if (!this.db) {
        observer.error('IndexedDB not initialized');
        return;
      }

      const transaction = this.db.transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.getAll();

      request.onerror = () => observer.error(request.error);
      request.onsuccess = () => {
        observer.next(request.result as T);
        observer.complete();
      };
    });
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
      if (!this.db) {
        observer.error('IndexedDB not initialized');
        return;
      }

      const transaction = this.db.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.add(data);

      request.onerror = () => observer.error(request.error);
      request.onsuccess = () => {
        observer.next({ ...data, id: request.result } as T);
        observer.complete();
      };
    });
  }

  syncOfflineData(): Observable<any> {
    if (!navigator.onLine) {
      return throwError('Device is offline. Will sync when online.');
    }

    return new Observable(observer => {
      if (!this.db) {
        observer.error('IndexedDB not initialized');
        return;
      }

      const syncStore = (storeName: string, apiEndpoint: string) => {
        return new Promise((resolve, reject) => {
          const transaction = this.db!.transaction([storeName], 'readwrite');
          const store = transaction.objectStore(storeName);
          const request = store.getAll();

          request.onerror = () => reject(request.error);
          request.onsuccess = () => {
            const offlineData = request.result;
            if (offlineData.length === 0) {
              resolve({ message: `No offline data to sync for ${storeName}.` });
              return;
            }

            const syncPromises = offlineData.map((data: any) =>
              this.http.post(`${this.apiUrl}/${apiEndpoint}`, data).toPromise()
            );

            Promise.all(syncPromises)
              .then(() => {
                store.clear();
                resolve({ message: `${storeName} synced successfully.` });
              })
              .catch(error => {
                reject(`Error syncing ${storeName}: ${error}`);
              });
          };
        });
      };

      Promise.all([
        syncStore('pendingTransactions', 'api/transactions'),
        syncStore('pendingLedgers', 'api/Ledgers')
      ])
        .then(results => {
          observer.next(results);
          observer.complete();
        })
        .catch(error => {
          observer.error(error);
        });
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
