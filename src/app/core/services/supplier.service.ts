import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, shareReplay } from 'rxjs';
import { SupplierRequest, SupplierResponse, SupplierSummaryResponse, SupplierDetailResponse } from '../models/supplier.model';
import { ResponseApi } from '../models/response-api.model';
import { Page } from '../models/pagination.model';
import { HttpParams } from '@angular/common/http';
import { environment } from '../../../environments/environment';

@Injectable({
    providedIn: 'root'
})
export class SupplierService {
    private http = inject(HttpClient);
    private apiUrl = `${environment.apiUrl}/suppliers`;

    private cache$?: Observable<ResponseApi<SupplierResponse[]>>;

    getAll(): Observable<ResponseApi<SupplierResponse[]>> {
        if (!this.cache$) {
            this.cache$ = this.http.get<ResponseApi<SupplierResponse[]>>(this.apiUrl).pipe(shareReplay(1));
        }
        return this.cache$;
    }

    getPaged(page: number, size: number, filters: any = {}): Observable<ResponseApi<Page<SupplierDetailResponse>>> {
        let params = new HttpParams()
            .set('page', page.toString())
            .set('size', size.toString());
            
        if (filters.providerInfo) params = params.set('providerInfo', filters.providerInfo);
        if (filters.category) params = params.set('category', filters.category);
        if (filters.contactInfo) params = params.set('contactInfo', filters.contactInfo);
        
        return this.http.get<ResponseApi<Page<SupplierDetailResponse>>>(`${this.apiUrl}/paged`, { params });
    }

    getSummary(): Observable<ResponseApi<SupplierSummaryResponse>> {
        return this.http.get<ResponseApi<SupplierSummaryResponse>>(`${this.apiUrl}/summary`);
    }

    getById(id: number): Observable<ResponseApi<SupplierResponse>> {
        return this.http.get<ResponseApi<SupplierResponse>>(`${this.apiUrl}/${id}`);
    }

    create(request: SupplierRequest): Observable<ResponseApi<SupplierResponse>> {
        return this.http.post<ResponseApi<SupplierResponse>>(this.apiUrl, request);
    }

    update(id: number, request: SupplierRequest): Observable<ResponseApi<SupplierResponse>> {
        return this.http.put<ResponseApi<SupplierResponse>>(`${this.apiUrl}/${id}`, request);
    }

    delete(id: number): Observable<ResponseApi<void>> {
        return this.http.delete<ResponseApi<void>>(`${this.apiUrl}/${id}`);
    }

    searchByDocument(documentNumber: string): Observable<ResponseApi<any>> {
        return this.http.get<ResponseApi<any>>(`${environment.apiUrl}/users/search/${documentNumber}`);
    }

    invalidateCache(): void {
        this.cache$ = undefined;
    }
}
