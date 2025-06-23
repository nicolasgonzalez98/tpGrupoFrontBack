import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LayoutComponent } from './layout/layout.component';
import { RegisterComponent } from './components/register/register.component';
import { LoginComponent } from './components/login/login.component';
import { StockComponent } from './components/stock/stock.component';

//Guards
import { AuthGuard } from './guards/auth.guard';
import { GuestGuard } from './guards/guest.guard';
import { AdminGuard } from './guards/admin.guard';
import { CervezasComponent } from './components/stock/cervezas/cervezas.component';
import { CervezaFormComponent } from './components/stock/cerveza-form/cerveza-form.component';

//Pedidos
import { PedidosComponent } from './components/pedidos/pedidos.component';
import { HomeComponent } from './components/home/home.component';

export const routes: Routes = [
  {
    path: '',
    component: LayoutComponent,
    children: [
      { path: '', component: HomeComponent, canActivate: [AuthGuard] },
      { path: 'register', component: RegisterComponent, canActivate: [GuestGuard]},
      { path: 'login', component: LoginComponent, canActivate: [GuestGuard]},
      { path: "stock", component: CervezasComponent, canActivate: [AuthGuard]},
      { path: 'stock/editarCerveza/:id', component: CervezaFormComponent, canActivate: [AuthGuard]},
      { path: 'stock/crearCerveza',component: CervezaFormComponent, canActivate: [AuthGuard]},
      { path: 'pedidos', component: PedidosComponent, canActivate: [GuestGuard] },
      { path: '**', redirectTo:''}
    ]
  }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})

export class AppRoutingModule {}

