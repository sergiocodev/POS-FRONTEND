import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
    VoidedDocumentRequest,
    VoidedDocumentResponse,
    VoidedSunatStatus
} from '../models/voided-document.model';

@Injectable({
    providedIn: 'root'
})
export class VoidedDocumentService {
    private http = inject(HttpClient);
    private apiUrl = '/api/v1/voided-documents';

    create(request: VoidedDocumentRequest): Observable<VoidedDocumentResponse> {
        return this.http.post<VoidedDocumentResponse>(this.apiUrl, request);
    }

    getAll(): Observable<VoidedDocumentResponse[]> {
        return this.http.get<VoidedDocumentResponse[]>(this.apiUrl);
    }

    getById(id: number): Observable<VoidedDocumentResponse> {
        return this.http.get<VoidedDocumentResponse>(`${this.apiUrl}/${id}`);
    }

    getByEstablishment(establishmentId: number): Observable<VoidedDocumentResponse[]> {
        return this.http.get<VoidedDocumentResponse[]>(`${this.apiUrl}/establishment/${establishmentId}`);
    }

    updateSunatStatus(id: number, status: VoidedSunatStatus, description?: string): Observable<VoidedDocumentResponse> {
        const descParam = description ? `&description=${encodeURIComponent(description)}` : '';
        return this.http.patch<VoidedDocumentResponse>(`${this.apiUrl}/${id}/sunat-status?status=${status}${descParam}`, {});
    }

    processDailyVoids(establishmentId: number): Observable<void> {
        return this.http.post<void>(`${this.apiUrl}/process?establishmentId=${establishmentId}`, {});
    }
}
