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
  imports: [RouterOutlet, SalePurchaseComponent, CommonModule],
})
export class NavigationComponent {
  @HostBinding('class.active') isOpen = false;

  openDropdown: string | null = null;
  isMenuOpen: boolean = false;

  constructor(private router: Router) {}

  showDropdown(dropdown: string) {
    this.openDropdown = dropdown;
  }

  hideDropdown() {
    this.openDropdown = null;
  }

  navigateTo(route: string) {
    this.router.navigate([route]);
    this.isMenuOpen = false; // Close the menu after successful navigation
    this.openDropdown = null; // Close dropdown after navigation
  }

  isDropdownOpen(dropdown: string): boolean {
    return this.openDropdown === dropdown;
  }

  toggleMenu() {
    this.isMenuOpen = !this.isMenuOpen;
  }
}