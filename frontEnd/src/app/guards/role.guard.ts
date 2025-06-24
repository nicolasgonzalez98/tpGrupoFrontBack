import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, Router } from '@angular/router';
import { AuthService } from '../../services/authService';
import { IUsuario } from '../models/usuario.models';

@Injectable({
  providedIn: 'root'
})
export class RoleGuard implements CanActivate {
  constructor(private authService: AuthService, private router: Router) {}

  canActivate(route: ActivatedRouteSnapshot): boolean {
    const user: IUsuario | null = this.authService.getUser();
    const allowedRoles = route.data['roles'] as string[];

    if (user && allowedRoles.includes(user.rol)) {
      return true;
    }

    this.router.navigate(['/']);
    return false;
  }
}
