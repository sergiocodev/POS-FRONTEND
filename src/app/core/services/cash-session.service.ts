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

    private sessionUrl = '/api/cash-sessions';
    private registerUrl = '/api/cash-registers';

    // Cash Registers
    getRegisters(): Observable<CashRegisterResponse[]> {
        return this.http.get<CashRegisterResponse[]>(this.registerUrl);
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

    closeSession(id: number, closingBalance: number): Observable<CashSessionResponse> {
        const params = new HttpParams().set('closingBalance', closingBalance.toString());
        return this.http.post<CashSessionResponse>(`${this.sessionUrl}/${id}/close`, {}, { params });
    }
}
