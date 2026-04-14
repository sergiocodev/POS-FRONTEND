import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, shareReplay } from 'rxjs';
import { EstablishmentRequest, EstablishmentResponse } from '../models/maintenance.model';
import { ResponseApi } from '../models/response-api.model';

@Injectable({
    providedIn: 'root'
})
export class EstablishmentService {
    private http = inject(HttpClient);
    private apiUrl = '/api/v1/establishments';

    private cache$?: Observable<ResponseApi<EstablishmentResponse[]>>;

    getAll(): Observable<ResponseApi<EstablishmentResponse[]>> {
        if (!this.cache$) {
            this.cache$ = this.http.get<ResponseApi<EstablishmentResponse[]>>(this.apiUrl).pipe(shareReplay(1));
        }
        return this.cache$;
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

    invalidateCache(): void {
        this.cache$ = undefined;
    }
}
