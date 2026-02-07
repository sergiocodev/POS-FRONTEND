import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { InventoryService } from '../../../core/services/inventory.service';
import { StockMovementResponse, MovementType } from '../../../core/models/inventory.model';

@Component({
    selector: 'app-stock-movement-list',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './stock-movement-list.component.html',
    styleUrl: './stock-movement-list.component.scss'
})
export class StockMovementListComponent implements OnInit {
    private inventoryService = inject(InventoryService);

    movements = signal<StockMovementResponse[]>([]);
    isLoading = signal<boolean>(false);
    searchTerm = signal<string>('');

    filteredMovements = computed(() => {
        const term = this.searchTerm().toLowerCase();
        if (!term) return this.movements();

        return this.movements().filter(m =>
            m.productName.toLowerCase().includes(term) ||
            (m.lotCode && m.lotCode.toLowerCase().includes(term)) ||
            (m.referenceTable && m.referenceTable.toLowerCase().includes(term))
        );
    });

    ngOnInit(): void {
        this.loadMovements();
    }

    loadMovements(): void {
        this.isLoading.set(true);
        this.inventoryService.getMovements().subscribe({
            next: (response) => {
                this.movements.set(response.data);
                this.isLoading.set(false);
            },
            error: (err) => {
                console.error('Error loading movements:', err);
                this.isLoading.set(false);
            }
        });
    }

    getMovementBadgeClass(type: MovementType): string {
        switch (type) {
            case 'PURCHASE':
            case 'ADJUSTMENT_IN':
            case 'TRANSFER_IN':
            case 'SALE_RETURN': return 'bg-success-subtle text-success border border-success';
            case 'SALE':
            case 'ADJUSTMENT_OUT':
            case 'TRANSFER_OUT':
            case 'VOID_RETURN': return 'bg-danger-subtle text-danger border border-danger';
            default: return 'bg-secondary-subtle text-secondary';
        }
    }

    getMovementIcon(type: MovementType): string {
        switch (type) {
            case 'PURCHASE':
            case 'ADJUSTMENT_IN':
            case 'TRANSFER_IN':
            case 'SALE_RETURN': return 'bi-arrow-down-left-circle-fill';
            case 'SALE':
            case 'ADJUSTMENT_OUT':
            case 'TRANSFER_OUT':
            case 'VOID_RETURN': return 'bi-arrow-up-right-circle-fill';
            default: return 'bi-dot';
        }
    }
}
