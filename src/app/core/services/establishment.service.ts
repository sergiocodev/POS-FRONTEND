import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { EstablishmentRequest, EstablishmentResponse } from '../models/maintenance.model';

@Injectable({
    providedIn: 'root'
})
export class EstablishmentService {
    private http = inject(HttpClient);
    private apiUrl = '/api/v1/establishments';

    getAll(): Observable<EstablishmentResponse[]> {
        return this.http.get<EstablishmentResponse[]>(this.apiUrl);
    }

    getById(id: number): Observable<EstablishmentResponse> {
        return this.http.get<EstablishmentResponse>(`${this.apiUrl}/${id}`);
    }

    create(request: EstablishmentRequest): Observable<EstablishmentResponse> {
        return this.http.post<EstablishmentResponse>(this.apiUrl, request);
    }

    update(id: number, request: EstablishmentRequest): Observable<EstablishmentResponse> {
        return this.http.put<EstablishmentResponse>(`${this.apiUrl}/${id}`, request);
    }

    delete(id: number): Observable<void> {
        return this.http.delete<void>(`${this.apiUrl}/${id}`);
    }
}
