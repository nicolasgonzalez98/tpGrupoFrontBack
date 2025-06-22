import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { AuthService } from '../../services/authService';
import { IUsuario, Rol } from '../models/usuario.models';

@Injectable({
  providedIn: 'root'
})
export class EmpleadoGuard implements CanActivate {
  constructor(private authService: AuthService, private router: Router) {}

  canActivate(): boolean {
    const usuario: IUsuario | null = this.authService.getUser();

    if (usuario && usuario.rol === Rol.Empleado) {
      return true;
    } else {
      this.router.navigate(['/']); 
      return false;
    }
  }
}

