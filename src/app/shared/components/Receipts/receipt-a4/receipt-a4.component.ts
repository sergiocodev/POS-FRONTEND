import { Component, Input, ViewChild, ElementRef, AfterViewInit, HostListener } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { ReceiptHeader, ReceiptBody } from '../models/receipt.model';

@Component({
    selector: 'app-receipt-a4',
    standalone: true,
    imports: [CommonModule],
    providers: [DatePipe],
    templateUrl: './receipt-a4.component.html',
    styleUrl: './receipt-a4.component.scss'
})
export class ReceiptA4Component implements AfterViewInit {
    @Input() header: ReceiptHeader | null = null;
    @Input() body: ReceiptBody | null = null;
    @Input() documentInvalidate: boolean = false;

    @ViewChild('contentToScale') contentToScale!: ElementRef;
    @ViewChild('mainContainer') mainContainer!: ElementRef;

    scale: number = 1;
    contentWidth: number = 794; // Baseline for A4 (~210mm)

    constructor(private datePipe: DatePipe) { }

    ngAfterViewInit() {
        setTimeout(() => this.calculateScale(), 50);
    }

    @HostListener('window:resize')
    onResize() {
        this.calculateScale();
    }

    private calculateScale() {
        if (!this.mainContainer || !this.contentToScale) return;
        const containerWidth = this.mainContainer.nativeElement.clientWidth;
        if (containerWidth < this.contentWidth) {
            this.scale = (containerWidth / this.contentWidth) * 0.95;
        } else {
            this.scale = 1;
        }
    }

    formatCurrency(amount: number | undefined | null): string {
        return (amount ?? 0).toFixed(2);
    }

    formatDate(date: string | Date | undefined): string {
        if (!date) return '';
        return this.datePipe.transform(date, 'yyyy-MM-dd HH:mm:ss') || '';
    }

    get watermark(): string {
        return this.documentInvalidate ? 'INVALIDADO' : '';
    }
}
