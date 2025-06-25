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
import { ConfirmationService } from 'primeng/api';

@Component({
  selector: 'app-pedidos',
  imports: [CardModule, ButtonModule, CommonModule, DrawerModule],
  templateUrl: './pedidos.component.html',
  styleUrl: './pedidos.component.css',
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
  private _confirmationService = inject(ConfirmationService);
  messageService = inject(MessageService);

  ngOnInit() {
    this._cervezaService.getAllCervezas().subscribe({
      next: cervezas => {
        this.cervezas = cervezas
        console.log('Cervezas activas:', this.cervezas);
      },
      error: err => {
        console.error('Error al cargar cervezas:', err);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudieron cargar las cervezas'
        });
      }
    });

    const usuario = this._authService.getUser();
    if (!usuario || !usuario._id) {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Usuario no autenticado'
      });
      window.location.href = '/login';
      return;
    }

    this.pedido = {
      usuario_id: usuario._id,
      cervezas: []
    };
  }

  agregarCervezaPedido(cervezaID: string) {
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
      cantidad: 1
    });
  }

  cambiarCantidadCerveza(cervezaID: string, nuevaCantidad: number) {
  if (!this.pedido) return;
  const item = this.pedido.cervezas.find(c => c.cerveza === cervezaID);
  if (item && nuevaCantidad > 0) {
    item.cantidad = nuevaCantidad;
  }
}

eliminarCervezaPedido(cervezaid: string) {
  this._confirmationService.confirm({
    message: '¿Está seguro que desea eliminar la cerveza?',
    header: 'Confirmar eliminación',
    icon: 'pi pi-exclamation-triangle',
    acceptLabel: 'Sí',
    rejectLabel: 'No',
    accept: () => {
      if (!this.pedido || !this.pedido.cervezas) return;
      this.pedido.cervezas = this.pedido.cervezas.filter(c => c.cerveza !== cervezaid);
      this.messageService.add({
        severity: 'success',
        summary: 'Eliminado',
        detail: 'Cerveza eliminada del pedido'
      });
      this._confirmationService.close();
    }
  });
}

  createPedido() {
    if (!this.pedido) return;
    this._pedidosService.createPedido(this.pedido).subscribe({
      next: pedidoCreado => {
        this.messageService.add({
          severity: 'success',
          summary: 'Pedido Creado',
          detail: `Pedido creado`
        });
        if (this.pedido) {
        this.pedido.cervezas = [];
        }
      },
      error: err => {
        console.error('Error al crear el pedido:', err);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudo crear el pedido'
        });
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