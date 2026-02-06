import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ProductRequest, ProductResponse } from '../models/product.model';
import { ResponseApi } from '../models/response-api.model';

@Injectable({
    providedIn: 'root'
})
export class ProductService {
    private http = inject(HttpClient);
    private apiUrl = '/api/v1/products';

    getAll(categoryId?: number, brandId?: number, active?: boolean): Observable<ResponseApi<ProductResponse[]>> {
        let params = '';
        const queryParams: string[] = [];
        if (categoryId !== undefined) queryParams.push(`categoryId=${categoryId}`);
        if (brandId !== undefined) queryParams.push(`brandId=${brandId}`);
        if (active !== undefined) queryParams.push(`active=${active}`);
        if (queryParams.length > 0) params = '?' + queryParams.join('&');
        return this.http.get<ResponseApi<ProductResponse[]>>(`${this.apiUrl}${params}`);
    }

    getById(id: number): Observable<ResponseApi<ProductResponse>> {
        return this.http.get<ResponseApi<ProductResponse>>(`${this.apiUrl}/${id}`);
    }

    create(request: ProductRequest): Observable<ResponseApi<ProductResponse>> {
        return this.http.post<ResponseApi<ProductResponse>>(this.apiUrl, request);
    }

    update(id: number, request: ProductRequest): Observable<ResponseApi<ProductResponse>> {
        return this.http.put<ResponseApi<ProductResponse>>(`${this.apiUrl}/${id}`, request);
    }

    delete(id: number): Observable<ResponseApi<void>> {
        return this.http.delete<ResponseApi<void>>(`${this.apiUrl}/${id}`);
    }

    search(query: string): Observable<ResponseApi<ProductResponse[]>> {
        return this.http.get<ResponseApi<ProductResponse[]>>(`${this.apiUrl}/search?query=${encodeURIComponent(query)}`);
    }

    getLots(id: number): Observable<ResponseApi<any[]>> {
        return this.http.get<ResponseApi<any[]>>(`${this.apiUrl}/${id}/lots`);
    }
}
