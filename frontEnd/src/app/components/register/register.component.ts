import { Component } from '@angular/core';
import { CommonModule } from '@angular/common'; 
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule  } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { AuthService } from '../../../services/authService';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  imports: [ButtonModule, InputTextModule, PasswordModule, ReactiveFormsModule, CommonModule],
  standalone: true,
})

export class RegisterComponent {
  registerForm: FormGroup;
  loading = false;
  errorMessage :string = '';
  successMessage :string = '';
  isAdminCreatingEmployee:boolean = false;

  constructor(private fb: FormBuilder, private authService: AuthService, private router:Router, private route: ActivatedRoute) {
    this.registerForm = this.fb.group({
      nombre: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required],
    });

    this.isAdminCreatingEmployee = this.router.url.startsWith('/admin/crear-empleado');
  }

  async onRegister() {
      if (this.registerForm.invalid) return;

      this.loading = true;
      this.errorMessage = '';
      this.successMessage = '';

      const payload = {
        ...this.registerForm.value,
        ...(this.isAdminCreatingEmployee ? { rol: 'empleado' } : {}),
      };
      console.log(payload)
      try {
        const res = await this.authService.register(payload);

        this.successMessage = 'Usuario registrado correctamente';
        this.registerForm.reset();
        if(!this.isAdminCreatingEmployee){
          this.router.navigate(['/login'], { queryParams: { registrado: true } });
        }else{
          this.router.navigate(['/admin'], { queryParams: { registrado: true } });
        }
        
      } catch (err: any) {
        this.errorMessage = err.message || 'Error al registrar usuario';
      } finally {
        this.loading = false;
      }
  }

  get nombre() {
    return this.registerForm.get('nombre')!;
  }

  get email() {
    return this.registerForm.get('email')!;
  }

  get password() {
    return this.registerForm.get('password')!;
  }
}
