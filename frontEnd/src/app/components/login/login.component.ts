import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { AuthService } from '../../../services/authService';
import { Router } from '@angular/router';
import { ActivatedRoute } from '@angular/router';
import { Location } from '@angular/common';
import { DialogModule } from 'primeng/dialog';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  imports: [ButtonModule, InputTextModule, PasswordModule, ReactiveFormsModule, CommonModule, DialogModule],
  standalone: true,
})
export class LoginComponent{
      loginForm!: FormGroup;
      loading = false;
      errorMessage = '';
      successMessage = '';
      showRegisteredDialog = false;

      constructor(
        private fb: FormBuilder,  
        private authService: AuthService, 
        private router:Router,
        private route: ActivatedRoute,
        private location: Location
      ) {}

      ngOnInit(): void {
        this.loginForm = this.fb.group({
          email: ['', [Validators.required, Validators.email]],
          password: ['', Validators.required],
        });

        this.route.queryParams.subscribe(params => {
          if (params['registrado'] === 'true') {
            this.showRegisteredDialog = true;

            this.location.replaceState(this.router.url.split('?')[0]);
          }
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
          
            localStorage.setItem('token', res.token);
            
            this.router.navigate([""])
            
        }catch (err: any) {
            this.errorMessage = err.message || 'Credenciales incorrectas';
        }finally {
            this.loading = false;
        }
      }
}
