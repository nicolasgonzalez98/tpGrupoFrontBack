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
import { AdminGuard } from './guards/admin.guard';
import { CervezasComponent } from './components/stock/cervezas/cervezas.component';
import { CervezaFormComponent } from './components/stock/cerveza-form/cerveza-form.component';



export const routes: Routes = [
  {
    path: '',
    component: LayoutComponent,
    children: [
      { path: '', component: StockComponent, canActivate: [AuthGuard] },
      { path: 'register', component: RegisterComponent, canActivate: [GuestGuard]},
      { path: 'login', component: LoginComponent, canActivate: [GuestGuard]},
      { path: "stock", component: CervezasComponent, canActivate: [AuthGuard]},
      { path: 'stock/editarCerveza/:id', component: CervezaFormComponent, canActivate: [AuthGuard]},
      { path: 'stock/crearCerveza',component: CervezaFormComponent, canActivate: [AuthGuard]},
      { path: 'admin', component: AdminHomeComponent,canActivate: [AdminGuard] }, 
      { path: 'admin/usuarios', component: AdminDashboardComponent,canActivate: [AdminGuard] },
      { path: '**', redirectTo:''}
    ]
  }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }

