import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { PurchaseRequest, PurchaseResponse, PurchaseSummaryResponse } from '../models/purchase.model';
import { ResponseApi } from '../models/response-api.model';
import { Page } from '../models/pagination.model';
import { environment } from '../../../environments/environment';

@Injectable({
    providedIn: 'root'
})
export class PurchaseService {
    private http = inject(HttpClient);
    private apiUrl = `${environment.apiUrl}/purchases`;

    create(request: PurchaseRequest, userId: number): Observable<ResponseApi<PurchaseResponse>> {
        return this.http.post<ResponseApi<PurchaseResponse>>(`${this.apiUrl}?userId=${userId}`, request);
    }

    getAll(): Observable<ResponseApi<PurchaseResponse[]>> {
        return this.http.get<ResponseApi<PurchaseResponse[]>>(this.apiUrl);
    }

    getById(id: number): Observable<ResponseApi<PurchaseResponse>> {
        return this.http.get<ResponseApi<PurchaseResponse>>(`${this.apiUrl}/${id}`);
    }

    getAllPaged(
        page: number = 0,
        size: number = 20,
        startDate?: string,
        endDate?: string,
        filters: any = {},
        establishmentId?: number | null
    ): Observable<ResponseApi<Page<PurchaseResponse>>> {
        let params = new HttpParams()
            .set('page', page)
            .set('size', size);
        
        if (startDate) params = params.set('startDate', startDate);
        if (endDate) params = params.set('endDate', endDate);
        if (establishmentId) params = params.set('establishmentId', establishmentId.toString());

        if (filters.supplierName) params = params.set('supplierName', filters.supplierName);
        if (filters.supplierDocumentNumber) params = params.set('supplierDocument', filters.supplierDocumentNumber);
        if (filters.voucher) params = params.set('number', filters.voucher);
        if (filters.documentType) params = params.set('documentType', filters.documentType);
        if (filters.status) params = params.set('status', filters.status);
        if (filters.userFullName) params = params.set('userName', filters.userFullName);
        if (filters.total) params = params.set('total', filters.total);
        if (filters.payments) params = params.set('paymentMethod', filters.payments);
        if (filters.date) params = params.set('columnDate', filters.date);

        return this.http.get<ResponseApi<Page<PurchaseResponse>>>(`${this.apiUrl}/paged`, { params });
    }

    getSummary(
        startDate?: string,
        endDate?: string,
        filters: any = {},
        establishmentId?: number | null
    ): Observable<ResponseApi<PurchaseSummaryResponse>> {
        let params = new HttpParams();
        
        if (startDate) params = params.set('startDate', startDate);
        if (endDate) params = params.set('endDate', endDate);
        if (establishmentId) params = params.set('establishmentId', establishmentId.toString());

        if (filters.supplierName) params = params.set('supplierName', filters.supplierName);
        if (filters.supplierDocumentNumber) params = params.set('supplierDocument', filters.supplierDocumentNumber);
        if (filters.voucher) params = params.set('number', filters.voucher);
        if (filters.documentType) params = params.set('documentType', filters.documentType);
        if (filters.status) params = params.set('status', filters.status);
        if (filters.userFullName) params = params.set('userName', filters.userFullName);
        if (filters.total) params = params.set('total', filters.total);
        if (filters.payments) params = params.set('paymentMethod', filters.payments);
        if (filters.date) params = params.set('columnDate', filters.date);

        return this.http.get<ResponseApi<PurchaseSummaryResponse>>(`${this.apiUrl}/summary`, { params });
    }

    cancel(id: number): Observable<ResponseApi<void>> {
        return this.http.post<ResponseApi<void>>(`${this.apiUrl}/${id}/cancel`, {});
    }
}
