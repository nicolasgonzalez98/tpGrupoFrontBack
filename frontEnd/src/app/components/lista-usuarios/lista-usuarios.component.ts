import { Component, OnInit } from '@angular/core';
import { UsuarioService } from '../../../services/UsuarioService';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Usuario, Rol } from '../../models/UsuarioModel'; 

@Component({
  selector: 'app-lista-usuarios',
  templateUrl: './lista-usuarios.component.html',
  styleUrls: ['./lista-usuarios.component.css'],
  imports: [CommonModule, FormsModule]
})
export class ListaUsuariosComponent implements OnInit {
  usuarios: Usuario[] = [];

  constructor(private usuarioService: UsuarioService) { }

  ngOnInit(): void {
    this.getUsuarios();
  }

  getUsuarios(): void {
    this.usuarioService.getUsuarios().subscribe(
      (data: Usuario[]) => { 
        this.usuarios = data;
        console.log('Usuarios obtenidos en el frontend:', this.usuarios);
      },
      error => {
        console.error('Error al obtener usuarios en el frontend:', error);
      }
    );
  }

  toggleActivo(usuario: Usuario): void {
    // 1. Invertir el estado 'activo' actual del usuario
    const nuevoEstadoActivo = !usuario.activo;
    // 2. Llamar al servicio para enviar la solicitud PATCH al backend
    this.usuarioService.updateUsuario(usuario._id, { activo: nuevoEstadoActivo }).subscribe(
      (usuarioActualizado: Usuario) => {
        // 3. Éxito: Actualizar el usuario en la lista local (this.usuarios)
        // Esto es importante para que la UI se refresque sin necesidad de recargar toda la lista.
        const index = this.usuarios.findIndex(u => u._id === usuarioActualizado._id);
        if (index !== -1) {
          this.usuarios[index].activo = usuarioActualizado.activo; // Actualiza solo la propiedad 'activo'
        }
        console.log(`Usuario ${usuarioActualizado.nombre} ha sido ${usuarioActualizado.activo ? 'activado' : 'desactivado'} con éxito.`);
      },
      error => {
        // 4. Error: Mostrar un mensaje en consola y, opcionalmente, al usuario
        console.error(`Error al cambiar el estado activo del usuario ${usuario.nombre}:`, error);
      }
    );
  }

  cambiarRol(usuario: Usuario, nuevoRolString: string): void {
    // Convertimos la cadena a un tipo Rol (esto es una aserción de tipo, útil para TypeScript)
    const nuevoRol: Rol = nuevoRolString as Rol;

    if (usuario.rol === nuevoRol) {
      console.log(`El rol de ${usuario.nombre} ya es ${nuevoRol}. No se requiere actualización.`);
      return;
    }

    this.usuarioService.updateUsuario(usuario._id, { rol: nuevoRol }).subscribe(
      (usuarioActualizado: Usuario) => {
        const index = this.usuarios.findIndex(u => u._id === usuarioActualizado._id);
        if (index !== -1) {
          this.usuarios[index].rol = usuarioActualizado.rol;
        }
        console.log(`Rol de usuario ${usuarioActualizado.nombre} cambiado a ${usuarioActualizado.rol} con éxito.`);
      },
      error => {
        console.error(`Error al cambiar el rol del usuario ${usuario.nombre}:`, error);
      }
    );
  }
}