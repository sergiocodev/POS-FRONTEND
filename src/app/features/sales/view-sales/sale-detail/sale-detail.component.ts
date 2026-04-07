import { Component, Input, Output, EventEmitter, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SaleResponse } from '../../../../core/models/sale.model';
import { SaleService } from '../../../../core/services/sale.service';

@Component({
  selector: 'app-sale-detail',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './sale-detail.component.html',
  styleUrl: './sale-detail.component.scss',
})
export class SaleDetailComponent {
  private saleService = inject(SaleService);

  @Input() sale?: SaleResponse;
  @Output() close = new EventEmitter<void>();
  @Output() actionSuccess = new EventEmitter<void>();

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
    if (this.sale && confirm('¿Estás seguro de anular esta venta?')) {
      this.saleService.cancel(this.sale.id).subscribe({
        next: () => {
          this.actionSuccess.emit();
          this.onClose();
        },
        error: (err) => console.error('Error invalidating sale:', err)
      });
    }
  }
}
