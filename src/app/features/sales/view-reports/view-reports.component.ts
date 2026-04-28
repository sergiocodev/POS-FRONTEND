import { Component, OnInit, inject, signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReportService } from '../../../core/services/report.service';
import { EstablishmentStateService } from '../../../core/services/establishment-state.service';
import { SalesReport, SalesSummary } from '../../../core/models/report.model';
import { SalesReportComponent } from './sales-report/sales-report.component';
import { ModuleHeaderComponent } from '../../../shared/components/module-header/module-header.component';

@Component({
    selector: 'app-view-reports',
    standalone: true,
    imports: [
        CommonModule,
        SalesReportComponent,
        ModuleHeaderComponent
    ],
    templateUrl: './view-reports.component.html'
})
export class ViewReportsComponent implements OnInit {
    private reportService = inject(ReportService);
    private establishmentStateService = inject(EstablishmentStateService);

    // State
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
            next: (response) => {
                this.sales.set(response.data);
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
            next: (response) => {
                this.summary.set(response.data);
                this.isLoading.set(false);
            },
            error: (err) => {
                console.error(err);
                this.isLoading.set(false);
            }
        });
    }

    handleFilterChange(event: { startDate: string, endDate: string }) {
        this.startDate = event.startDate;
        this.endDate = event.endDate;
        this.loadReport();
    }
}
