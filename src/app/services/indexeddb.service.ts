import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class IndexedDBService {
  private dbName = 'OfflineStore';
  private dbVersion = 1;
  private db: IDBDatabase | null = null;

  constructor() {
    this.initDB();
  }

  private initDB(): void {
    console.log('Initializing IndexedDB...');
    const request = indexedDB.open(this.dbName, this.dbVersion);

    request.onerror = (event) => {
      console.error('IndexedDB error:', event);
    };

    request.onsuccess = (event) => {
      this.db = (event.target as IDBOpenDBRequest).result;
      console.log('IndexedDB initialized successfully');
      this.logObjectStores();
    };

    request.onupgradeneeded = (event) => {
      console.log('Upgrading IndexedDB...');
      const db = (event.target as IDBOpenDBRequest).result;
      
      if (!db.objectStoreNames.contains('transactions')) {
        db.createObjectStore('transactions', { keyPath: 'id', autoIncrement: true });
        console.log('Created "transactions" object store');
      }
      if (!db.objectStoreNames.contains('ledgerNames')) {
        db.createObjectStore('ledgerNames', { keyPath: 'id', autoIncrement: true });
        console.log('Created "ledgerNames" object store');
      }
      if (!db.objectStoreNames.contains('pendingTransactions')) {
        db.createObjectStore('pendingTransactions', { keyPath: 'id', autoIncrement: true });
        console.log('Created "pendingTransactions" object store');
      }
      if (!db.objectStoreNames.contains('pendingLedgers')) {
        db.createObjectStore('pendingLedgers', { keyPath: 'id', autoIncrement: true });
        console.log('Created "pendingLedgers" object store');
      }
    };
  }

  private logObjectStores(): void {
    if (this.db) {
      console.log('Object stores in the database:');
      Array.from(this.db.objectStoreNames).forEach(storeName => {
        console.log(`- ${storeName}`);
      });
    }
  }

  addItem(storeName: string, item: any): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject('Database not initialized');
        return;
      }

      const txn = this.db.transaction(storeName, 'readwrite');
      const store = txn.objectStore(storeName);
      const request = store.add(item);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  getItems(storeName: string): Promise<any[]> {
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
