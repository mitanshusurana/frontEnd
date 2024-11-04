import { Component, OnInit } from '@angular/core';
import { NotificationService } from './services/notification.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
  isOnline: boolean = navigator.onLine;

  constructor(private notificationService: NotificationService) {}

  ngOnInit() {
    this.setupNetworkListeners();
  }

  private setupNetworkListeners() {
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.notificationService.showNotification('You are back online!', 'success');
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
      this.notificationService.showNotification('You are offline. Changes will be synced when you\'re back online.', 'info');
    });
  }
}
