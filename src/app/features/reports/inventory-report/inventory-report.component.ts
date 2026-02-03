import { Component, OnInit, inject, signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ReportService } from '../../../core/services/report.service';
import { EstablishmentStateService } from '../../../core/services/establishment-state.service';
import { InventoryReport } from '../../../core/models/report.model';

@Component({
    selector: 'app-inventory-report',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './inventory-report.component.html',
    styleUrl: './inventory-report.component.scss'
})
export class InventoryReportComponent implements OnInit {
    private reportService = inject(ReportService);
    private establishmentStateService = inject(EstablishmentStateService);

    reportData = signal<InventoryReport[]>([]);
    isLoading = signal<boolean>(false);
    selectedEstablishmentId = this.establishmentStateService.selectedEstablishmentId;
    activeTab = signal<'GENERAL' | 'LOW_STOCK' | 'EXPIRING'>('GENERAL');

    
    lowStockThreshold = signal<number>(10);
    expiringDays = signal<number>(30);

    constructor() {
        
        effect(() => {
            if (this.selectedEstablishmentId()) {
                this.loadReport();
            }
        });
    }

    ngOnInit(): void {
        if (this.selectedEstablishmentId()) {
            this.loadReport();
        }
    }

    setTab(tab: 'GENERAL' | 'LOW_STOCK' | 'EXPIRING'): void {
        this.activeTab.set(tab);
        this.loadReport();
    }

    loadReport(): void {
        this.isLoading.set(true);
        let request;
        const establishmentId = this.selectedEstablishmentId() || undefined;

        switch (this.activeTab()) {
            case 'LOW_STOCK':
                request = this.reportService.getLowStockReport(this.lowStockThreshold(), establishmentId);
                break;
            case 'EXPIRING':
                request = this.reportService.getExpiringReport(this.expiringDays(), establishmentId);
                break;
            default:
                request = this.reportService.getInventoryReport(establishmentId);
                break;
        }

        request.subscribe({
            next: (data) => {
                this.reportData.set(data);
                this.isLoading.set(false);
            },
            error: (err) => {
                console.error('Error loading report', err);
                this.isLoading.set(false);
            }
        });
    }

    getStockBadgeClass(status: string): string {
        switch (status) {
            case 'CRITICAL': return 'bg-danger';
            case 'LOW': return 'bg-warning text-dark';
            default: return 'bg-success';
        }
    }

    exportToCsv(): void {
        
        const data = this.reportData();
        if (data.length === 0) return;

        const headers = ['Producto', 'Código', 'Lote', 'Vencimiento', 'Cantidad', 'Costo', 'Precio', 'Estado'];
        const csvContent = [
            headers.join(','),
            ...data.map(item => [
                `"${item.productName}"`,
                item.productCode,
                item.lotCode,
                item.expiryDate,
                item.quantity,
                item.costPrice,
                item.salesPrice,
                item.stockStatus
            ].join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `inventario_${this.activeTab()}_${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
    }
}
