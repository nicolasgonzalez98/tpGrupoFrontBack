import { Component, inject, OnInit } from '@angular/core';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { CervezaService } from '../../../services/cerveza.service';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../services/authService';
import { ICerveza } from '../../models/cerveza.models';
import { IPedido } from '../../models/pedido.models';

@Component({
  selector: 'app-pedidos',
  imports: [CardModule, ButtonModule, CommonModule],
  templateUrl: './pedidos.component.html',
  styleUrl: './pedidos.component.css'
})
export class PedidosComponent implements OnInit {
  cervezas: ICerveza[] = [];
  pedido?: IPedido;

  private _cervezaService = inject(CervezaService);
  private _authService = inject(AuthService);

  ngOnInit() {
    this._cervezaService.getAll().subscribe({
      next: cervezas => {
        this.cervezas = cervezas
        console.log('Cervezas activas:', this.cervezas);
      },
      error: err => {
        console.error('Error al cargar cervezas:', err);
      }
    });

      this.pedido = {
        usuario_id: this._authService.getUser()!.id,
        cervezas: []
      };
    
  }

  agregarCervezaPedido(cervezaID: string, cantidad: number) {
    // Aquí podrías implementar la lógica para agregar el pedido
    this.pedido!.cervezas.push({
      cerveza: cervezaID,
      cantidad: cantidad
    });
  }

  eliminarCervezaPedido(cervezaid: string) {
    if (!this.pedido || !this.pedido.cervezas) return;

    this.pedido.cervezas = this.pedido.cervezas.splice(
      this.pedido.cervezas.findIndex(c => c.cerveza === cervezaid)
    )
  
    console.log('Cerveza eliminada del pedido:', this.pedido!.cervezas);
  }

  confirmarPedido() {

    // Aquí podrías implementar la lógica para confirmar el pedido
    console.log('Pedido confirmado');
  }

  //TODO: PEDIDO SERVICE
}