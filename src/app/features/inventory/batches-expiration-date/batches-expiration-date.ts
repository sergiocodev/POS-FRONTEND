import { Component, OnInit, inject, signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BatchListComponent } from './batch-list/batch-list.component';
import { BatchFormComponent } from './batch-form/batch-form.component';
import { InventoryService } from '../../../core/services/inventory.service';
import { EstablishmentStateService } from '../../../core/services/establishment-state.service';
import { ModalService } from '../../../shared/components/confirm-modal/service/modal.service';
import { ProductLotResponse } from '../../../core/models/inventory.model';
import { ModalGenericComponent } from '../../../shared/components/modal-generic/modal-generic.component';
import { ModuleHeaderComponent } from '../../../shared/components/module-header/module-header.component';
import { ConfirmModalComponent } from '../../../shared/components/confirm-modal/confirm-modal.component';
import { ModalAlertComponent } from '../../../shared/components/modal-alert/modal-alert.component';

import { ProductService } from '../../../core/services/product.service';
import { ProductResponse } from '../../../core/models/product.model';

@Component({
  selector: 'app-batches-expiration-date',
  standalone: true,
  imports: [
    CommonModule,
    BatchListComponent,
    BatchFormComponent,
    ModalGenericComponent,
    ModuleHeaderComponent,
    ConfirmModalComponent,
    ModalAlertComponent
  ],
  templateUrl: './batches-expiration-date.html',
  styleUrl: './batches-expiration-date.scss'
})
export class BatchesExpirationDateComponent implements OnInit {
  private inventoryService = inject(InventoryService);
  private productService = inject(ProductService);
  private establishmentStateService = inject(EstablishmentStateService);
  private modalService = inject(ModalService);

  selectedEstablishmentId = this.establishmentStateService.selectedEstablishmentId;

  // State
  lots = signal<ProductLotResponse[]>([]);
  products = signal<ProductResponse[]>([]);
  isLoading = signal(false);
  isLoadingProducts = signal(false);

  // Pagination State
  currentPage = signal(0);
  pageSize = signal(10);
  totalElements = signal(0);
  tableFilters = signal<any>({});

  // Modal State
  showForm = signal(false);

  constructor() {
    effect(() => {
      this.selectedEstablishmentId(); // track signal
      this.currentPage.set(0);
      this.loadLots();
    }, { allowSignalWrites: true });
  }

  ngOnInit() {
    this.loadLots();
    this.loadProducts();
  }

  loadLots() {
    const estId = this.selectedEstablishmentId();
    if (!estId) return;

    this.isLoading.set(true);
    this.inventoryService.getAllLotsPaged(estId, this.currentPage(), this.pageSize(), this.tableFilters()).subscribe({
      next: (res) => {
        const page = res.data;
        this.lots.set(page.content || []);
        this.totalElements.set(page.totalElements || 0);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Error loading lots:', err);
        this.modalService.alert({ title: 'Error', message: 'No se pudieron cargar los lotes', type: 'error' });
        this.isLoading.set(false);
      }
    });
  }

  onPageChange(page: number) {
    this.currentPage.set(page);
    this.loadLots();
  }

  onPageSizeChange(size: number) {
    this.pageSize.set(size);
    this.currentPage.set(0);
    this.loadLots();
  }

  onFilterChange(filters: any) {
    this.tableFilters.set(filters);
    this.currentPage.set(0);
    this.loadLots();
  }

  loadProducts() {
    this.isLoadingProducts.set(true);
    this.productService.getAll().subscribe({
      next: (res) => {
        this.products.set(res.data);
        this.isLoadingProducts.set(false);
      },
      error: (err) => {
        console.error('Error loading products:', err);
        this.isLoadingProducts.set(false);
      }
    });
  }

  onOpenForm() {
    this.showForm.set(true);
  }

  onFormSaved() {
    this.showForm.set(false);
    this.loadLots();
    this.modalService.alert({ title: 'Éxito', message: 'Lote registrado correctamente', type: 'success' });
  }

  onFormCancelled() {
    this.showForm.set(false);
  }
}
