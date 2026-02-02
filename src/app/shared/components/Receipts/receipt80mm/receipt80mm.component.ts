import { Component, Input, HostBinding } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { ReceiptHeader, ReceiptBody } from '../models/receipt.model';

@Component({
    selector: 'app-receipt80mm',
    standalone: true,
    imports: [CommonModule],
    providers: [DatePipe],
    templateUrl: './receipt80mm.component.html',
    styleUrl: './receipt80mm.component.scss'
})
export class Receipt80mmComponent {
    @Input() header: ReceiptHeader | null = null;
    @Input() body: ReceiptBody | null = null;

    @Input() documentInvalidate: boolean = false;
    @Input() primaryColor: string = '#3b82f6';
    @Input() className = '';

    constructor(private datePipe: DatePipe) { }

    formatCurrency(amount: number | undefined | null): string {
        return (amount ?? 0).toFixed(2);
    }

    formatDate(date: string | Date | undefined): string {
        if (!date) return '';
        return this.datePipe.transform(date, 'yyyy-MM-dd HH:mm:ss') || '';
    }

    get qrSrc(): string {
        return this.body?.qrBase64 || '';
    }

    get watermark(): string {
        return this.documentInvalidate ? 'INVALIDADO' : '';
    }
}
