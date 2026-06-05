import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, shareReplay } from 'rxjs';
import { CustomerRequest, CustomerResponse, ExternalLookupResponse } from '../models/customer.model';
import { CustomerDashboardResponse } from '../models/customer-dashboard.model';
import { ResponseApi } from '../models/response-api.model';
import { environment } from '../../../environments/environment';

@Injectable({
    providedIn: 'root'
})
export class CustomerService {
    private http = inject(HttpClient);
    private apiUrl = `${environment.apiUrl}/customers`;

    private cache$?: Observable<ResponseApi<CustomerResponse[]>>;

    getAll(): Observable<ResponseApi<CustomerResponse[]>> {
        if (!this.cache$) {
            this.cache$ = this.http.get<ResponseApi<CustomerResponse[]>>(this.apiUrl).pipe(shareReplay(1));
        }
        return this.cache$;
    }

    getAllPaged(page: number, size: number, filters: any = {}): Observable<ResponseApi<any>> {
        let params = `?page=${page}&size=${size}`;
        if (filters.name) params += `&name=${encodeURIComponent(filters.name)}`;
        if (filters.documentNumber) params += `&documentNumber=${encodeURIComponent(filters.documentNumber)}`;
        if (filters.email) params += `&email=${encodeURIComponent(filters.email)}`;
        if (filters.phone) params += `&phone=${encodeURIComponent(filters.phone)}`;

        return this.http.get<ResponseApi<any>>(`${this.apiUrl}/paged${params}`);
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
        return this.http.get<ResponseApi<ExternalLookupResponse>>(`${environment.apiUrl}/users/search/${documentNumber}`);
    }

    getDashboard(): Observable<ResponseApi<CustomerDashboardResponse>> {
        return this.http.get<ResponseApi<CustomerDashboardResponse>>(`${this.apiUrl}/dashboard`);
    }

    invalidateCache(): void {
        this.cache$ = undefined;
    }
}
