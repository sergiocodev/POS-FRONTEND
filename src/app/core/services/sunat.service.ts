import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ResponseApi } from '../models/response-api.model';
import { environment } from '../../../environments/environment';

export interface EmitInvoiceResponse {
    saleId: number;
    sunatStatus: string;
    sunatMessage: string;
    xmlUrl: string;
    cdrUrl: string;
    hashCpe: string;
}

@Injectable({
    providedIn: 'root'
})
export class SunatService {
    private http = inject(HttpClient);
    private apiUrl = `${environment.apiUrl}/sunat`;

    emitInvoice(saleId: number): Observable<ResponseApi<EmitInvoiceResponse>> {
        return this.http.post<ResponseApi<EmitInvoiceResponse>>(`${this.apiUrl}/EmitInvoiceToOSE`, { saleId });
    }
}
