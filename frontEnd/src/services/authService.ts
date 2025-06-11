import { Injectable } from '@angular/core';
import axios from 'axios';

@Injectable({
  providedIn: 'root'
})

export class AuthService {
    private apiUrl = 'http://localhost:3000/api/auth';

    constructor() {}

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
            return response.data;
        }catch (error: any) {
            throw error.response?.data || { message: 'Error de red o desconocido' };
        }
    }
}
