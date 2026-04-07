import { Component, inject, signal, ViewChild, TemplateRef, input, output, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { CustomTableComponent, TableColumn } from '../../../../shared/components/custom-table/custom-table.component';
import { StockTransferResponse, TransferStatus } from '../../../../core/models/stock-transfer.model';

@Component({
  selector: 'app-stock-transfer-list',
  standalone: true,
  imports: [CommonModule, CustomTableComponent],
  templateUrl: './stock-transfer-list.component.html',
  styleUrl: './stock-transfer-list.component.scss',
  providers: [DatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class StockTransferListComponent {
  private datePipe = inject(DatePipe);

  // Inputs using signals
  transfers = input<StockTransferResponse[]>([]);
  isLoading = input<boolean>(false);
  activeTab = input<'SENT' | 'RECEIVED'>('SENT');

  // Outputs
  tabChange = output<'SENT' | 'RECEIVED'>();
  create = output<void>();
  view = output<StockTransferResponse>();
  dispatch = output<number>();
  receive = output<number>();
  cancel = output<number>();

  @ViewChild('actionTemplate', { static: true }) actionTemplate!: TemplateRef<any>;

  columns: TableColumn[] = [
    { key: 'transferNumber', label: 'Número', filterable: true },
    { 
      key: 'createdAt', 
      label: 'Fecha', 
      format: (val: any) => val ? this.datePipe.transform(val, 'dd/MM/yyyy HH:mm') || '' : ''
    },
    { key: 'sourceEstablishmentName', label: 'Origen', filterable: true },
    { key: 'targetEstablishmentName', label: 'Destino', filterable: true },
    { key: 'status', label: 'Estado', type: 'badge', classCallback: (val: any) => this.getStatusBadgeClass(val) },
    { key: 'actions', label: 'Acciones', type: 'template', templateRef: undefined } // Template will be set after view init or in constructor if possible
  ];

  constructor() {
    // We need to wait for ViewChild to be available, or we can use the template inside the HTML
  }

  ngOnInit() {
    this.columns = this.columns.map(col => 
      col.key === 'actions' ? { ...col, templateRef: this.actionTemplate } : col
    );
  }

  setTab(tab: 'SENT' | 'RECEIVED') {
    this.tabChange.emit(tab);
  }

  getStatusBadgeClass(status: string): string {
    switch (status) {
      case TransferStatus.PENDING: return 'bg-warning-subtle text-warning border border-warning';
      case TransferStatus.IN_TRANSIT: return 'bg-info-subtle text-info border border-info';
      case TransferStatus.COMPLETED: return 'bg-success-subtle text-success border border-success';
      case TransferStatus.CANCELED: return 'bg-danger-subtle text-danger border border-danger';
      default: return 'bg-secondary-subtle text-secondary';
    }
  }

  handleAction(event: { action: string, row: any }) {
    switch (event.action) {
      case 'view': this.view.emit(event.row); break;
      case 'dispatch': this.dispatch.emit(event.row.id); break;
      case 'receive': this.receive.emit(event.row.id); break;
      case 'cancel': this.cancel.emit(event.row.id); break;
    }
  }
}

