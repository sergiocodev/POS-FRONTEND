import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule, DatePipe, CurrencyPipe } from '@angular/common';
import { SupplierService } from '../../../core/services/supplier.service';
import { SupplierDetailResponse, SupplierSummaryResponse } from '../../../core/models/supplier.model';
import { SmartKpiCardsComponent, SmartKpiItem } from '../../../shared/components/smart-kpi-cards/smart-kpi-cards.component';
import { CustomTableComponent, TableColumn } from '../../../shared/components/custom-table/custom-table.component';
import { FormsModule } from '@angular/forms';
import { ModuleHeaderComponent } from '../../../shared/components/module-header/module-header.component';

@Component({
  selector: 'app-suppliers',
  standalone: true,
  imports: [CommonModule, SmartKpiCardsComponent, CustomTableComponent, FormsModule, ModuleHeaderComponent],
  templateUrl: './suppliers.component.html',
  styleUrl: './suppliers.component.scss',
  providers: [DatePipe, CurrencyPipe]
})
export class SuppliersComponent implements OnInit {
  Math = Math;
  private supplierService = inject(SupplierService);
  private datePipe = inject(DatePipe);
  private currencyPipe = inject(CurrencyPipe);

  // State
  suppliers = signal<SupplierDetailResponse[]>([]);
  isLoading = signal<boolean>(false);
  
  // Pagination
  currentPage = signal(0);
  pageSize = signal(10);
  totalItems = signal(0);
  totalPages = signal(0);

  // Summary
  kpiItems = signal<SmartKpiItem[]>([
    { label: 'Proveedores Activos', value: 0, icon: 'bi-people-fill', color: 'blue' },
    { label: 'En Evaluación', value: 0, icon: 'bi-clipboard2-pulse', color: 'orange' },
    { label: 'Vencidos', value: 0, icon: 'bi-exclamation-circle', color: 'purple' },
    { label: 'Gasto Total (Año)', value: 0, prefix: '$', icon: 'bi-wallet2', color: 'green' },
    { label: 'Evaluación Promedio', value: '0.0', suffix: '/ 5', icon: 'bi-star-half', color: 'blue' },
  ]);

  private buildKpiItems(s: SupplierSummaryResponse): SmartKpiItem[] {
    return [
      {
        label: 'Proveedores Activos',
        value: s.activeSuppliers,
        icon: 'bi-people-fill',
        color: 'blue',
        trendValue: '+ 85%',
        trendDirection: 'up',
        trendText: 'del total'
      },
      {
        label: 'En Evaluación',
        value: s.evaluatingSuppliers,
        icon: 'bi-clipboard2-pulse',
        color: 'orange',
        trendValue: '- 12.5%',
        trendDirection: 'down',
        trendText: 'del total'
      },
      {
        label: 'Vencidos',
        value: s.expiredSuppliers,
        icon: 'bi-exclamation-circle',
        color: 'purple',
        trendValue: '- 7.5%',
        trendDirection: 'down',
        trendText: 'del total'
      },
      {
        label: 'Gasto Total (Año)',
        value: s.totalSpendYear.toLocaleString('en-US', { maximumFractionDigits: 0 }),
        prefix: '$',
        icon: 'bi-wallet2',
        color: 'green',
        trendValue: '+ 18%',
        trendDirection: 'up',
        trendText: 'vs año anterior'
      },
      {
        label: 'Evaluación Promedio',
        value: s.averageRating.toFixed(1),
        suffix: '/ 5',
        icon: 'bi-star-half',
        color: 'blue',
        trendValue: '+ 0.3',
        trendDirection: 'up',
        trendText: 'vs periodo anterior'
      },
    ];
  }

  cols: TableColumn[] = [
    { key: 'index', label: '#', type: 'index', width: '50px', align: 'center' },
    { 
      key: 'providerInfo', 
      label: 'PROVEEDOR', 
      type: 'html',
      format: (_: any, row: SupplierDetailResponse) => `
        <div class="d-flex align-items-center">
          <div class="avatar me-2 bg-light text-primary fw-bold rounded-circle d-flex align-items-center justify-content-center" style="width: 40px; height: 40px;">
            ${row.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <div class="fw-bold">${row.name}</div>
            <small class="text-muted">RUC: ${row.ruc || 'N/A'}</small>
          </div>
        </div>
      `
    },
    { key: 'category', label: 'CATEGORÍA', type: 'text' },
    { 
      key: 'contactInfo', 
      label: 'CONTACTO', 
      type: 'html',
      format: (_: any, row: SupplierDetailResponse) => `
        <div>
          <div class="fw-bold">${row.contactName || 'Sin contacto'}</div>
          <small class="text-muted">${row.email || 'Sin email'}</small>
        </div>
      `
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
      },
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
        let html = '<div class="d-flex align-items-center"><span class="text-warning me-2">';
        for (let i = 1; i <= 5; i++) {
          html += i <= stars ? '<i class="bi bi-star-fill"></i>' : '<i class="bi bi-star text-muted"></i>';
        }
        html += `</span><span class="fw-bold">${rating.toFixed(1)}</span></div>`;
        return html;
      }
    },
    { 
      key: 'lastPurchase', 
      label: 'ÚLTIMA COMPRA', 
      type: 'text', 
      format: (v: any) => v ? this.datePipe.transform(v, 'dd/MM/yyyy') || 'N/A' : 'Sin compras' 
    },
    { 
      key: 'purchaseVolume', 
      label: 'VOLUMEN DE COMPRA', 
      type: 'text', 
      format: (v: any) => v ? this.currencyPipe.transform(v, 'USD', 'symbol', '1.0-0') || '$0' : '$0' 
    },
    { key: 'actions', label: 'ACCIONES', type: 'action' }
  ];

  ngOnInit(): void {
    this.loadSuppliers();
    this.loadSummary();
  }

  loadSuppliers(): void {
    this.isLoading.set(true);
    this.supplierService.getPaged(this.currentPage(), this.pageSize()).subscribe({
      next: (response) => {
        const page = response.data;
        this.suppliers.set(page.content || []);
        this.totalItems.set(page.totalElements || 0);
        this.totalPages.set(page.totalPages || 0);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Error loading suppliers', err);
        this.isLoading.set(false);
      }
    });
  }

  loadSummary(): void {
    this.supplierService.getSummary().subscribe({
      next: (response) => {
        this.kpiItems.set(this.buildKpiItems(response.data));
      },
      error: (err) => console.error('Error loading summary', err)
    });
  }

  handleTableAction(e: { action: string, row: SupplierDetailResponse }) {
    if (e.action === 'view' || e.action === 'edit') {
      console.log('Action view on supplier:', e.row);
    }
  }

  handlePageChange(page: number): void {
    this.currentPage.set(page);
    this.loadSuppliers();
  }

  handlePageSizeChangeValue(size: number): void {
    this.pageSize.set(size);
    this.currentPage.set(0);
    this.loadSuppliers();
  }
}
