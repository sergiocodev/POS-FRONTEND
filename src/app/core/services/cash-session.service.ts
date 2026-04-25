import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
    CashSessionRequest, CashSessionResponse,
    CashRegisterResponse, CashRegisterRequest,
    CashInflowRequest, CashOutflowRequest,
    CashMovementResponse, SessionStatusResponse,
    CashConceptResponse, CloseSessionRequest
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
    private cashUrl = '/api/v1/cash';
    private conceptUrl = '/api/v1/cash-concepts';


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

    // New Cash Movement Methods (CashController.java)
    registerInflow(request: CashInflowRequest): Observable<ResponseApi<CashMovementResponse>> {
        return this.http.post<ResponseApi<CashMovementResponse>>(`${this.cashUrl}/RegisterCashInflow`, request);
    }

    registerOutflow(request: CashOutflowRequest): Observable<ResponseApi<CashMovementResponse>> {
        return this.http.post<ResponseApi<CashMovementResponse>>(`${this.cashUrl}/RegisterCashOutflow`, request);
    }

    getCurrentSessionStatus(userId: number): Observable<ResponseApi<SessionStatusResponse>> {
        const params = new HttpParams().set('userId', userId.toString());
        return this.http.get<ResponseApi<SessionStatusResponse>>(`${this.cashUrl}/GetCurrentSessionStatus`, { params });
    }

    closeSessionAndReport(request: CloseSessionRequest): Observable<ResponseApi<CashSessionResponse>> {
        return this.http.post<ResponseApi<CashSessionResponse>>(`${this.cashUrl}/CloseSessionAndReport`, request);
    }

    getConceptsByType(type: string, isSystem?: boolean): Observable<ResponseApi<CashConceptResponse[]>> {
        let params = new HttpParams();
        if (isSystem !== undefined) {
            params = params.set('isSystem', String(isSystem));
        }
        return this.http.get<ResponseApi<CashConceptResponse[]>>(`${this.conceptUrl}/type/${type}`, { params });
    }

    createConcept(name: string, type: string): Observable<ResponseApi<CashConceptResponse>> {
        return this.http.post<ResponseApi<CashConceptResponse>>(this.conceptUrl, { name, type });
    }
}
