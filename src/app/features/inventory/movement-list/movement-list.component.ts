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
            next: (data) => {
                this.movements.set(data);
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

    getTypeClass(type: string): string {
        switch (type) {
            case 'ENTRADA': return 'bg-success';
            case 'SALIDA': return 'bg-danger';
            case 'AJUSTE': return 'bg-warning text-dark';
            default: return 'bg-info';
        }
    }

    trackById(index: number, item: StockMovementResponse) {
        return item.id;
    }
}
