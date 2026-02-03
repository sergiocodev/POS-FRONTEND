import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
    InventoryResponse, InventoryRequest,
    ProductLotResponse, ProductLotRequest,
    StockMovementResponse, StockMovementRequest
} from '../models/inventory.model';

@Injectable({
    providedIn: 'root'
})
export class InventoryService {
    private http = inject(HttpClient);

    
    private inventoryUrl = '/api/v1/inventory';
    private lotsUrl = '/api/v1/product-lots';
    private movementsUrl = '/api/v1/stock-movements';

    
    getAllStock(): Observable<InventoryResponse[]> {
        return this.http.get<InventoryResponse[]>(this.inventoryUrl);
    }

    getStockByEstablishment(establishmentId: number): Observable<InventoryResponse[]> {
        return this.http.get<InventoryResponse[]>(`${this.inventoryUrl}/establishment/${establishmentId}`);
    }

    updateStock(request: InventoryRequest): Observable<InventoryResponse> {
        return this.http.post<InventoryResponse>(`${this.inventoryUrl}/update`, request);
    }

    adjustStock(request: InventoryRequest): Observable<InventoryResponse> {
        return this.http.post<InventoryResponse>(`${this.inventoryUrl}/adjustments`, request);
    }

    getAlerts(): Observable<InventoryResponse[]> {
        return this.http.get<InventoryResponse[]>(`${this.inventoryUrl}/alerts`);
    }

    getLowStock(): Observable<InventoryResponse[]> {
        return this.http.get<InventoryResponse[]>(`${this.inventoryUrl}/low-stock`);
    }

    getById(id: number): Observable<InventoryResponse> {
        return this.http.get<InventoryResponse>(`${this.inventoryUrl}/${id}`);
    }

    
    getAllLots(): Observable<ProductLotResponse[]> {
        return this.http.get<ProductLotResponse[]>(this.lotsUrl);
    }

    getLotsByProduct(productId: number): Observable<ProductLotResponse[]> {
        return this.http.get<ProductLotResponse[]>(`${this.lotsUrl}/product/${productId}`);
    }

    createLot(request: ProductLotRequest): Observable<ProductLotResponse> {
        return this.http.post<ProductLotResponse>(this.lotsUrl, request);
    }

    deleteLot(id: number): Observable<void> {
        return this.http.delete<void>(`${this.lotsUrl}/${id}`);
    }

    
    getMovements(): Observable<StockMovementResponse[]> {
        return this.http.get<StockMovementResponse[]>(this.movementsUrl);
    }

    getMovementsByEstablishment(establishmentId: number): Observable<StockMovementResponse[]> {
        return this.http.get<StockMovementResponse[]>(`${this.movementsUrl}/establishment/${establishmentId}`);
    }

    createMovement(request: StockMovementRequest): Observable<StockMovementResponse> {
        return this.http.post<StockMovementResponse>(this.movementsUrl, request);
    }
}
