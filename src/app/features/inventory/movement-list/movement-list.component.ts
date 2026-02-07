import { Component, OnInit, inject, signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { InventoryService } from '../../../core/services/inventory.service';
import { EstablishmentStateService } from '../../../core/services/establishment-state.service';
import { StockMovementResponse, MovementType } from '../../../core/models/inventory.model';

@Component({
    selector: 'app-movement-list',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './movement-list.component.html',
    styleUrl: './movement-list.component.scss'
})
export class MovementListComponent implements OnInit {
    private inventoryService = inject(InventoryService);
    private establishmentStateService = inject(EstablishmentStateService);

    movements = signal<StockMovementResponse[]>([]);
    filteredMovements = signal<StockMovementResponse[]>([]);
    isLoading = signal(false);
    searchTerm = signal('');

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
        this.inventoryService.getMovementsByEstablishment(estId).subscribe({
            next: (response) => {
                this.movements.set(response.data);
                this.applyFilters();
                this.isLoading.set(false);
            },
            error: (err) => {
                console.error('Error loading movements:', err);
                this.isLoading.set(false);
            }
        });
    }

    applyFilters() {
        const term = this.searchTerm().toLowerCase();
        if (!term) {
            this.filteredMovements.set(this.movements());
            return;
        }

        const filtered = this.movements().filter(m =>
            m.productName.toLowerCase().includes(term) ||
            (m.lotCode && m.lotCode.toLowerCase().includes(term)) ||
            m.reason.toLowerCase().includes(term)
        );
        this.filteredMovements.set(filtered);
    }

    onSearchChange(value: string) {
        this.searchTerm.set(value);
        this.applyFilters();
    }

    getTypeClass(type: MovementType): string {
        switch (type) {
            case MovementType.PURCHASE:
            case MovementType.ADJUSTMENT_IN:
            case MovementType.TRANSFER_IN:
            case MovementType.SALE_RETURN:
                return 'bg-success';
            case MovementType.SALE:
            case MovementType.ADJUSTMENT_OUT:
            case MovementType.TRANSFER_OUT:
            case MovementType.VOID_RETURN:
                return 'bg-danger';
            default: return 'bg-info';
        }
    }

    isOutput(type: MovementType): boolean {
        return [
            MovementType.SALE,
            MovementType.ADJUSTMENT_OUT,
            MovementType.TRANSFER_OUT,
            MovementType.VOID_RETURN
        ].includes(type);
    }

    trackById(index: number, item: StockMovementResponse) {
        return item.id;
    }
}
