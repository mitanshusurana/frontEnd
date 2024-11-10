import { Component, OnInit } from '@angular/core';
import { ApiService } from './services/api.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
  isOnline: boolean = navigator.onLine;

  constructor(private apiService: ApiService) {}

  ngOnInit() {
    this.setupNetworkListeners();
  }

  private setupNetworkListeners() {
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.syncOfflineData();
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
    });
  }

  private syncOfflineData() {
    this.apiService['syncOfflineData']().subscribe({
      next: (result: any) => console.log('Sync result:', result),
      error: (error: any) => console.error('Sync error:', error)
    });
  }
}
