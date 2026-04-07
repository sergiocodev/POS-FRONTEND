import { Component, input, output, ChangeDetectionStrategy, inject } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { StockTransferResponse, TransferStatus } from '../../../../core/models/stock-transfer.model';
import { CustomTableComponent, TableColumn } from '../../../../shared/components/custom-table/custom-table.component';

@Component({
  selector: 'app-stock-transfer-details',
  standalone: true,
  imports: [CommonModule, CustomTableComponent],
  templateUrl: './stock-transfer-details.component.html',
  styleUrl: './stock-transfer-details.component.scss',
  providers: [DatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class StockTransferDetailsComponent {
  private datePipe = inject(DatePipe);

  // Inputs
  transfer = input.required<StockTransferResponse>();

  // Outputs
  dispatch = output<number>();
  receive = output<number>();
  cancel = output<number>();
  close = output<void>();

  // Enum access for template
  TransferStatus = TransferStatus;

  columns: TableColumn[] = [
    { key: 'productName', label: 'Producto' },
    { key: 'lotCode', label: 'Lote' },
    { key: 'unitName', label: 'Unidad' },
    { key: 'quantity', label: 'Cantidad', classCallback: () => 'fw-bold text-center' }
  ];

  getStatusBadgeClass(status: string): string {
    switch (status) {
      case TransferStatus.PENDING: return 'bg-warning-subtle text-warning border border-warning px-3 py-1';
      case TransferStatus.IN_TRANSIT: return 'bg-info-subtle text-info border border-info px-3 py-1';
      case TransferStatus.COMPLETED: return 'bg-success-subtle text-success border border-success px-3 py-1';
      case TransferStatus.CANCELED: return 'bg-danger-subtle text-danger border border-danger px-3 py-1';
      default: return 'bg-secondary-subtle text-secondary px-3 py-1';
    }
  }

  onDispatch() {
    this.dispatch.emit(this.transfer().id);
  }

  onReceive() {
    this.receive.emit(this.transfer().id);
  }

  onCancel() {
    this.cancel.emit(this.transfer().id);
  }
}
