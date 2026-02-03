import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { InventoryReport, PurchaseReport, SalesReport, SalesSummary } from '../models/report.model';

@Injectable({
    providedIn: 'root'
})
export class ReportService {
    private http = inject(HttpClient);
    private apiUrl = '/api/v1/reports';

    
    getInventoryReport(establishmentId?: number): Observable<InventoryReport[]> {
        let params = new HttpParams();
        if (establishmentId) {
            params = params.set('establishmentId', establishmentId.toString());
        }
        return this.http.get<InventoryReport[]>(`${this.apiUrl}/inventory`, { params });
    }

    getLowStockReport(threshold: number = 10, establishmentId?: number): Observable<InventoryReport[]> {
        let params = new HttpParams().set('threshold', threshold.toString());
        if (establishmentId) {
            params = params.set('establishmentId', establishmentId.toString());
        }
        return this.http.get<InventoryReport[]>(`${this.apiUrl}/inventory/low-stock`, { params });
    }

    getExpiringReport(days: number = 30, establishmentId?: number): Observable<InventoryReport[]> {
        let params = new HttpParams().set('days', days.toString());
        if (establishmentId) {
            params = params.set('establishmentId', establishmentId.toString());
        }
        return this.http.get<InventoryReport[]>(`${this.apiUrl}/inventory/expiring`, { params });
    }

    
    getSalesReport(start: string, end: string, establishmentId?: number): Observable<SalesReport[]> {
        let params = new HttpParams()
            .set('start', start)
            .set('end', end);
        if (establishmentId) {
            params = params.set('establishmentId', establishmentId.toString());
        }
        return this.http.get<SalesReport[]>(`${this.apiUrl}/sales`, { params });
    }

    getSalesSummary(start: string, end: string, establishmentId?: number): Observable<SalesSummary> {
        let params = new HttpParams()
            .set('start', start)
            .set('end', end);
        if (establishmentId) {
            params = params.set('establishmentId', establishmentId.toString());
        }
        return this.http.get<SalesSummary>(`${this.apiUrl}/sales/summary`, { params });
    }

    
    getPurchaseReport(start: string, end: string, establishmentId?: number): Observable<PurchaseReport[]> {
        let params = new HttpParams()
            .set('start', start)
            .set('end', end);
        if (establishmentId) {
            params = params.set('establishmentId', establishmentId.toString());
        }
        return this.http.get<PurchaseReport[]>(`${this.apiUrl}/purchases`, { params });
    }
}
