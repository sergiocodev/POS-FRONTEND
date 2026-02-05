import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { CustomerRequest, CustomerResponse, ExternalLookupResponse } from '../models/customer.model';

@Injectable({
    providedIn: 'root'
})
export class CustomerService {
    private http = inject(HttpClient);
    private apiUrl = '/api/v1/customers';

    getAll(): Observable<CustomerResponse[]> {
        return this.http.get<CustomerResponse[]>(this.apiUrl);
    }

    getById(id: number): Observable<CustomerResponse> {
        return this.http.get<CustomerResponse>(`${this.apiUrl}/${id}`);
    }

    create(request: CustomerRequest): Observable<CustomerResponse> {
        return this.http.post<CustomerResponse>(this.apiUrl, request);
    }

    update(id: number, request: CustomerRequest): Observable<CustomerResponse> {
        return this.http.put<CustomerResponse>(`${this.apiUrl}/${id}`, request);
    }

    delete(id: number): Observable<void> {
        return this.http.delete<void>(`${this.apiUrl}/${id}`);
    }

    searchByDocument(documentNumber: string): Observable<ExternalLookupResponse> {
        return this.http.get<ExternalLookupResponse>(`/api/v1/users/search/${documentNumber}`);
    }
}
