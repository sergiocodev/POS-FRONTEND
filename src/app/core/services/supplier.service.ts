import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { SupplierRequest, SupplierResponse } from '../models/supplier.model';

@Injectable({
    providedIn: 'root'
})
export class SupplierService {
    private http = inject(HttpClient);
    private apiUrl = '/api/suppliers';

    getAll(): Observable<SupplierResponse[]> {
        return this.http.get<SupplierResponse[]>(this.apiUrl);
    }

    getById(id: number): Observable<SupplierResponse> {
        return this.http.get<SupplierResponse>(`${this.apiUrl}/${id}`);
    }

    create(request: SupplierRequest): Observable<SupplierResponse> {
        return this.http.post<SupplierResponse>(this.apiUrl, request);
    }

    update(id: number, request: SupplierRequest): Observable<SupplierResponse> {
        return this.http.put<SupplierResponse>(`${this.apiUrl}/${id}`, request);
    }

    delete(id: number): Observable<void> {
        return this.http.delete<void>(`${this.apiUrl}/${id}`);
    }
}
