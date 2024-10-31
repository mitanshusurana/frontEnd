import { Component, HostBinding } from '@angular/core';
import { Router } from '@angular/router';
import { RouterOutlet } from '@angular/router';
import { SalePurchaseComponent } from '../transaction/sale-purchase/sale-purchase.component';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-navigation',
  templateUrl: './navigation.component.html',
  styleUrls: ['./navigation.component.scss'],
  standalone: true,
  imports: [RouterOutlet, SalePurchaseComponent,CommonModule],
})
export class NavigationComponent {
  @HostBinding('class.active') isOpen = false;

  // Track the currently open dropdown
  openDropdown: string | null = null;

  constructor(private router: Router) {}

  // Show dropdown on mouse enter
  showDropdown(dropdown: string) {
    this.openDropdown = dropdown;
  }

  // Hide dropdown on mouse leave
  hideDropdown() {
    this.openDropdown = null;
  }

  // Navigate to the specified route
  navigateTo(route: string) {
    this.router.navigate([route]);
    this.openDropdown = null; // Close dropdown after navigation
  }

  // Check if a dropdown is open
  isDropdownOpen(dropdown: string): boolean {
    return this.openDropdown === dropdown;
  }
}