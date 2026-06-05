import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { StockMovementRequest, StockMovementResponse } from '../models/inventory.model';
import { ResponseApi } from '../models/response-api.model';
import { environment } from '../../../environments/environment';

@Injectable({
    providedIn: 'root'
})
export class StockMovementService {
    private http = inject(HttpClient);
    private apiUrl = `${environment.apiUrl}/stock-movements`;

    getAll(): Observable<ResponseApi<StockMovementResponse[]>> {
        return this.http.get<ResponseApi<StockMovementResponse[]>>(this.apiUrl);
    }

    getByProduct(productId: number): Observable<ResponseApi<StockMovementResponse[]>> {
        return this.http.get<ResponseApi<StockMovementResponse[]>>(`${this.apiUrl}/product/${productId}`);
    }

    getByEstablishment(establishmentId: number): Observable<ResponseApi<StockMovementResponse[]>> {
        return this.http.get<ResponseApi<StockMovementResponse[]>>(`${this.apiUrl}/establishment/${establishmentId}`);
    }

    getByLot(lotId: number): Observable<ResponseApi<StockMovementResponse[]>> {
        return this.http.get<ResponseApi<StockMovementResponse[]>>(`${this.apiUrl}/lot/${lotId}`);
    }

    create(request: StockMovementRequest): Observable<ResponseApi<StockMovementResponse>> {
        return this.http.post<ResponseApi<StockMovementResponse>>(this.apiUrl, request);
    }
}
