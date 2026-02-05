import { Component, OnInit, inject, signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ModuleHeaderComponent } from '../../../../shared/components/module-header/module-header.component';
import { FormsModule } from '@angular/forms';
import { ReportService } from '../../../../core/services/report.service';
import { EstablishmentStateService } from '../../../../core/services/establishment-state.service';
import { SalesReport, SalesSummary } from '../../../../core/models/report.model';

@Component({
    selector: 'app-sales-report',
    standalone: true,
    imports: [CommonModule, FormsModule, ModuleHeaderComponent],
    templateUrl: './sales-report.component.html',
    styleUrl: './sales-report.component.scss'
})
export class SalesReportComponent implements OnInit {
    private reportService = inject(ReportService);
    private establishmentStateService = inject(EstablishmentStateService);

    sales = signal<SalesReport[]>([]);
    summary = signal<SalesSummary | null>(null);
    isLoading = signal<boolean>(false);
    selectedEstablishmentId = this.establishmentStateService.selectedEstablishmentId;

    startDate = '';
    endDate = '';

    constructor() {
        effect(() => {
            if (this.selectedEstablishmentId()) {
                this.loadReport();
            }
        });
    }

    ngOnInit(): void {
        const today = new Date();
        const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);

        this.startDate = firstDay.toISOString().split('T')[0];
        this.endDate = today.toISOString().split('T')[0];

        if (this.selectedEstablishmentId()) {
            this.loadReport();
        }
    }

    loadReport(): void {
        this.isLoading.set(true);
        const establishmentId = this.selectedEstablishmentId() || undefined;

        this.reportService.getSalesReport(this.startDate, this.endDate, establishmentId).subscribe({
            next: (data) => {
                this.sales.set(data);
                this.loadSummary();
            },
            error: (err) => {
                console.error(err);
                this.isLoading.set(false);
            }
        });
    }

    loadSummary(): void {
        const establishmentId = this.selectedEstablishmentId() || undefined;
        this.reportService.getSalesSummary(this.startDate, this.endDate, establishmentId).subscribe({
            next: (data) => {
                this.summary.set(data);
                this.isLoading.set(false);
            },
            error: (err) => {
                console.error(err);
                this.isLoading.set(false);
            }
        });
    }

    getStatusClass(status: string): string {
        switch (status) {
            case 'COMPLETED':
            case 'PAGADO':
                return 'text-bg-success'; // Fondo verde, texto blanco automático
            case 'PENDING':
            case 'PENDIENTE':
                return 'text-bg-warning'; // Fondo amarillo, texto negro automático
            case 'CANCELLED':
            case 'ANULADO':
                return 'text-bg-danger'; // Fondo rojo, texto blanco automático
            default:
                return 'text-bg-secondary';
        }
    }
}