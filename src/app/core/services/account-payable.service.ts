import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AccountPayableResponse, AccountPayablePaymentRequest, PayableStatus } from '../models/account-payable.model';
import { ResponseApi } from '../models/response-api.model';

@Injectable({
    providedIn: 'root'
})
export class AccountPayableService {
    private http = inject(HttpClient);
    private apiUrl = '/api/v1/account-payables';

    getAll(): Observable<ResponseApi<AccountPayableResponse[]>> {
        return this.http.get<ResponseApi<AccountPayableResponse[]>>(this.apiUrl);
    }

    getBySupplierId(supplierId: number): Observable<ResponseApi<AccountPayableResponse[]>> {
        return this.http.get<ResponseApi<AccountPayableResponse[]>>(`${this.apiUrl}/supplier/${supplierId}`);
    }

    getByStatus(status: PayableStatus): Observable<ResponseApi<AccountPayableResponse[]>> {
        return this.http.get<ResponseApi<AccountPayableResponse[]>>(`${this.apiUrl}/status/${status}`);
    }

    pay(id: number, request: AccountPayablePaymentRequest, userId: number): Observable<ResponseApi<AccountPayableResponse>> {
        return this.http.post<ResponseApi<AccountPayableResponse>>(`${this.apiUrl}/${id}/pay?userId=${userId}`, request);
    }
}
