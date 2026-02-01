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

    getAll(): Observable<ProductResponse[]> {
        return this.http.get<ProductResponse[]>(this.apiUrl);
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
}
