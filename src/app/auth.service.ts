import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  constructor() { 
    // Check if the user is already logged in on initialization
    if (localStorage.getItem('isLoggedIn') === 'true') { 
      this.isAuthenticated = true;
    }
  }
  private isAuthenticated = false;

  login(username: string, password: string): boolean {
    if (username === 'admin' && password === 'admin') {
      this.isAuthenticated = true;
      localStorage.setItem('isLoggedIn', 'true'); // Store login state
      return true;
    }
    return false;
  }

  logout(): void {
    this.isAuthenticated = false;
    localStorage.removeItem('isLoggedIn'); // Clear login state
  }

  isLoggedIn(): boolean {
    console.log('checked the auth function value', this.isAuthenticated)
    return this.isAuthenticated;
  }
}