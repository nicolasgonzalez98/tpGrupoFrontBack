import { Component } from '@angular/core';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { LayoutComponent } from "./layout/layout.component";
import { filter } from 'rxjs/operators';
import { AuthService } from '../services/authService';
import { NavbarComponent } from "./navbar/navbar.component";
import { ListaUsuariosComponent } from '../app/components/lista-usuarios/lista-usuarios.component';
import { CommonModule } from '@angular/common';
import { MessageService } from 'primeng/api';
import { ConfirmationService } from 'primeng/api';


@Component({
  selector: 'app-root',
  imports: [LayoutComponent, CommonModule, RouterOutlet,
    ListaUsuariosComponent, NavbarComponent ],
  providers: [MessageService, ConfirmationService],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})

export class AppComponent {
    showNavbar = true;
    isLoggedIn = false;
    dropdownOpen = false;

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

    toggleDropdown() {
    this.dropdownOpen = !this.dropdownOpen;
  }

    logout() {
        this.authService.logout();
        this.router.navigate(['/login']);
    }

}
