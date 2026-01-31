import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { InventoryService } from '../../../core/services/inventory.service';
import { SaleService } from '../../../core/services/sale.service';
import { InventoryResponse } from '../../../core/models/inventory.model';
import { EstablishmentResponse } from '../../../core/models/sale.model';

@Component({
    selector: 'app-inventory-list',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './inventory-list.component.html',
    styleUrl: './inventory-list.component.scss'
})
export class InventoryListComponent implements OnInit {
    private inventoryService = inject(InventoryService);
    private saleService = inject(SaleService);

    inventory = signal<InventoryResponse[]>([]);
    establishments = signal<EstablishmentResponse[]>([]);
    selectedEstablishmentId = signal<number | null>(null);
    searchTerm = signal<string>('');
    isLoading = signal<boolean>(false);

    filteredInventory = computed(() => {
        let result = this.inventory();

        // Filter by establishment
        if (this.selectedEstablishmentId()) {
            result = result.filter(item => item.establishmentId === this.selectedEstablishmentId());
        }

        // Filter by search term
        const term = this.searchTerm().toLowerCase();
        if (term) {
            result = result.filter(item =>
                item.productName.toLowerCase().includes(term) ||
                item.lotCode.toLowerCase().includes(term)
            );
        }

        return result;
    });

    ngOnInit(): void {
        this.loadInitialData();
    }

    loadInitialData(): void {
        this.isLoading.set(true);
        this.saleService.getEstablishments().subscribe(ests => {
            this.establishments.set(ests);
        });

        this.loadInventory();
    }

    loadInventory(): void {
        this.isLoading.set(true);
        this.inventoryService.getAllStock().subscribe({
            next: (data) => {
                this.inventory.set(data);
                this.isLoading.set(false);
            },
            error: (err) => {
                console.error('Error loading inventory:', err);
                this.isLoading.set(false);
            }
        });
    }

    onExport(): void {
        // Implement CSV/XLS export logic later
        alert('Función de exportación próximamente');
    }
}
