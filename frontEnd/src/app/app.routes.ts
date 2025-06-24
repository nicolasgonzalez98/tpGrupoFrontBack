import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LayoutComponent } from './layout/layout.component';
import { RegisterComponent } from './components/register/register.component';
import { LoginComponent } from './components/login/login.component';
import { AdminHomeComponent } from '../app/components/admin/admin.component';
import { AdminDashboardComponent } from '../app/components/admin-dashboard/admin-dashboard.component';
import { StockComponent } from './components/stock/stock.component';

//Guards
import { AuthGuard } from './guards/auth.guard';
import { GuestGuard } from './guards/guest.guard';
import { EmpleadoGuard } from './guards/empleado.guard';
import { AdminGuard } from './guards/admin.guard';
import { RoleGuard } from './guards/role.guard';

import { CervezasComponent } from './components/stock/cervezas/cervezas.component';
import { CervezaFormComponent } from './components/stock/cerveza-form/cerveza-form.component';
import { HomeComponent } from './components/home/home.component';

import { AdministrarPedidosComponent } from './components/stock/administrar-pedidos/administrar-pedidos.component';
import { MisPedidosComponent } from './components/pedidos/mis-pedidos/mis-pedidos.component';
import { PedidosComponent } from './components/pedidos/pedidos.component';
import { ClienteGuard } from './guards/cliente.guard';


export const routes: Routes = [
  {
    path: '',
    component: LayoutComponent,
    children: [
      { path: '', component: HomeComponent, canActivate: [AuthGuard] },
      { path: 'register', component: RegisterComponent, canActivate: [GuestGuard]},
      { path: 'login', component: LoginComponent, canActivate: [GuestGuard]},
      { path: "stock", component: CervezasComponent, canActivate: [AuthGuard, RoleGuard], data: { roles: ['admin', 'empleado'] }},
      { path: 'stock/editarCerveza/:id', component: CervezaFormComponent, canActivate: [AuthGuard, RoleGuard], data:{ roles: ['admin', 'empleado']}},
      { path: 'stock/crearCerveza',component: CervezaFormComponent, canActivate: [AuthGuard, RoleGuard], data: {roles: ['admin', 'empleado']}},
      { path: 'admin', component: AdminHomeComponent,canActivate: [AuthGuard, AdminGuard] }, 
      { path: 'admin/usuarios', component: AdminDashboardComponent,canActivate: [AuthGuard, AdminGuard] },
      { path: 'admin/crear-empleado', component: RegisterComponent, canActivate: [AuthGuard, AdminGuard]},
      { path: 'stock/administrar-pedidos',component: AdministrarPedidosComponent},
      { path: 'pedidos', component: PedidosComponent, canActivate: [AuthGuard, ClienteGuard] },
      { path: 'pedidos/mis-pedidos', component: MisPedidosComponent, canActivate: [AuthGuard, ClienteGuard] },
      { path: '**', redirectTo:''}
    ]
  }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }

