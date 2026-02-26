import { Component, OnInit, inject, signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { InventoryListComponent } from './inventory-list/inventory-list.component';
import { InventoryAdjustmentFormComponent } from './inventory-adjustment-form/inventory-adjustment-form.component';
import { InventoryService } from '../../../core/services/inventory.service';
import { EstablishmentStateService } from '../../../core/services/establishment-state.service';
import { ModalService } from '../../../shared/components/confirm-modal/service/modal.service';
import { InventoryResponse } from '../../../core/models/inventory.model';
import { ModalGenericComponent } from '../../../shared/components/modal-generic/modal-generic.component';
import { ModuleHeaderComponent } from '../../../shared/components/module-header/module-header.component';
import { ConfirmModalComponent } from '../../../shared/components/confirm-modal/confirm-modal.component';
import { ModalAlertComponent } from '../../../shared/components/modal-alert/modal-alert.component';

@Component({
  selector: 'app-current-inventory',
  standalone: true,
  imports: [
    CommonModule,
    InventoryListComponent,
    InventoryAdjustmentFormComponent,
    ModalGenericComponent,
    ModuleHeaderComponent,
    ConfirmModalComponent,
    ModalAlertComponent
  ],
  templateUrl: './current-inventory.html',
  styleUrl: './current-inventory.scss'
})
export class CurrentInventoryComponent implements OnInit {
  private inventoryService = inject(InventoryService);
  private establishmentStateService = inject(EstablishmentStateService);
  private modalService = inject(ModalService);

  // State
  inventory = signal<InventoryResponse[]>([]);
  isLoading = signal(false);

  // Filter
  selectedEstablishmentId = this.establishmentStateService.selectedEstablishmentId;

  // Modal State
  showAdjustmentModal = signal(false);
  selectedInventoryItem = signal<InventoryResponse | null>(null);

  constructor() {
    effect(() => {
      if (this.selectedEstablishmentId()) {
        this.loadInventory();
      }
    });
  }

  ngOnInit() {
    if (this.selectedEstablishmentId()) {
      this.loadInventory();
    }
  }

  loadInventory() {
    const estId = this.selectedEstablishmentId();
    if (!estId) return;

    this.isLoading.set(true);
    this.inventoryService.getStockByEstablishment(estId).subscribe({
      next: (res) => {
        this.inventory.set(res.data);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Error loading inventory:', err);
        this.modalService.alert({ title: 'Error', message: 'No se pudo cargar el inventario', type: 'error' });
        this.isLoading.set(false);
      }
    });
  }

  onAdjust(item: InventoryResponse) {
    this.selectedInventoryItem.set(item);
    this.showAdjustmentModal.set(true);
  }

  onAdjustmentSaved() {
    this.showAdjustmentModal.set(false);
    this.selectedInventoryItem.set(null);
    this.loadInventory();
    this.modalService.alert({ title: 'Éxito', message: 'Inventario ajustado correctamente', type: 'success' });
  }

  onAdjustmentCancelled() {
    this.showAdjustmentModal.set(false);
    this.selectedInventoryItem.set(null);
  }

  onExport() {
    this.modalService.alert({ title: 'Próximamente', message: 'La función de exportación estará disponible pronto.', type: 'warning' });
  }
}
