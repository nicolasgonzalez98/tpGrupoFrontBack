import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
//import { IUsuario } from '../app/models/usuario.models';
import { Usuario } from '../app/models/UsuarioModel';

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

  updateUsuario(id: string, partialData: Partial<Usuario>): Observable<Usuario> {
     return this.http.patch<Usuario>(`${this.apiUrl}/${id}`, partialData);
  }
}

