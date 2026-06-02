import { Component, OnInit, inject, signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MovementListComponent } from './movement-list/movement-list.component';
import { InventoryService } from '../../../core/services/inventory.service';
import { EstablishmentStateService } from '../../../core/services/establishment-state.service';
import { ModalService } from '../../../shared/components/confirm-modal/service/modal.service';
import { StockMovementResponse } from '../../../core/models/inventory.model';
import { ModuleHeaderComponent } from '../../../shared/components/module-header/module-header.component';
import { ConfirmModalComponent } from '../../../shared/components/confirm-modal/confirm-modal.component';
import { ModalAlertComponent } from '../../../shared/components/modal-alert/modal-alert.component';

@Component({
    selector: 'app-movements',
    standalone: true,
    imports: [
        CommonModule,
        MovementListComponent,
        ModuleHeaderComponent,
        ConfirmModalComponent,
        ModalAlertComponent
    ],
    templateUrl: './movements.html',
    styleUrl: './movements.scss'
})
export class MovementsComponent implements OnInit {
    private inventoryService = inject(InventoryService);
    private establishmentStateService = inject(EstablishmentStateService);
    private modalService = inject(ModalService);

    // State
    movements = signal<StockMovementResponse[]>([]);
    isLoading = signal(false);

    // Pagination State
    currentPage = signal(0);
    pageSize = signal(10);
    totalElements = signal(0);
    tableFilters = signal<any>({});

    // Filter
    selectedEstablishmentId = this.establishmentStateService.selectedEstablishmentId;

    constructor() {
        effect(() => {
            if (this.selectedEstablishmentId()) {
                this.loadMovements();
            }
        });
    }

    ngOnInit() {
        if (this.selectedEstablishmentId()) {
            this.loadMovements();
        }
    }

    loadMovements() {
        const estId = this.selectedEstablishmentId();
        if (!estId) return;

        this.isLoading.set(true);
        this.inventoryService.getMovementsByEstablishmentPaged(estId, this.currentPage(), this.pageSize(), this.tableFilters()).subscribe({
            next: (res) => {
                const page = res.data;
                this.movements.set(page.content || []);
                this.totalElements.set(page.totalElements || 0);
                this.isLoading.set(false);
            },
            error: (err) => {
                console.error('Error loading movements:', err);
                this.modalService.alert({ title: 'Error', message: 'No se pudieron cargar los movimientos', type: 'error' });
                this.isLoading.set(false);
            }
        });
    }

    onPageChange(page: number) {
        this.currentPage.set(page);
        this.loadMovements();
    }

    onPageSizeChange(size: number) {
        this.pageSize.set(size);
        this.currentPage.set(0);
        this.loadMovements();
    }

    onFilterChange(filters: any) {
        this.tableFilters.set(filters);
        this.currentPage.set(0);
        this.loadMovements();
    }
}
