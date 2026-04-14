import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { LoginRequest, LoginResponse, RegisterRequest, User } from '../models/auth.model';
import { ResponseApi } from '../models/response-api.model';
import { Router } from '@angular/router';

@Injectable({
    providedIn: 'root'
})
export class AuthService {
    private http = inject(HttpClient);
    private router = inject(Router);

    // SECURITY: Access token in sessionStorage (cleared on tab close, not shared across tabs)
    // Refresh token in localStorage (needed for background refresh)
    // This mitigates XSS impact — access token is gone when tab closes
    private readonly TOKEN_KEY = 'auth_token'; // sessionStorage
    private readonly REFRESH_TOKEN_KEY = 'refresh_token'; // localStorage
    private readonly USER_KEY = 'current_user'; // sessionStorage

    currentUser = signal<User | null>(this.getUserFromStorage());

    login(request: LoginRequest): Observable<ResponseApi<LoginResponse>> {
        return this.http.post<ResponseApi<LoginResponse>>('/api/v1/auth/login', request).pipe(
            tap(response => {
                if (response.status === 200 && response.data) {
                    this.saveAuthData(response.data);
                }
            })
        );
    }

    register(request: RegisterRequest): Observable<ResponseApi<LoginResponse>> {
        return this.http.post<ResponseApi<LoginResponse>>('/api/v1/auth/register', request).pipe(
            tap(response => {
                if (response.status === 201 && response.data) {
                    this.saveAuthData(response.data);
                }
            })
        );
    }

    logout(): void {
        sessionStorage.removeItem(this.TOKEN_KEY);
        localStorage.removeItem(this.REFRESH_TOKEN_KEY);
        sessionStorage.removeItem(this.USER_KEY);
        this.currentUser.set(null);
        this.router.navigate(['/login']);
    }

    /**
     * Get access token from sessionStorage (not localStorage).
     * SessionStorage is cleared when the tab closes, limiting XSS exposure.
     */
    getToken(): string | null {
        try {
            return sessionStorage.getItem(this.TOKEN_KEY);
        } catch {
            return null;
        }
    }

    getRefreshToken(): string | null {
        try {
            return localStorage.getItem(this.REFRESH_TOKEN_KEY);
        } catch {
            return null;
        }
    }

    refreshToken(): Observable<ResponseApi<LoginResponse>> {
        const refreshToken = this.getRefreshToken();
        if (!refreshToken) {
            this.logout();
            throw new Error('No refresh token available');
        }

        return this.http.post<ResponseApi<LoginResponse>>('/api/v1/auth/refresh', { refreshToken }).pipe(
            tap(response => {
                if (response.status === 200 && response.data) {
                    this.saveAuthData(response.data);
                } else {
                    this.logout();
                }
            })
        );
    }

    isAuthenticated(): boolean {
        const token = this.getToken();
        if (!token) return false;
        // Check if JWT is expired by decoding the payload
        try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            return payload.exp * 1000 > Date.now();
        } catch {
            return false;
        }
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
        // Access token → sessionStorage (cleared on tab close)
        sessionStorage.setItem(this.TOKEN_KEY, response.token);
        // Refresh token → localStorage (needed for background refresh across sessions)
        if (response.refreshToken) {
            localStorage.setItem(this.REFRESH_TOKEN_KEY, response.refreshToken);
        }

        const user: User = {
            id: response.id,
            username: response.username,
            email: response.email,
            fullName: response.fullName,
            roles: response.roles || [],
            permissions: response.permissions || [],
            profilePicture: response.profilePicture
        };

        // User data → sessionStorage (synced with access token lifecycle)
        sessionStorage.setItem(this.USER_KEY, JSON.stringify(user));
        this.currentUser.set(user);
    }

    private getUserFromStorage(): User | null {
        try {
            const userJson = sessionStorage.getItem(this.USER_KEY);
            return userJson ? JSON.parse(userJson) : null;
        } catch {
            sessionStorage.removeItem(this.USER_KEY);
            return null;
        }
    }

    updateCurrentUser(user: User): void {
        sessionStorage.setItem(this.USER_KEY, JSON.stringify(user));
        this.currentUser.set(user);
    }
}
