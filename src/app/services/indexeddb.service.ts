
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class IndexedDBService {
  private dbName = 'OfflineStore';
  private dbVersion = 2;
  private db: IDBDatabase | null = null;

  constructor() {
    this.initDB();
  }

  private initDB(): void {
    const request = indexedDB.open(this.dbName, this.dbVersion);

    request.onerror = (event) => {
      console.error('IndexedDB error:', event);
    };

    request.onsuccess = (event) => {
      this.db = (event.target as IDBOpenDBRequest).result;
    };

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains('transactions')) {
        db.createObjectStore('transactions', { keyPath: 'id', autoIncrement: true });
      }
      if (!db.objectStoreNames.contains('Ledgers')) {
        db.createObjectStore('Ledgers', { keyPath: 'id', autoIncrement: true });
      }
      if (!db.objectStoreNames.contains('pendingTransactions')) {
        db.createObjectStore('pendingTransactions', { keyPath: 'id', autoIncrement: true });
      }
      if (!db.objectStoreNames.contains('pendingLedgers')) {
        db.createObjectStore('pendingLedgers', { keyPath: 'id', autoIncrement: true });
      }
    };
  }

  addData(storeName: string, data: any): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject('Database not initialized');
        return;
      }
  
      const txn = this.db.transaction(storeName, 'readwrite');
      const store = txn.objectStore(storeName);
      
      // Prepare data for insertion
      const requests: IDBRequest<any>[] = [];
      
      if (Array.isArray(data)) {
        data.forEach(item => {
          // Remove the id field if it exists
          const { id, ...itemWithoutId } = item;
          requests.push(store.add(itemWithoutId));
        });
      } else {
        // Remove the id field if it exists
        const { id, ...dataWithoutId } = data;
        requests.push(store.add(dataWithoutId));
      }
  
      // Handle completion and errors
      txn.oncomplete = () => resolve();
      txn.onerror = () => reject(txn.error);
  
      // Handle individual request results
      requests.forEach(request => {
        request.onerror = (event) => {
          console.error('Error adding data to IndexedDB:', event);
        };
      });
    });
  }

  getData(storeName: string): Promise<any> {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject('Database not initialized');
        return;
      }

      const txn = this.db.transaction(storeName, 'readonly');
      const store = txn.objectStore(storeName);
      const request = store.getAll();

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
    });
  }

  clearStore(storeName: string): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject('Database not initialized');
        return;
      }

      const txn = this.db.transaction(storeName, 'readwrite');
      const store = txn.objectStore(storeName);
      const request = store.clear();

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  getPendingTransactions(): Promise<any[]> {
    return this.getData('pendingTransactions');
  }

  removePendingTransaction(id: any): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject('Database not initialized');
        return;
      }

      const txn = this.db.transaction('pendingTransactions', 'readwrite');
      const store = txn.objectStore('pendingTransactions');
      const request = store.delete(id);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

}
