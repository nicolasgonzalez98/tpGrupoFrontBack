import { Component, inject, OnInit } from '@angular/core';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { ICerveza } from '../../../models/cerveza.models';
import { CervezaService } from '../../../../services/cerveza.service';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ConfirmationService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import { ActivatedRoute } from '@angular/router';
import { Location } from '@angular/common';
import { DialogModule } from 'primeng/dialog';


@Component({
  selector: 'app-cervezas',
  templateUrl: './cervezas.component.html',
  styleUrls: ['./cervezas.component.css'],
  providers:[ConfirmationService],
  imports: [
    TableModule,
    ButtonModule,
    CommonModule,
    RouterModule,
    ConfirmDialogModule,
    ToastModule,
    DialogModule
  ]
})

export class CervezasComponent implements OnInit {
  cervezas: ICerveza[] = [];
  error: string = '';
  showEditedDialog:boolean = false
  showCreatedDialog:boolean = false

  private _cervezaService = inject(CervezaService);

  constructor(
    private cervezaService : CervezaService, 
    private confirmationService: ConfirmationService,
    private route: ActivatedRoute,
    private location: Location,
    private router:Router,
  ) {}

  ngOnInit(): void {
    this.getAllCervezas();

    this.route.queryParams.subscribe(params => {
      if (params['creado']) {
        this.showCreatedDialog = true
      } else if (params['editado']) {
        this.showEditedDialog = true
      }

      this.location.replaceState(this.router.url.split('?')[0]);
    });
  }

  //Funciones del componente
  get showDialog() {
    return this.showEditedDialog || this.showCreatedDialog;
  }

  set showDialog(value: boolean) {
    if (!value) {
      this.showEditedDialog = false;
      this.showCreatedDialog = false;
    }
  }
  /////////////////////////////////////////////////

  getAllCervezas() {
    this._cervezaService.getAllCervezas().subscribe({
      next: data => {
        this.cervezas = data;
        this.error = "";
      },
      error: err => {
        this.error = 'No se pudieron cargar las cervezas. Verificá la conexión con el servidor.';
      }
    });
  }

  editar(cerveza: any) {
    console.log('Editar', cerveza);
  }

  
  deleteCerveza(id: string) {
    this._cervezaService.deleteCervezaById(id).subscribe({
      next: data => {
        this.getAllCervezas();
      },
      error: err => {
        this.error = 'Error al eliminar cerveza'
      }
    });
  }

  eliminar(cerveza: ICerveza) {
    this.confirmationService.confirm({
      message: `¿Estás seguro de que querés eliminar la cerveza "${cerveza.nombre}"?`,
      header: 'Confirmar eliminación',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Sí',
      rejectLabel: 'No',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => {
        if (cerveza._id) {
          this.deleteCerveza(cerveza._id);
        }
      }
    });
  }

}

