import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { CashMovement, CashMovementRequest } from '../../core/models/cash-movement.model';
import { ResponseApi } from '../../core/models/response-api.model';
import { environment } from '../../../environments/environment';

@Injectable({
    providedIn: 'root'
})
export class CashMovementService {
    private http = inject(HttpClient);
    private apiUrl = `${environment.apiUrl}/cash-movements`;

    getAll(page: number = 0, size: number = 10, filters: any = {}): Observable<ResponseApi<any>> {
        let params = new HttpParams()
            .set('page', page.toString())
            .set('size', size.toString())
            .set('sort', 'createdAt,desc');
            
        if (filters.createdAt) params = params.set('createdAt', filters.createdAt);
        if (filters.conceptName) params = params.set('conceptName', filters.conceptName);
        if (filters.description) params = params.set('description', filters.description);
        if (filters.type) params = params.set('type', filters.type);
        if (filters.reference) params = params.set('reference', filters.reference);
        if (filters.username) params = params.set('username', filters.username);
        if (filters.establishmentId) params = params.set('establishmentId', filters.establishmentId);
            
        return this.http.get<ResponseApi<any>>(this.apiUrl, { params });
    }

    getBySession(sessionId: number): Observable<ResponseApi<CashMovement[]>> {
        return this.http.get<ResponseApi<CashMovement[]>>(`${this.apiUrl}/session/${sessionId}`);
    }

    create(request: CashMovementRequest): Observable<ResponseApi<CashMovement>> {
        return this.http.post<ResponseApi<CashMovement>>(this.apiUrl, request);
    }

    getById(id: number): Observable<ResponseApi<CashMovement>> {
        return this.http.get<ResponseApi<CashMovement>>(`${this.apiUrl}/${id}`);
    }

    delete(id: number): Observable<ResponseApi<void>> {
        return this.http.delete<ResponseApi<void>>(`${this.apiUrl}/${id}`);
    }
}
