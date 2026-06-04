import { Component, Input, Output, EventEmitter, inject, signal, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AccountReceivableResponse, AccountReceivablePaymentResponse } from '../../../../core/models/account-receivable.model';
import { AccountReceivableService } from '../../../../core/services/account-receivable.service';
import { ModalService } from '../../../../shared/components/confirm-modal/service/modal.service';
import { CustomTableComponent, TableColumn } from '../../../../shared/components/custom-table/custom-table.component';

@Component({
  selector: 'app-payment-history',
  standalone: true,
  imports: [CommonModule, CustomTableComponent],
  templateUrl: './payment-history.component.html',
  styleUrl: './payment-history.component.scss'
  // Force recompile
})
export class PaymentHistoryComponent implements OnChanges {
  @Input() selectedReceivable: AccountReceivableResponse | null = null;
  @Output() close = new EventEmitter<void>();

  private accountReceivableService = inject(AccountReceivableService);
  private modalService = inject(ModalService);

  paymentHistory = signal<AccountReceivablePaymentResponse[]>([]);
  isLoadingHistory = signal<boolean>(false);

  historyColumns: TableColumn[] = [
      { key: 'paymentDate', label: 'Fecha', format: (val) => {
          const d = new Date(val);
          return `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getFullYear()} ${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
      }},
      { key: 'amount', label: 'Monto', format: (val) => `S/ ${Number(val).toFixed(2)}` },
      { 
          key: 'paymentMethod', 
          label: 'Método', 
          type: 'badge',
          classCallback: () => 'bg-secondary'
      },
      { key: 'reference', label: 'Referencia', format: (val) => val ? val : '-' },
      { key: 'username', label: 'Usuario' }
  ];

  ngOnChanges(changes: SimpleChanges): void {
      if (changes['selectedReceivable'] && this.selectedReceivable) {
          this.loadHistory();
      }
  }

  loadHistory() {
      if (!this.selectedReceivable) return;
      this.isLoadingHistory.set(true);
      this.accountReceivableService.getPaymentsByReceivableId(this.selectedReceivable.id).subscribe({
          next: (res: any) => {
              this.paymentHistory.set(res.data);
              this.isLoadingHistory.set(false);
          },
          error: (err: any) => {
              this.isLoadingHistory.set(false);
              this.modalService.alert({ title: 'Error', message: 'No se pudo cargar el historial de pagos', type: 'error' });
          }
      });
  }

  closeHistoryModal() {
      this.close.emit();
  }
}
