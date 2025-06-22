import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Usuario } from '../app/models/UsuarioModel'; // ¡Importa la interfaz Usuario!

@Injectable({
  providedIn: 'root'
})
export class UsuarioService {
  private apiUrl = 'http://localhost:3000/api/usuarios';

  constructor(private http: HttpClient) { }

  // Tipamos el Observable para que retorne un array de objetos Usuario
  getUsuarios(): Observable<Usuario[]> {
    return this.http.get<Usuario[]>(this.apiUrl);
  }
}