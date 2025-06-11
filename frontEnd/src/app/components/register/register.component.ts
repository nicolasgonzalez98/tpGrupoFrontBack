import { Component } from '@angular/core';
import { CommonModule } from '@angular/common'; 
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule  } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { AuthService } from '../../../services/authService';




@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  imports: [ButtonModule, InputTextModule, PasswordModule, ReactiveFormsModule, CommonModule],
  standalone: true,
})

export class RegisterComponent {
  registerForm: FormGroup;
  loading = false;
  errorMessage = '';
  successMessage = '';

  constructor(private fb: FormBuilder, private authService: AuthService) {
    this.registerForm = this.fb.group({
      nombre: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required],
    });
  }

  async onRegister() {
      if (this.registerForm.invalid) return;

      this.loading = true;
      this.errorMessage = '';
      this.successMessage = '';

      try {
        const res = await this.authService.register(this.registerForm.value);
        this.successMessage = 'Usuario registrado correctamente';
        this.registerForm.reset();
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
