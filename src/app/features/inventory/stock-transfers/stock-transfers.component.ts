import { Component, OnInit, inject, signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { StockTransferListComponent } from './stock-transfer-list/stock-transfer-list.component';
import { StockTransferFormComponent } from './stock-transfer-form/stock-transfer-form.component';
import { StockTransferDetailsComponent } from './stock-transfer-details/stock-transfer-details.component';
import { StockTransferService } from '../../../core/services/stock-transfer.service';
import { EstablishmentStateService } from '../../../core/services/establishment-state.service';
import { EstablishmentService } from '../../../core/services/establishment.service';
import { InventoryService } from '../../../core/services/inventory.service';
import { ModalService } from '../../../shared/components/confirm-modal/service/modal.service';
import { ModuleHeaderComponent } from '../../../shared/components/module-header/module-header.component';
import { ModalGenericComponent } from '../../../shared/components/modal-generic/modal-generic.component';
import { ConfirmModalComponent } from '../../../shared/components/confirm-modal/confirm-modal.component';
import { ModalAlertComponent } from '../../../shared/components/modal-alert/modal-alert.component';
import { StockTransferResponse, StockTransferRequest } from '../../../core/models/stock-transfer.model';
import { EstablishmentResponse } from '../../../core/models/maintenance.model';
import { InventoryResponse } from '../../../core/models/inventory.model';
import { forkJoin } from 'rxjs';

@Component({
  selector: 'app-stock-transfers',
  standalone: true,
  imports: [
    CommonModule,
    StockTransferListComponent,
    StockTransferFormComponent,
    StockTransferDetailsComponent,
    ModuleHeaderComponent,
    ModalGenericComponent,
    ConfirmModalComponent,
    ModalAlertComponent
  ],
  templateUrl: './stock-transfers.component.html',
  styleUrl: './stock-transfers.component.scss'
})
export class StockTransfersComponent implements OnInit {
  private transferService = inject(StockTransferService);
  private establishmentState = inject(EstablishmentStateService);
  private establishmentService = inject(EstablishmentService);
  private inventoryService = inject(InventoryService);
  private modalService = inject(ModalService);

  // State for List
  transfers = signal<StockTransferResponse[]>([]);
  isLoading = signal(false);
  activeTab = signal<'SENT' | 'RECEIVED'>('SENT');

  // State for Form
  establishments = signal<EstablishmentResponse[]>([]);
  inventoryItems = signal<InventoryResponse[]>([]);
  lotsMap = signal<Map<number, number>>(new Map());
  isSaving = signal(false);
  isLoadingData = signal(false);

  // Modal State
  showForm = signal(false);
  showDetails = signal(false);
  selectedTransfer = signal<StockTransferResponse | null>(null);

  constructor() {
    effect(() => {
      const estId = this.establishmentState.selectedEstablishmentId();
      if (estId) {
        this.loadTransfers();
        this.loadMasterData();
      }
    });
  }

  ngOnInit() {
    this.loadTransfers();
    this.loadMasterData();
  }

  loadTransfers() {
    const estId = this.establishmentState.selectedEstablishmentId();
    if (!estId) return;

    this.isLoading.set(true);
    const request$ = this.activeTab() === 'SENT' 
      ? this.transferService.getBySourceEstablishmentId(estId)
      : this.transferService.getByTargetEstablishmentId(estId);

    request$.subscribe({
      next: (res: any) => {
        this.transfers.set(res || []);
        this.isLoading.set(false);
      },
      error: (err: any) => {
        console.error('Error loading transfers:', err);
        this.isLoading.set(false);
      }
    });
  }

  loadMasterData() {
    const currentEstId = this.establishmentState.selectedEstablishmentId();
    if (!currentEstId) return;

    this.isLoadingData.set(true);

    forkJoin({
      establishments: this.establishmentService.getAll(),
      lots: this.inventoryService.getAllLots(),
      inventory: this.inventoryService.getStockByEstablishment(currentEstId)
    }).subscribe({
      next: (data: any) => {
        // Filter out current establishment
        const filteredEsts = (data.establishments.data || []).filter((e: any) => e.id !== currentEstId);
        this.establishments.set(filteredEsts);

        // Lots map
        const map = new Map<number, number>();
        (data.lots.data || []).forEach((lot: any) => map.set(lot.id, lot.productId));
        this.lotsMap.set(map);

        // Inventory
        const items = (data.inventory.data || []).filter((i: any) => i.quantity > 0);
        this.inventoryItems.set(items);
        
        this.isLoadingData.set(false);
      },
      error: (err) => {
        console.error('Error loading master data:', err);
        this.isLoadingData.set(false);
      }
    });
  }

  onTabChange(tab: 'SENT' | 'RECEIVED') {
    this.activeTab.set(tab);
    this.loadTransfers();
  }

  onOpenForm() {
    this.showForm.set(true);
  }

  onFormCancelled() {
    this.showForm.set(false);
  }

  onSaveTransfer(request: StockTransferRequest) {
    this.isSaving.set(true);
    this.transferService.create(request).subscribe({
      next: () => {
        this.isSaving.set(false);
        this.showForm.set(false);
        this.loadTransfers();
        this.modalService.alert({ title: 'Éxito', message: 'Transferencia creada correctamente', type: 'success' });
      },
      error: (err) => {
        console.error('Error creating transfer:', err);
        this.isSaving.set(false);
        this.modalService.alert({ title: 'Error', message: 'No se pudo crear la transferencia', type: 'error' });
      }
    });
  }

  onDispatch(id: number) {
    this.transferService.dispatchTransfer(id).subscribe({
      next: () => {
        this.loadTransfers();
        this.showDetails.set(false);
        this.selectedTransfer.set(null);
        this.modalService.alert({ title: 'Éxito', message: 'Transferencia despachada', type: 'success' });
      },
      error: (err) => {
        console.error('Error dispatching transfer:', err);
        this.modalService.alert({ title: 'Error', message: 'No se pudo despachar la transferencia', type: 'error' });
      }
    });
  }

  onReceive(id: number) {
    this.transferService.receiveTransfer(id).subscribe({
      next: () => {
        this.loadTransfers();
        this.showDetails.set(false);
        this.selectedTransfer.set(null);
        this.modalService.alert({ title: 'Éxito', message: 'Transferencia recibida', type: 'success' });
      },
      error: (err) => {
        console.error('Error receiving transfer:', err);
        this.modalService.alert({ title: 'Error', message: 'No se pudo recibir la transferencia', type: 'error' });
      }
    });
  }

  onCancel(id: number) {
    this.transferService.cancelTransfer(id).subscribe({
      next: () => {
        this.loadTransfers();
        this.showDetails.set(false);
        this.selectedTransfer.set(null);
        this.modalService.alert({ title: 'Éxito', message: 'Transferencia anulada', type: 'success' });
      },
      error: (err) => {
        console.error('Error cancelling transfer:', err);
        this.modalService.alert({ title: 'Error', message: 'No se pudo anular la transferencia', type: 'error' });
      }
    });
  }

  onView(transfer: StockTransferResponse) {
    // If the transfer doesn't have items loaded, we fetch by ID. 
    // Wait, the lists endpoint returns items usually. Let's just use the selected transfer!
    this.selectedTransfer.set(transfer);
    this.showDetails.set(true);
  }

  onDetailsClosed() {
    this.showDetails.set(false);
    this.selectedTransfer.set(null);
  }
}
