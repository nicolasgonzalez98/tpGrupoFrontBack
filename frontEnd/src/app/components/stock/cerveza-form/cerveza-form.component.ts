import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { CheckboxModule } from 'primeng/checkbox';
import { CervezaService } from '../../../../services/cerveza.service';
//import { MessageService } from 'primeng/api';

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

  error: string = '';
  errores_form: { [campo: string]: string } = {};

  constructor(
    private route: ActivatedRoute, 
    private router: Router, 
    private cervezaService: CervezaService,
    
  ) {}

  ngOnInit(): void {
    this.id = this.route.snapshot.paramMap.get('id') || undefined;

    if (this.id) {
      this.cervezaService.getById(this.id).subscribe({
        next: (data) => this.cerveza = data,
        error: () => {
          this.error = 'No se pudo cargar la cerveza.';
          console.error('Error cargando cerveza');
        }
      });
    }
  }

  validar(): boolean {
    this.errores_form = {};
    this.error = ""

    const { nombre, tipo, stock_actual, stock_minimo } = this.cerveza;

    if (!nombre.trim()) {
      this.errores_form['nombre'] = 'El nombre es obligatorio.';
    }

    if (!tipo.trim()) {
      this.errores_form['tipo'] = 'El tipo es obligatorio.';
    }

    if (stock_actual < 0) {
      this.errores_form['stock_actual'] = 'El stock actual no puede ser negativo.';
    }

    if (stock_minimo < 0) {
      this.errores_form['stock_minimo'] = 'El stock mínimo no puede ser negativo.';
    }

    this.error = '';
    
    return Object.keys(this.errores_form).length === 0;
  }

  guardar() {
    
    if (!this.validar()) return;

    if (this.id) {
      this.cervezaService.update(this.id, this.cerveza).subscribe({
        next: () => this.router.navigate(['/stock'], { queryParams: { editado: true } }),
        error: (err) => {
          this.error = 'Error actualizando la cerveza.';
        }
      });
    } else {
      this.cervezaService.create(this.cerveza).subscribe({
        next: () => this.router.navigate(['/stock'], { queryParams: { creado: true } }),
        error: (err) => {
          this.error = 'Error creando la cerveza.';
        }
      });
    }
  }

  cancelar() {
    this.router.navigate(['/stock']);
  }
}

