import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SupplierService } from '../../../core/services/supplier.service';
import { SupplierDetailResponse, SupplierSummaryResponse } from '../../../core/models/supplier.model';
import { SmartKpiCardsComponent, SmartKpiItem } from '../../../shared/components/smart-kpi-cards/smart-kpi-cards.component';
import { FormsModule } from '@angular/forms';
import { ModuleHeaderComponent } from '../../../shared/components/module-header/module-header.component';
import { ModalGenericComponent } from '../../../shared/components/modal-generic/modal-generic.component';
import { SupplierFormComponent } from './supplier-form/supplier-form.component';
import { SuppliersListComponent } from './suppliers-list/suppliers-list.component';
import { ModalAlertComponent } from '../../../shared/components/modal-alert/modal-alert.component';
import { ConfirmModalComponent } from '../../../shared/components/confirm-modal/confirm-modal.component';
import { ModalService } from '../../../shared/components/confirm-modal/service/modal.service';
import { SpinnerComponent } from '../../../shared/components/spinner/spinner.component';

@Component({
  selector: 'app-suppliers',
  standalone: true,
  imports: [CommonModule, SmartKpiCardsComponent, FormsModule, ModuleHeaderComponent, ModalGenericComponent, SupplierFormComponent, SuppliersListComponent, ModalAlertComponent, ConfirmModalComponent, SpinnerComponent],
  templateUrl: './suppliers.component.html',
  styleUrl: './suppliers.component.scss'
})
export class SuppliersComponent implements OnInit {
  Math = Math;
  private supplierService = inject(SupplierService);
  private modalService = inject(ModalService);

  // State
  suppliers = signal<SupplierDetailResponse[]>([]);
  isLoading = signal<boolean>(false);
  
  // Pagination
  currentPage = signal(0);
  pageSize = signal(10);
  totalItems = signal(0);
  totalPages = signal(0);
  tableFilters = signal<any>({});

  // Modal State
  showFormModal = signal<boolean>(false);
  selectedSupplierId = signal<number | null>(null);

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

  ngOnInit(): void {
    this.loadSuppliers();
    this.loadSummary();
  }

  loadSuppliers(): void {
    this.isLoading.set(true);
    this.supplierService.getPaged(this.currentPage(), this.pageSize(), this.tableFilters()).subscribe({
      next: (response: any) => {
        const page = response.data;
        const items = page.content || [];
        const mappedData = items.map((item: any) => ({
            ...item,
            actions: [
                { id: 'edit', icon: 'bi-pencil', class: 'btn-primary', title: 'Editar' },
                { id: 'view', icon: 'bi-eye', class: 'btn-info', title: 'Ver' }
            ]
        }));
        this.suppliers.set(mappedData);
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

  openNewForm(): void {
    this.selectedSupplierId.set(null);
    this.showFormModal.set(true);
  }

  closeFormModal(): void {
    this.showFormModal.set(false);
    this.selectedSupplierId.set(null);
  }

  onFormSaved(): void {
    this.closeFormModal();
    this.loadSuppliers();
    this.loadSummary();
  }

  handleTableAction(e: { action: string, row: SupplierDetailResponse }) {
    if (e.action === 'edit') {
      this.selectedSupplierId.set(e.row.id);
      this.showFormModal.set(true);
    } else if (e.action === 'view') {
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

  onTableFilter(filters: any): void {
    this.tableFilters.set(filters);
    this.currentPage.set(0);
    this.loadSuppliers();
  }
}
