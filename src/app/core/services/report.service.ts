import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { InventoryReport, PurchaseReport, SalesReport, SalesSummary } from '../models/report.model';
import { ResponseApi } from '../models/response-api.model';

@Injectable({
    providedIn: 'root'
})
export class ReportService {
    private http = inject(HttpClient);
    private apiUrl = '/api/v1/reports';


    getInventoryReport(establishmentId?: number): Observable<ResponseApi<InventoryReport[]>> {
        let params = new HttpParams();
        if (establishmentId) {
            params = params.set('establishmentId', establishmentId.toString());
        }
        return this.http.get<ResponseApi<InventoryReport[]>>(`${this.apiUrl}/inventory`, { params });
    }

    getLowStockReport(threshold: number = 10, establishmentId?: number): Observable<ResponseApi<InventoryReport[]>> {
        let params = new HttpParams().set('threshold', threshold.toString());
        if (establishmentId) {
            params = params.set('establishmentId', establishmentId.toString());
        }
        return this.http.get<ResponseApi<InventoryReport[]>>(`${this.apiUrl}/inventory/low-stock`, { params });
    }

    getExpiringReport(days: number = 30, establishmentId?: number): Observable<ResponseApi<InventoryReport[]>> {
        let params = new HttpParams().set('days', days.toString());
        if (establishmentId) {
            params = params.set('establishmentId', establishmentId.toString());
        }
        return this.http.get<ResponseApi<InventoryReport[]>>(`${this.apiUrl}/inventory/expiring`, { params });
    }


    getSalesReport(start: string, end: string, establishmentId?: number): Observable<ResponseApi<SalesReport[]>> {
        let params = new HttpParams()
            .set('start', start)
            .set('end', end);
        if (establishmentId) {
            params = params.set('establishmentId', establishmentId.toString());
        }
        return this.http.get<ResponseApi<SalesReport[]>>(`${this.apiUrl}/sales`, { params });
    }

    getSalesSummary(start: string, end: string, establishmentId?: number): Observable<ResponseApi<SalesSummary>> {
        let params = new HttpParams()
            .set('start', start)
            .set('end', end);
        if (establishmentId) {
            params = params.set('establishmentId', establishmentId.toString());
        }
        return this.http.get<ResponseApi<SalesSummary>>(`${this.apiUrl}/sales/summary`, { params });
    }


    getPurchaseReport(start: string, end: string, establishmentId?: number): Observable<ResponseApi<PurchaseReport[]>> {
        let params = new HttpParams()
            .set('start', start)
            .set('end', end);
        if (establishmentId) {
            params = params.set('establishmentId', establishmentId.toString());
        }
        return this.http.get<ResponseApi<PurchaseReport[]>>(`${this.apiUrl}/purchases`, { params });
    }
}
