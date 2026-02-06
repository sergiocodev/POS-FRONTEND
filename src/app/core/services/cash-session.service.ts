import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
    CashSessionRequest, CashSessionResponse,
    CashRegisterResponse, CashRegisterRequest
} from '../models/cash.model';
import { AuthService } from './auth.service';
import { ResponseApi } from '../models/response-api.model';

@Injectable({
    providedIn: 'root'
})
export class CashSessionService {
    private http = inject(HttpClient);
    private authService = inject(AuthService);

    private sessionUrl = '/api/v1/cash-sessions';
    private registerUrl = '/api/v1/cash-registers';


    getRegisters(): Observable<ResponseApi<CashRegisterResponse[]>> {
        return this.http.get<ResponseApi<CashRegisterResponse[]>>(this.registerUrl);
    }

    getRegisterById(id: number): Observable<ResponseApi<CashRegisterResponse>> {
        return this.http.get<ResponseApi<CashRegisterResponse>>(`${this.registerUrl}/${id}`);
    }

    createRegister(request: CashRegisterRequest): Observable<ResponseApi<CashRegisterResponse>> {
        return this.http.post<ResponseApi<CashRegisterResponse>>(this.registerUrl, request);
    }

    updateRegister(id: number, request: CashRegisterRequest): Observable<ResponseApi<CashRegisterResponse>> {
        return this.http.put<ResponseApi<CashRegisterResponse>>(`${this.registerUrl}/${id}`, request);
    }

    deleteRegister(id: number): Observable<ResponseApi<void>> {
        return this.http.delete<ResponseApi<void>>(`${this.registerUrl}/${id}`);
    }


    getAllSessions(): Observable<ResponseApi<CashSessionResponse[]>> {
        return this.http.get<ResponseApi<CashSessionResponse[]>>(this.sessionUrl);
    }

    getById(id: number): Observable<ResponseApi<CashSessionResponse>> {
        return this.http.get<ResponseApi<CashSessionResponse>>(`${this.sessionUrl}/${id}`);
    }

    getActiveSession(): Observable<ResponseApi<CashSessionResponse>> {
        const userId = this.authService.currentUser()?.id;
        const params = new HttpParams().set('userId', userId?.toString() || '');
        return this.http.get<ResponseApi<CashSessionResponse>>(`${this.sessionUrl}/active`, { params });
    }

    openSession(request: CashSessionRequest): Observable<ResponseApi<CashSessionResponse>> {
        const userId = this.authService.currentUser()?.id;
        const params = new HttpParams().set('userId', userId?.toString() || '');
        return this.http.post<ResponseApi<CashSessionResponse>>(`${this.sessionUrl}/open`, request, { params });
    }

    closeSession(id: number, closingBalance: number, diffAmount: number): Observable<ResponseApi<CashSessionResponse>> {
        const params = new HttpParams()
            .set('closingBalance', closingBalance.toString())
            .set('diffAmount', diffAmount.toString());
        return this.http.post<ResponseApi<CashSessionResponse>>(`${this.sessionUrl}/${id}/close`, {}, { params });
    }

    getStatus(userId: number): Observable<ResponseApi<CashSessionResponse>> {
        const params = new HttpParams().set('userId', userId.toString());
        return this.http.get<ResponseApi<CashSessionResponse>>(`${this.sessionUrl}/status`, { params });
    }

    closeActiveSession(userId: number, closingBalance: number, diffAmount: number): Observable<ResponseApi<CashSessionResponse>> {
        const params = new HttpParams()
            .set('userId', userId.toString())
            .set('closingBalance', closingBalance.toString())
            .set('diffAmount', diffAmount.toString());
        return this.http.post<ResponseApi<CashSessionResponse>>(`${this.sessionUrl}/close`, {}, { params });
    }

    getHistory(userId: number): Observable<ResponseApi<CashSessionResponse[]>> {
        const params = new HttpParams().set('userId', userId.toString());
        return this.http.get<ResponseApi<CashSessionResponse[]>>(`${this.sessionUrl}/history`, { params });
    }
}
