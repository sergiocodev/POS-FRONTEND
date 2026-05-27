import { Component, Input, Output, EventEmitter, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PurchaseResponse } from '../../../../core/models/purchase.model';

@Component({
  selector: 'app-purchase-detail',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './purchase-detail.component.html',
  styleUrl: './purchase-detail.component.scss',
})
export class PurchaseDetailComponent {
  @Input() purchase?: PurchaseResponse;
  @Output() close = new EventEmitter<void>();
  @Output() actionSuccess = new EventEmitter<void>();
  @Output() cancel = new EventEmitter<number>();

  onClose() {
    this.close.emit();
  }

  onPrint() {
    window.print();
  }

  onInvalidate() {
    if (this.purchase) {
      this.cancel.emit(this.purchase.id);
    }
  }
}
