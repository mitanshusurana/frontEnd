import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, from, of, throwError } from 'rxjs';
import { catchError, tap, retry } from 'rxjs/operators';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private apiUrl = environment.apiUrl;
  private dbName = 'OfflineStore';
  private db: IDBDatabase | null = null;

  constructor(private http: HttpClient) {
    this.initIndexedDB();
  }

  private initIndexedDB(): void {
    const request = indexedDB.open(this.dbName, 1);

    request.onerror = (event) => {
      console.error('IndexedDB error:', event);
    };

    request.onsuccess = (event) => {
      this.db = (event.target as IDBOpenDBRequest).result;
    };

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      db.createObjectStore('transactions', { keyPath: 'id', autoIncrement: true });
      db.createObjectStore('customers', { keyPath: 'id', autoIncrement: true });
      db.createObjectStore('balances', { keyPath: 'id' });
      db.createObjectStore('pendingTransactions', { keyPath: 'id', autoIncrement: true });
      db.createObjectStore('pendingCustomers', { keyPath: 'id', autoIncrement: true });
    };
  }

  private handleRequest<T>(endpoint: string, method: string, data?: any): Observable<T> {
    if (navigator.onLine) {
      return this.http.request<T>(method, `${this.apiUrl}/${endpoint}`, { body: data }).pipe(
        retry(3),
        tap(response => {
          if (method === 'GET') {
            this.saveToIndexedDB(endpoint, response);
          }
        }),
        catchError(this.handleError)
      );
    } else {
      if (method === 'GET') {
        return this.getFromIndexedDB<T>(endpoint);
      } else if (method === 'POST') {
        return this.saveOfflineData(endpoint, data);
      } else {
        return throwError('Operation not supported offline');
      }
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

  private saveOfflineData<T>(endpoint: string, data: any): Observable<T> {
    const storeName = endpoint === 'transactions' ? 'pendingTransactions' : 'pendingCustomers';
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
        observer.next({ id: request.result, ...data } as T);
        observer.complete();
      };
    });
  }

  getTransactions(): Observable<any[]> {
    return this.handleRequest<any[]>('transactions', 'GET');
  }

  createTransaction(transaction: any): Observable<any> {
    // TODO: Adapt the transaction data structure as needed before sending to the server
    return this.handleRequest<any>('transactions', 'POST', transaction);
  }

  createCustomer(customer: any): Observable<any> {
    // TODO: Adapt the customer data structure as needed before sending to the server
    return this.handleRequest<any>('customers', 'POST', customer);
  }

  getBalances(): Observable<any[]> {
    return this.handleRequest<any[]>('balances', 'GET');
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
              this.http.post(`${this.apiUrl}/${apiEndpoint}`, data)
                .pipe(
                  retry(3),
                  catchError(this.handleError)
                )
                .toPromise()
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
        syncStore('pendingTransactions', 'transactions'),
        syncStore('pendingCustomers', 'customers')
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
      // Client-side error
      errorMessage = `Error: ${error.error.message}`;
    } else {
      // Server-side error
      errorMessage = `Error Code: ${error.status}\nMessage: ${error.message}`;
    }
    console.error(errorMessage);
    // TODO: Implement user notification here (e.g., using a toast service)
    return throwError(errorMessage);
  }
}
