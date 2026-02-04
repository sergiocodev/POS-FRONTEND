import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { SaleService } from '../../../core/services/sale.service';
import { SaleResponse, SaleStatus, SunatStatus } from '../../../core/models/sale.model';

@Component({
    selector: 'app-sale-list',
    standalone: true,
    imports: [CommonModule, RouterModule],
    templateUrl: './sale-list.component.html',
    styleUrl: './sale-list.component.scss'
})
export class SaleListComponent implements OnInit {
    private saleService = inject(SaleService);
    private router = inject(Router);

    sales = signal<SaleResponse[]>([]);
    filteredSales = signal<SaleResponse[]>([]);
    isLoading = signal<boolean>(false);
    errorMessage = signal<string>('');

    ngOnInit(): void {
        this.loadSales();
    }

    loadSales(): void {
        this.isLoading.set(true);
        this.saleService.getAll().subscribe({
            next: (data) => {
                this.sales.set(data);
                this.filteredSales.set(data);
                this.isLoading.set(false);
            },
            error: (error) => {
                this.errorMessage.set('Error al cargar ventas. Intenta de nuevo.');
                this.isLoading.set(false);
                console.error('Error loading sales:', error);
            }
        });
    }

    onSearch(event: Event): void {
        const input = event.target as HTMLInputElement;
        const term = input.value.toLowerCase();

        if (!term) {
            this.filteredSales.set(this.sales());
            return;
        }

        const filtered = this.sales().filter(s =>
            s.number.toLowerCase().includes(term) ||
            s.customerName.toLowerCase().includes(term) ||
            s.series.toLowerCase().includes(term)
        );
        this.filteredSales.set(filtered);
    }

    onNewSale(): void {
        this.router.navigate(['/sales/pos']);
    }

    onViewDetails(id: number): void {

        console.log('View sale details:', id);
    }

    onCancel(id: number): void {
        if (confirm('¿Estás seguro de anular esta venta? Esta acción no se puede deshacer.')) {
            this.saleService.cancel(id).subscribe({
                next: () => this.loadSales(),
                error: (err) => this.errorMessage.set('Error al anular la venta.')
            });
        }
    }

    getStatusBadgeClass(status: string): string {
        switch (status) {
            case 'COMPLETED': return 'bg-success';
            case 'CANCELED': return 'bg-danger';
            default: return 'bg-secondary';
        }
    }

    getSunatBadgeClass(status: string): string {
        switch (status) {
            case 'ACCEPTED': return 'bg-success';
            case 'PENDING': return 'bg-warning text-dark';
            case 'REJECTED': return 'bg-danger';
            default: return 'bg-info text-dark';
        }
    }
}
