import { Component, OnInit, inject, signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ReportService } from '../../../core/services/report.service';
import { EstablishmentStateService } from '../../../core/services/establishment-state.service';
import { PurchaseReport } from '../../../core/models/report.model';

@Component({
    selector: 'app-purchase-report',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './purchase-report.component.html',
    styleUrl: './purchase-report.component.scss'
})
export class PurchaseReportComponent implements OnInit {
    private reportService = inject(ReportService);
    private establishmentStateService = inject(EstablishmentStateService);

    purchases = signal<PurchaseReport[]>([]);
    isLoading = signal<boolean>(false);
    selectedEstablishmentId = this.establishmentStateService.selectedEstablishmentId;

    // Default to current month based logic 
    startDate = '';
    endDate = '';

    constructor() {
        // Automatically reload when establishment changes
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

        // Initial load only if effect hasn't triggered it
        if (this.selectedEstablishmentId()) {
            this.loadReport();
        }
    }

    loadReport(): void {
        this.isLoading.set(true);
        const establishmentId = this.selectedEstablishmentId() || undefined;
        this.reportService.getPurchaseReport(this.startDate, this.endDate, establishmentId).subscribe({
            next: (data) => {
                this.purchases.set(data);
                this.isLoading.set(false);
            },
            error: (err) => {
                console.error('Error loading purchase report', err);
                this.isLoading.set(false);
            }
        });
    }

    getTotalPurchases(): number {
        return this.purchases().reduce((sum, p) => sum + p.total, 0);
    }
}
