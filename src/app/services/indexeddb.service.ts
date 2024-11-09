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
      if (!db.objectStoreNames.contains('ledgerNames')) {
        db.createObjectStore('ledgerNames', { keyPath: 'id', autoIncrement: true });
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
      const request = Array.isArray(data) ? data.map(item => store.add(item)) : store.add(data);

      txn.oncomplete = () => resolve();
      txn.onerror = () => reject(txn.error);
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
}
