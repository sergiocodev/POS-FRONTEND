import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { CustomerRequest, CustomerResponse, ExternalLookupResponse } from '../models/customer.model';
import { ResponseApi } from '../models/response-api.model';

@Injectable({
    providedIn: 'root'
})
export class CustomerService {
    private http = inject(HttpClient);
    private apiUrl = '/api/v1/customers';

    getAll(): Observable<ResponseApi<CustomerResponse[]>> {
        return this.http.get<ResponseApi<CustomerResponse[]>>(this.apiUrl);
    }

    getById(id: number): Observable<ResponseApi<CustomerResponse>> {
        return this.http.get<ResponseApi<CustomerResponse>>(`${this.apiUrl}/${id}`);
    }

    create(request: CustomerRequest): Observable<ResponseApi<CustomerResponse>> {
        return this.http.post<ResponseApi<CustomerResponse>>(this.apiUrl, request);
    }

    update(id: number, request: CustomerRequest): Observable<ResponseApi<CustomerResponse>> {
        return this.http.put<ResponseApi<CustomerResponse>>(`${this.apiUrl}/${id}`, request);
    }

    delete(id: number): Observable<ResponseApi<void>> {
        return this.http.delete<ResponseApi<void>>(`${this.apiUrl}/${id}`);
    }

    searchByDocument(documentNumber: string): Observable<ResponseApi<ExternalLookupResponse>> {
        return this.http.get<ResponseApi<ExternalLookupResponse>>(`/api/v1/users/search/${documentNumber}`);
    }
}
