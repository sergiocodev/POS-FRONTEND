import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { SupplierRequest, SupplierResponse } from '../models/supplier.model';
import { ResponseApi } from '../models/response-api.model';

@Injectable({
    providedIn: 'root'
})
export class SupplierService {
    private http = inject(HttpClient);
    private apiUrl = '/api/v1/suppliers';

    getAll(): Observable<ResponseApi<SupplierResponse[]>> {
        return this.http.get<ResponseApi<SupplierResponse[]>>(this.apiUrl);
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
}
