import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
    CashSessionRequest, CashSessionResponse,
    CashRegisterResponse, CashRegisterRequest
} from '../models/cash.model';
import { AuthService } from './auth.service';

@Injectable({
    providedIn: 'root'
})
export class CashSessionService {
    private http = inject(HttpClient);
    private authService = inject(AuthService);

    private sessionUrl = '/api/v1/cash-sessions';
    private registerUrl = '/api/v1/cash-registers';

    // Cash Registers
    getRegisters(): Observable<CashRegisterResponse[]> {
        return this.http.get<CashRegisterResponse[]>(this.registerUrl);
    }

    getRegisterById(id: number): Observable<CashRegisterResponse> {
        return this.http.get<CashRegisterResponse>(`${this.registerUrl}/${id}`);
    }

    createRegister(request: CashRegisterRequest): Observable<CashRegisterResponse> {
        return this.http.post<CashRegisterResponse>(this.registerUrl, request);
    }

    updateRegister(id: number, request: CashRegisterRequest): Observable<CashRegisterResponse> {
        return this.http.put<CashRegisterResponse>(`${this.registerUrl}/${id}`, request);
    }

    deleteRegister(id: number): Observable<void> {
        return this.http.delete<void>(`${this.registerUrl}/${id}`);
    }

    // Cash Sessions
    getAllSessions(): Observable<CashSessionResponse[]> {
        return this.http.get<CashSessionResponse[]>(this.sessionUrl);
    }

    getById(id: number): Observable<CashSessionResponse> {
        return this.http.get<CashSessionResponse>(`${this.sessionUrl}/${id}`);
    }

    getActiveSession(): Observable<CashSessionResponse> {
        const userId = this.authService.currentUser()?.id;
        const params = new HttpParams().set('userId', userId?.toString() || '');
        return this.http.get<CashSessionResponse>(`${this.sessionUrl}/active`, { params });
    }

    openSession(request: CashSessionRequest): Observable<CashSessionResponse> {
        const userId = this.authService.currentUser()?.id;
        const params = new HttpParams().set('userId', userId?.toString() || '');
        return this.http.post<CashSessionResponse>(`${this.sessionUrl}/open`, request, { params });
    }

    closeSession(id: number, closingBalance: number, diffAmount: number): Observable<CashSessionResponse> {
        const params = new HttpParams()
            .set('closingBalance', closingBalance.toString())
            .set('diffAmount', diffAmount.toString());
        return this.http.post<CashSessionResponse>(`${this.sessionUrl}/${id}/close`, {}, { params });
    }

    getStatus(userId: number): Observable<CashSessionResponse> {
        const params = new HttpParams().set('userId', userId.toString());
        return this.http.get<CashSessionResponse>(`${this.sessionUrl}/status`, { params });
    }

    closeActiveSession(userId: number, closingBalance: number, diffAmount: number): Observable<CashSessionResponse> {
        const params = new HttpParams()
            .set('userId', userId.toString())
            .set('closingBalance', closingBalance.toString())
            .set('diffAmount', diffAmount.toString());
        return this.http.post<CashSessionResponse>(`${this.sessionUrl}/close`, {}, { params });
    }

    getHistory(userId: number): Observable<CashSessionResponse[]> {
        const params = new HttpParams().set('userId', userId.toString());
        return this.http.get<CashSessionResponse[]>(`${this.sessionUrl}/history`, { params });
    }
}
