import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { catchError, switchMap, throwError } from 'rxjs';

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
                Authorization: `Bearer ${token}`
            }
        });
    }

    return next(authReq).pipe(
        catchError((error: HttpErrorResponse) => {
            // Capture both 401 (Unauthorized) and 403 (Forbidden) as some backends return 403 for expired tokens
            if ((error.status === 401 || error.status === 403) && !req.url.includes('/api/v1/auth/refresh')) {
                return authService.refreshToken().pipe(
                    switchMap((response) => {
                        const newToken = response.data?.token;
                        const retryReq = req.clone({
                            setHeaders: {
                                Authorization: `Bearer ${newToken}`
                            }
                        });
                        return next(retryReq);
                    }),
                    catchError((refreshError) => {
                        authService.logout();
                        return throwError(() => refreshError);
                    })
                );
            }
            return throwError(() => error);
        })
    );
};
