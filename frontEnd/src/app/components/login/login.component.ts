import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { AuthService } from '../../../services/authService';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  imports: [ButtonModule, InputTextModule, PasswordModule, ReactiveFormsModule, CommonModule],
  standalone: true,
})
export class LoginComponent{
      loginForm!: FormGroup;
      loading = false;
      errorMessage = '';
      successMessage = '';

      constructor(private fb: FormBuilder,  private authService: AuthService) {}

      ngOnInit(): void {
        this.loginForm = this.fb.group({
          email: ['', [Validators.required, Validators.email]],
          password: ['', Validators.required],
        });
      }

      get email() {
        return this.loginForm.get('email')!;
      }

      get password() {
        return this.loginForm.get('password')!;
      }

      async onSubmit() {
        this.loading = true;
        this.errorMessage = '';
        this.successMessage = '';

        try{
            const res = await this.authService.login(this.loginForm.value);
            this.successMessage = '¡Bienvenido!';
          
            localStorage.setItem('token', res.token);
            
        }catch (err: any) {
            this.errorMessage = err.message || 'Credenciales incorrectas';
        }finally {
            this.loading = false;
        }
      }
}
