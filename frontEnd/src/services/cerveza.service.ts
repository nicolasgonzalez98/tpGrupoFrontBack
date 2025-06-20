import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { ICerveza } from '../app/models/cerveza.models';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class CervezaService {
  private url = 'http://localhost:3000/api/cervezas';

  constructor(private _httpClient: HttpClient) {}

  public getAll(): Observable<ICerveza[]> {
    return this._httpClient.get<ICerveza[]>(this.url);
  }

  public getById(id: string): Observable<ICerveza> {
    return this._httpClient.get<ICerveza>(`${this.url}/${id}`);
  }

  public create(cerveza: ICerveza): Observable<ICerveza> {
    return this._httpClient.post<ICerveza>(this.url, cerveza);
  }

  public update(id: string, cerveza: Partial<ICerveza>): Observable<ICerveza> {
    return this._httpClient.put<ICerveza>(`${this.url}/${id}`, cerveza);
  }

  public delete(id: string): Observable<ICerveza> {
    return this._httpClient.delete<ICerveza>(`${this.url}/${id}`);
  }
}
