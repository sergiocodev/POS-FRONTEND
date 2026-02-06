import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { PurchaseRequest, PurchaseResponse } from '../models/purchase.model';
import { ResponseApi } from '../models/response-api.model';

@Injectable({
    providedIn: 'root'
})
export class PurchaseService {
    private http = inject(HttpClient);
    private apiUrl = '/api/v1/purchases';

    create(request: PurchaseRequest, userId: number): Observable<ResponseApi<PurchaseResponse>> {
        return this.http.post<ResponseApi<PurchaseResponse>>(`${this.apiUrl}?userId=${userId}`, request);
    }

    getAll(): Observable<ResponseApi<PurchaseResponse[]>> {
        return this.http.get<ResponseApi<PurchaseResponse[]>>(this.apiUrl);
    }

    getById(id: number): Observable<ResponseApi<PurchaseResponse>> {
        return this.http.get<ResponseApi<PurchaseResponse>>(`${this.apiUrl}/${id}`);
    }

    cancel(id: number): Observable<ResponseApi<void>> {
        return this.http.post<ResponseApi<void>>(`${this.apiUrl}/${id}/cancel`, {});
    }
}
