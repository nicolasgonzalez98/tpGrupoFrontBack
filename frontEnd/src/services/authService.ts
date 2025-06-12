import { Injectable } from '@angular/core';
import axios from 'axios';
import { BehaviorSubject } from 'rxjs';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})

export class AuthService {
    private apiUrl = 'http://localhost:3000/api/auth';

    private isLoggedInSubject = new BehaviorSubject<boolean>(this.isLoggedIn());
    private userSubject = new BehaviorSubject<any>(this.getUserFromStorage());

    isLoggedIn$ = this.isLoggedInSubject.asObservable();
    user$ = this.userSubject.asObservable();

    constructor(private router:Router) {}

    public isLoggedIn(): boolean {
        const token = localStorage.getItem('token');
        return token !== null && token !== '';
    }

    private getUserFromStorage() {
        const user = localStorage.getItem('user');
        return user ? JSON.parse(user) : null;
    }

    async register(data: { nombre: string; email: string; password: string }): Promise<any> {
        try{
            const response = await axios.post(`${this.apiUrl}/register`, data);
            return response.data;
        }catch (error: any) {
            throw error.response?.data || { message: 'Error de red o desconocido' };
        }
    }

    async login(data: { email: string; password: string }): Promise<any> {
        try{
            const response = await axios.post(`${this.apiUrl}/login`, data);

            localStorage.setItem('token', response.data.token);
            localStorage.setItem('user', JSON.stringify(response.data.user));

            this.isLoggedInSubject.next(true);
            this.userSubject.next(response.data.user);

            return response.data;
        }catch (error: any) {
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

    getUser() {
        return this.userSubject.value;
    }
}
