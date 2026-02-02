import { Component, Input } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { SaleOrNoteReceiptDto, ReceiptHeader, ReceiptBody } from '../models/receipt.model';

@Component({
    selector: 'app-receipt-ticket',
    standalone: true,
    imports: [CommonModule],
    providers: [DatePipe],
    templateUrl: './receipt-ticket.component.html',
    styleUrl: './receipt-ticket.component.scss'
})
export class ReceiptTicketComponent {
    @Input() header: ReceiptHeader | null = null;
    @Input() body: ReceiptBody | null = null;

    @Input() documentInvalidate: boolean = false;
    @Input() watermarkText = '';
    @Input() className = '';

    constructor(private datePipe: DatePipe) { }

    formatCurrency(amount: number | undefined | null): string {
        return (amount ?? 0).toFixed(2);
    }

    formatDate(date: string | Date | undefined): string {
        if (!date) return '';
        return this.datePipe.transform(date, 'yyyy-MM-dd HH:mm:ss') || '';
    }

    get watermark(): string {
        return this.documentInvalidate ? 'INVALIDADO' : this.watermarkText;
    }
}
