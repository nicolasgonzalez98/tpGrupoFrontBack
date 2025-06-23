import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { IPedido } from '../app/models/pedido.models';


@Injectable({
  providedIn: 'root'
})
export class PedidosService {
  private url = 'http://localhost:3000/pedido';

  constructor(private _httpClient: HttpClient) { 
  }

  createPedido(pedido: IPedido): Observable<IPedido> {
    return this._httpClient.post<IPedido>(`${this.url}`, pedido);
  }

  getAllPedidos(): Observable<IPedido[]> {
    return this._httpClient.get<IPedido[]>(`${this.url}`);
  }

  getPedidoById(pedidoId: string): Observable<IPedido> {
    return this._httpClient.get<IPedido>(`${this.url}/${pedidoId}`);
  }

  deletePedidoById(pedidoId: string): Observable<void> {
    return this._httpClient.delete<void>(`${this.url}/${pedidoId}`);
  }

  updatePedido(pedidoId: string, data: { aprobado_por?: string, estado?: string }): Observable<IPedido> {
    return this._httpClient.patch<IPedido>(`${this.url}/${pedidoId}`, data);
  }

}
