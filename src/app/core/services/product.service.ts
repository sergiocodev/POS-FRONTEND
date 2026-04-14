import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ProductRequest, ProductResponse } from '../models/product.model';
import { ProductLotResponse } from '../models/inventory.model';
import { ResponseApi } from '../models/response-api.model';

@Injectable({
    providedIn: 'root'
})
export class ProductService {
    private http = inject(HttpClient);
    private apiUrl = '/api/v1/products';

    getAll(categoryId?: number, brandId?: number): Observable<ResponseApi<ProductResponse[]>> {
        let params = new HttpParams();
        if (categoryId !== undefined) params = params.set('categoryId', categoryId);
        if (brandId !== undefined) params = params.set('brandId', brandId);
        return this.http.get<ResponseApi<ProductResponse[]>>(`${this.apiUrl}/GetAllProducts`, { params });
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
        return this.http.get<ResponseApi<ProductResponse[]>>(`${this.apiUrl}/search`, {
            params: new HttpParams().set('query', query)
        });
    }

    getLots(id: number): Observable<ResponseApi<ProductLotResponse[]>> {
        return this.http.get<ResponseApi<ProductLotResponse[]>>(`${this.apiUrl}/${id}/lots`);
    }

}
