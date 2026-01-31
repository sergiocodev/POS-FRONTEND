import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ReportService } from '../../../core/services/report.service';
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

    purchases = signal<PurchaseReport[]>([]);
    isLoading = signal<boolean>(false);

    // Default to current month based logic 
    startDate = '';
    endDate = '';

    ngOnInit(): void {
        const today = new Date();
        const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);

        this.startDate = firstDay.toISOString().split('T')[0];
        this.endDate = today.toISOString().split('T')[0];

        this.loadReport();
    }

    loadReport(): void {
        this.isLoading.set(true);
        this.reportService.getPurchaseReport(this.startDate, this.endDate).subscribe({
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
