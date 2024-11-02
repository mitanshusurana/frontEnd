
import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

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

  constructor(private http: HttpClient) { }

  getLedgerNames(): Observable<string[]> {
    return this.http.get<string[]>(`${this.apiUrl}/api/Ledgers`);
  }

  getTransactions(date?: string): Observable<Transaction[]> {
    let params = new HttpParams();
    if (date) {
      params = params.append('date', date);
    }
    return this.http.get<Transaction[]>(`${this.apiUrl}/api/transactions`, { params });
  }

  createTransaction(transaction: Transaction): Observable<any> {
    return this.http.post(`${this.apiUrl}/api/transactions`, transaction);
  }

  deleteTransaction(id: string): Observable<any> {
    let params = new HttpParams().append('id', id);
    return this.http.delete(`${this.apiUrl}/api/transactions`, { params });
  }

  createLedger(newLedger: CreateCustomer): Observable<any> {
    return this.http.post(`${this.apiUrl}/api/Ledgers`, newLedger);
  }
}
