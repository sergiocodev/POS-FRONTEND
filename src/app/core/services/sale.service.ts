import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { SaleRequest, SaleResponse, EstablishmentResponse } from '../models/sale.model';

@Injectable({
    providedIn: 'root'
})
export class SaleService {
    private http = inject(HttpClient);
    private apiUrl = '/api/sales';

    create(request: SaleRequest): Observable<SaleResponse> {
        return this.http.post<SaleResponse>(this.apiUrl, request);
    }

    getAll(): Observable<SaleResponse[]> {
        return this.http.get<SaleResponse[]>(this.apiUrl);
    }

    getById(id: number): Observable<SaleResponse> {
        return this.http.get<SaleResponse>(`${this.apiUrl}/${id}`);
    }

    cancel(id: number): Observable<void> {
        return this.http.post<void>(`${this.apiUrl}/${id}/cancel`, {});
    }

    getEstablishments(): Observable<EstablishmentResponse[]> {
        return this.http.get<EstablishmentResponse[]>('/api/establishments');
    }
}
