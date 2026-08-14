import { Component, OnInit, inject, signal, effect, untracked } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SupplierService } from '../../../core/services/supplier.service';
import { SupplierDetailResponse } from '../../../core/models/supplier.model';
import { EstablishmentStateService } from '../../../core/services/establishment-state.service';
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
  private establishmentStateService = inject(EstablishmentStateService);

  selectedEstablishmentId = this.establishmentStateService.selectedEstablishmentId;

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
  kpiItems = signal<SmartKpiItem[]>([]);

  constructor() {
    effect(() => {
        this.selectedEstablishmentId(); // track signal
        untracked(() => {
            this.currentPage.set(0);
            this.loadSummary();
            this.loadSuppliers();
        });
    }, { allowSignalWrites: true });
  }

  ngOnInit(): void {
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
    if (!this.selectedEstablishmentId()) return;
    this.supplierService.getSummary(this.selectedEstablishmentId()!).subscribe({
      next: (response: any) => {
        const data = response.data ? response.data : response;
        const styles: any = {
          'PROVEEDORES ACTIVOS': { icon: 'bi-people-fill', color: 'blue' },
          'EN EVALUACIÓN': { icon: 'bi-clipboard2-pulse', color: 'orange' },
          'VENCIDOS': { icon: 'bi-exclamation-circle', color: 'purple' },
          'GASTO MENSUAL': { icon: 'bi-wallet2', color: 'green' },
          'RATING PROMEDIO': { icon: 'bi-star-half', color: 'blue' }
        };

        const mappedData = data.map((item: any) => ({
            ...item,
            ...(styles[item.label] || { icon: 'bi-info-circle', color: 'blue' })
        }));

        this.kpiItems.set(mappedData);
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
