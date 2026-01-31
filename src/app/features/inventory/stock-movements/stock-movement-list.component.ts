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
            m.reason.toLowerCase().includes(term)
        );
    });

    ngOnInit(): void {
        this.loadMovements();
    }

    loadMovements(): void {
        this.isLoading.set(true);
        this.inventoryService.getMovements().subscribe({
            next: (data) => {
                this.movements.set(data);
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
            case 'ENTRADA': return 'bg-success-subtle text-success border border-success';
            case 'SALIDA': return 'bg-danger-subtle text-danger border border-danger';
            case 'AJUSTE': return 'bg-warning-subtle text-warning-emphasis border border-warning';
            default: return 'bg-secondary';
        }
    }

    getMovementIcon(type: MovementType): string {
        switch (type) {
            case 'ENTRADA': return 'bi-arrow-down-left-circle-fill';
            case 'SALIDA': return 'bi-arrow-up-right-circle-fill';
            case 'AJUSTE': return 'bi-sliders';
            default: return 'bi-dot';
        }
    }
}
