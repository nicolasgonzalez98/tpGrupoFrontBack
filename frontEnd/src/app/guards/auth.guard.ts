import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { AuthService } from '../../services/authService';
import { IUsuario } from '../models/usuario.models';


@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {
  constructor(private authService: AuthService, private router: Router) {}

  canActivate(): boolean {
    if (this.authService.isLoggedIn()) {
      // const usuario: IUsuario | null = this.authService.getUser();
      return true;
    } else {
      this.router.navigate(['/login']);
      return false;
    }
  }
}
