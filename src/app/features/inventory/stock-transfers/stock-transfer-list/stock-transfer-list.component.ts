import { Component, inject, computed, ViewChild, TemplateRef, input, output, ChangeDetectionStrategy, OnInit } from '@angular/core';
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
export class StockTransferListComponent implements OnInit {
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
  @ViewChild('docTemplate', { static: true }) docTemplate!: TemplateRef<any>;

  columns = computed<TableColumn[]>(() => {
    const isSent = this.activeTab() === 'SENT';
    
    return [
      { 
        key: 'transferNumber', 
        label: 'Documento', 
        type: 'template', 
        templateRef: this.docTemplate, 
        filterable: true 
      },
      isSent 
        ? { key: 'targetEstablishmentName', label: 'Destino', filterable: true }
        : { key: 'sourceEstablishmentName', label: 'Origen', filterable: true },
      { 
        key: 'userName', 
        label: 'Registrado por', 
        filterable: true 
      },
      { 
        key: 'items', 
        label: 'Artículos', 
        type: 'badge', 
        classCallback: () => 'bg-secondary-subtle text-secondary fw-bold px-2 py-1', 
        format: (val: any[]) => `${val?.length || 0} ítems` 
      },
      { 
        key: 'status', 
        label: 'Estado', 
        type: 'badge', 
        classCallback: (val: any) => this.getStatusBadgeClass(val),
        format: (val: any) => this.getStatusLabel(val)
      },
      { 
        key: 'actions', 
        label: 'Acciones', 
        type: 'template', 
        templateRef: this.actionTemplate 
      }
    ];
  });

  ngOnInit() {
  }

  setTab(tab: 'SENT' | 'RECEIVED') {
    this.tabChange.emit(tab);
  }

  getStatusBadgeClass(status: string): string {
    switch (status) {
      case TransferStatus.PENDING: return 'bg-warning-subtle text-warning border border-warning px-2 py-1';
      case TransferStatus.IN_TRANSIT: return 'bg-info-subtle text-info border border-info px-2 py-1';
      case TransferStatus.COMPLETED: return 'bg-success-subtle text-success border border-success px-2 py-1';
      case TransferStatus.CANCELED: return 'bg-danger-subtle text-danger border border-danger px-2 py-1';
      default: return 'bg-secondary-subtle text-secondary px-2 py-1';
    }
  }

  getStatusLabel(status: string): string {
    switch (status) {
      case TransferStatus.PENDING: return 'PENDIENTE';
      case TransferStatus.IN_TRANSIT: return 'EN TRÁNSITO';
      case TransferStatus.COMPLETED: return 'COMPLETADA';
      case TransferStatus.CANCELED: return 'ANULADA';
      default: return status;
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

