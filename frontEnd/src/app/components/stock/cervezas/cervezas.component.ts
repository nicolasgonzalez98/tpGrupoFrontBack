import { Component, inject, OnInit } from '@angular/core';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ICerveza } from '../../../models/cerveza.models';
import { CervezaService } from '../../../../services/cerveza.service';

@Component({
  selector: 'app-cervezas',
  templateUrl: './cervezas.component.html',
  styleUrls: ['./cervezas.component.css'],
  imports: [
    TableModule,
    ButtonModule,
    CommonModule,
    RouterModule
  ]
})

export class CervezasComponent implements OnInit {
  cervezas: ICerveza[] = [];
  error: string = '';

  private _cervezaService = inject(CervezaService);

  constructor(private cervezaService : CervezaService) {}

  ngOnInit(): void {
    this.getAllCervezas();
  }

  getAllCervezas() {
    this._cervezaService.getAll().subscribe({
      next: data => {
        this.cervezas = data;
        this.error = "";
      },
      error: err => {
        console.log(err)
        this.error = 'No se pudieron cargar las cervezas. Verificá la conexión con el servidor.';
      }
    });
  }

  editar(cerveza: any) {
    console.log('Editar', cerveza);
    // Acá podrías abrir un diálogo
  }

  deleteCerveza(id: string) {
    this._cervezaService.delete(id).subscribe({
      next: data => {
        console.log(`Cerveza eliminada: ${data.nombre}`);
        this.getAllCervezas();
      },
      error: error => {
        console.error('Error al eliminar cerveza:', error);
      }
    });
  }

  eliminar(cerveza: ICerveza) {
    if (cerveza._id && confirm(`¿Eliminar cerveza "${cerveza.nombre}"?`)) {
      this.deleteCerveza(cerveza._id);
    }
  }

}

