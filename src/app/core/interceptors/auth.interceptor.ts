import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { catchError, filter, switchMap, take, throwError, BehaviorSubject } from 'rxjs';

let isRefreshing = false;
const refreshTokenSubject = new BehaviorSubject<string | null>(null);

export const authInterceptor: HttpInterceptorFn = (req, next) => {
    const authService = inject(AuthService);
    const token = authService.getToken();

    if (req.url.includes('/api/v1/auth/')) {
        return next(req);
    }

    let authReq = req;
    if (token) {
        authReq = req.clone({
            setHeaders: {
                Authorization: `Bearer ${token}`,
                'X-API-Version': '1'
            }
        });
    } else {
        authReq = req.clone({
            setHeaders: {
                'X-API-Version': '1'
            }
        });
    }

    return next(authReq).pipe(
        catchError((error: HttpErrorResponse) => {
            // Check for blacklisted token (backend sets X-Token-Blacklisted: true)
            // This means the user explicitly logged out — don't attempt refresh
            if (error.headers.get('X-Token-Blacklisted') === 'true') {
                authService.logout();
                return throwError(() => new Error('Session ended. Please log in again.'));
            }

            // Only refresh on 401 (Unauthorized), not 403 (Forbidden)
            // 403 means "authenticated but no permission" — refreshing won't help
            if (error.status === 401 && !req.url.includes('/api/v1/auth/refresh')) {
                if (isRefreshing) {
                    // Queue this request and wait for the new token
                    return refreshTokenSubject.pipe(
                        filter(t => t !== null),
                        take(1),
                        switchMap(newToken => next(req.clone({
                            setHeaders: { Authorization: `Bearer ${newToken}` }
                        })))
                    );
                }

                isRefreshing = true;
                refreshTokenSubject.next(null);

                return authService.refreshToken().pipe(
                    switchMap((response) => {
                        const newToken = response.data?.token;
                        isRefreshing = false;
                        refreshTokenSubject.next(newToken);

                        const retryReq = req.clone({
                            setHeaders: {
                                Authorization: `Bearer ${newToken}`
                            }
                        });
                        return next(retryReq);
                    }),
                    catchError((refreshError) => {
                        isRefreshing = false;
                        refreshTokenSubject.next(null);
                        authService.logout();
                        return throwError(() => refreshError);
                    })
                );
            }
            return throwError(() => error);
        })
    );
};
