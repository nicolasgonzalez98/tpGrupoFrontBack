import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { ICerveza } from '../app/models/cerveza.models';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class CervezaService {
  private url = 'http://localhost:3000';

  constructor(private _httpClient: HttpClient) {}

  getAllCervezas(): Observable<ICerveza[]> {
    return this._httpClient.get<ICerveza[]>(`${this.url}`);
  }

  getCervezaById(id: string): Observable<ICerveza> {
    return this._httpClient.get<ICerveza>(`${this.url}/${id}`);
  }

  createCerveza(cerveza: ICerveza): Observable<ICerveza> {
    return this._httpClient.post<ICerveza>(`${this.url}/stock`, cerveza);
  }

  updateCerveza(id: string, updateData: Partial<ICerveza>): Observable<ICerveza> {
    return this._httpClient.patch<ICerveza>(`${this.url}/stock/${id}`, updateData);
  }

  deleteCervezaById(id: string): Observable<ICerveza> {
    return this._httpClient.delete<ICerveza>(`${this.url}/stock/${id}`);
  }
}
