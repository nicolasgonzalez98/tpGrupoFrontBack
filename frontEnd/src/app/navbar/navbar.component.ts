import { Component } from '@angular/core';
import { AuthService } from '../../services/authService';
import { ButtonModule } from 'primeng/button';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-navbar',
  imports: [ButtonModule, CommonModule],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.css'
})
export class NavbarComponent {
  isAdmin = false;
  isEmployee = false;
  isClient = false

  //Variables para funcionamiento de Menu
  showStockMenu = false;
  showAdminMenu = false;
  showClientsMenu = false;

  showMenus: Record<string, boolean> = {};


  menuItems = [
    {
      label: 'Stock',
      visible: () => this.isAdmin || this.isEmployee,
      submenuKey: 'showStockMenu',
      submenu: [
        { label: 'Ver stock', path: '/stock', visible: () => this.isEmployee || this.isAdmin },
        { label: 'Agregar cerveza', path: '/stock/crearCerveza', visible: () => this.isEmployee || this.isAdmin }
      ]
    },
    {
      label: 'Administrador',
      visible: () => this.isAdmin,
      submenuKey: 'showAdminMenu',
      submenu: [
        { label: 'Panel de admin', path: '/admin', visible: () => this.isAdmin },
        { label: 'Registrar empleado', path: '/admin/crear-empleado', visible: () => this.isAdmin }
      ]
    }
  ];


  constructor(public authService: AuthService){
    this.authService.user$.subscribe(user => {
      this.isAdmin = user?.rol === 'admin';
      this.isEmployee = user?.rol === 'empleado';
      this.isClient = user?.rol === 'cliente';
    });
  }
}
