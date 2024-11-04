import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, from, of } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
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
    };
  }

  // Generic method to handle API requests with offline support
  private handleRequest<T>(endpoint: string, method: string, data?: any): Observable<T> {
    if (navigator.onLine) {
      return this.http.request<T>(method, `${this.apiUrl}/${endpoint}`, { body: data }).pipe(
        tap(response => this.saveToIndexedDB(endpoint, response)),
        catchError(error => {
          console.error('API error:', error);
          return this.getFromIndexedDB<T>(endpoint);
        })
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
    store.put(data);
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

  // Existing methods with offline support
  getTransactions(): Observable<any[]> {
    return this.handleRequest<any[]>('transactions', 'GET');
  }

  createTransaction(transaction: any): Observable<any> {
    return this.handleRequest<any>('transactions', 'POST', transaction);
  }

  createCustomer(customer: any): Observable<any> {
    return this.handleRequest<any>('customers', 'POST', customer);
  }

  getBalances(): Observable<any[]> {
    return this.handleRequest<any[]>('balances', 'GET');
  }

  // Add any other existing methods here, following the same pattern

  // Method to sync offline data
  syncOfflineData(): Observable<any> {
    if (!navigator.onLine) {
      return of({ message: 'Device is offline. Will sync when online.' });
    }

    return new Observable(observer => {
      if (!this.db) {
        observer.error('IndexedDB not initialized');
        return;
      }

      const syncStore = (storeName: string) => {
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
              this.http.post(`${this.apiUrl}/${storeName}`, data).toPromise()
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
        syncStore('transactions'),
        syncStore('customers'),
        syncStore('balances')
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
}
