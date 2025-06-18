import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { CheckboxModule } from 'primeng/checkbox';

@Component({
  selector: 'app-cerveza-form',
  templateUrl: './cerveza-form.component.html',
  styleUrls: ['./cerveza-form.component.css'],
  imports: [
    CommonModule,
    FormsModule,
    ButtonModule,
    InputTextModule,
    InputNumberModule,
    CheckboxModule,
  ]
})
export class CervezaFormComponent implements OnInit {

  id?: string;
  cerveza = {
    nombre: '',
    tipo: '',
    stock_actual: 0,
    stock_minimo: 0,
    activo: true
  };

  constructor(private route: ActivatedRoute, private router: Router) {}

  ngOnInit(): void {
    this.id = this.route.snapshot.paramMap.get('id') || undefined;

    if (this.id) {
      // Aquí deberías llamar al service para obtener la cerveza por id y cargar datos
      // Por ejemplo:
      // this.cervezaService.getCerveza(this.id).subscribe(data => this.cerveza = data);
      console.log('Editar cerveza con id:', this.id);
      // Simulamos carga con datos dummy para el ejemplo
      this.cerveza = {
        nombre: 'Ejemplo IPA',
        tipo: 'Rubia',
        stock_actual: 15,
        stock_minimo: 5,
        activo: true
      }
    }
  }

  guardar() {
    if (this.id) {
      // Actualizar cerveza
      console.log('Actualizando cerveza', this.cerveza);
      // Llamar al service update
    } else {
      // Crear nueva cerveza
      console.log('Creando cerveza', this.cerveza);
      // Llamar al service create
    }

    // Redirigir a la lista de cervezas
    this.router.navigate(['/stock']);
  }

  cancelar() {
    this.router.navigate(['/stock']);
  }
}

