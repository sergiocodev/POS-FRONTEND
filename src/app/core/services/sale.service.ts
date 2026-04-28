import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { SaleRequest, SaleResponse, EstablishmentResponse, ProductForSaleResponse, SaleSummaryResponse } from '../models/sale.model';
import { ResponseApi } from '../models/response-api.model';
import { Page } from '../models/pagination.model';

@Injectable({
    providedIn: 'root'
})
export class SaleService {
    private http = inject(HttpClient);
    private apiUrl = '/api/v1/sales';

    create(request: SaleRequest): Observable<ResponseApi<SaleResponse>> {
        return this.http.post<ResponseApi<SaleResponse>>(this.apiUrl, request);
    }

    getAll(startDate?: string, endDate?: string): Observable<ResponseApi<SaleResponse[]>> {
        const params: any = {};
        if (startDate) params.startDate = startDate;
        if (endDate) params.endDate = endDate;
        return this.http.get<ResponseApi<SaleResponse[]>>(this.apiUrl, { params });
    }

    getAllPaged(
        page: number = 0,
        size: number = 20,
        startDate?: string,
        endDate?: string,
        filters: any = {}
    ): Observable<ResponseApi<Page<SaleResponse>>> {
        let params = new HttpParams()
            .set('page', page)
            .set('size', size);
        
        if (startDate) params = params.set('startDate', startDate);
        if (endDate) params = params.set('endDate', endDate);

        // Map frontend table column keys to backend expected params
        if (filters.customerName) params = params.set('customerName', filters.customerName);
        if (filters.customerDocumentNumber) params = params.set('customerDocument', filters.customerDocumentNumber);
        if (filters.voucher) params = params.set('number', filters.voucher);
        if (filters.documentType) params = params.set('documentType', filters.documentType);
        if (filters.status) params = params.set('status', filters.status);
        if (filters.sunatStatus) params = params.set('sunatStatus', filters.sunatStatus);
        if (filters.userFullName) params = params.set('vendedorName', filters.userFullName);
        if (filters.total) params = params.set('total', filters.total);
        if (filters.payments) params = params.set('paymentMethod', filters.payments);
        if (filters.date) params = params.set('columnDate', filters.date);

        return this.http.get<ResponseApi<Page<SaleResponse>>>(`${this.apiUrl}/paged`, { params });
    }

    getById(id: number): Observable<ResponseApi<SaleResponse>> {
        return this.http.get<ResponseApi<SaleResponse>>(`${this.apiUrl}/${id}`);
    }

    cancel(id: number): Observable<ResponseApi<void>> {
        return this.http.post<ResponseApi<void>>(`${this.apiUrl}/${id}/cancel`, {});
    }

    getPdf(id: number): Observable<Blob> {
        return this.http.get(`${this.apiUrl}/${id}/pdf`, { responseType: 'blob' });
    }

    getXml(id: number): Observable<string> {
        return this.http.get(`${this.apiUrl}/${id}/xml`, { responseType: 'text' });
    }

    getCdr(id: number): Observable<string> {
        return this.http.get(`${this.apiUrl}/${id}/cdr`, { responseType: 'text' });
    }

    createCreditNote(id: number, reason: string): Observable<ResponseApi<SaleResponse>> {
        return this.http.post<ResponseApi<SaleResponse>>(`${this.apiUrl}/${id}/credit-note?reason=${encodeURIComponent(reason)}`, {});
    }

    createDebitNote(id: number, reason: string): Observable<ResponseApi<SaleResponse>> {
        return this.http.post<ResponseApi<SaleResponse>>(`${this.apiUrl}/${id}/debit-note?reason=${encodeURIComponent(reason)}`, {});
    }

    invalidate(id: number, reason: string): Observable<ResponseApi<void>> {
        return this.http.post<ResponseApi<void>>(`${this.apiUrl}/${id}/invalidate?reason=${encodeURIComponent(reason)}`, {});
    }

    getEstablishments(): Observable<ResponseApi<EstablishmentResponse[]>> {
        return this.http.get<ResponseApi<EstablishmentResponse[]>>('/api/v1/establishments');
    }

    listProductsForSale(establishmentId: number): Observable<ResponseApi<ProductForSaleResponse[]>> {
        return this.http.get<ResponseApi<ProductForSaleResponse[]>>(`${this.apiUrl}/ListProductsForSale`, {
            params: { establishmentId: establishmentId.toString() }
        });
    }

    searchProductsForPOS(query: string, establishmentId: number): Observable<ResponseApi<ProductForSaleResponse[]>> {
        return this.http.get<ResponseApi<ProductForSaleResponse[]>>(`${this.apiUrl}/SearchProductsForPOS`, {
            params: { query, establishmentId: establishmentId.toString() }
        });
    }

    getSummary(
        startDate?: string,
        endDate?: string,
        filters: any = {}
    ): Observable<ResponseApi<SaleSummaryResponse>> {
        let params = new HttpParams();
        
        if (startDate) params = params.set('startDate', startDate);
        if (endDate) params = params.set('endDate', endDate);

        if (filters.customerName) params = params.set('customerName', filters.customerName);
        if (filters.customerDocumentNumber) params = params.set('customerDocument', filters.customerDocumentNumber);
        if (filters.voucher) params = params.set('number', filters.voucher);
        if (filters.documentType) params = params.set('documentType', filters.documentType);
        if (filters.status) params = params.set('status', filters.status);
        if (filters.sunatStatus) params = params.set('sunatStatus', filters.sunatStatus);
        if (filters.userFullName) params = params.set('vendedorName', filters.userFullName);
        if (filters.total) params = params.set('total', filters.total);
        if (filters.payments) params = params.set('paymentMethod', filters.payments);
        if (filters.date) params = params.set('columnDate', filters.date);

        return this.http.get<ResponseApi<SaleSummaryResponse>>(`${this.apiUrl}/summary`, { params });
    }
}
