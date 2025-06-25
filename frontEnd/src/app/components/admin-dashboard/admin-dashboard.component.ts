import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ListaUsuariosComponent } from '../../../app/components/lista-usuarios/lista-usuarios.component';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, ListaUsuariosComponent],
  templateUrl: './admin-dashboard.component.html',
  styleUrls: ['./admin-dashboard.component.css']
})

export class AdminDashboardComponent implements OnInit {
  

  ngOnInit(): void {
    
  }
}