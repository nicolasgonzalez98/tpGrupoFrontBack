import { Component } from '@angular/core';
import { AuthService } from '../../../services/authService';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-home',
  imports: [CommonModule],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css'
})
export class HomeComponent {
  isAdmin:boolean = false;
  isEmployee:boolean = false;
  isClient:boolean = false;

  constructor(public authService: AuthService){
    
    this.authService.user$.subscribe(user => {
      this.isAdmin = user?.rol === 'admin';
      this.isEmployee = user?.rol === 'empleado';
      this.isClient = user?.rol === 'cliente';
    });
  }
}
