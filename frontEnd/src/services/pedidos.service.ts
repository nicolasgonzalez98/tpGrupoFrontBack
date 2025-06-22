import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { ICerveza } from '../app/models/cerveza.models';
import { Observable } from 'rxjs';
import { IPedido } from '../app/models/pedido.models';


@Injectable({
  providedIn: 'root'
})
export class PedidosService {

  constructor() { }
}
