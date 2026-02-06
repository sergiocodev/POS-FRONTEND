import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { EstablishmentRequest, EstablishmentResponse } from '../models/maintenance.model';
import { ResponseApi } from '../models/response-api.model';

@Injectable({
    providedIn: 'root'
})
export class EstablishmentService {
    private http = inject(HttpClient);
    private apiUrl = '/api/v1/establishments';

    getAll(): Observable<ResponseApi<EstablishmentResponse[]>> {
        return this.http.get<ResponseApi<EstablishmentResponse[]>>(this.apiUrl);
    }

    getById(id: number): Observable<ResponseApi<EstablishmentResponse>> {
        return this.http.get<ResponseApi<EstablishmentResponse>>(`${this.apiUrl}/${id}`);
    }

    create(request: EstablishmentRequest): Observable<ResponseApi<EstablishmentResponse>> {
        return this.http.post<ResponseApi<EstablishmentResponse>>(this.apiUrl, request);
    }

    update(id: number, request: EstablishmentRequest): Observable<ResponseApi<EstablishmentResponse>> {
        return this.http.put<ResponseApi<EstablishmentResponse>>(`${this.apiUrl}/${id}`, request);
    }

    delete(id: number): Observable<ResponseApi<void>> {
        return this.http.delete<ResponseApi<void>>(`${this.apiUrl}/${id}`);
    }
}
