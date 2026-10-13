import { Component, Input, Output, EventEmitter, inject } from '@angular/core';
import { CommonModule, DatePipe, CurrencyPipe } from '@angular/common';
import { CustomTableComponent, TableColumn } from '../../../../shared/components/custom-table/custom-table.component';
import { SupplierDetailResponse } from '../../../../core/models/supplier.model';

@Component({
  selector: 'app-suppliers-list',
  standalone: true,
  imports: [CommonModule, CustomTableComponent],
  templateUrl: './suppliers-list.component.html',
  styleUrl: './suppliers-list.component.scss',
  providers: [DatePipe, CurrencyPipe]
})
export class SuppliersListComponent {
  private datePipe = inject(DatePipe);
  private currencyPipe = inject(CurrencyPipe);

  @Input() suppliers: SupplierDetailResponse[] = [];
  @Input() pageSize: number = 10;
  @Input() totalItems: number = 0;
  @Input() currentPage: number = 1;

  @Output() onAction = new EventEmitter<{ action: string, row: SupplierDetailResponse }>();
  @Output() onPageChange = new EventEmitter<number>();
  @Output() onPageSizeChange = new EventEmitter<number>();
  @Output() onFilterChange = new EventEmitter<any>();

  cols: TableColumn[] = [
    { key: 'index', label: 'N°', type: 'index', width: '50px', align: 'center' },
    {
      key: 'providerInfo',
      label: 'PROVEEDOR',
      type: 'html',
      format: (_: any, row: SupplierDetailResponse) => `
        <div class="d-flex flex-column align-items-center justify-content-center text-center">
          <div class="fw-bold">${row.name}</div>
          <small class="text-muted">RUC: ${row.ruc || 'N/A'}</small>
        </div>
      `,
      filterable: true, align: 'center'
    },
    { key: 'category', label: 'CATEGORÍA', type: 'text', filterable: true, align: 'center' },
    {
      key: 'contactInfo',
      label: 'CONTACTO',
      type: 'html',
      format: (_: any, row: SupplierDetailResponse) => `
        <div>
          <div class="fw-bold">${row.contactName || 'Sin contacto'}</div>
          <small class="text-muted">${row.email || 'Sin email'}</small>
        </div>
      `,
      filterable: true, align: 'center'
    },
    {
      key: 'status',
      label: 'ESTADO',
      type: 'badge',
      classCallback: (status: string) => {
        if (status === 'ACTIVO') return 'bg-success-subtle text-success';
        if (status === 'EN_EVALUACION') return 'bg-warning-subtle text-warning';
        if (status === 'VENCIDO') return 'bg-danger-subtle text-danger';
        return 'bg-secondary-subtle text-secondary';
      }, align: 'center',
      format: (val: string) => {
        if (val === 'EN_EVALUACION') return 'En evaluación';
        if (val === 'ACTIVO') return 'Activo';
        if (val === 'VENCIDO') return 'Vencido';
        return val || 'N/A';
      }
    },
    {
      key: 'ratingInfo',
      label: 'EVALUACIÓN',
      type: 'html',
      format: (_: any, row: SupplierDetailResponse) => {
        const rating = row.rating || 0;
        const stars = Math.round(rating);
        let html = '<div class="d-flex align-items-center justify-content-center"><span class="text-warning me-2">';
        for (let i = 1; i <= 5; i++) {
          html += i <= stars ? '<i class="bi bi-star-fill"></i>' : '<i class="bi bi-star text-muted"></i>';
        }
        html += `</span><span class="fw-bold">${rating.toFixed(1)}</span></div>`;
        return html;
      }, align: 'center'
    },
    {
      key: 'lastPurchase',
      label: 'ÚLTIMA COMPRA',
      type: 'text',
      format: (v: any) => v ? this.datePipe.transform(v, 'dd/MM/yyyy') || 'N/A' : 'Sin compras',
      align: 'center'
    },
    {
      key: 'purchaseVolume',
      label: 'VOLUMEN DE COMPRA',
      type: 'text',
      format: (v: any) => v != null ? `S/ ${Number(v).toFixed(2)}` : 'S/ 0.00',
      align: 'center'
    },
    { key: 'actions', label: 'ACCIONES', type: 'action', align: 'center' }
  ];
}
