import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { IUsuario } from '../app/models/usuario.models';

@Injectable({
  providedIn: 'root'
})
export class UsuarioService {
  private apiUrl = 'http://localhost:3000/api/usuarios';

  constructor(private http: HttpClient) { }

  // Tipamos el Observable para que retorne un array de objetos Usuario
  getUsuarios(): Observable<IUsuario[]> {
    return this.http.get<IUsuario[]>(this.apiUrl);
  }

  updateUsuario(id: string, partialData: Partial<IUsuario>): Observable<IUsuario> {
     return this.http.patch<IUsuario>(`${this.apiUrl}/${id}`, partialData);
  }
}

