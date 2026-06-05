import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
    InventoryReport,
    PurchaseReport,
    SalesReport,
    SalesSummary,
    SalesBySeriesReport,
    SalesByPaymentMethodReport,
    SalesByLaboratoryReport,
    SalesByEmployeeCategoryReport,
    CategorySalesReport,
    EmployeeSalesReport,
    SalesByCategoryDetailReport,
    SalesByCustomerReport
} from '../models/report.model';
import { ResponseApi } from '../models/response-api.model';
import { environment } from '../../../environments/environment';

@Injectable({
    providedIn: 'root'
})
export class ReportService {
    private http = inject(HttpClient);
    private apiUrl = `${environment.apiUrl}/reports`;

    // ── Inventory Reports ──

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

    // ── Sales Reports ──

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

    getSalesFiltered(start: string, end: string, establishmentId: number,
        documentType?: string, series?: string): Observable<ResponseApi<SalesReport[]>> {
        let params = new HttpParams()
            .set('start', start)
            .set('end', end)
            .set('establishmentId', establishmentId.toString());
        if (documentType) params = params.set('documentType', documentType);
        if (series) params = params.set('series', series);
        return this.http.get<ResponseApi<SalesReport[]>>(`${this.apiUrl}/sales/filtered`, { params });
    }

    getSalesBySeries(start: string, end: string, establishmentId: number): Observable<ResponseApi<SalesBySeriesReport[]>> {
        const params = new HttpParams()
            .set('start', start)
            .set('end', end)
            .set('establishmentId', establishmentId.toString());
        return this.http.get<ResponseApi<SalesBySeriesReport[]>>(`${this.apiUrl}/sales/by-series`, { params });
    }

    getSalesByPaymentMethod(start: string, end: string, establishmentId: number): Observable<ResponseApi<SalesByPaymentMethodReport[]>> {
        const params = new HttpParams()
            .set('start', start)
            .set('end', end)
            .set('establishmentId', establishmentId.toString());
        return this.http.get<ResponseApi<SalesByPaymentMethodReport[]>>(`${this.apiUrl}/sales/by-payment-method`, { params });
    }

    getSalesByLaboratory(start: string, end: string, establishmentId: number): Observable<ResponseApi<SalesByLaboratoryReport[]>> {
        const params = new HttpParams()
            .set('start', start)
            .set('end', end)
            .set('establishmentId', establishmentId.toString());
        return this.http.get<ResponseApi<SalesByLaboratoryReport[]>>(`${this.apiUrl}/sales/by-laboratory`, { params });
    }

    getSalesByCategory(start: string, end: string, establishmentId: number): Observable<ResponseApi<CategorySalesReport[]>> {
        const params = new HttpParams()
            .set('start', start)
            .set('end', end)
            .set('establishmentId', establishmentId.toString());
        return this.http.get<ResponseApi<CategorySalesReport[]>>(`${this.apiUrl}/sales-by-category`, { params });
    }

    getSalesByEmployee(start: string, end: string, establishmentId: number): Observable<ResponseApi<EmployeeSalesReport[]>> {
        const params = new HttpParams()
            .set('start', start)
            .set('end', end)
            .set('establishmentId', establishmentId.toString());
        return this.http.get<ResponseApi<EmployeeSalesReport[]>>(`${this.apiUrl}/sales-by-employee`, { params });
    }

    getSalesByEmployeeCategory(start: string, end: string, establishmentId: number): Observable<ResponseApi<SalesByEmployeeCategoryReport[]>> {
        const params = new HttpParams()
            .set('start', start)
            .set('end', end)
            .set('establishmentId', establishmentId.toString());
        return this.http.get<ResponseApi<SalesByEmployeeCategoryReport[]>>(`${this.apiUrl}/sales/by-employee-category`, { params });
    }

    getSalesByCategoryDetail(start: string, end: string, establishmentId: number): Observable<ResponseApi<SalesByCategoryDetailReport[]>> {
        const params = new HttpParams()
            .set('start', start)
            .set('end', end)
            .set('establishmentId', establishmentId.toString());
        return this.http.get<ResponseApi<SalesByCategoryDetailReport[]>>(`${this.apiUrl}/sales/by-category-detail`, { params });
    }

    getSalesByProduct(start: string, end: string, establishmentId: number): Observable<ResponseApi<any[]>> {
        const params = new HttpParams()
            .set('start', start)
            .set('end', end)
            .set('establishmentId', establishmentId.toString());
        return this.http.get<ResponseApi<any[]>>(`${this.apiUrl}/sales/by-product`, { params });
    }

    getSalesByCustomer(start: string, end: string, establishmentId: number, customerIds?: number[]): Observable<ResponseApi<SalesByCustomerReport[]>> {
        let params = new HttpParams()
            .set('start', start)
            .set('end', end)
            .set('establishmentId', establishmentId.toString());
            
        if (customerIds && customerIds.length > 0) {
            params = params.set('customerIds', customerIds.join(','));
        }
            
        return this.http.get<ResponseApi<SalesByCustomerReport[]>>(`${this.apiUrl}/sales/by-customer`, { params });
    }

    getAvailableSeries(establishmentId: number, documentType?: string): Observable<ResponseApi<string[]>> {
        let params = new HttpParams()
            .set('establishmentId', establishmentId.toString());
        if (documentType) {
            params = params.set('documentType', documentType);
        }
        return this.http.get<ResponseApi<string[]>>(`${this.apiUrl}/sales/series`, { params });
    }

    getSalesFilteredPdf(
        start: string,
        end: string,
        establishmentId: number,
        documentType?: string,
        series?: string,
        sellerId?: number
    ): Observable<Blob> {
        let params = new HttpParams()
            .set('start', start)
            .set('end', end)
            .set('establishmentId', establishmentId.toString());

        if (documentType) params = params.set('documentType', documentType);
        if (series) params = params.set('series', series);
        if (sellerId) params = params.set('sellerId', sellerId.toString());

        return this.http.get(`${this.apiUrl}/pdf/comprobantes`, {
            params,
            responseType: 'blob'
        });
    }

    getSalesBySeriesPdf(
        start: string,
        end: string,
        establishmentId: number,
        series?: string[]
    ): Observable<Blob> {
        let params = new HttpParams()
            .set('start', start)
            .set('end', end)
            .set('establishmentId', establishmentId.toString());

        if (series && series.length > 0) {
            params = params.set('series', series.join(','));
        }

        return this.http.get(`${this.apiUrl}/pdf/series`, {
            params,
            responseType: 'blob'
        });
    }

    getSalesByCategoryPdf(
        start: string,
        end: string,
        establishmentId: number,
        categoryIds?: number[],
        sellerId?: number
    ): Observable<Blob> {
        let params = new HttpParams()
            .set('start', start)
            .set('end', end)
            .set('establishmentId', establishmentId.toString());

        if (categoryIds && categoryIds.length > 0) {
            params = params.set('categoryIds', categoryIds.join(','));
        }
        if (sellerId) {
            params = params.set('sellerId', sellerId.toString());
        }

        return this.http.get(`${this.apiUrl}/pdf/categories`, {
            params,
            responseType: 'blob'
        });
    }

    getSalesByProductBrandTherapeuticPdf(
        start: string,
        end: string,
        establishmentId: number,
        productIds?: number[],
        brandIds?: number[],
        therapeuticActionIds?: number[],
        sellerId?: number
    ): Observable<Blob> {
        let params = new HttpParams()
            .set('start', start)
            .set('end', end)
            .set('establishmentId', establishmentId.toString());

        if (productIds && productIds.length > 0) params = params.set('productIds', productIds.join(','));
        if (brandIds && brandIds.length > 0) params = params.set('brandIds', brandIds.join(','));
        if (therapeuticActionIds && therapeuticActionIds.length > 0) params = params.set('therapeuticActionIds', therapeuticActionIds.join(','));
        if (sellerId) params = params.set('sellerId', sellerId.toString());

        return this.http.get(`${this.apiUrl}/pdf/products`, {
            params,
            responseType: 'blob'
        });
    }

    // ── Seller-specific PDF Reports ──

    getSellerPdf(
        start: string,
        end: string,
        establishmentId: number,
        sellerIds: number[]
    ): Observable<Blob> {
        let params = new HttpParams()
            .set('start', start)
            .set('end', end)
            .set('establishmentId', establishmentId.toString());

        if (sellerIds && sellerIds.length > 0) {
            params = params.set('sellerIds', sellerIds.join(','));
        }

        return this.http.get(`${this.apiUrl}/pdf/seller`, {
            params,
            responseType: 'blob'
        });
    }

    getSellerCategoriesPdf(
        start: string,
        end: string,
        establishmentId: number,
        sellerIds: number[],
        categoryIds?: number[]
    ): Observable<Blob> {
        let params = new HttpParams()
            .set('start', start)
            .set('end', end)
            .set('establishmentId', establishmentId.toString());

        if (sellerIds && sellerIds.length > 0) {
            params = params.set('sellerIds', sellerIds.join(','));
        }

        if (categoryIds && categoryIds.length > 0) {
            params = params.set('categoryIds', categoryIds.join(','));
        }

        return this.http.get(`${this.apiUrl}/pdf/seller-categories`, {
            params,
            responseType: 'blob'
        });
    }

    getSellerProductsPdf(
        start: string,
        end: string,
        establishmentId: number,
        sellerIds: number[],
        productIds?: number[]
    ): Observable<Blob> {
        let params = new HttpParams()
            .set('start', start)
            .set('end', end)
            .set('establishmentId', establishmentId.toString());

        if (sellerIds && sellerIds.length > 0) {
            params = params.set('sellerIds', sellerIds.join(','));
        }

        if (productIds && productIds.length > 0) {
            params = params.set('productIds', productIds.join(','));
        }

        return this.http.get(`${this.apiUrl}/pdf/seller-products`, {
            params,
            responseType: 'blob'
        });
    }

    // ── Customer-specific PDF Reports ──

    getSalesByCustomerPdf(
        start: string,
        end: string,
        establishmentId: number,
        customerIds?: number[]
    ): Observable<Blob> {
        let params = new HttpParams()
            .set('start', start)
            .set('end', end)
            .set('establishmentId', establishmentId.toString());

        if (customerIds && customerIds.length > 0) {
            params = params.set('customerIds', customerIds.join(','));
        }

        return this.http.get(`${this.apiUrl}/pdf/customer`, {
            params,
            responseType: 'blob'
        });
    }

    // ── Purchase Reports ──

    getPurchaseReport(start: string, end: string, establishmentId?: number): Observable<ResponseApi<PurchaseReport[]>> {
        let params = new HttpParams()
            .set('start', start)
            .set('end', end);
        if (establishmentId) {
            params = params.set('establishmentId', establishmentId.toString());
        }
        return this.http.get<ResponseApi<PurchaseReport[]>>(`${this.apiUrl}/purchases`, { params });
    }

    // ── Purchase PDF Reports (To Be Implemented in Backend) ──

    getPurchasesFilteredPdf(start: string, end: string, establishmentId: number | null): Observable<Blob> {
        let params = new HttpParams().set('start', start).set('end', end);
        if (establishmentId) params = params.set('establishmentId', establishmentId.toString());
        return this.http.get(`${this.apiUrl}/pdf/purchases/comprobantes`, { params, responseType: 'blob' });
    }

    getPurchasesByStatusPdf(start: string, end: string, establishmentId: number | null): Observable<Blob> {
        let params = new HttpParams().set('start', start).set('end', end);
        if (establishmentId) params = params.set('establishmentId', establishmentId.toString());
        return this.http.get(`${this.apiUrl}/pdf/purchases/status`, { params, responseType: 'blob' });
    }

    getPurchasesByCategoryPdf(start: string, end: string, establishmentId: number | null, categoryIds?: number[]): Observable<Blob> {
        let params = new HttpParams().set('start', start).set('end', end);
        if (establishmentId) params = params.set('establishmentId', establishmentId.toString());
        if (categoryIds && categoryIds.length > 0) params = params.set('categoryIds', categoryIds.join(','));
        return this.http.get(`${this.apiUrl}/pdf/purchases/categories`, { params, responseType: 'blob' });
    }

    getProductPriceHistoryPdf(start: string, end: string, establishmentId: number | null, productId?: number): Observable<Blob> {
        let params = new HttpParams().set('start', start).set('end', end);
        if (establishmentId) params = params.set('establishmentId', establishmentId.toString());
        if (productId) params = params.set('productId', productId.toString());
        return this.http.get(`${this.apiUrl}/pdf/purchases/price-history`, { params, responseType: 'blob' });
    }

    getPurchasesBySupplierPdf(start: string, end: string, establishmentId: number | null, supplierIds?: number[]): Observable<Blob> {
        let params = new HttpParams().set('start', start).set('end', end);
        if (establishmentId) params = params.set('establishmentId', establishmentId.toString());
        if (supplierIds && supplierIds.length > 0) params = params.set('supplierIds', supplierIds.join(','));
        return this.http.get(`${this.apiUrl}/pdf/purchases/supplier`, { params, responseType: 'blob' });
    }

    getAccountsPayableBySupplierPdf(start: string, end: string, establishmentId: number | null, supplierIds?: number[]): Observable<Blob> {
        let params = new HttpParams().set('start', start).set('end', end);
        if (establishmentId) params = params.set('establishmentId', establishmentId.toString());
        if (supplierIds && supplierIds.length > 0) params = params.set('supplierIds', supplierIds.join(','));
        return this.http.get(`${this.apiUrl}/pdf/purchases/accounts-payable`, { params, responseType: 'blob' });
    }

    getPurchasesByBuyerPdf(start: string, end: string, establishmentId: number | null, buyerIds?: number[]): Observable<Blob> {
        let params = new HttpParams().set('start', start).set('end', end);
        if (establishmentId) params = params.set('establishmentId', establishmentId.toString());
        if (buyerIds && buyerIds.length > 0) params = params.set('buyerIds', buyerIds.join(','));
        return this.http.get(`${this.apiUrl}/pdf/purchases/buyer`, { params, responseType: 'blob' });
    }

    // ── Cash Box PDF Reports ──

    getCashSessionsPdf(start: string, end: string, establishmentId: number | null): Observable<Blob> {
        let params = new HttpParams().set('start', start).set('end', end);
        if (establishmentId) params = params.set('establishmentId', establishmentId.toString());
        return this.http.get(`${this.apiUrl}/pdf/cash/sessions`, { params, responseType: 'blob' });
    }

    getCashMovementsPdf(start: string, end: string, establishmentId: number | null): Observable<Blob> {
        let params = new HttpParams().set('start', start).set('end', end);
        if (establishmentId) params = params.set('establishmentId', establishmentId.toString());
        return this.http.get(`${this.apiUrl}/pdf/cash/movements`, { params, responseType: 'blob' });
    }

    getCashArqueoPdf(sessionId: number): Observable<Blob> {
        return this.http.get(`${this.apiUrl}/pdf/cash/sessions/${sessionId}/arqueo`, { responseType: 'blob' });
    }
}
