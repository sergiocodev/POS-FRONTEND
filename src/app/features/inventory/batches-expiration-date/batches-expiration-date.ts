import { Component, OnInit, inject, signal, effect, untracked } from '@angular/core';
import { forkJoin } from 'rxjs';
import { take, finalize } from 'rxjs/operators';
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
import { SpinnerComponent } from '../../../shared/components/spinner/spinner.component';

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
    ModalAlertComponent,
    SpinnerComponent
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
      untracked(() => {
          this.currentPage.set(0);
          this.loadLots();
      });
    }, { allowSignalWrites: true });
  }

  ngOnInit() {
    this.loadAllData();
  }

  loadAllData() {
    const estId = this.selectedEstablishmentId();
    if (!estId) return;

    this.isLoading.set(true);
    forkJoin({
        lots: this.inventoryService.getAllLotsPaged(estId, this.currentPage(), this.pageSize(), this.tableFilters()).pipe(take(1)),
        products: this.productService.getAll().pipe(take(1))
    }).subscribe({
        next: (res) => {
            const page = res.lots.data;
            this.lots.set(page.content || []);
            this.totalElements.set(page.totalElements || 0);
            this.products.set(res.products.data || []);
            this.isLoading.set(false);
        },
        error: (err) => {
            console.error('Error loading initial data:', err);
            this.modalService.alert({ title: 'Error', message: 'No se pudieron cargar los datos', type: 'error' });
            this.isLoading.set(false);
        }
    });
  }

  loadLots() {
    const estId = this.selectedEstablishmentId();
    if (!estId) return;

    this.isLoading.set(true);
    this.inventoryService.getAllLotsPaged(estId, this.currentPage(), this.pageSize(), this.tableFilters())
    .pipe(take(1), finalize(() => this.isLoading.set(false)))
    .subscribe({
      next: (res) => {
        const page = res.data;
        this.lots.set(page.content || []);
        this.totalElements.set(page.totalElements || 0);
      },
      error: (err) => {
        console.error('Error loading lots:', err);
        this.modalService.alert({ title: 'Error', message: 'No se pudieron cargar los lotes', type: 'error' });
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
