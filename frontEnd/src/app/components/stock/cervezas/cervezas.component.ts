import { Component, OnInit } from '@angular/core';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

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
  cervezas = [
    {
      _id: '1',
      nombre: 'Golden Ale',
      tipo: 'Rubia',
      stock_actual: 50,
      stock_minimo: 20,
      activo: true
    },
    {
      _id: '2',
      nombre: 'IPA',
      tipo: 'Lupulada',
      stock_actual: 10,
      stock_minimo: 15,
      activo: true
    }
  ];

  constructor() {}

  ngOnInit(): void {}

  editar(cerveza: any) {
    console.log('Editar', cerveza);
    // Acá podrías abrir un diálogo
  }

  eliminar(cerveza: any) {
    console.log('Eliminar', cerveza);
    // Confirmación y acción
  }

  agregar() {
    console.log('Agregar nueva cerveza');
    // Mostrar modal o redirigir a formulario
  }
}

