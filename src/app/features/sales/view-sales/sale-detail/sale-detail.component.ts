import { Component, Input, Output, EventEmitter, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SaleResponse } from '../../../../core/models/sale.model';

@Component({
  selector: 'app-sale-detail',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './sale-detail.component.html',
  styleUrl: './sale-detail.component.scss',
})
export class SaleDetailComponent {
  @Input() sale?: SaleResponse;
  @Output() close = new EventEmitter<void>();
  @Output() actionSuccess = new EventEmitter<void>();
  @Output() cancel = new EventEmitter<number>();

  selectedTab = signal<string>('document');
  selectedFormat = signal<string>('TICKET');

  onClose() {
    this.close.emit();
  }

  selectTab(tab: string) {
    this.selectedTab.set(tab);
  }

  onFormatChange(event: any) {
    this.selectedFormat.set(event.target.value);
  }

  onPrint() {
    window.print();
  }

  onDownload() {
    if (this.sale?.pdfUrl) {
      window.open(this.sale.pdfUrl, '_blank');
    } else {
      console.log('No PDF URL available');
    }
  }

  onShare() {
    if (navigator.share) {
      navigator.share({
        title: 'Comprobante de Venta',
        text: `Comprobante ${this.sale?.series}-${this.sale?.number}`,
        url: window.location.href
      });
    }
  }

  onClone() {
    console.log('Cloning sale:', this.sale?.id);
  }

  onInvalidate() {
    if (this.sale) {
      this.cancel.emit(this.sale.id);
    }
  }
}
