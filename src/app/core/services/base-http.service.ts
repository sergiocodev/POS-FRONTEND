import { inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, catchError, throwError } from 'rxjs';
import { ResponseApi } from '../models/response-api.model';
import { Page } from '../models/pagination.model';
import { environment } from '../../../environments/environment';


/**
 * Base service providing common HTTP patterns: paginated requests, error handling.
 * Extend this class for entity services to avoid duplicating boilerplate.
 *
 * Example:
 * ```typescript
 * @Injectable({ providedIn: 'root' })
 * export class BrandService extends BaseHttpService<BrandResponse> {
 *   protected override readonly apiUrl = `${environment.apiUrl}/brands`;
 * }
 * ```
 *
 * Note: This class is NOT @Injectable itself. It is meant to be extended
 * by concrete services that provide their own @Injectable decorator.
 */
export abstract class BaseHttpService<T> {
    protected http = inject(HttpClient);
    protected abstract apiUrl: string;

    /**
     * Get all items.
     */
    getAll(): Observable<ResponseApi<T[]>> {
        return this.http.get<ResponseApi<T[]>>(this.apiUrl).pipe(
            catchError(this.handleError)
        );
    }

    /**
     * Get paginated results.
     */
    getPaged(page: number = 0, size: number = 20, filters?: Record<string, any>): Observable<ResponseApi<Page<T>>> {
        let params = new HttpParams()
            .set('page', page)
            .set('size', size);

        if (filters) {
            Object.entries(filters).forEach(([key, value]) => {
                if (value !== undefined && value !== null) {
                    params = params.set(key, value);
                }
            });
        }

        return this.http.get<ResponseApi<Page<T>>>(this.apiUrl, { params }).pipe(
            catchError(this.handleError)
        );
    }

    /**
     * Get single item by ID.
     */
    getById(id: number | string): Observable<ResponseApi<T>> {
        return this.http.get<ResponseApi<T>>(`${this.apiUrl}/${id}`).pipe(
            catchError(this.handleError)
        );
    }

    /**
     * Create a new item.
     */
    create(body: any): Observable<ResponseApi<T>> {
        return this.http.post<ResponseApi<T>>(this.apiUrl, body).pipe(
            catchError(this.handleError)
        );
    }

    /**
     * Update an existing item.
     */
    update(id: number | string, body: any): Observable<ResponseApi<T>> {
        return this.http.put<ResponseApi<T>>(`${this.apiUrl}/${id}`, body).pipe(
            catchError(this.handleError)
        );
    }

    /**
     * Delete an item.
     */
    delete(id: number | string): Observable<ResponseApi<void>> {
        return this.http.delete<ResponseApi<void>>(`${this.apiUrl}/${id}`).pipe(
            catchError(this.handleError)
        );
    }

    /**
     * Centralized error handler — logs and re-throws a user-friendly message.
     */
    protected handleError(error: any): Observable<never> {
        let message = 'Error inesperado';
        if (error?.error?.message) {
            message = error.error.message;
        } else if (typeof error === 'string') {
            message = error;
        }
        console.error(`[HTTP Error] ${error?.status ?? 'unknown'}: ${message}`, error);
        return throwError(() => ({ message, status: error?.status }));
    }
}
