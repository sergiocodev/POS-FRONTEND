import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { InventoryReport, PurchaseReport, SalesReport, SalesSummary } from '../models/report.model';

@Injectable({
    providedIn: 'root'
})
export class ReportService {
    private http = inject(HttpClient);
    private apiUrl = '/api/reports';

    // Inventory Reports
    getInventoryReport(): Observable<InventoryReport[]> {
        return this.http.get<InventoryReport[]>(`${this.apiUrl}/inventory`);
    }

    getLowStockReport(threshold: number = 10): Observable<InventoryReport[]> {
        const params = new HttpParams().set('threshold', threshold.toString());
        return this.http.get<InventoryReport[]>(`${this.apiUrl}/inventory/low-stock`, { params });
    }

    getExpiringReport(days: number = 30): Observable<InventoryReport[]> {
        const params = new HttpParams().set('days', days.toString());
        return this.http.get<InventoryReport[]>(`${this.apiUrl}/inventory/expiring`, { params });
    }

    // Sales Reports
    getSalesReport(start: string, end: string): Observable<SalesReport[]> {
        const params = new HttpParams()
            .set('start', start)
            .set('end', end);
        return this.http.get<SalesReport[]>(`${this.apiUrl}/sales`, { params });
    }

    getSalesSummary(start: string, end: string): Observable<SalesSummary> {
        const params = new HttpParams()
            .set('start', start)
            .set('end', end);
        return this.http.get<SalesSummary>(`${this.apiUrl}/sales/summary`, { params });
    }

    // Purchase Reports
    getPurchaseReport(start: string, end: string): Observable<PurchaseReport[]> {
        const params = new HttpParams()
            .set('start', start)
            .set('end', end);
        return this.http.get<PurchaseReport[]>(`${this.apiUrl}/purchases`, { params });
    }
}
