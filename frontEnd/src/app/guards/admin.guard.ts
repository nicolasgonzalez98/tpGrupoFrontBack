import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { AuthService } from '../../services/authService';

@Injectable({
  providedIn: 'root'
})
export class AdminGuard implements CanActivate {
  constructor(private authService: AuthService, private router: Router) {}

  canActivate(): boolean {
    const usuario = this.authService.getUser(); 

    if (this.authService.isLoggedIn() && usuario?.rol === 'admin') {
      return true;
    } else {
      this.router.navigate(['/']); 
      return false;
    }
  }
}

