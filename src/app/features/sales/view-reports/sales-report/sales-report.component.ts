import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SalesReport, SalesSummary } from '../../../../core/models/report.model';

@Component({
    selector: 'app-sales-report',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './sales-report.component.html',
    styleUrl: './sales-report.component.scss'
})
export class SalesReportComponent implements OnInit {
    @Input() sales: SalesReport[] = [];
    @Input() summary: SalesSummary | null = null;
    @Input() isLoading = false;
    @Input() initialStartDate = '';
    @Input() initialEndDate = '';

    @Output() filterChange = new EventEmitter<{ startDate: string, endDate: string }>();

    startDate = '';
    endDate = '';

    ngOnInit(): void {
        this.startDate = this.initialStartDate;
        this.endDate = this.initialEndDate;
    }

    onFilter(): void {
        this.filterChange.emit({
            startDate: this.startDate,
            endDate: this.endDate
        });
    }

    getStatusClass(status: string): string {
        switch (status) {
            case 'COMPLETED':
            case 'PAGADO':
                return 'text-bg-success';
            case 'PENDING':
            case 'PENDIENTE':
                return 'text-bg-warning';
            case 'CANCELLED':
            case 'ANULADO':
                return 'text-bg-danger';
            default:
                return 'text-bg-secondary';
        }
    }
}