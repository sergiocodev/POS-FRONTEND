import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { SaleRequest, SaleResponse, EstablishmentResponse } from '../models/sale.model';

@Injectable({
    providedIn: 'root'
})
export class SaleService {
    private http = inject(HttpClient);
    private apiUrl = '/api/v1/sales';

    create(request: SaleRequest, userId: number): Observable<SaleResponse> {
        return this.http.post<SaleResponse>(`${this.apiUrl}?userId=${userId}`, request);
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

    getPdf(id: number): Observable<Blob> {
        return this.http.get(`${this.apiUrl}/${id}/pdf`, { responseType: 'blob' });
    }

    getXml(id: number): Observable<string> {
        return this.http.get(`${this.apiUrl}/${id}/xml`, { responseType: 'text' });
    }

    getCdr(id: number): Observable<string> {
        return this.http.get(`${this.apiUrl}/${id}/cdr`, { responseType: 'text' });
    }

    createCreditNote(id: number, reason: string, userId: number): Observable<SaleResponse> {
        return this.http.post<SaleResponse>(`${this.apiUrl}/${id}/credit-note?reason=${encodeURIComponent(reason)}&userId=${userId}`, {});
    }

    createDebitNote(id: number, reason: string, userId: number): Observable<SaleResponse> {
        return this.http.post<SaleResponse>(`${this.apiUrl}/${id}/debit-note?reason=${encodeURIComponent(reason)}&userId=${userId}`, {});
    }

    invalidate(id: number, reason: string, userId: number): Observable<void> {
        return this.http.post<void>(`${this.apiUrl}/${id}/invalidate?reason=${encodeURIComponent(reason)}&userId=${userId}`, {});
    }

    getEstablishments(): Observable<EstablishmentResponse[]> {
        return this.http.get<EstablishmentResponse[]>('/api/v1/establishments');
    }
}
