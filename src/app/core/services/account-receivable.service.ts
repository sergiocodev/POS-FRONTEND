import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AccountReceivableResponse, AccountReceivablePaymentRequest, AccountReceivablePaymentResponse } from '../models/account-receivable.model';
import { ResponseApi } from '../models/response-api.model';
import { Page } from '../models/pagination.model';
import { environment } from '../../../environments/environment';

@Injectable({
    providedIn: 'root'
})
export class AccountReceivableService {
    private http = inject(HttpClient);
    private apiUrl = `${environment.apiUrl}/account-receivables`;
    private paymentUrl = '/api/v1/account-receivable-payments';

    getAll(): Observable<ResponseApi<AccountReceivableResponse[]>> {
        return this.http.get<ResponseApi<AccountReceivableResponse[]>>(this.apiUrl);
    }

    getAllPaged(params: any): Observable<ResponseApi<Page<AccountReceivableResponse>>> {
        return this.http.get<ResponseApi<Page<AccountReceivableResponse>>>(`${this.apiUrl}/paged`, { params });
    }

    getDashboard(): Observable<any> {
        return this.http.get<any>(`${this.apiUrl}/dashboard`);
    }

    getById(id: number): Observable<ResponseApi<AccountReceivableResponse>> {
        return this.http.get<ResponseApi<AccountReceivableResponse>>(`${this.apiUrl}/${id}`);
    }

    getByCustomerId(customerId: number): Observable<ResponseApi<AccountReceivableResponse[]>> {
        return this.http.get<ResponseApi<AccountReceivableResponse[]>>(`${this.apiUrl}/customer/${customerId}`);
    }

    getPaymentsByReceivableId(id: number): Observable<ResponseApi<AccountReceivablePaymentResponse[]>> {
        return this.http.get<ResponseApi<AccountReceivablePaymentResponse[]>>(`${this.apiUrl}/${id}/payments`);
    }

    pay(id: number, request: AccountReceivablePaymentRequest): Observable<ResponseApi<any>> {
        return this.http.post<ResponseApi<any>>(this.paymentUrl, request);
    }

    cancel(id: number): Observable<ResponseApi<void>> {
        return this.http.delete<ResponseApi<void>>(`${this.apiUrl}/${id}`);
    }

    getPaymentHistory(params: any): Observable<ResponseApi<Page<AccountReceivablePaymentResponse>>> {
        return this.http.get<ResponseApi<Page<AccountReceivablePaymentResponse>>>(`${this.paymentUrl}/history`, { params });
    }
}
