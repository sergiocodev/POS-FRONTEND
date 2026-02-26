import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BatchListComponent } from './batch-list/batch-list.component';
import { BatchFormComponent } from './batch-form/batch-form.component';
import { InventoryService } from '../../../core/services/inventory.service';
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
  private modalService = inject(ModalService);

  // State
  lots = signal<ProductLotResponse[]>([]);
  products = signal<ProductResponse[]>([]);
  isLoading = signal(false);
  isLoadingProducts = signal(false);

  // Modal State
  showForm = signal(false);

  ngOnInit() {
    this.loadLots();
    this.loadProducts();
  }

  loadLots() {
    this.isLoading.set(true);
    this.inventoryService.getAllLots().subscribe({
      next: (res) => {
        this.lots.set(res.data);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Error loading lots:', err);
        this.modalService.alert({ title: 'Error', message: 'No se pudieron cargar los lotes', type: 'error' });
        this.isLoading.set(false);
      }
    });
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
