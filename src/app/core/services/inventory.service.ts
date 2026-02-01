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

    // Inventory Endpoints
    private inventoryUrl = '/api/v1/inventory';
    private lotsUrl = '/api/v1/product-lots';
    private movementsUrl = '/api/v1/stock-movements';

    // Inventory
    getAllStock(): Observable<InventoryResponse[]> {
        return this.http.get<InventoryResponse[]>(this.inventoryUrl);
    }

    getStockByEstablishment(establishmentId: number): Observable<InventoryResponse[]> {
        return this.http.get<InventoryResponse[]>(`${this.inventoryUrl}/establishment/${establishmentId}`);
    }

    updateStock(request: InventoryRequest): Observable<InventoryResponse> {
        return this.http.post<InventoryResponse>(this.inventoryUrl, request);
    }

    // Product Lots
    getLotsByProduct(productId: number): Observable<ProductLotResponse[]> {
        return this.http.get<ProductLotResponse[]>(`${this.lotsUrl}/product/${productId}`);
    }

    createLot(request: ProductLotRequest): Observable<ProductLotResponse> {
        return this.http.post<ProductLotResponse>(this.lotsUrl, request);
    }

    // Stock Movements
    getMovements(): Observable<StockMovementResponse[]> {
        return this.http.get<StockMovementResponse[]>(this.movementsUrl);
    }

    createMovement(request: StockMovementRequest): Observable<StockMovementResponse> {
        return this.http.post<StockMovementResponse>(this.movementsUrl, request);
    }
}
