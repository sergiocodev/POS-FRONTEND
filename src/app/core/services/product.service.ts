import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ProductRequest, ProductResponse } from '../models/product.model';

@Injectable({
    providedIn: 'root'
})
export class ProductService {
    private http = inject(HttpClient);
    private apiUrl = '/api/v1/products';

    getAll(categoryId?: number, brandId?: number, active?: boolean): Observable<ProductResponse[]> {
        let params = '';
        const queryParams: string[] = [];
        if (categoryId !== undefined) queryParams.push(`categoryId=${categoryId}`);
        if (brandId !== undefined) queryParams.push(`brandId=${brandId}`);
        if (active !== undefined) queryParams.push(`active=${active}`);
        if (queryParams.length > 0) params = '?' + queryParams.join('&');
        return this.http.get<ProductResponse[]>(`${this.apiUrl}${params}`);
    }

    getById(id: number): Observable<ProductResponse> {
        return this.http.get<ProductResponse>(`${this.apiUrl}/${id}`);
    }

    create(request: ProductRequest): Observable<ProductResponse> {
        return this.http.post<ProductResponse>(this.apiUrl, request);
    }

    update(id: number, request: ProductRequest): Observable<ProductResponse> {
        return this.http.put<ProductResponse>(`${this.apiUrl}/${id}`, request);
    }

    delete(id: number): Observable<void> {
        return this.http.delete<void>(`${this.apiUrl}/${id}`);
    }

    search(query: string): Observable<ProductResponse[]> {
        return this.http.get<ProductResponse[]>(`${this.apiUrl}/search?query=${encodeURIComponent(query)}`);
    }

    getLots(id: number): Observable<any[]> {
        return this.http.get<any[]>(`${this.apiUrl}/${id}/lots`);
    }
}
