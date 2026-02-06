import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { PurchaseService } from '../../../core/services/purchase.service';
import { PurchaseResponse } from '../../../core/models/purchase.model';

@Component({
    selector: 'app-purchase-list',
    standalone: true,
    imports: [CommonModule, RouterModule],
    templateUrl: './purchase-list.component.html',
    styleUrl: './purchase-list.component.scss'
})
export class PurchaseListComponent implements OnInit {
    private purchaseService = inject(PurchaseService);
    private router = inject(Router);

    purchases = signal<PurchaseResponse[]>([]);
    filteredPurchases = signal<PurchaseResponse[]>([]);
    isLoading = signal<boolean>(false);
    errorMessage = signal<string>('');

    ngOnInit(): void {
        this.loadPurchases();
    }

    loadPurchases(): void {
        this.isLoading.set(true);
        this.purchaseService.getAll().subscribe({
            next: (response) => {
                const data = response.data;
                this.purchases.set(data);
                this.filteredPurchases.set(data);
                this.isLoading.set(false);
            },
            error: (error) => {
                this.errorMessage.set('Error al cargar compras. Intenta de nuevo.');
                this.isLoading.set(false);
                console.error('Error loading purchases:', error);
            }
        });
    }

    onSearch(event: Event): void {
        const input = event.target as HTMLInputElement;
        const term = input.value.toLowerCase();

        if (!term) {
            this.filteredPurchases.set(this.purchases());
            return;
        }

        const filtered = this.purchases().filter(p =>
            p.number?.toLowerCase().includes(term) ||
            p.supplierName.toLowerCase().includes(term) ||
            p.series?.toLowerCase().includes(term)
        );
        this.filteredPurchases.set(filtered);
    }

    onNewPurchase(): void {
        this.router.navigate(['/purchases/new']);
    }

    getStatusBadgeClass(status: string): string {
        switch (status) {
            case 'RECEIVED': return 'bg-success';
            case 'PENDING': return 'bg-warning text-dark';
            case 'CANCELED': return 'bg-danger';
            default: return 'bg-secondary';
        }
    }
}
