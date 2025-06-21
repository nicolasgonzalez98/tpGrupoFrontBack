import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common'; // Necesario para *ngIf, *ngFor si los usas aquí
import { ListaUsuariosComponent } from '../../../app/components/lista-usuarios/lista-usuarios.component';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, ListaUsuariosComponent], // <--- ¡Añade ListaUsuariosComponent aquí!
  templateUrl: './admin-dashboard.component.html',
  styleUrls: ['./admin-dashboard.component.css']
})

export class AdminDashboardComponent implements OnInit {
  

  ngOnInit(): void {
    
  }
}