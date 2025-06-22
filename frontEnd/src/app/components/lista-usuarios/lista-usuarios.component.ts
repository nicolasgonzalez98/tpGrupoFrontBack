import { Component, OnInit } from '@angular/core';
import { UsuarioService } from '../../../services/UsuarioService';
import { CommonModule } from '@angular/common'; 
import { Usuario } from '../../models/UsuarioModel'; // ¡Importa la interfaz Usuario!

@Component({
  selector: 'app-lista-usuarios',
  templateUrl: './lista-usuarios.component.html',
  styleUrls: ['./lista-usuarios.component.css'],
   imports: [CommonModule] 
})
export class ListaUsuariosComponent implements OnInit {
  usuarios: Usuario[] = []; 

  constructor(private usuarioService: UsuarioService) { }

  ngOnInit(): void {
    this.getUsuarios();
  }

  getUsuarios(): void {
    this.usuarioService.getUsuarios().subscribe(
      (data: Usuario[]) => { // También puedes tipar aquí el 'data' si lo prefieres
        this.usuarios = data;
        console.log('Usuarios obtenidos en el frontend:', this.usuarios);
      },
      error => {
        console.error('Error al obtener usuarios en el frontend:', error);
      }
    );
  }
}