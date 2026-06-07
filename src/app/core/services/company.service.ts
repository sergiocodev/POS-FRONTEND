import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { CompanyResponse } from '../models/company.model';
import { environment } from '../../../environments/environment';

export interface CompanyRequest {
    ruc: string;
    name: string;
    address?: string;
    ubigeo?: string;
    urbanization?: string;
    phone?: string;
    email?: string;
    logoUrl?: string;
}

@Injectable({
    providedIn: 'root'
})
export class CompanyService {
    private http = inject(HttpClient);
    private apiUrl = `${environment.apiUrl}/company`;

    getCompany(): Observable<CompanyResponse> {
        return this.http.get<CompanyResponse>(this.apiUrl);
    }

    updateCompany(request: CompanyRequest): Observable<CompanyResponse> {
        return this.http.put<CompanyResponse>(this.apiUrl, request);
    }

    isConfigured(): Observable<boolean> {
        return this.http.get<boolean>(`${this.apiUrl}/is-configured`);
    }
}
