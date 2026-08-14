import { Component, OnInit, inject, signal, effect, untracked } from '@angular/core';
import { CommonModule } from '@angular/common';
import { forkJoin } from 'rxjs';
import { take, finalize } from 'rxjs/operators';
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
import { SpinnerComponent } from '../../../shared/components/spinner/spinner.component';
import { StockTransferResponse, StockTransferRequest } from '../../../core/models/stock-transfer.model';
import { EstablishmentResponse } from '../../../core/models/maintenance.model';
import { InventoryResponse } from '../../..../../../core/models/inventory.model';


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
    ModalAlertComponent,
    SpinnerComponent
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
        untracked(() => this.loadAllData());
      }
    }, { allowSignalWrites: true });
  }

  ngOnInit() {
    this.loadAllData();
  }

  loadAllData() {
    const estId = this.establishmentState.selectedEstablishmentId();
    if (!estId) return;

    this.isLoading.set(true);

    const request$ = this.activeTab() === 'SENT'
      ? this.transferService.getBySourceEstablishmentId(estId).pipe(take(1))
      : this.transferService.getByTargetEstablishmentId(estId).pipe(take(1));

    const master$ = forkJoin({
      establishments: this.establishmentService.getAll().pipe(take(1)),
      lots: this.inventoryService.getAllLots().pipe(take(1)),
      inventory: this.inventoryService.getStockByEstablishment(estId).pipe(take(1))
    });

    forkJoin({ transfers: request$, master: master$ }).subscribe({
      next: (res: any) => {
        this.transfers.set(res.transfers || []);

        const data = res.master;
        const currentEstId = estId;
        const establishmentsData = data.establishments.data;
        const filteredEsts = (Array.isArray(establishmentsData) ? establishmentsData : (establishmentsData?.content || [])).filter((e: any) => e.id !== currentEstId);
        this.establishments.set(filteredEsts);

        const map = new Map<number, number>();
        const lotsData = data.lots.data;
        (Array.isArray(lotsData) ? lotsData : (lotsData?.content || [])).forEach((lot: any) => map.set(lot.id, lot.productId));
        this.lotsMap.set(map);

        const invData = data.inventory.data;
        const inventoryList = Array.isArray(invData) ? invData : (invData?.content || []);
        const items = inventoryList.filter((i: any) => i.quantity > 0);
        this.inventoryItems.set(items);

        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Error loading data:', err);
        this.modalService.alert({ title: 'Error', message: 'No se pudieron cargar los datos', type: 'error' });
        this.isLoading.set(false);
      }
    });
  }

  loadTransfers() {
    const estId = this.establishmentState.selectedEstablishmentId();
    if (!estId) return;

    this.isLoading.set(true);
    const request$ = this.activeTab() === 'SENT'
      ? this.transferService.getBySourceEstablishmentId(estId)
      : this.transferService.getByTargetEstablishmentId(estId);

    request$.pipe(take(1), finalize(() => this.isLoading.set(false))).subscribe({
      next: (res: any) => {
        this.transfers.set(res || []);
      },
      error: (err: any) => {
        console.error('Error loading transfers:', err);
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
