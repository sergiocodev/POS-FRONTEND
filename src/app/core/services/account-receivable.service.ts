import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AccountReceivableResponse, AccountReceivablePaymentRequest, AccountReceivablePaymentResponse } from '../models/account-receivable.model';
import { ResponseApi } from '../models/response-api.model';
import { Page } from '../models/pagination.model';

@Injectable({
    providedIn: 'root'
})
export class AccountReceivableService {
    private http = inject(HttpClient);
    private apiUrl = '/api/v1/account-receivables';
    private paymentUrl = '/api/v1/account-receivable-payments';

    getAll(): Observable<ResponseApi<AccountReceivableResponse[]>> {
        return this.http.get<ResponseApi<AccountReceivableResponse[]>>(this.apiUrl);
    }

    getById(id: number): Observable<ResponseApi<AccountReceivableResponse>> {
        return this.http.get<ResponseApi<AccountReceivableResponse>>(`${this.apiUrl}/${id}`);
    }

    getByCustomerId(customerId: number): Observable<ResponseApi<AccountReceivableResponse[]>> {
        return this.http.get<ResponseApi<AccountReceivableResponse[]>>(`${this.apiUrl}/customer/${customerId}`);
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
