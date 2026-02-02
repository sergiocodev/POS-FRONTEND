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

@Injectable({
    providedIn: 'root'
})
export class DashboardService {
    private http = inject(HttpClient);
    private apiUrl = '/api/v1/dashboard';

    getSummaryCards(establishmentId: number): Observable<DashboardSummaryResponse> {
        return this.http.get<DashboardSummaryResponse>(`${this.apiUrl}/summary-cards?establishmentId=${establishmentId}`);
    }

    getSalesChart(range: string, establishmentId: number): Observable<SalesChartResponse[]> {
        return this.http.get<SalesChartResponse[]>(`${this.apiUrl}/sales-chart?range=${range}&establishmentId=${establishmentId}`);
    }

    getAlerts(establishmentId: number): Observable<DashboardAlertsResponse> {
        return this.http.get<DashboardAlertsResponse>(`${this.apiUrl}/alerts?establishmentId=${establishmentId}`);
    }

    getPaymentMethods(date: string | null, establishmentId: number): Observable<PaymentMethodDistribution[]> {
        const dateParam = date ? `&date=${date}` : '';
        return this.http.get<PaymentMethodDistribution[]>(`${this.apiUrl}/payment-methods?establishmentId=${establishmentId}${dateParam}`);
    }

    getTopProducts(limit: number, establishmentId: number): Observable<TopProductDashboard[]> {
        return this.http.get<TopProductDashboard[]>(`${this.apiUrl}/top-products?limit=${limit}&establishmentId=${establishmentId}`);
    }

    getEmployeePerformance(date: string | null, establishmentId: number): Observable<EmployeePerformanceDashboard[]> {
        const dateParam = date ? `&date=${date}` : '';
        return this.http.get<EmployeePerformanceDashboard[]>(`${this.apiUrl}/employee-performance?establishmentId=${establishmentId}${dateParam}`);
    }
}
