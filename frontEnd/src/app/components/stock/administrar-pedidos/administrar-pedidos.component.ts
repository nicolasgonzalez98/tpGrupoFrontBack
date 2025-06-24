import { Component, inject } from '@angular/core';
import { PedidosService } from '../../../../services/pedidos.service';
import { AuthService } from '../../../../services/authService';
import { IAdminPedido } from '../../../models/adminPedido.models';
import { MessageService } from 'primeng/api';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ConfirmationService } from 'primeng/api';
import { CardModule } from 'primeng/card';


@Component({
  selector: 'app-administrar-pedidos',
  imports: [ConfirmDialogModule, CardModule],
  templateUrl: './administrar-pedidos.component.html',
  styleUrl: './administrar-pedidos.component.css'
})
export class AdministrarPedidosComponent {
  private _pedidosService = inject(PedidosService);
  private _authService = inject(AuthService);
  private _messageService = inject(MessageService);
  private _confirmationService = inject(ConfirmationService);

  adminPedidos: IAdminPedido[] = [];
  selectedPedido?: IAdminPedido;

  ngOnInit() {
    this._pedidosService.getAllPedidos().subscribe({
      next: pedidos => {
        this.adminPedidos = pedidos;
        console.log('Pedidos cargados:', this.adminPedidos);
      },
      error: err => {
        console.error('Error al cargar pedidos:', err);
        this._messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'No se pudieron cargar los pedidos'
      });
      }
    });

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

    this.selectedPedido = {
      _id: '',
      usuario_id: '',
      estado: '',
      aprobado_por: usuario.id,
      fecha_aprobacion: undefined as any,
      cervezas: [],
      fecha: undefined as any
    };
  }

  aceptarPedido(pedido: IAdminPedido) {
    const actualizado = {
      ...pedido,
      estado: 'aceptado',
      fecha_aprobacion: new Date()
    };
    this.actualizarPedidoEnBackend(actualizado);
  }

  confirmarAceptacion(pedido: IAdminPedido) {
    this._confirmationService.confirm({
      message: '¿Estás seguro de que deseas aceptar este pedido?',
      acceptLabel: 'Sí',
      rejectLabel: 'No',
      accept: () => {
        this.aceptarPedido(pedido);
        this._confirmationService.close();
      }
    });
  }

  rechazarPedido(pedido: IAdminPedido) {
    const actualizado = {
      ...pedido,
      estado: 'rechazado',
    };
    this.actualizarPedidoEnBackend(actualizado);
  }

  confirmarRechazo(pedido: IAdminPedido) {
    this._confirmationService.confirm({
      message: '¿Estás seguro de que deseas rechazar este pedido?',
      acceptLabel: 'Sí',
      rejectLabel: 'No',
      accept: () => {
        this.rechazarPedido(pedido);
        this._confirmationService.close();
      }
    });
  }

  private actualizarPedidoEnBackend(pedido: IAdminPedido) {
    const usuario = this._authService.getUser();
    const body = {
      estado: pedido.estado,
      aprobado_por: usuario!.id
    };
    this._pedidosService.updatePedido(pedido._id, body).subscribe({
      next: updatedPedido => {
        this._messageService.add({
          severity: 'success',
          summary: 'Éxito',
          detail: 'Pedido actualizado correctamente'
        });
        this.ngOnInit();
      },
      error: err => {
        console.error('Error al actualizar el pedido:', err);
        this._messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudo actualizar el pedido'
        });
      }
    });
  }

  eliminarPedido(pedidoId: string) {
    this._pedidosService.deletePedidoById(pedidoId).subscribe({
      next: () => {
        this._messageService.add({
          severity: 'success',
          summary: 'Eliminado',
          detail: 'Pedido eliminado correctamente'
        });
        this.ngOnInit();
      },
      error: err => {
        console.error('Error al eliminar el pedido:', err);
        this._messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudo eliminar el pedido'
        });
      }
    });
  }

}
