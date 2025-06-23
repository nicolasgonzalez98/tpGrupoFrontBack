import { Component, inject, OnInit } from '@angular/core';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { MessageService } from 'primeng/api';
import { DrawerModule } from 'primeng/drawer';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../services/authService';
import { ICerveza } from '../../models/cerveza.models';
import { IPedido } from '../../models/pedido.models';
import { PedidosService } from '../../../services/pedidos.service';
import { CervezaService } from '../../../services/cerveza.service';

@Component({
  selector: 'app-pedidos',
  imports: [CardModule, ButtonModule, CommonModule, DrawerModule],
  templateUrl: './pedidos.component.html',
  styleUrl: './pedidos.component.css',
  providers: [MessageService]
})

export class PedidosComponent implements OnInit {
  cervezas: ICerveza[] = [];
  pedido?: IPedido;
  cantidad: { [id: string]: number } = {};
  visible: boolean = false;

  public Math = Math;
  private _cervezaService = inject(CervezaService);
  private _authService = inject(AuthService);
  private _pedidosService = inject(PedidosService);
  messageService = inject(MessageService);

  ngOnInit() {
    this._cervezaService.getAllCervezas().subscribe({
      next: cervezas => {
        this.cervezas = cervezas
        console.log('Cervezas activas:', this.cervezas);
      },
      error: err => {
        console.error('Error al cargar cervezas:', err);
      }
    });

    const usuario = this._authService.getUser();
    if (!usuario || !usuario.id) {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Usuario no autenticado'
      });
      window.location.href = '/login';
      return;
    }

    this.pedido = {
      usuario_id: usuario.id,
      cervezas: []
    };
  }

  agregarCervezaPedido(cervezaID: string, cantidad: number) {
    if (!this.pedido) return;
      const yaEnCarrito = this.pedido.cervezas.some(c => c.cerveza === cervezaID);
    if (yaEnCarrito) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Atención',
        detail: 'Cerveza ya sumada'
      });
      return;
    }
    this.pedido.cervezas.push({
      cerveza: cervezaID,
      cantidad: cantidad
    });
}

  eliminarCervezaPedido(cervezaid: string) {
    if (!this.pedido || !this.pedido.cervezas) return;

    this.pedido.cervezas = this.pedido.cervezas.splice(
      this.pedido.cervezas.findIndex(c => c.cerveza === cervezaid)
    )

  //   const originalLength = this.pedido.cervezas.length;
  // const filtradas = this.pedido.cervezas.filter(c => c.cerveza !== cervezaid);

  // // Solo reasigna si realmente eliminó algo
  // if (filtradas.length < originalLength) {
  //   this.pedido.cervezas = filtradas;
  //   console.log('Cerveza eliminada del pedido:', this.pedido.cervezas);
  // } else {
  //   console.log('No se encontró la cerveza a eliminar, el array queda igual.');
  // }
  
    console.log('Cerveza eliminada del pedido:', this.pedido!.cervezas);
  }

  createPedido() {
    if (!this.pedido) return;
    this._pedidosService.createPedido(this.pedido).subscribe({
      next: pedidoCreado => {
        console.log('Pedido confirmado:', pedidoCreado);
        if (this.pedido) {
        this.pedido.cervezas = [];
        }
      },
      error: err => {
        console.error('Error al confirmar pedido:', err);
      }
    });
  }

  get pedidoCervezasDetallado() {
  if (!this.pedido) return [];
  return this.pedido.cervezas.map(item => {
    const cerveza = this.cervezas.find(c => c._id === item.cerveza);
    return {
      ...item,
      nombre: cerveza?.nombre || 'Desconocida',
      tipo: cerveza?.tipo || 'Desconocido'
    };
  });
}

  getMaxCantidad(cerveza: ICerveza): number {
  return this.Math.max(1, cerveza.stock_actual - cerveza.stock_minimo);
}

}