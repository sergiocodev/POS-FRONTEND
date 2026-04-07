import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ResponseApi } from '../models/response-api.model';
import { StockTransferRequest, StockTransferResponse } from '../models/stock-transfer.model';

@Injectable({
    providedIn: 'root'
})
export class StockTransferService {
    private http = inject(HttpClient);
    private apiUrl = '/api/v1/stock-transfers';

    create(request: StockTransferRequest): Observable<StockTransferResponse> {
        return this.http.post<StockTransferResponse>(this.apiUrl, request);
    }

    getById(id: number): Observable<StockTransferResponse> {
        return this.http.get<StockTransferResponse>(`${this.apiUrl}/${id}`);
    }

    getBySourceEstablishmentId(establishmentId: number): Observable<StockTransferResponse[]> {
        return this.http.get<StockTransferResponse[]>(`${this.apiUrl}/source/${establishmentId}`);
    }

    getByTargetEstablishmentId(establishmentId: number): Observable<StockTransferResponse[]> {
        return this.http.get<StockTransferResponse[]>(`${this.apiUrl}/target/${establishmentId}`);
    }

    dispatchTransfer(id: number): Observable<StockTransferResponse> {
        return this.http.put<StockTransferResponse>(`${this.apiUrl}/${id}/dispatch`, {});
    }

    receiveTransfer(id: number): Observable<StockTransferResponse> {
        return this.http.put<StockTransferResponse>(`${this.apiUrl}/${id}/receive`, {});
    }

    cancelTransfer(id: number): Observable<StockTransferResponse> {
        return this.http.delete<StockTransferResponse>(`${this.apiUrl}/${id}`);
    }
}
