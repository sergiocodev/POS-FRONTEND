import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
    InventoryResponse, InventoryRequest,
    ProductLotResponse, ProductLotRequest,
    StockMovementResponse, StockMovementRequest
} from '../models/inventory.model';
import { ResponseApi } from '../models/response-api.model';

@Injectable({
    providedIn: 'root'
})
export class InventoryService {
    private http = inject(HttpClient);


    private inventoryUrl = '/api/v1/inventory';
    private lotsUrl = '/api/v1/product-lots';
    private movementsUrl = '/api/v1/stock-movements';


    getAllStock(): Observable<ResponseApi<InventoryResponse[]>> {
        return this.http.get<ResponseApi<InventoryResponse[]>>(this.inventoryUrl);
    }

    getStockByEstablishment(establishmentId: number, page: number = 0, size: number = 10, filters: any = {}): Observable<ResponseApi<any>> {
        let params = new HttpParams()
            .set('page', page.toString())
            .set('size', size.toString());
        
        Object.keys(filters).forEach(key => {
            if (filters[key] !== null && filters[key] !== undefined && filters[key] !== '') {
                params = params.set(key, filters[key]);
            }
        });

        return this.http.get<ResponseApi<any>>(`${this.inventoryUrl}/establishment/${establishmentId}/paged`, { params });
    }

    updateStock(request: InventoryRequest): Observable<ResponseApi<InventoryResponse>> {
        return this.http.post<ResponseApi<InventoryResponse>>(`${this.inventoryUrl}/update`, request);
    }

    adjustStock(request: InventoryRequest): Observable<ResponseApi<InventoryResponse>> {
        return this.http.post<ResponseApi<InventoryResponse>>(`${this.inventoryUrl}/adjustments`, request);
    }

    getAlerts(): Observable<ResponseApi<InventoryResponse[]>> {
        return this.http.get<ResponseApi<InventoryResponse[]>>(`${this.inventoryUrl}/alerts`);
    }

    getLowStock(): Observable<ResponseApi<InventoryResponse[]>> {
        return this.http.get<ResponseApi<InventoryResponse[]>>(`${this.inventoryUrl}/low-stock`);
    }

    getById(id: number): Observable<ResponseApi<InventoryResponse>> {
        return this.http.get<ResponseApi<InventoryResponse>>(`${this.inventoryUrl}/${id}`);
    }


    getAllLots(): Observable<ResponseApi<ProductLotResponse[]>> {
        return this.http.get<ResponseApi<ProductLotResponse[]>>(this.lotsUrl);
    }

    getAllLotsPaged(page: number = 0, size: number = 10, filters: any = {}): Observable<ResponseApi<any>> {
        let params = new HttpParams()
            .set('page', page.toString())
            .set('size', size.toString());

        Object.keys(filters).forEach(key => {
            if (filters[key] !== null && filters[key] !== undefined && filters[key] !== '') {
                params = params.set(key, filters[key]);
            }
        });

        return this.http.get<ResponseApi<any>>(`${this.lotsUrl}/paged`, { params });
    }

    getLotsByProduct(productId: number): Observable<ResponseApi<ProductLotResponse[]>> {
        return this.http.get<ResponseApi<ProductLotResponse[]>>(`${this.lotsUrl}/product/${productId}`);
    }

    createLot(request: ProductLotRequest): Observable<ResponseApi<ProductLotResponse>> {
        return this.http.post<ResponseApi<ProductLotResponse>>(this.lotsUrl, request);
    }

    deleteLot(id: number): Observable<ResponseApi<void>> {
        return this.http.delete<ResponseApi<void>>(`${this.lotsUrl}/${id}`);
    }


    getMovements(): Observable<ResponseApi<StockMovementResponse[]>> {
        return this.http.get<ResponseApi<StockMovementResponse[]>>(this.movementsUrl);
    }

    getMovementsByEstablishment(establishmentId: number): Observable<ResponseApi<StockMovementResponse[]>> {
        return this.http.get<ResponseApi<StockMovementResponse[]>>(`${this.movementsUrl}/establishment/${establishmentId}`);
    }

    getMovementsByEstablishmentPaged(establishmentId: number, page: number = 0, size: number = 10, filters: any = {}): Observable<ResponseApi<any>> {
        let params = new HttpParams()
            .set('page', page.toString())
            .set('size', size.toString());

        Object.keys(filters).forEach(key => {
            if (filters[key] !== null && filters[key] !== undefined && filters[key] !== '') {
                params = params.set(key, filters[key]);
            }
        });

        return this.http.get<ResponseApi<any>>(`${this.movementsUrl}/establishment/${establishmentId}/paged`, { params });
    }

    createMovement(request: StockMovementRequest): Observable<ResponseApi<StockMovementResponse>> {
        return this.http.post<ResponseApi<StockMovementResponse>>(this.movementsUrl, request);
    }
}
