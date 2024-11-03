import { Component, OnInit } from '@angular/core';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { Observable } from 'rxjs';
import { map, shareReplay } from 'rxjs/operators';
import { Router } from '@angular/router';

@Component({
  selector: 'app-navigation',
  templateUrl: './navigation.component.html',
  styleUrls: ['./navigation.component.scss']
})
export class NavigationComponent implements OnInit {
  isHandset$: Observable<boolean> = this.breakpointObserver.observe(Breakpoints.Handset)
    .pipe(
      map(result => result.matches),
      shareReplay()
    );

  openSubmenus: { [key: string]: boolean } = {};

  constructor(
    private breakpointObserver: BreakpointObserver,
    private router: Router
  ) {}

  ngOnInit() {}

  showSubmenu(submenu: string) {
  }

  isSubmenuOpen(submenu: string): boolean {
    return this.openSubmenus[submenu] || false;
  }

  navigateTo(route: string) {
    this.router.navigate([route]);
  }
}

  showSubmenu(submenu: string) {
    this.openSubmenus[submenu] = \!this.openSubmenus[submenu];
  }

  isSubmenuOpen(submenu: string): boolean {
    return this.openSubmenus[submenu] || false;
  }

  navigateTo(route: string) {
    this.router.navigate([route]);
  }
}
