import { Component, OnInit, inject, signal, computed, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { InventoryService } from '../../../core/services/inventory.service';
import { EstablishmentStateService } from '../../../core/services/establishment-state.service';
import { InventoryResponse } from '../../../core/models/inventory.model';

@Component({
    selector: 'app-inventory-list',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './inventory-list.component.html',
    styleUrl: './inventory-list.component.scss'
})
export class InventoryListComponent implements OnInit {
    private inventoryService = inject(InventoryService);
    private establishmentStateService = inject(EstablishmentStateService);
    private router = inject(Router);

    inventory = signal<InventoryResponse[]>([]);
    isLoading = signal<boolean>(false);
    searchTerm = signal<string>('');

    selectedEstablishmentId = this.establishmentStateService.selectedEstablishmentId;

    filteredInventory = computed(() => {
        let result = this.inventory();

        
        if (this.selectedEstablishmentId()) {
            result = result.filter(item => item.establishmentId === this.selectedEstablishmentId());
        }

        
        const term = this.searchTerm().toLowerCase();
        if (term) {
            result = result.filter(item =>
                item.productName.toLowerCase().includes(term) ||
                item.lotCode.toLowerCase().includes(term)
            );
        }

        return result;
    });

    constructor() {
        
        effect(() => {
            if (this.selectedEstablishmentId()) {
                this.loadInventory();
            }
        });
    }

    ngOnInit(): void {
        if (this.selectedEstablishmentId()) {
            this.loadInventory();
        }
    }

    loadInventory(): void {
        const estId = this.selectedEstablishmentId();
        if (!estId) return;

        this.isLoading.set(true);
        this.inventoryService.getStockByEstablishment(estId).subscribe({
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

    onAdjust(item: InventoryResponse): void {
        this.router.navigate(['/inventory/adjust', item.id]);
    }

    onExport(): void {
        
        alert('Función de exportación próximamente');
    }
}
