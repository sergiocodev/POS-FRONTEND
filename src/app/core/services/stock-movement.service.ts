import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { StockMovementRequest, StockMovementResponse } from '../models/inventory.model';

@Injectable({
    providedIn: 'root'
})
export class StockMovementService {
    private http = inject(HttpClient);
    private apiUrl = '/api/v1/stock-movements';

    getAll(): Observable<StockMovementResponse[]> {
        return this.http.get<StockMovementResponse[]>(this.apiUrl);
    }

    getByProduct(productId: number): Observable<StockMovementResponse[]> {
        return this.http.get<StockMovementResponse[]>(`${this.apiUrl}/product/${productId}`);
    }

    getByEstablishment(establishmentId: number): Observable<StockMovementResponse[]> {
        return this.http.get<StockMovementResponse[]>(`${this.apiUrl}/establishment/${establishmentId}`);
    }

    getByLot(lotId: number): Observable<StockMovementResponse[]> {
        return this.http.get<StockMovementResponse[]>(`${this.apiUrl}/lot/${lotId}`);
    }

    create(request: StockMovementRequest): Observable<StockMovementResponse> {
        return this.http.post<StockMovementResponse>(this.apiUrl, request);
    }
}
