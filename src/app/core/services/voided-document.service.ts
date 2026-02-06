import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
    VoidedDocumentRequest,
    VoidedDocumentResponse,
    VoidedSunatStatus
} from '../models/voided-document.model';
import { ResponseApi } from '../models/response-api.model';

@Injectable({
    providedIn: 'root'
})
export class VoidedDocumentService {
    private http = inject(HttpClient);
    private apiUrl = '/api/v1/voided-documents';

    create(request: VoidedDocumentRequest): Observable<ResponseApi<VoidedDocumentResponse>> {
        return this.http.post<ResponseApi<VoidedDocumentResponse>>(this.apiUrl, request);
    }

    getAll(): Observable<ResponseApi<VoidedDocumentResponse[]>> {
        return this.http.get<ResponseApi<VoidedDocumentResponse[]>>(this.apiUrl);
    }

    getById(id: number): Observable<ResponseApi<VoidedDocumentResponse>> {
        return this.http.get<ResponseApi<VoidedDocumentResponse>>(`${this.apiUrl}/${id}`);
    }

    getByEstablishment(establishmentId: number): Observable<ResponseApi<VoidedDocumentResponse[]>> {
        return this.http.get<ResponseApi<VoidedDocumentResponse[]>>(`${this.apiUrl}/establishment/${establishmentId}`);
    }

    updateSunatStatus(id: number, status: VoidedSunatStatus, description?: string): Observable<ResponseApi<VoidedDocumentResponse>> {
        const descParam = description ? `&description=${encodeURIComponent(description)}` : '';
        return this.http.patch<ResponseApi<VoidedDocumentResponse>>(`${this.apiUrl}/${id}/sunat-status?status=${status}${descParam}`, {});
    }

    processDailyVoids(establishmentId: number): Observable<ResponseApi<void>> {
        return this.http.post<ResponseApi<void>>(`${this.apiUrl}/process?establishmentId=${establishmentId}`, {});
    }
}
