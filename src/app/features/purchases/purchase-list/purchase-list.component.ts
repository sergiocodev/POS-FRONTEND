import { Component, OnInit, inject, signal, computed } from '@angular/core';
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

    // Client-side pagination
    currentPage = signal(0);
    pageSize = signal(20);

    pagedPurchases = computed(() => {
        const start = this.currentPage() * this.pageSize();
        return this.filteredPurchases().slice(start, start + this.pageSize());
    });

    totalItems = computed(() => this.filteredPurchases().length);
    totalPages = computed(() => Math.ceil(this.totalItems() / this.pageSize()));

    get displayStart(): number {
        return this.totalItems() === 0 ? 0 : (this.currentPage() * this.pageSize()) + 1;
    }

    get displayEnd(): number {
        const end = (this.currentPage() + 1) * this.pageSize();
        return Math.min(end, this.totalItems());
    }

    get pageNumbers(): number[] {
        const total = this.totalPages();
        const current = this.currentPage();
        const pages: number[] = [];

        if (total <= 7) {
            for (let i = 0; i < total; i++) pages.push(i);
        } else {
            pages.push(0, 1, 2);
            if (current > 4) pages.push(-1);
            const start = Math.max(3, current - 1);
            const end = Math.min(total - 3, current + 1);
            for (let i = start; i <= end; i++) pages.push(i);
            if (current < total - 5) pages.push(-2);
            pages.push(total - 3, total - 2, total - 1);
        }

        return pages;
    }

    goToPage(page: number): void {
        if (page >= 0 && page < this.totalPages()) {
            this.currentPage.set(page);
        }
    }

    previousPage(): void {
        if (this.currentPage() > 0) {
            this.currentPage.set(this.currentPage() - 1);
        }
    }

    nextPage(): void {
        if (this.currentPage() < this.totalPages() - 1) {
            this.currentPage.set(this.currentPage() + 1);
        }
    }

    onPageClick(page: number): void {
        if (page < 0) return;
        this.goToPage(page);
    }

    isEllipsis(page: number): boolean {
        return page < 0;
    }

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
        this.currentPage.set(0);

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

    getPaymentConditionBadgeClass(condition: string): string {
        switch (condition) {
            case 'CASH':
            case 'CONTADO': return 'bg-info text-dark';
            case 'CREDIT':
            case 'CREDITO': return 'bg-warning text-dark';
            default: return 'bg-secondary';
        }
    }
}
