import { Component, inject } from '@angular/core';
import { PedidosService } from '../../../../services/pedidos.service';
import { IAdminPedido } from '../../../models/adminPedido.models';
import { AuthService } from '../../../../services/authService';
import { MessageService } from 'primeng/api';
import { CardModule } from 'primeng/card';


@Component({
  selector: 'app-mis-pedidos',
  imports: [CardModule],
  templateUrl: './mis-pedidos.component.html',
  styleUrls: ['./mis-pedidos.component.css']
})

export class MisPedidosComponent {
  misPedidos: IAdminPedido[] = [];

  private _pedidosService = inject(PedidosService);
  private _authService = inject(AuthService);
  private _messageService = inject(MessageService);

  ngOnInit() {
    const usuario = this._authService.getUser();
    if (!usuario || !usuario.id) {
      this._messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Usuario no autenticado'
      });
      window.location.href = '/login';
      return;
    }

    this._pedidosService.getPedidosByUsuario(usuario.id).subscribe({
      next: (pedidos) => {
        this.misPedidos = pedidos;
      },
      error: (err) => {
        console.error('Error al cargar mis pedidos:', err);
      },
    });
  }
}

