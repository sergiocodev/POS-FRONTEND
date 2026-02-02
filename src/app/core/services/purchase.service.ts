import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { PurchaseRequest, PurchaseResponse } from '../models/purchase.model';

@Injectable({
    providedIn: 'root'
})
export class PurchaseService {
    private http = inject(HttpClient);
    private apiUrl = '/api/v1/purchases';

    create(request: PurchaseRequest, userId: number): Observable<PurchaseResponse> {
        return this.http.post<PurchaseResponse>(`${this.apiUrl}?userId=${userId}`, request);
    }

    getAll(): Observable<PurchaseResponse[]> {
        return this.http.get<PurchaseResponse[]>(this.apiUrl);
    }

    getById(id: number): Observable<PurchaseResponse> {
        return this.http.get<PurchaseResponse>(`${this.apiUrl}/${id}`);
    }

    cancel(id: number): Observable<void> {
        return this.http.post<void>(`${this.apiUrl}/${id}/cancel`, {});
    }
}
