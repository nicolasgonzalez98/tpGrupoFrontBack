import { Component, inject } from '@angular/core';
import { PedidosService } from '../../../../services/pedidos.service';
import { CervezaService } from '../../../../services/cerveza.service';
import { IAdminPedido } from '../../../models/adminPedido.models';
import { ICerveza } from '../../../models/cerveza.models';
import { AuthService } from '../../../../services/authService';
import { CommonModule } from '@angular/common';
import { MessageService } from 'primeng/api';
import { CardModule } from 'primeng/card';

@Component({
  selector: 'app-mis-pedidos',
  imports: [CardModule, CommonModule],
  templateUrl: './mis-pedidos.component.html',
  styleUrls: ['./mis-pedidos.component.css']
})

export class MisPedidosComponent {
  misPedidos: IAdminPedido[] = [];
  cervezasPorPedido: { [pedidoId: string]: Array<ICerveza & { cantidad: number }> } = {};


  private _pedidosService = inject(PedidosService);
  private _cervezaService = inject(CervezaService);
  private _authService = inject(AuthService);
  private _messageService = inject(MessageService);

  ngOnInit() {
    const usuario = this._authService.getUser();
    if (!usuario || !usuario._id) {
      this._messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Usuario no autenticado'
      });
      window.location.href = '/login';
      return;
    }

    this._pedidosService.getPedidosByUsuario(usuario._id).subscribe({
      next: (pedidos) => {
        this.misPedidos = pedidos;
        this.cervezasPorPedido = {};
        for (const pedido of pedidos) {
          this.cervezasPorPedido[pedido._id] = [];
          for (const item of pedido.cervezas) {
            this._cervezaService.getCervezaById(item.cerveza).subscribe({
              next: (cerveza) => {
                this.cervezasPorPedido[pedido._id].push({
                  ...cerveza,
                  cantidad: item.cantidad
                });
              }
            });
          }
        }
      },
      error: (err) => {
        this._messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudieron cargar los pedidos'
        });
      }
    });
  }
}

