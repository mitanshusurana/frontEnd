import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class LedgerCacheService {
  private apiUrl = 'https://your-api-url.com/ledgers'; // Replace with your actual API URL
  private cacheKey = 'cachedLedgers';

  constructor(private http: HttpClient) {}

  getLedgers(): Observable<any[]> {
    const cachedData = localStorage.getItem(this.cacheKey);
    if (cachedData) {
      return of(JSON.parse(cachedData));
    } else {
      return this.fetchAndCacheLedgers();
    }
  }

  private fetchAndCacheLedgers(): Observable<any[]> {
    return this.http.get<any[]>(this.apiUrl).pipe(
      tap(ledgers => {
        localStorage.setItem(this.cacheKey, JSON.stringify(ledgers));
      }),
      catchError(error => {
        console.error('Error fetching ledgers:', error);
        return of([]);
      })
    );
  }

  addLedger(ledger: any): Observable<any> {
    return this.http.post(this.apiUrl, ledger).pipe(
      tap(() => {
        // Update the cache after successfully adding a new ledger
        this.fetchAndCacheLedgers().subscribe();
      })
    );
  }

  clearCache(): void {
    localStorage.removeItem(this.cacheKey);
  }
}
