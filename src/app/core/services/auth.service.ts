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


    currentUser = signal<User | null>(this.getUserFromStorage());

    login(request: LoginRequest): Observable<LoginResponse> {
        return this.http.post<LoginResponse>('/api/v1/auth/login', request).pipe(
            tap(response => {
                this.saveAuthData(response);
            })
        );
    }

    register(request: RegisterRequest): Observable<LoginResponse> {
        return this.http.post<LoginResponse>('/api/v1/auth/register', request).pipe(
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




    hasPermission(permission: string): boolean {
        const user = this.currentUser();
        if (!user || !user.permissions) {
            return false;
        }
        return user.permissions.includes(permission);
    }


    hasAnyPermission(permissions: string[]): boolean {
        if (!permissions || permissions.length === 0) {
            return true;
        }
        const user = this.currentUser();
        if (!user || !user.permissions) {
            return false;
        }
        return permissions.some(permission => user.permissions.includes(permission));
    }


    hasAllPermissions(permissions: string[]): boolean {
        if (!permissions || permissions.length === 0) {
            return true;
        }
        const user = this.currentUser();
        if (!user || !user.permissions) {
            return false;
        }
        return permissions.every(permission => user.permissions.includes(permission));
    }


    getUserPermissions(): string[] {
        const user = this.currentUser();
        return user?.permissions || [];
    }


    getUserRoles(): string[] {
        const user = this.currentUser();
        return user?.roles || [];
    }


    hasRole(role: string): boolean {
        const user = this.currentUser();
        if (!user || !user.roles) {
            return false;
        }
        return user.roles.includes(role);
    }


    hasAnyRole(roles: string[]): boolean {
        if (!roles || roles.length === 0) {
            return true;
        }
        const user = this.currentUser();
        if (!user || !user.roles) {
            return false;
        }
        return roles.some(role => user.roles.includes(role));
    }



    private saveAuthData(response: LoginResponse): void {
        localStorage.setItem(this.TOKEN_KEY, response.token);

        const user: User = {
            id: response.id,
            username: response.username,
            email: response.email,
            fullName: response.fullName,
            roles: response.roles || [],
            permissions: response.permissions || [],
            profilePicture: response.profilePicture
        };

        localStorage.setItem(this.USER_KEY, JSON.stringify(user));
        this.currentUser.set(user);
    }

    private getUserFromStorage(): User | null {
        const userJson = localStorage.getItem(this.USER_KEY);
        return userJson ? JSON.parse(userJson) : null;
    }

    updateCurrentUser(user: User): void {
        localStorage.setItem(this.USER_KEY, JSON.stringify(user));
        this.currentUser.set(user);
    }
}
