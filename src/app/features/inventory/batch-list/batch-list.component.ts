import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { InventoryService } from '../../../core/services/inventory.service';
import { ProductLotResponse } from '../../../core/models/inventory.model';

@Component({
    selector: 'app-batch-list',
    standalone: true,
    imports: [CommonModule, FormsModule, RouterModule],
    templateUrl: './batch-list.component.html',
    styleUrl: './batch-list.component.scss'
})
export class BatchListComponent implements OnInit {
    private inventoryService = inject(InventoryService);

    lots = signal<ProductLotResponse[]>([]);
    isLoading = signal(false);
    searchTerm = signal('');

    filteredLots = computed(() => {
        const term = this.searchTerm().toLowerCase();
        if (!term) return this.lots();

        return this.lots().filter(lot =>
            lot.productName.toLowerCase().includes(term) ||
            lot.lotCode.toLowerCase().includes(term)
        );
    });

    ngOnInit() {
        this.loadLots();
    }

    loadLots() {
        this.isLoading.set(true);
        this.inventoryService.getAllLots().subscribe({
            next: (response) => {
                this.lots.set(response.data);
                this.isLoading.set(false);
            },
            error: (err) => {
                console.error('Error loading lots:', err);
                this.isLoading.set(false);
            }
        });
    }

    getExpiryStatus(expiryDate: string): { class: string, text: string, color: string } {
        const today = new Date();
        const expiry = new Date(expiryDate);
        const diffTime = expiry.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays < 0) return { class: 'bg-dark', text: 'Vencido', color: '#fff' };
        if (diffDays <= 30) return { class: 'bg-danger', text: 'Crítico (< 30 días)', color: '#fff' };
        if (diffDays <= 90) return { class: 'bg-warning text-dark', text: 'Próximo (< 90 días)', color: '#000' };
        return { class: 'bg-success', text: 'Vigente', color: '#fff' };
    }

    getDaysRemaining(expiryDate: string): number {
        const today = new Date();
        const expiry = new Date(expiryDate);
        const diffTime = expiry.getTime() - today.getTime();
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    }
}
