import { Component } from '@angular/core';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { LayoutComponent } from "./layout/layout.component";
import { filter } from 'rxjs/operators';
import { AuthService } from '../services/authService';
import { CommonModule } from '@angular/common';


@Component({
  selector: 'app-root',
  imports: [LayoutComponent, CommonModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})

export class AppComponent {
    showNavbar = true;
    isLoggedIn = false;

    constructor(public authService: AuthService, private router: Router) {
      
        this.router.events.pipe(
          filter(event => event instanceof NavigationEnd)
        ).subscribe((event: NavigationEnd) => {
          const path = event.url;
          this.showNavbar = !['/login', '/register'].includes(path);
        });

        this.authService.isLoggedIn$.subscribe(status => {
          this.isLoggedIn = status;
        });
    }
}
