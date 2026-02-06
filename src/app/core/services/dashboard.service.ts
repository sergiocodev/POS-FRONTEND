import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
    DashboardSummaryResponse,
    SalesChartResponse,
    DashboardAlertsResponse,
    PaymentMethodDistribution,
    TopProductDashboard,
    EmployeePerformanceDashboard
} from '../models/dashboard.model';
import { ResponseApi } from '../models/response-api.model';

@Injectable({
    providedIn: 'root'
})
export class DashboardService {
    private http = inject(HttpClient);
    private apiUrl = '/api/v1/dashboard';

    getSummaryCards(establishmentId: number): Observable<ResponseApi<DashboardSummaryResponse>> {
        return this.http.get<ResponseApi<DashboardSummaryResponse>>(`${this.apiUrl}/summary-cards?establishmentId=${establishmentId}`);
    }

    getSalesChart(range: string, establishmentId: number): Observable<ResponseApi<SalesChartResponse[]>> {
        return this.http.get<ResponseApi<SalesChartResponse[]>>(`${this.apiUrl}/sales-chart?range=${range}&establishmentId=${establishmentId}`);
    }

    getAlerts(establishmentId: number): Observable<ResponseApi<DashboardAlertsResponse>> {
        return this.http.get<ResponseApi<DashboardAlertsResponse>>(`${this.apiUrl}/alerts?establishmentId=${establishmentId}`);
    }

    getPaymentMethods(date: string | null, establishmentId: number): Observable<ResponseApi<PaymentMethodDistribution[]>> {
        const dateParam = date ? `&date=${date}` : '';
        return this.http.get<ResponseApi<PaymentMethodDistribution[]>>(`${this.apiUrl}/payment-methods?establishmentId=${establishmentId}${dateParam}`);
    }

    getTopProducts(limit: number, establishmentId: number): Observable<ResponseApi<TopProductDashboard[]>> {
        return this.http.get<ResponseApi<TopProductDashboard[]>>(`${this.apiUrl}/top-products?limit=${limit}&establishmentId=${establishmentId}`);
    }

    getEmployeePerformance(date: string | null, establishmentId: number): Observable<ResponseApi<EmployeePerformanceDashboard[]>> {
        const dateParam = date ? `&date=${date}` : '';
        return this.http.get<ResponseApi<EmployeePerformanceDashboard[]>>(`${this.apiUrl}/employee-performance?establishmentId=${establishmentId}${dateParam}`);
    }
}
