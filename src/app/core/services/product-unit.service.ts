import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ProductUnitRequest, ProductUnitResponse } from '../models/product.model';
import { ResponseApi } from '../models/response-api.model';
import { environment } from '../../../environments/environment';

@Injectable({
    providedIn: 'root'
})
export class ProductUnitService {
    private http = inject(HttpClient);
    private apiUrl = `${environment.apiUrl}/product-units`;

    create(request: ProductUnitRequest): Observable<ProductUnitResponse> {
        return this.http.post<ProductUnitResponse>(this.apiUrl, request);
    }

    getByProductId(productId: number): Observable<ProductUnitResponse[]> {
        return this.http.get<ProductUnitResponse[]>(`${this.apiUrl}/product/${productId}`);
    }

    getById(id: number): Observable<ProductUnitResponse> {
        return this.http.get<ProductUnitResponse>(`${this.apiUrl}/${id}`);
    }

    getByBarcode(barcode: string): Observable<ProductUnitResponse> {
        return this.http.get<ProductUnitResponse>(`${this.apiUrl}/barcode/${barcode}`);
    }

    update(id: number, request: ProductUnitRequest): Observable<ProductUnitResponse> {
        return this.http.put<ProductUnitResponse>(`${this.apiUrl}/${id}`, request);
    }

    delete(id: number): Observable<void> {
        return this.http.delete<void>(`${this.apiUrl}/${id}`);
    }
}
