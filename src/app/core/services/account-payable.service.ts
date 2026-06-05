import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AccountPayableResponse, AccountPayablePaymentRequest, PayableStatus, AccountPayablePaymentResponse } from '../models/account-payable.model';
import { ResponseApi } from '../models/response-api.model';
import { Page } from '../models/pagination.model';
import { environment } from '../../../environments/environment';

@Injectable({
    providedIn: 'root'
})
export class AccountPayableService {
    private http = inject(HttpClient);
    private apiUrl = `${environment.apiUrl}/account-payables`;

    getAll(): Observable<ResponseApi<AccountPayableResponse[]>> {
        return this.http.get<ResponseApi<AccountPayableResponse[]>>(this.apiUrl);
    }

    getAllPaged(params: any): Observable<ResponseApi<Page<AccountPayableResponse>>> {
        return this.http.get<ResponseApi<Page<AccountPayableResponse>>>(`${this.apiUrl}/paged`, { params });
    }

    getDashboard(): Observable<any> {
        return this.http.get<any>(`${this.apiUrl}/dashboard`);
    }

    getBySupplierId(supplierId: number): Observable<ResponseApi<AccountPayableResponse[]>> {
        return this.http.get<ResponseApi<AccountPayableResponse[]>>(`${this.apiUrl}/supplier/${supplierId}`);
    }

    getByStatus(status: PayableStatus): Observable<ResponseApi<AccountPayableResponse[]>> {
        return this.http.get<ResponseApi<AccountPayableResponse[]>>(`${this.apiUrl}/status/${status}`);
    }

    pay(id: number, request: AccountPayablePaymentRequest): Observable<ResponseApi<AccountPayableResponse>> {
        return this.http.post<ResponseApi<AccountPayableResponse>>(`${this.apiUrl}/${id}/pay`, request);
    }

    getPaymentHistory(params: any): Observable<ResponseApi<Page<AccountPayablePaymentResponse>>> {
        const url = `${this.apiUrl.replace('account-payables', 'account-payable-payments')}/history`;
        return this.http.get<ResponseApi<Page<AccountPayablePaymentResponse>>>(url, { params });
    }

    getPaymentsByPayableId(id: number): Observable<ResponseApi<AccountPayablePaymentResponse[]>> {
        return this.http.get<ResponseApi<AccountPayablePaymentResponse[]>>(`${environment.apiUrl}/account-payable-payments/payable/${id}`);
    }
}
