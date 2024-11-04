import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, from, of } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private apiUrl = 'https://your-api-url.com/api'; // Replace with your actual API URL
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
      db.createObjectStore('ledgers', { keyPath: 'id' });
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

  // Save data to IndexedDB
  private saveToIndexedDB(storeName: string, data: any): void {
    if (!this.db) {
      console.error('IndexedDB not initialized');
      return;
    }

    const transaction = this.db.transaction([storeName], 'readwrite');
    const store = transaction.objectStore(storeName);
    store.put(data);
  }

  // Get data from IndexedDB
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

      const transaction = this.db.transaction(['transactions'], 'readwrite');
      const store = transaction.objectStore('transactions');
      const request = store.getAll();

      request.onerror = () => observer.error(request.error);
      request.onsuccess = () => {
        const offlineData = request.result;
        if (offlineData.length === 0) {
          observer.next({ message: 'No offline data to sync.' });
          observer.complete();
          return;
        }

        // Implement your sync logic here
        // For example, you might want to send each transaction to the server
        const syncPromises = offlineData.map((data: any) =>
          this.http.post(`${this.apiUrl}/transactions`, data).toPromise()
        );

        Promise.all(syncPromises)
          .then(() => {
            // Clear synced data from IndexedDB
            store.clear();
            observer.next({ message: 'Offline data synced successfully.' });
            observer.complete();
          })
          .catch(error => {
            observer.error('Error syncing offline data: ' + error);
          });
      };
    });
  }

  // Example methods for transactions and ledgers
  getTransactions(): Observable<any[]> {
    return this.handleRequest<any[]>('transactions', 'GET');
  }

  addTransaction(transaction: any): Observable<any> {
    return this.handleRequest<any>('transactions', 'POST', transaction);
  }

  getLedgers(): Observable<any[]> {
    return this.handleRequest<any[]>('ledgers', 'GET');
  }

  addLedger(ledger: any): Observable<any> {
    return this.handleRequest<any>('ledgers', 'POST', ledger);
  }
}
