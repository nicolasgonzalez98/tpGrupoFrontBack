// frontEnd/src/app/admin/admin-dashboard/lista-usuarios/lista-usuarios.component.ts

import { Component, OnInit } from '@angular/core';
import { UsuarioService } from '../../../services/UsuarioService';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms'; 
import { DialogModule } from 'primeng/dialog'; 
import { InputTextModule } from 'primeng/inputtext'; 
import { ReactiveFormsModule, FormGroup, FormBuilder, Validators } from '@angular/forms'; 
import { ButtonModule } from 'primeng/button'; 
import { Rol } from '../../models/usuario.models'; 
import { catchError, map } from 'rxjs/operators'; 
import { of } from 'rxjs'; 
import { IUsuario } from '../../models/usuario.models';

@Component({
  selector: 'app-lista-usuarios',
  standalone: true, 
  imports: [
    CommonModule,
    FormsModule, 
    DialogModule,
    InputTextModule,
    ReactiveFormsModule,
    ButtonModule 
  ],
  templateUrl: './lista-usuarios.component.html',
  styleUrls: ['./lista-usuarios.component.css']
})
export class ListaUsuariosComponent implements OnInit {
  usuarios: IUsuario[] = [];

  displayEditModal: boolean = false; 
  editUserForm!: FormGroup; 
  selectedUser: IUsuario | null = null; 
  editErrorMessage: string = ''; 

  constructor(private usuarioService: UsuarioService, private fb: FormBuilder) { } 

  ngOnInit(): void {
    this.getUsuarios();

    this.editUserForm = this.fb.group({
      _id: [''], 
      nombre: ['', Validators.required], 
      email: ['', [Validators.required, Validators.email]], 
    });
  }

  getUsuarios(): void {
    this.usuarioService.getUsuarios().subscribe(
      (data: IUsuario[]) => {
        this.usuarios = data.map(user => ({
          ...user,
          activo: !!user.activo 
        }));
        if (this.usuarios.length > 0) {
          console.log('Primer usuario cargado y su _ID:', this.usuarios[0]._id); 
        } else {
          console.log('No se cargaron usuarios.');
        }
        console.log('Usuarios obtenidos en el frontend (activo transformado):', this.usuarios);
      },
      error => {
        console.error('Error al obtener usuarios en el frontend:', error);
      }
    );
  }

  openEditModal(usuario: IUsuario): void {
    this.selectedUser = { ...usuario }; 
    this.editUserForm.patchValue({ 
      _id: this.selectedUser._id, 
      nombre: this.selectedUser.nombre,
      email: this.selectedUser.email,
    });
    this.editErrorMessage = ''; 
    this.displayEditModal = true; 
  }

  closeEditModal(): void {
    this.displayEditModal = false; 
    this.selectedUser = null; 
    this.editUserForm.reset(); 
  }

  async saveUserChanges(): Promise<void> {
    if (this.editUserForm.invalid || !this.selectedUser) {
      this.editErrorMessage = 'Por favor, completa todos los campos requeridos y asegúrate de que el email sea válido.';
      return;
    }

    this.editErrorMessage = ''; 
    const userId = this.editUserForm.get('_id')?.value; 

    if (!userId) {
        console.error("Error: El _ID del usuario es undefined o nulo al intentar guardar cambios.");
        this.editErrorMessage = "No se pudo obtener el ID del usuario para guardar los cambios. Por favor, recargue la página.";
        return;
    }

    const partialData: Partial<IUsuario> = { 
      nombre: this.editUserForm.get('nombre')?.value,
      email: this.editUserForm.get('email')?.value,
    };

    try {
      const usuarioActualizado: IUsuario | undefined = await this.usuarioService.updateUsuario(userId, partialData).toPromise();
      
      if (usuarioActualizado) { 
        const index = this.usuarios.findIndex(u => u._id === usuarioActualizado._id); 
        if (index !== -1) {
          this.usuarios[index].nombre = usuarioActualizado.nombre;
          this.usuarios[index].email = usuarioActualizado.email;
          this.usuarios[index].activo = !!usuarioActualizado.activo; 
        }
        console.log('Usuario actualizado con éxito:', usuarioActualizado);
        this.closeEditModal(); 
      } else {
        console.error('La actualización se completó, pero no se recibieron datos del usuario actualizado.');
        this.editErrorMessage = 'Error: No se recibieron datos del usuario actualizado.';
      }
    } catch (error: any) {
      console.error('Error al actualizar usuario:', error);
      this.editErrorMessage = error.error?.message || error.message || 'Error desconocido al actualizar usuario.';
    }
  }

  async toggleActivo(usuario: IUsuario): Promise<void> {
    if (!usuario._id) { 
        console.error("Error: El _ID del usuario es undefined o nulo al cambiar estado activo.");
        alert("No se pudo cambiar el estado activo: ID de usuario no encontrado.");
        return;
    }
    const nuevoEstadoActivo = !usuario.activo; 
    try {
      const updatedUser: IUsuario | undefined = await this.usuarioService.updateUsuario(usuario._id, { activo: nuevoEstadoActivo }).toPromise(); 
      if (updatedUser) {
        const index = this.usuarios.findIndex(u => u._id === updatedUser._id); 
        if (index !== -1) {
          this.usuarios[index].activo = !!updatedUser.activo; 
        }
        console.log(`Usuario ${updatedUser.nombre} ha sido ${updatedUser.activo ? 'activado' : 'desactivado'} con éxito.`);
      } else {
        console.error('No se recibieron datos al cambiar estado activo.');
        alert('Error: No se recibieron datos del usuario actualizado al cambiar estado.');
      }
    } catch (error: any) {
      console.error(`Error al cambiar el estado activo del usuario ${usuario.nombre}:`, error);
      alert(error.error?.message || 'Error al actualizar estado.'); 
    }
  }

  async cambiarRol(usuario: IUsuario, nuevoRolString: string): Promise<void> {
    const nuevoRol: Rol = nuevoRolString as Rol;

    if (usuario.rol === nuevoRol) {
      console.log(`El rol de ${usuario.nombre} ya es ${nuevoRol}. No se requiere actualización.`);
      return;
    }

    if (!usuario._id) { 
        console.error("Error: El _ID del usuario es undefined o nulo al cambiar rol.");
        alert("No se pudo cambiar el rol: ID de usuario no encontrado.");
        return;
    }
    try {
      const updatedUser: IUsuario | undefined = await this.usuarioService.updateUsuario(usuario._id, { rol: nuevoRol }).toPromise(); 
      if (updatedUser) {
        const index = this.usuarios.findIndex(u => u._id === updatedUser._id); 
        if (index !== -1) {
          this.usuarios[index].rol = updatedUser.rol;
        }
        console.log(`Rol de usuario ${updatedUser.nombre} cambiado a ${updatedUser.rol} con éxito.`);
      } else {
        console.error('No se recibieron datos al cambiar rol.');
        alert('Error: No se recibieron datos del usuario actualizado al cambiar rol.');
      }
    } catch (error: any) {
      console.error(`Error al cambiar el rol del usuario ${usuario.nombre}:`, error);
      alert(error.error?.message || 'Error al actualizar rol.');
    }
  }
}