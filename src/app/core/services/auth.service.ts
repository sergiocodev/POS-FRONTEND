import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { LoginRequest, LoginResponse, RegisterRequest, User } from '../models/auth.model';
import { Router } from '@angular/router';

@Injectable({
    providedIn: 'root'
})
export class AuthService {
    private http = inject(HttpClient);
    private router = inject(Router);

    private readonly TOKEN_KEY = 'auth_token';
    private readonly USER_KEY = 'current_user';

    // Signal to track authentication state
    currentUser = signal<User | null>(this.getUserFromStorage());

    login(request: LoginRequest): Observable<LoginResponse> {
        return this.http.post<LoginResponse>('/api/auth/login', request).pipe(
            tap(response => {
                this.saveAuthData(response);
            })
        );
    }

    register(request: RegisterRequest): Observable<LoginResponse> {
        return this.http.post<LoginResponse>('/api/auth/register', request).pipe(
            tap(response => {
                this.saveAuthData(response);
            })
        );
    }

    logout(): void {
        localStorage.removeItem(this.TOKEN_KEY);
        localStorage.removeItem(this.USER_KEY);
        this.currentUser.set(null);
        this.router.navigate(['/login']);
    }

    getToken(): string | null {
        return localStorage.getItem(this.TOKEN_KEY);
    }

    isAuthenticated(): boolean {
        return !!this.getToken();
    }

    private saveAuthData(response: LoginResponse): void {
        localStorage.setItem(this.TOKEN_KEY, response.token);

        const user: User = {
            id: response.id,
            username: response.username,
            email: response.email,
            nombre: response.nombre,
            rol: response.rol
        };

        localStorage.setItem(this.USER_KEY, JSON.stringify(user));
        this.currentUser.set(user);
    }

    private getUserFromStorage(): User | null {
        const userJson = localStorage.getItem(this.USER_KEY);
        return userJson ? JSON.parse(userJson) : null;
    }
}
