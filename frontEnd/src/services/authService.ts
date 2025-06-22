import { Injectable } from '@angular/core';
import axios from 'axios';
import { BehaviorSubject } from 'rxjs';
import { Router } from '@angular/router';
import { IUsuario } from '../app/models/usuario.models';

@Injectable({
  providedIn: 'root'
})

export class AuthService {
    private apiUrl = 'http://localhost:3000/api/auth';

    private isLoggedInSubject = new BehaviorSubject<boolean>(this.isLoggedIn());
    private userSubject = new BehaviorSubject<IUsuario | null>(this.getUserFromStorage());

    isLoggedIn$ = this.isLoggedInSubject.asObservable();
    user$ = this.userSubject.asObservable();

    constructor(private router:Router) {}

    public isLoggedIn(): boolean {
        const token = localStorage.getItem('token');
        return token !== null && token !== '';
    }

    private getUserFromStorage(): IUsuario | null {
        const user = localStorage.getItem('user');
        return user ? JSON.parse(user) as IUsuario : null;
    }

    async register(data: { nombre: string; email: string; password: string }): Promise<{ message: string; user: IUsuario }> {
        try {
            const response = await axios.post(`${this.apiUrl}/register`, data);
            return response.data;
        } catch (error: any) {
            throw error.response?.data || { message: 'Error de red o desconocido' };
        }
    }

    async login(data: { email: string; password: string }): Promise<{ message: string; token: string; user: IUsuario }> {
        try {
                const response = await axios.post(`${this.apiUrl}/login`, data);

                const user: IUsuario = response.data.user;

                localStorage.setItem('token', response.data.token);
                localStorage.setItem('user', JSON.stringify(user));

                this.isLoggedInSubject.next(true);
                this.userSubject.next(user);

                return response.data;
            } catch (error: any) {
                throw error.response?.data || { message: 'Error de red o desconocido' };
            }
    }

    logout() {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        this.isLoggedInSubject.next(false);
        this.userSubject.next(null);
        this.router.navigate(['/login'])
    }

    getToken() {
        return localStorage.getItem('token');
    }

    getUser(): IUsuario | null {
        return this.userSubject.value;
    }
}
